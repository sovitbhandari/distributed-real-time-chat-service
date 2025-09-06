# djchat — Distributed Real-Time Chat (Django + Channels + Redis)

A minimal, production-ready WebSocket chat built with **Django + Channels + Redis**, containerized with **Docker**, ready for **Kubernetes** with **HPA** and **Prometheus**-scrapable `/metrics`.

## Features
- WebSockets via **Django Channels** (works across pods via Redis fan-out)
- **Redis** channel layer for horizontal scalability
- **Prometheus** metrics: connections, messages, and basic broadcast timing
- Health checks: `/health` (readiness/liveness)
- Docker & docker-compose for local dev
- Kubernetes manifests (Deployment, Service, HPA, Redis)
- Works with SQLite locally; switch to Postgres in production via env vars

## Quick Start (Local, with docker-compose)
```bash
# In the extracted folder:
docker compose up --build
# Open: http://localhost:8000
```

## Manual Local Run (no Docker)
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export SECRET_KEY="dev"
export ALLOWED_HOSTS="*"
export REDIS_URL="redis://localhost:6379/0"
# Start local redis (needs Docker):
docker run --rm -p 6379:6379 redis:7-alpine
python3 manage.py migrate
python3 manage.py runserver 0.0.0.0:8000
```

## Kubernetes (example)
```bash
# create namespace
kubectl apply -f k8s/00-namespace.yaml
# deploy redis then app
kubectl apply -f k8s/10-redis.yaml
kubectl apply -f k8s/20-app.yaml
kubectl apply -f k8s/30-hpa.yaml

# Port-forward to test quickly
kubectl -n djchat port-forward svc/djchat 8000:80
# Open: http://localhost:8000
```

### Notes
- For production DB, set `DATABASE_URL` (e.g., `postgres://user:pass@host:5432/dbname`).
- `ALLOWED_HOSTS` must include your domain/IP in production.
- Service exposes `/metrics` for Prometheus; add your Prometheus scrape config or ServiceMonitor if using kube-prometheus-stack.
