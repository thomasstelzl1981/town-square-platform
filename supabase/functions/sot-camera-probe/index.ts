import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Pure-JS MD5 (RFC 1321) ──
function md5(str: string): string {
  function safeAdd(x: number, y: number) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    return (((x >> 16) + (y >> 16) + (lsw >> 16)) << 16) | (lsw & 0xffff);
  }
  function bitRotateLeft(n: number, c: number) { return (n << c) | (n >>> (32 - c)); }
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn((b & c) | (~b & d), a, b, x, s, t); }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t); }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn(b ^ c ^ d, a, b, x, s, t); }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn(c ^ (b | ~d), a, b, x, s, t); }
  function rstr2binl(input: string) {
    const output: number[] = new Array(input.length >> 2).fill(0);
    for (let i = 0; i < input.length * 8; i += 8) output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << (i % 32);
    return output;
  }
  function binl2rstr(input: number[]) {
    let output = '';
    for (let i = 0; i < input.length * 32; i += 8) output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xff);
    return output;
  }
  function binlMD5(x: number[], len: number) {
    x[len >> 5] |= 0x80 << (len % 32);
    x[(((len + 64) >>> 9) << 4) + 14] = len;
    let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
    for (let i = 0; i < x.length; i += 16) {
      const oa = a, ob = b, oc = c, od = d;
      a=ff(a,b,c,d,x[i+0],7,-680876936);d=ff(d,a,b,c,x[i+1],12,-389564586);c=ff(c,d,a,b,x[i+2],17,606105819);b=ff(b,c,d,a,x[i+3],22,-1044525330);
      a=ff(a,b,c,d,x[i+4],7,-176418897);d=ff(d,a,b,c,x[i+5],12,1200080426);c=ff(c,d,a,b,x[i+6],17,-1473231341);b=ff(b,c,d,a,x[i+7],22,-45705983);
      a=ff(a,b,c,d,x[i+8],7,1770035416);d=ff(d,a,b,c,x[i+9],12,-1958414417);c=ff(c,d,a,b,x[i+10],17,-42063);b=ff(b,c,d,a,x[i+11],22,-1990404162);
      a=ff(a,b,c,d,x[i+12],7,1804603682);d=ff(d,a,b,c,x[i+13],12,-40341101);c=ff(c,d,a,b,x[i+14],17,-1502002290);b=ff(b,c,d,a,x[i+15],22,1236535329);
      a=gg(a,b,c,d,x[i+1],5,-165796510);d=gg(d,a,b,c,x[i+6],9,-1069501632);c=gg(c,d,a,b,x[i+11],14,643717713);b=gg(b,c,d,a,x[i+0],20,-373897302);
      a=gg(a,b,c,d,x[i+5],5,-701558691);d=gg(d,a,b,c,x[i+10],9,38016083);c=gg(c,d,a,b,x[i+15],14,-660478335);b=gg(b,c,d,a,x[i+4],20,-405537848);
      a=gg(a,b,c,d,x[i+9],5,568446438);d=gg(d,a,b,c,x[i+14],9,-1019803690);c=gg(c,d,a,b,x[i+3],14,-187363961);b=gg(b,c,d,a,x[i+8],20,1163531501);
      a=gg(a,b,c,d,x[i+13],5,-1444681467);d=gg(d,a,b,c,x[i+2],9,-51403784);c=gg(c,d,a,b,x[i+7],14,1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734);
      a=hh(a,b,c,d,x[i+5],4,-378558);d=hh(d,a,b,c,x[i+8],11,-2022574463);c=hh(c,d,a,b,x[i+11],16,1839030562);b=hh(b,c,d,a,x[i+14],23,-35309556);
      a=hh(a,b,c,d,x[i+1],4,-1530992060);d=hh(d,a,b,c,x[i+4],11,1272893353);c=hh(c,d,a,b,x[i+7],16,-155497632);b=hh(b,c,d,a,x[i+10],23,-1094730640);
      a=hh(a,b,c,d,x[i+13],4,681279174);d=hh(d,a,b,c,x[i+0],11,-358537222);c=hh(c,d,a,b,x[i+3],16,-722521979);b=hh(b,c,d,a,x[i+6],23,76029189);
      a=hh(a,b,c,d,x[i+9],4,-640364487);d=hh(d,a,b,c,x[i+12],11,-421815835);c=hh(c,d,a,b,x[i+15],16,530742520);b=hh(b,c,d,a,x[i+2],23,-995338651);
      a=ii(a,b,c,d,x[i+0],6,-198630844);d=ii(d,a,b,c,x[i+7],10,1126891415);c=ii(c,d,a,b,x[i+14],15,-1416354905);b=ii(b,c,d,a,x[i+5],21,-57434055);
      a=ii(a,b,c,d,x[i+12],6,1700485571);d=ii(d,a,b,c,x[i+3],10,-1894986606);c=ii(c,d,a,b,x[i+10],15,-1051523);b=ii(b,c,d,a,x[i+1],21,-2054922799);
      a=ii(a,b,c,d,x[i+8],6,1873313359);d=ii(d,a,b,c,x[i+15],10,-30611744);c=ii(c,d,a,b,x[i+6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21,1309151649);
      a=ii(a,b,c,d,x[i+4],6,-145523070);d=ii(d,a,b,c,x[i+11],10,-1120210379);c=ii(c,d,a,b,x[i+2],15,718787259);b=ii(b,c,d,a,x[i+9],21,-343485551);
      a=safeAdd(a,oa);b=safeAdd(b,ob);c=safeAdd(c,oc);d=safeAdd(d,od);
    }
    return [a, b, c, d];
  }
  function rstr2hex(input: string) {
    const hex = '0123456789abcdef';
    let out = '';
    for (let i = 0; i < input.length; i++) { const x = input.charCodeAt(i); out += hex[(x >>> 4) & 0xf] + hex[x & 0xf]; }
    return out;
  }
  return rstr2hex(binl2rstr(binlMD5(rstr2binl(str), str.length * 8)));
}

