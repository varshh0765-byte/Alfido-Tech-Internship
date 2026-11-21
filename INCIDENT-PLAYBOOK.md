# Incident Playbook

Covers the two alerts defined in `prometheus/alert-rules.yml`. Open alerts at Prometheus -> Alerts (port 9090).

## General workflow

1. **Detect**: an alert fires in Prometheus, or the Grafana dashboard shows "App up" = 0 or errors > 0.
2. **Triage**: check what is running and what is failing.
   ```bash
   docker compose ps
   docker compose logs --tail=50 app
   ```
3. **Mitigate**: restore service first (restart the failed container).
4. **Verify**: `curl localhost:3000/health` returns `{"status":"ok"}` and the alert clears.
5. **Review**: record what happened and how to prevent it (template at the bottom).

## Alert: AppDown (critical)

**Meaning:** Prometheus cannot scrape `app:3000` for 15 seconds.

| Step | Command | What to look for |
|------|---------|------------------|
| 1 | `docker compose ps` | `mon-app` is Exited or restarting |
| 2 | `docker compose logs --tail=100 app` | Last error before the crash |
| 3 | `docker compose start app` (or `docker compose up -d`) | Container starts |
| 4 | `curl localhost:3000/health` | `{"status":"ok","db":"connected"}` |

**Likely causes:** crash on startup, database unreachable at boot, out of memory.

## Alert: HighErrorRate (warning)

**Meaning:** more than 20% of requests returned HTTP 5xx over the last minute.

| Step | Command | What to look for |
|------|---------|------------------|
| 1 | `docker compose ps` | Is `mon-db` Up and healthy? |
| 2 | `docker compose logs --tail=100 app \| grep '"level":"error"'` | Error messages such as a failed query |
| 3 | `curl localhost:3000/health` | 503 with `db: unreachable` means a database problem |
| 4 | `docker compose start db` then `docker compose restart app` | Service recovers |
| 5 | Watch Grafana "5xx errors per second" | Drops back to 0 |

**Likely causes:** database stopped, bad deploy, a code bug on one route.

## Escalation

- Not fixed within 15 minutes: contact the service owner.
- Data concerns: do not run `docker compose down -v`, because it deletes the database volume.

## Post-incident template

```
Date/time:
Alert:
Impact:
Timeline (detected / mitigated / resolved):
Root cause:
Fix applied:
Prevention / follow-up:
```
