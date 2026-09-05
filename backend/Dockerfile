# Cloud Run Standalone FastAPI Dockerfile
FROM python:3.11-slim

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Source Code
COPY . .

# DuckDB / Parquet persistent directory
RUN mkdir -p /data/storage /data/features

ENV PORT=8000
ENV PYTHONUNBUFFERED=1
ENV STORAGE_PATH=/data/storage
ENV FEATURE_STORE_PATH=/data/features

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