function parseDigestChallenge(header: string): Record<string, string> {
  const params: Record<string, string> = {};
  const regex = /(\w+)="([^"]+)"/g;
  let match;
  while ((match = regex.exec(header)) !== null) params[match[1]] = match[2];
  const qopMatch = header.match(/qop=([^,\s]+)/);
  if (qopMatch && !params.qop) params.qop = qopMatch[1].replace(/"/g, '');
  return params;
}

function buildDigestAuth(method: string, uri: string, username: string, password: string, challenge: Record<string, string>): string {
  const { realm, nonce, opaque, qop } = challenge;
  const nc = "00000001";
  const cnonce = Math.random().toString(36).substring(2, 10);
  const ha1 = md5(`${username}:${realm}:${password}`);
  const ha2 = md5(`${method}:${uri}`);
  const response = qop === "auth" ? md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`) : md5(`${ha1}:${nonce}:${ha2}`);
  let header = `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${response}"`;
  if (qop) header += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;
  if (opaque) header += `, opaque="${opaque}"`;
  return header;
}

// ── Response types ──
interface ProbeResult {
  reachability: 'ok' | 'timeout' | 'dns_fail' | 'refused';
  auth: 'ok' | 'unauthorized' | 'digest_required' | 'forbidden' | 'no_credentials' | 'skipped';
  snapshot: 'ok' | 'not_jpeg' | 'bad_path' | 'no_image' | 'skipped';
  latency_ms: number;
  hints: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body
    const body = await req.json();
    const { snapshot_url, auth_user, auth_pass } = body as {
      snapshot_url: string;
      auth_user?: string;
      auth_pass?: string;
    };

