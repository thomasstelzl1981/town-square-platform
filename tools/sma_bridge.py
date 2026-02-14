#!/usr/bin/env python3
"""
SMA Sunny Tripower Local Bridge Script
========================================
Connects to an SMA inverter on the local network via WebConnect JSON-API,
polls live data, and pushes measurements to the Lovable Cloud database
via the pv-connector-bridge edge function.

Usage:
    python sma_bridge.py \
        --ip 192.168.178.42 \
        --password YOUR_WR_PASSWORD \
        --plant-id YOUR_PV_PLANT_UUID \
        --tenant-id YOUR_TENANT_UUID \
        --connector-id YOUR_CONNECTOR_UUID \
        --supabase-url https://ktpvilzjtcaxyuufocrs.supabase.co \
        --supabase-key YOUR_ANON_OR_SERVICE_KEY \
        --interval 10

Requirements:
    pip install requests
"""

import argparse
import json
import sys
import time
import urllib3
from datetime import datetime

import requests

# SMA uses self-signed certs — suppress warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# SMA WebConnect register keys
KEYS = {
    "current_power_w": "6100_40263F00",
    "total_energy_wh": "6400_00260100",
    "energy_today_wh": "6400_00262200",
}


def sma_login(ip: str, password: str) -> str:
    """Login to SMA inverter, return session ID."""
    url = f"https://{ip}/dyn/login.json"
    payload = {"right": "usr", "pass": password}
    r = requests.post(url, json=payload, verify=False, timeout=10)
    r.raise_for_status()
    data = r.json()
    sid = data.get("result", {}).get("sid")
    if not sid:
        raise RuntimeError(f"SMA login failed: {json.dumps(data)}")
    print(f"[{now()}] ✓ SMA login OK (sid={sid[:8]}...)")
    return sid


def sma_logout(ip: str, sid: str):
    """Logout from SMA inverter."""
    try:
        url = f"https://{ip}/dyn/logout.json?sid={sid}"
        requests.post(url, json={}, verify=False, timeout=5)
    except Exception:
        pass


def sma_read_values(ip: str, sid: str) -> dict:
    """Read current values from SMA inverter."""
    url = f"https://{ip}/dyn/getValues.json?sid={sid}"
    keys_list = list(KEYS.values())
    payload = {"destDev": [], "keys": keys_list}
    r = requests.post(url, json=payload, verify=False, timeout=10)
    r.raise_for_status()
    data = r.json()

    result = data.get("result", {})
    if not result:
        raise RuntimeError(f"No result from SMA: {json.dumps(data)}")

    # Parse values — SMA nests under serial number
    values = {}
    for serial_data in result.values():
        for key_name, register_key in KEYS.items():
            if register_key in serial_data:
                entries = serial_data[register_key]
                # Navigate nested structure: {"1": [{"val": 4230}]}
                for channel in entries.values():
                    if isinstance(channel, list) and len(channel) > 0:
                        val = channel[0].get("val")
                        if val is not None and val != "null":
                            values[key_name] = val

    return values


def push_measurement(
    supabase_url: str,
    supabase_key: str,
    plant_id: str,
    tenant_id: str,
    connector_id: str,
    values: dict,
):
    """Push measurement to pv-connector-bridge edge function."""
    url = f"{supabase_url}/functions/v1/pv-connector-bridge"
    headers = {
        "Authorization": f"Bearer {supabase_key}",
        "apikey": supabase_key,
        "Content-Type": "application/json",
    }

    power_w = values.get("current_power_w", 0)
    energy_today_kwh = values.get("energy_today_wh", 0) / 1000.0 if "energy_today_wh" in values else None
    energy_month_kwh = None  # SMA doesn't provide monthly directly

    payload = {
        "action": "ingest",
        "connector_id": connector_id,
        "pv_plant_id": plant_id,
        "tenant_id": tenant_id,
        "current_power_w": power_w,
        "energy_today_kwh": energy_today_kwh,
        "energy_month_kwh": energy_month_kwh,
        "source": "sma_webconnect",
    }

    r = requests.post(url, json=payload, headers=headers, timeout=10)
    if r.status_code != 200:
        print(f"[{now()}] ✗ Push failed ({r.status_code}): {r.text}")
    else:
        print(f"[{now()}] ↑ Pushed: {power_w}W | {energy_today_kwh:.2f}kWh today" if energy_today_kwh else f"[{now()}] ↑ Pushed: {power_w}W")


