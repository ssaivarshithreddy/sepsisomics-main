# Sepsisomics Backend

FastAPI backend foundation for authenticated Sepsisomics clinical intelligence workflows.

## Setup

Required backend runtime:

- Python 3.12
- FastAPI 0.115.6
- scikit-learn 1.6.1
- Supabase Python client 2.10.0

1. Copy `.env.example` to `.env`.
2. Fill in Supabase URL, anon key, service role key, and JWT secret.
3. Apply `supabase/schema.sql` in the Supabase SQL editor.
4. Run the API:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API exposes `/health` and versioned routes under `/api/v1`.

## Intelligence Modules

- `/api/v1/ml/predict` runs the reusable RandomForest inference pipeline.
- `/api/v1/ml/datasets/transform` prepares MIMIC-IV, PhysioNet, or generic records for model ingestion.
- `/api/v1/timeline/patients/{patient_id}` returns risk progression and deterioration estimates.
- `/api/v1/summaries/patients/{patient_id}` generates stored medical summaries from vitals, alerts, and predictions.
- `/api/v1/notifications/*` supports device registration and emergency alert delivery queues.
- `/api/v1/collaboration/*` supports shared patient access and activity tracking.
- `/api/v1/monitoring/*` exposes diagnostics for database, Redis, and realtime health.
