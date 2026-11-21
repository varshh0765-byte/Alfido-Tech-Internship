# Task 3: Monitoring, Logging and Incident Playbook

Adds monitoring to the Node.js + PostgreSQL app from Task 1:

- **Metrics:** the app exposes `/metrics` (prom-client). Prometheus scrapes it every 5 seconds.
- **Dashboard:** Grafana, with a provisioned "App Overview" dashboard.
- **Alerts:** two Prometheus rules, `AppDown` and `HighErrorRate`.
- **Logging:** the app writes structured JSON logs to stdout; Docker collects them (rotated, max 3 x 10 MB) and you read them with `docker compose logs`.
- **Incident playbook:** see [INCIDENT-PLAYBOOK.md](INCIDENT-PLAYBOOK.md).

## Services and ports

| Service | URL | Notes |
|---------|-----|-------|
| App | http://localhost:3000 | `/`, `/health`, `/visits`, `/error`, `/metrics` |
| Prometheus | http://localhost:9090 | Targets, queries, Alerts |
| Grafana | http://localhost:3001 | login `admin` / `admin` |

## Run

```bash
cd task3-monitoring
docker compose up --build -d
docker compose ps
```

## Generate traffic

```bash
for i in $(seq 1 50); do curl -s localhost:3000/visits > /dev/null; curl -s localhost:3000/ > /dev/null; done
```

## View logs

```bash
docker compose logs -f app
docker compose logs app | grep '"level":"error"'
```

## Simulate incidents

**1. Database failure (HighErrorRate):**
```bash
docker compose stop db
for i in $(seq 1 100); do curl -s localhost:3000/visits > /dev/null; sleep 0.5; done
```
Prometheus -> Alerts shows `HighErrorRate` as Pending then Firing. Recover with `docker compose start db`.

**2. App down (AppDown):**
```bash
docker compose stop app
```
After about 15 seconds `AppDown` fires. Recover with `docker compose start app`.

## Stop

```bash
docker compose down        # keep data
docker compose down -v     # delete data volumes
```
