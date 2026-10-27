#!/usr/bin/env python3
"""One synthetic black-box check against the fixed, already expired staging QA.

No Admin, email, account or restore operation. A rejected POST can increment
the staging abuse counter. Unexpected acceptance stops without retrying or
printing credentials. Never redirect or accept a caller-selected target.
"""
import argparse
import datetime
import json
import urllib.error
import urllib.request
import uuid

SITE = "https://uadav-api-staging.uadavstream.workers.dev"
PAGES = "https://uadav-stream-staging.pages.dev"
QA_JOB = "JOB-MVPJ9WRW-439D4126D9AE"


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise RuntimeError("Unexpected redirect; no request forwarded.")


def request_json(opener, path, payload=None):
    headers = {"Accept": "application/json", "User-Agent": "UADAV-staging-expiry-QA/11768"}
    if payload is not None:
        headers.update({"Content-Type": "application/json", "Origin": PAGES})
    req = urllib.request.Request(
        SITE + path,
        data=None if payload is None else json.dumps(payload).encode(),
        headers=headers,
        method="GET" if payload is None else "POST",
    )
    try:
        response = opener.open(req, timeout=15)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        body = response.read(350001)
        if len(body) > 350000:
            raise RuntimeError("Response too large; no result accepted.")
        if response.headers.get_content_type() != "application/json":
            raise RuntimeError("Unexpected content type; no result accepted.")
        return response.code, json.loads(body), response.headers.get("Date")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--probe-expired-fixture", action="store_true",
                        help="Allow one POST containing only synthetic QA data.")
    args = parser.parse_args()
    opener = urllib.request.build_opener(NoRedirect())
    status, health, _ = request_json(opener, "/api/health")
    if status != 200 or health.get("build") != "11768" or not health.get("d1"):
        raise RuntimeError("Expected staging11768/D1 not observed; probe not performed.")
    status, offers, _ = request_json(opener, "/api/bolsa_trabajo")
    if status != 200 or not isinstance(offers, list):
        raise RuntimeError("Public list not confirmed; probe not performed.")
    if any(offer.get("id") == QA_JOB for offer in offers):
        raise RuntimeError("Expired QA is publicly visible; probe not performed.")
    result = {
        "scope": "bolsa-expired-application-http-staging",
        "build": "11768", "result": "public-read-only",
        "public_expired_offer_hidden": True,
        "public_offers_before": len(offers),
        "live_new_application_probe_performed": False,
        "recovery_enabled_by_this_tool": False,
        "admin_or_account_credentials_used": False,
        "automatic_retries": 0,
    }
    if args.probe_expired_fixture:
        payload = {
            "job_id": QA_JOB, "request_id": str(uuid.uuid4()),
            "nombre": "QA de vencimiento sin persona real",
            "email": "expiry-qa@example.invalid",
            "consent_scope": "job_application_v1",
            "consent_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "shared_fields": ["nombre", "email"], "save_to_account": False,
        }
        status, body, server_date = request_json(opener, "/api/bolsa_trabajo/postular", payload)
        result.update({
            "live_new_application_probe_performed": True,
            "probe_payload": "synthetic-only-no-account",
            "http_status": status,
            "server_date": server_date,
            "unavailable_response_confirmed": status == 404 and body == {"error": "Oportunidad no disponible"},
            "credential_returned": isinstance(body, dict) and ("clave_consulta" in body or "item" in body),
            "temporary_rate_counter_may_increment": True,
        })
        if not result["unavailable_response_confirmed"] or result["credential_returned"]:
            result["result"] = "unexpected-response-stop-no-retry"
            print(json.dumps(result, ensure_ascii=False, indent=2))
            return 1
        status, after, _ = request_json(opener, "/api/bolsa_trabajo")
        result["public_offer_still_hidden"] = status == 200 and isinstance(after, list) and not any(x.get("id") == QA_JOB for x in after)
        result["result"] = "complete" if result["public_offer_still_hidden"] else "pending"
    result["checked_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["result"] in ("complete", "public-read-only") else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, ValueError, urllib.error.URLError, TimeoutError) as error:
        print(json.dumps({"scope": "bolsa-expired-application-http-staging", "result": "not-confirmed", "error_type": type(error).__name__}))
        raise SystemExit(1)
