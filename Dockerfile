# Multi-stage Dockerfile for Cloud Run & Local Production
# Stage 1: Build Frontend Assets
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Python Backend & Production Container
FROM python:3.11-slim AS production

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python quantitative dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy Backend Code
COPY backend/ ./backend/

# Copy Built Frontend from Stage 1
COPY --from=frontend-builder /app/dist /app/frontend_dist

# Create storage volume directory for DuckDB & Parquet
RUN mkdir -p /app/data/storage /app/data/features /app/logs

# Copy configuration and entrypoint
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Cloud Run binds to PORT environment variable (default 3000/8000)
ENV PORT=3000
ENV PYTHONUNBUFFERED=1
ENV STORAGE_PATH=/app/data/storage
ENV FEATURE_STORE_PATH=/app/data/features

EXPOSE 3000

CMD ["/app/entrypoint.sh"]
