/**
 * sot-telematics-sync — Traccar API Pull → SSOT → Trip Engine
 *
 * Polls Traccar REST API for positions, normalizes into cars_positions_raw,
 * updates cars_device_status, and runs trip detection via ENG-TRIP logic.
 *
 * Secrets required:
 *   TRACCAR_BASE_URL  – e.g. https://traccar.example.com
 *   TRACCAR_API_TOKEN – Basic auth token (base64 of user:pass)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

// ─── Types mirroring ENG-TRIP spec (no direct import in Deno edge) ───

interface PositionPoint {
  device_id: string;
  recorded_at: string;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  altitude?: number;
  accuracy?: number;
  attributes: Record<string, unknown>;
}

interface TripResult {
  start_time: string;
  end_time: string;
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  distance_km: number;
  distance_source: string;
  positions_count: number;
  max_speed_kmh: number;
  avg_speed_kmh: number;
}

// ─── Trip Detection (inline pure logic, mirrors engine.ts) ───

const EARTH_RADIUS_M = 6_371_000;
function toRad(d: number) { return (d * Math.PI) / 180; }
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DRIFT_M = 15;
const MIN_SPEED = 3;
const STOP_TIMEOUT_MS = 180_000;
const MIN_DIST_M = 100;
const MIN_DUR_S = 60;

function detectTripsFromPositions(positions: PositionPoint[], standard: string): TripResult[] {
  if (positions.length < 2) return [];
  // filter drift
  const filtered: PositionPoint[] = [positions[0]];
  for (let i = 1; i < positions.length; i++) {
    const prev = filtered[filtered.length - 1];
    const curr = positions[i];
    if (haversine(prev.lat, prev.lon, curr.lat, curr.lon) > DRIFT_M || curr.speed >= MIN_SPEED) {
      filtered.push(curr);
    }
  }
  if (filtered.length < 2) return [];

  const trips: TripResult[] = [];
  let buf: PositionPoint[] = [];
  let lastMove = 0;

  function isMoving(p: PositionPoint): boolean {
    if (standard === 'B' && p.attributes.ignition !== undefined) return p.attributes.ignition === true;
    return p.speed >= MIN_SPEED;
  }
  function ts(p: PositionPoint) { return new Date(p.recorded_at).getTime(); }
  function flush() {
    if (buf.length < 2) { buf = []; return; }
    const first = buf[0], last = buf[buf.length - 1];
    const dur = (ts(last) - ts(first)) / 1000;
    if (dur < MIN_DUR_S) { buf = []; return; }
    let dist = 0;
    for (let i = 1; i < buf.length; i++) dist += haversine(buf[i - 1].lat, buf[i - 1].lon, buf[i].lat, buf[i].lon);
    const distKm = dist / 1000;
    if (dist < MIN_DIST_M) { buf = []; return; }

    let distance_source = 'gps';
    let finalKm = distKm;
    const firstOdo = first.attributes.odometer as number | undefined;
    const lastOdo = last.attributes.odometer as number | undefined;
    if (standard === 'B' && typeof firstOdo === 'number' && typeof lastOdo === 'number' && lastOdo > firstOdo) {
      const odoKm = (lastOdo - firstOdo) / 1000;
      if (distKm > 0 && Math.abs(odoKm - distKm) / distKm < 0.3) { finalKm = odoKm; distance_source = 'odometer'; }
      else if (odoKm > 0) { finalKm = (odoKm + distKm) / 2; distance_source = 'hybrid'; }
    }

    const speeds = buf.map(p => p.speed).filter(s => s > 0);
    trips.push({
      start_time: first.recorded_at,
      end_time: last.recorded_at,
      start_lat: first.lat,
      start_lon: first.lon,
      end_lat: last.lat,
      end_lon: last.lon,
      distance_km: Math.round(finalKm * 100) / 100,
      distance_source,
      positions_count: buf.length,
      max_speed_kmh: speeds.length ? Math.round(Math.max(...speeds) * 10) / 10 : 0,
      avg_speed_kmh: dur > 0 ? Math.round((finalKm / (dur / 3600)) * 10) / 10 : 0,
    });
    buf = [];
  }

  for (const pos of filtered) {
    if (isMoving(pos)) {
      if (buf.length > 0 && ts(pos) - lastMove > STOP_TIMEOUT_MS) { flush(); }
      buf.push(pos);
      lastMove = ts(pos);
    } else {
      if (buf.length > 0) {
        buf.push(pos);
        if (ts(pos) - lastMove > STOP_TIMEOUT_MS) flush();
      }
    }
  }
  flush();
  return trips;
}

// ─── Traccar API Client ───

interface TraccarPosition {
  id: number;
  deviceId: number;
  fixTime: string;
  serverTime: string;
  latitude: number;
  longitude: number;
  speed: number; // knots
  course: number;
  altitude: number;
  accuracy: number;
  attributes: Record<string, unknown>;
}

async function fetchTraccarPositions(
  baseUrl: string, token: string, deviceId: string, from: string, to: string
): Promise<TraccarPosition[]> {
  const url = `${baseUrl}/api/positions?deviceId=${deviceId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Basic ${token}`, Accept: 'application/json' },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Traccar API ${resp.status}: ${text}`);
  }
  return await resp.json();
}

// ─── Main Handler ───

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req);
  const corsHeaders = getCorsHeaders(req);

  try {
    const TRACCAR_BASE_URL = Deno.env.get('TRACCAR_BASE_URL');
    const TRACCAR_API_TOKEN = Deno.env.get('TRACCAR_API_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse body for action-based routing
    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* no body = sync action */ }
    const action = body.action as string | undefined;

    // ─── Action: register_device ───
    if (action === 'register_device') {
      const { device_id, imei, device_name, tenant_id } = body as {
        device_id: string; imei: string; device_name: string; tenant_id: string;
      };

      if (!device_id || !imei) {
        return new Response(
          JSON.stringify({ error: 'device_id and imei are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If Traccar secrets not configured, skip registration but return success
      if (!TRACCAR_BASE_URL || !TRACCAR_API_TOKEN) {
        return new Response(
          JSON.stringify({
            ok: true,
            traccar_registered: false,
            message: 'Traccar secrets not configured — device saved locally. Registration will happen when secrets are set.',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Register device in Traccar via REST API
      const traccarResp = await fetch(`${TRACCAR_BASE_URL}/api/devices`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${TRACCAR_API_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: device_name || `Device ${imei}`,
          uniqueId: imei,
          category: 'car',
        }),
      });

      if (!traccarResp.ok) {
        const errText = await traccarResp.text();
        console.error(`Traccar register failed: ${traccarResp.status} ${errText}`);
        return new Response(
          JSON.stringify({ ok: false, traccar_registered: false, error: `Traccar API: ${traccarResp.status}`, details: errText }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const traccarDevice = await traccarResp.json();
      const traccarDeviceId = String(traccarDevice.id);

      // Update external ref with actual Traccar device ID
      await supabase
        .from('cars_device_external_refs')
        .update({ external_device_id: traccarDeviceId })
        .eq('device_id', device_id)
        .eq('source_type', 'traccar')
        .eq('tenant_id', tenant_id);

      return new Response(
        JSON.stringify({
          ok: true,
          traccar_registered: true,
          traccar_device_id: traccarDeviceId,
          traccar_name: traccarDevice.name,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Default action: sync positions ───
    if (!TRACCAR_BASE_URL || !TRACCAR_API_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Traccar credentials not configured. Set TRACCAR_BASE_URL and TRACCAR_API_TOKEN secrets.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1) Load all traccar devices with external refs
    const { data: refs, error: refsErr } = await supabase
      .from('cars_device_external_refs')
      .select('id, device_id, external_device_id, tenant_id, cars_devices(id, integration_level, source_type)')
      .eq('source_type', 'traccar');
    if (refsErr) throw new Error(`Load device refs: ${refsErr.message}`);
    if (!refs || refs.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, message: 'No traccar devices configured', synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const results: Array<{ device_id: string; positions: number; trips: number }> = [];

    for (const ref of refs) {
      const device = (ref as any).cars_devices;
      if (!device) continue;

      const deviceId = ref.device_id;
      const externalId = ref.external_device_id;
      const tenantId = ref.tenant_id;
      const standard = device.integration_level || 'A';

      // 2) Get last sync cursor from device_status
      const { data: status } = await supabase
        .from('cars_device_status')
        .select('last_position_at')
        .eq('device_id', deviceId)
        .maybeSingle();

      const fromTime = status?.last_position_at
        ? new Date(status.last_position_at).toISOString()
        : new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(); // default: last 24h

      // 3) Fetch positions from Traccar
      let traccarPositions: TraccarPosition[];
      try {
        traccarPositions = await fetchTraccarPositions(
          TRACCAR_BASE_URL, TRACCAR_API_TOKEN, externalId, fromTime, now.toISOString()
        );
      } catch (e) {
        console.error(`Traccar fetch failed for device ${externalId}:`, e);
        results.push({ device_id: deviceId, positions: 0, trips: 0 });
        continue;
      }

      if (traccarPositions.length === 0) {
        results.push({ device_id: deviceId, positions: 0, trips: 0 });
        continue;
      }

      // 4) Normalize and UPSERT into cars_positions_raw
      const normalizedRows = traccarPositions.map(p => ({
        tenant_id: tenantId,
        device_id: deviceId,
        source_type: 'traccar',
        source_position_id: String(p.id),
        recorded_at: p.fixTime,
        lat: p.latitude,
        lon: p.longitude,
        speed: Math.round(p.speed * 1.852 * 100) / 100, // knots → km/h
        course: p.course,
        altitude: p.altitude,
        accuracy: p.accuracy,
        attributes: p.attributes || {},
      }));

      const { error: upsertErr } = await supabase
        .from('cars_positions_raw')
        .upsert(normalizedRows, { onConflict: 'tenant_id,source_type,source_position_id' });
      if (upsertErr) {
        console.error(`Upsert positions failed for device ${deviceId}:`, upsertErr.message);
        continue;
      }

      // 5) Update device status
      const lastPos = traccarPositions[traccarPositions.length - 1];
      const statusRow = {
        device_id: deviceId,
        tenant_id: tenantId,
        is_online: true,
        last_signal_at: lastPos.serverTime,
        last_position_at: lastPos.fixTime,
        last_lat: lastPos.latitude,
        last_lon: lastPos.longitude,
        last_speed: Math.round(lastPos.speed * 1.852 * 100) / 100,
        last_course: lastPos.course,
        last_attributes: lastPos.attributes || {},
        updated_at: now.toISOString(),
      };
      await supabase
        .from('cars_device_status')
        .upsert(statusRow, { onConflict: 'device_id' });

      // 6) Run trip detection per logbook
      const { data: logbooks } = await supabase
        .from('cars_logbooks')
        .select('id')
        .eq('device_id', deviceId)
        .eq('status', 'active');

      let totalTrips = 0;
      const posPoints: PositionPoint[] = normalizedRows.map(r => ({
        device_id: r.device_id,
        recorded_at: r.recorded_at,
        lat: r.lat,
        lon: r.lon,
        speed: r.speed,
        course: r.course,
        altitude: r.altitude,
        accuracy: r.accuracy,
        attributes: r.attributes as Record<string, unknown>,
      }));
      posPoints.sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

      const detectedTrips = detectTripsFromPositions(posPoints, standard);

      for (const logbook of (logbooks || [])) {
        for (const trip of detectedTrips) {
          const { error: tripErr } = await supabase
            .from('cars_trips')
            .insert({
              tenant_id: tenantId,
              vehicle_id: null, // will be filled from logbook→vehicle join if needed
              logbook_id: logbook.id,
              device_id: deviceId,
              start_at: trip.start_time,
              end_at: trip.end_time,
              start_lat: trip.start_lat,
              start_lon: trip.start_lon,
              end_lat: trip.end_lat,
              end_lon: trip.end_lon,
              distance_km: trip.distance_km,
              distance_source: trip.distance_source,
              classification: 'unclassified',
              source: 'telematics',
            });
          if (tripErr) {
            console.error(`Insert trip failed:`, tripErr.message);
          } else {
            totalTrips++;
          }
        }

        // 7) Detection run log
        await supabase.from('cars_trip_detection_runs').insert({
          tenant_id: tenantId,
          logbook_id: logbook.id,
          device_id: deviceId,
          from_ts: fromTime,
          to_ts: now.toISOString(),
          positions_ingested: traccarPositions.length,
          trips_created: detectedTrips.length,
          status: 'ok',
        });
      }

      results.push({ device_id: deviceId, positions: traccarPositions.length, trips: totalTrips });
    }

    return new Response(
      JSON.stringify({ ok: true, synced: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('sot-telematics-sync error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
