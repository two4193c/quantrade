import React, { useState } from "react";
import { Terminal, Layers, Server, Database, Cloud, Copy, Check, ShieldCheck, Box, HardDrive } from "lucide-react";

export const DockerArchitectureTab: React.FC = () => {
  const [activeFile, setActiveFile] = useState<"compose" | "dockerfile" | "cloudrun" | "requirements">("compose");
  const [copied, setCopied] = useState(false);

  const fileContents = {
    compose: `version: '3.8'

services:
  # Module 5 & 1-4: FastAPI Quantitative Backend Service
  quant-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: quanttrade-fastapi
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - PORT=8000
      - ENVIRONMENT=development
      - STORAGE_PATH=/data/storage
      - FEATURE_STORE_PATH=/data/features
      - TIINGO_API_KEY=\${TIINGO_API_KEY:-""}
      - UK_STAMP_DUTY_RATE=0.005
      - DEFAULT_UNIVERSE=FTSE100
    volumes:
      - quant-storage:/data/storage
      - quant-features:/data/features
      - ./backend:/app
    depends_on:
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Module 5: React + Tailwind Frontend Service (Vite Dev / Nginx)
  quant-frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    container_name: quanttrade-react
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:8000
    depends_on:
      - quant-backend

  # Redis for Background Job Queue (Long-running Optuna studies)
  redis:
    image: redis:7-alpine
    container_name: quanttrade-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  # Automated Daily Ingestion Scheduler
  quant-scheduler:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: quanttrade-scheduler
    command: ["python", "-m", "app.scheduler"]
    environment:
      - BACKEND_API_URL=http://quant-backend:8000
      - SCHEDULE_CRON=0 17 * * 1-5  # Mon-Fri 17:00 London close
    depends_on:
      - quant-backend
    volumes:
      - quant-storage:/data/storage

volumes:
  quant-storage:
    name: quanttrade_duckdb_parquet
  quant-features:
    name: quanttrade_features
  redis-data:
    name: quanttrade_redis`,

    dockerfile: `# Multi-stage Dockerfile for Cloud Run & Local Production
# Stage 1: Build Frontend Assets
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Python Backend & Production Container
FROM python:3.11-slim AS production

RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential \\
    curl \\
    nginx \\
    supervisor \\
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

COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV PORT=3000
ENV PYTHONUNBUFFERED=1
ENV STORAGE_PATH=/app/data/storage

EXPOSE 3000

CMD ["/app/entrypoint.sh"]`,

    cloudrun: `# Deploy Backend to Google Cloud Run (Dedicated container)
gcloud builds submit --tag gcr.io/$PROJECT_ID/quanttrade-backend ./backend

gcloud run deploy quanttrade-backend \\
  --image gcr.io/$PROJECT_ID/quanttrade-backend \\
  --platform managed \\
  --region europe-west2 \\
  --allow-unauthenticated \\
  --set-env-vars="ENVIRONMENT=production,TIINGO_API_KEY=sm://TIINGO_KEY" \\
  --memory 2Gi \\
  --cpu 2 \\
  --timeout 300s

# Deploy Frontend to Vercel
vercel --prod --build-env VITE_API_URL=https://quanttrade-backend-xxx.run.app`,

    requirements: `fastapi>=0.110.0
uvicorn[standard]>=0.28.0
pydantic>=2.6.0
duckdb>=0.10.0
pyarrow>=15.0.0
pandas>=2.2.0
numpy>=1.26.0
scipy>=1.12.0
scikit-learn>=1.4.0
hmmlearn>=0.3.0
yfinance>=0.2.36
requests>=2.31.0
apscheduler>=3.10.4
python-dotenv>=1.0.1
optuna>=3.5.0
stable-baselines3>=2.2.1
gymnasium>=0.29.1`
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fileContents[activeFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-slate-100">Dockerized System Architecture & Cloud Run Deployment</h2>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            DevOps & Infrastructure
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Decoupled container topology: FastAPI backend + React Vite frontend + DuckDB columnar storage volume + Redis queue
        </p>
      </div>

      {/* Interactive Container Architecture Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Container 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">CONTAINER 1</span>
              <Box className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-sm font-semibold text-slate-100 mt-2">FastAPI Backend</h4>
            <p className="text-xs text-slate-400 mt-1">
              Python 3.11 with VectorBT, DuckDB, Optuna, Scikit-learn, and HMMlearn.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex justify-between">
            <span>Internal Port</span>
            <span className="text-slate-200">8000</span>
          </div>
        </div>

        {/* Container 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-blue-400 font-semibold">CONTAINER 2</span>
              <Server className="w-4 h-4 text-blue-400" />
            </div>
            <h4 className="text-sm font-semibold text-slate-100 mt-2">React 19 Frontend</h4>
            <p className="text-xs text-slate-400 mt-1">
              Vite + TailwindCSS + Recharts single-page application served via Nginx.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex justify-between">
            <span>External Port</span>
            <span className="text-slate-200">3000</span>
          </div>
        </div>

        {/* Volume 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-amber-400 font-semibold">PERSISTENT VOLUME</span>
              <HardDrive className="w-4 h-4 text-amber-400" />
            </div>
            <h4 className="text-sm font-semibold text-slate-100 mt-2">DuckDB & Parquet</h4>
            <p className="text-xs text-slate-400 mt-1">
              Partitioned storage mounted at <code>/data/storage</code>. GCS compatible.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex justify-between">
            <span>Format</span>
            <span className="text-slate-200">Snappy Parquet</span>
          </div>
        </div>

        {/* Container 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-purple-400 font-semibold">CONTAINER 3 & 4</span>
              <Cloud className="w-4 h-4 text-purple-400" />
            </div>
            <h4 className="text-sm font-semibold text-slate-100 mt-2">Redis & Scheduler</h4>
            <p className="text-xs text-slate-400 mt-1">
              Redis for background backtests and APScheduler for daily 17:05 London jobs.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex justify-between">
            <span>Cron Job</span>
            <span className="text-slate-200">Mon-Fri 17:05</span>
          </div>
        </div>
      </div>

      {/* Code & Configuration Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-3 bg-slate-800/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          {/* File Tabs */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveFile("compose")}
              className={`px-3 py-1.5 rounded text-xs font-mono transition ${
                activeFile === "compose" ? "bg-slate-700 text-emerald-400 font-semibold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              docker-compose.yml
            </button>
            <button
              onClick={() => setActiveFile("dockerfile")}
              className={`px-3 py-1.5 rounded text-xs font-mono transition ${
                activeFile === "dockerfile" ? "bg-slate-700 text-emerald-400 font-semibold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Dockerfile
            </button>
            <button
              onClick={() => setActiveFile("cloudrun")}
              className={`px-3 py-1.5 rounded text-xs font-mono transition ${
                activeFile === "cloudrun" ? "bg-slate-700 text-emerald-400 font-semibold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Cloud Run Deploy (CLI)
            </button>
            <button
              onClick={() => setActiveFile("requirements")}
              className={`px-3 py-1.5 rounded text-xs font-mono transition ${
                activeFile === "requirements" ? "bg-slate-700 text-emerald-400 font-semibold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              requirements.txt
            </button>
          </div>

          <button
            onClick={copyToClipboard}
            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs flex items-center space-x-1 transition font-mono"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>

        <pre className="p-4 text-xs font-mono text-slate-300 bg-slate-950 overflow-x-auto max-h-96 leading-relaxed">
          {fileContents[activeFile]}
        </pre>
      </div>

      {/* Execution Instructions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h4 className="text-xs font-semibold text-slate-100 flex items-center space-x-2 mb-3">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Local Development Quickstart Command</span>
        </h4>
        <div className="p-3 bg-slate-950 rounded-lg font-mono text-xs text-emerald-400 flex items-center justify-between">
          <code>docker-compose up --build</code>
          <span className="text-slate-500 text-[11px]">Starts FastAPI (8000), React (3000), Redis (6379)</span>
        </div>
      </div>
    </div>
  );
};
