# ---- Frontend build (Vite) ----
FROM node:20-alpine AS fe
WORKDIR /fe
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build   # builds to /fe/dist -> we'll serve as Django static

# ---- Python runtime ----
FROM python:3.13-slim AS app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# copy project
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY . /app

# copy built frontend into Django static dir
RUN mkdir -p /app/static/frontend && \
    cp -r /fe/dist/* /app/static/frontend/ || true

# whitenoise collectstatic (optional if you already ship built assets)
ENV DJANGO_SETTINGS_MODULE=djchat.settings
RUN python manage.py collectstatic --noinput || true

# health endpoint
EXPOSE 8000

# Entrypoint ensures DB ready + migrations then start Daphne
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
CMD ["/entrypoint.sh"]