def update_status(supabase_url: str, supabase_key: str, connector_id: str, status: str, error: str = None):
    """Update connector status via edge function."""
    url = f"{supabase_url}/functions/v1/pv-connector-bridge"
    headers = {
        "Authorization": f"Bearer {supabase_key}",
        "apikey": supabase_key,
        "Content-Type": "application/json",
    }
    payload = {"action": "status", "connector_id": connector_id, "status": status}
    if error:
        payload["last_error"] = error
    try:
        requests.post(url, json=payload, headers=headers, timeout=10)
    except Exception:
        pass


def now():
    return datetime.now().strftime("%H:%M:%S")


def main():
    parser = argparse.ArgumentParser(description="SMA Sunny Tripower Local Bridge")
    parser.add_argument("--ip", required=True, help="SMA inverter IP address")
    parser.add_argument("--password", required=True, help="SMA WebConnect password")
    parser.add_argument("--plant-id", required=True, help="PV plant UUID")
    parser.add_argument("--tenant-id", required=True, help="Tenant UUID")
    parser.add_argument("--connector-id", required=True, help="Connector UUID")
    parser.add_argument("--supabase-url", default="https://ktpvilzjtcaxyuufocrs.supabase.co")
    parser.add_argument("--supabase-key", required=True, help="Supabase anon or service key")
    parser.add_argument("--interval", type=int, default=10, help="Polling interval in seconds")
    args = parser.parse_args()

    print(f"╔══════════════════════════════════════╗")
    print(f"║   SMA Bridge — System of a Town      ║")
    print(f"╠══════════════════════════════════════╣")
    print(f"║ IP:       {args.ip:<26}║")
    print(f"║ Plant:    {args.plant_id[:8]}...{' ' * 17}║")
    print(f"║ Interval: {args.interval}s{' ' * 24}║")
    print(f"╚══════════════════════════════════════╝")

    sid = None
    consecutive_errors = 0

    try:
        while True:
            try:
                # Login if needed
                if sid is None:
                    sid = sma_login(args.ip, args.password)
                    update_status(args.supabase_url, args.supabase_key, args.connector_id, "connected")
                    consecutive_errors = 0

                # Read values
                values = sma_read_values(args.ip, sid)
                print(f"[{now()}] ⚡ Power: {values.get('current_power_w', '?')}W")

                # Push to cloud
                push_measurement(
                    args.supabase_url,
                    args.supabase_key,
                    args.plant_id,
                    args.tenant_id,
                    args.connector_id,
                    values,
                )
                consecutive_errors = 0

            except KeyboardInterrupt:
                raise
            except Exception as e:
                consecutive_errors += 1
                err_msg = str(e)
                print(f"[{now()}] ✗ Error ({consecutive_errors}): {err_msg}")

                # Session might have expired — force re-login
                if sid:
                    sma_logout(args.ip, sid)
                    sid = None

                if consecutive_errors >= 3:
                    update_status(args.supabase_url, args.supabase_key, args.connector_id, "error", err_msg)

            time.sleep(args.interval)

    except KeyboardInterrupt:
        print(f"\n[{now()}] Bridge stopped.")
        if sid:
            sma_logout(args.ip, sid)
        update_status(args.supabase_url, args.supabase_key, args.connector_id, "offline")
        sys.exit(0)


if __name__ == "__main__":
    main()