    if (!snapshot_url) {
      return new Response(JSON.stringify({ error: "snapshot_url required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result: ProbeResult = {
      reachability: 'ok',
      auth: 'skipped',
      snapshot: 'skipped',
      latency_ms: 0,
      hints: [],
    };

    const startTime = Date.now();

    // Step 1: Initial fetch (no auth)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    let response: Response;
    try {
      response = await fetch(snapshot_url, { signal: controller.signal });
    } catch (fetchErr) {
      clearTimeout(timeout);
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);

      if (msg.includes('abort') || msg.includes('timeout')) {
        result.reachability = 'timeout';
        result.hints.push('Keine Verbindung innerhalb von 12 Sekunden. Prüfen Sie die FRITZ!Box-Portfreigabe: externer Port → Kamera IP → interner Port.');
      } else if (msg.includes('dns') || msg.includes('getaddrinfo') || msg.includes('ENOTFOUND')) {
        result.reachability = 'dns_fail';
        result.hints.push('Domain nicht erreichbar. Prüfen Sie Ihre MyFRITZ-Adresse oder DynDNS-Domain. Öffnen Sie die Domain im Browser – wenn sie nicht lädt, ist die Domain nicht aktiv.');
      } else {
        result.reachability = 'refused';
        result.hints.push('Verbindung abgelehnt. Prüfen Sie die FRITZ!Box-Portfreigabe und ob die Kamera eingeschaltet ist.');
      }

      result.latency_ms = Date.now() - startTime;
      return new Response(JSON.stringify(result), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    result.latency_ms = Date.now() - startTime;

    // Step 2: Handle 401
    if (response.status === 401) {
      if (!auth_user || !auth_pass) {
        clearTimeout(timeout);
        result.auth = 'no_credentials';
        result.hints.push('Kamera verlangt Login-Daten. Bitte Benutzername und Passwort eingeben.');
        return new Response(JSON.stringify(result), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const wwwAuth = response.headers.get("WWW-Authenticate") ?? "";

      let camAuthHeader: string;
      if (wwwAuth.toLowerCase().startsWith("digest")) {
        const challenge = parseDigestChallenge(wwwAuth);
        const parsedUrl = new URL(snapshot_url);
        const uri = parsedUrl.pathname + parsedUrl.search;
        camAuthHeader = buildDigestAuth("GET", uri, auth_user, auth_pass, challenge);
      } else {
        camAuthHeader = `Basic ${btoa(`${auth_user}:${auth_pass}`)}`;
      }

      try {
        // Consume the body of the first response
        await response.text();
        response = await fetch(snapshot_url, {
          signal: controller.signal,
          headers: { Authorization: camAuthHeader },
        });
      } catch (fetchErr) {
        clearTimeout(timeout);
        result.auth = 'unauthorized';
        result.hints.push('Verbindung nach Auth-Handshake fehlgeschlagen. Prüfen Sie Netzwerk und Portfreigabe.');
        return new Response(JSON.stringify(result), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (response.status === 401) {
        clearTimeout(timeout);
        result.auth = 'unauthorized';
        result.hints.push('Login abgelehnt. Prüfen Sie Benutzername und Passwort im Kamera-WebUI. Bei Digest-Kameras: Stellen Sie sicher, dass der Kamera-Benutzer aktiv ist.');
        await response.text();
        return new Response(JSON.stringify(result), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (response.status === 403) {
        clearTimeout(timeout);
        result.auth = 'forbidden';
        result.hints.push('Zugriff verboten. Der Kamera-Benutzer hat keine Berechtigung für Snapshots. Prüfen Sie die Benutzerrechte im Kamera-WebUI.');
        await response.text();
        return new Response(JSON.stringify(result), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      result.auth = 'ok';
    } else if (response.ok) {
      result.auth = 'ok'; // No auth needed
    }

    clearTimeout(timeout);

    // Step 3: Validate snapshot
    if (!response.ok) {
      result.snapshot = 'bad_path';
      result.hints.push(`Snapshot-Adresse liefert HTTP ${response.status}. Wählen Sie den passenden Hersteller-Preset oder kopieren Sie die Snapshot-URL aus dem Kamera-WebUI.`);
      await response.text();
      return new Response(JSON.stringify(result), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = response.headers.get("content-type") ?? "";
    const bodyBytes = new Uint8Array(await response.arrayBuffer());

    // Check JPEG magic bytes (FF D8 FF)
    const isJpeg = bodyBytes.length >= 3 && bodyBytes[0] === 0xFF && bodyBytes[1] === 0xD8 && bodyBytes[2] === 0xFF;
    const isImage = contentType.includes("image/") || isJpeg;

    if (!isImage) {
      result.snapshot = 'not_jpeg';
      result.hints.push('Kein Bild empfangen. Die Snapshot-URL liefert keinen JPEG-Stream. Prüfen Sie den Hersteller-Preset oder die Snapshot-URL aus dem Kamera-WebUI.');
    } else if (bodyBytes.length < 1000) {
      result.snapshot = 'no_image';
      result.hints.push('Bild sehr klein (< 1 KB) – möglicherweise ein Platzhalter. Prüfen Sie, ob die Kamera korrekt verbunden ist.');
    } else {
      result.snapshot = 'ok';
    }

    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
