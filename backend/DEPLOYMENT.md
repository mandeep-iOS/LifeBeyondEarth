# Life Beyond Earth - Deployment Guide

## Backend Deployment

### Overview

The backend is a FastAPI application with SQLite storage. It can be deployed to Render or any Docker-compatible environment.

### Environment Variables

#### Required
- `PYTHONUNBUFFERED=1` - Ensures Python output is unbuffered (required for logs)
- `PYTHONDONTWRITEBYTECODE=1` - Prevents .pyc file generation

#### Optional
- `NASA_API_KEY` - NASA API key (defaults to `DEMO_KEY`, which is rate-limited). Get a free key at https://api.nasa.gov
- `LBE_DB_PATH` - Path to SQLite database file (defaults to `data/lifebeyondearth.db`)
- `NASA_CACHE_TTL` - NASA API cache duration in seconds (defaults to 3600)

### Render Deployment

The `render.yaml` file is pre-configured for Render.com deployment:

1. **Service**: FastAPI backend
   - Runtime: Docker
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
   - Health check: `/health`
   - Plan: Free (suitable for demo/development)

2. **Static Site**: Frontend (pre-built)
   - Serves from `web-app/dist`
   - Requires `VITE_API_URL` set to backend service URL

3. **Database**: SQLite in filesystem
   - Persisted in the service's `/data` directory
   - Pre-migrated to support mission keys

### Database Schema

The SQLite database includes two main tables with mission_key support:

**history table**
- Columns: id, client_id, mission_key, planet_name, plant_name, days_survived, survival_score, survival_probability, robot_action, reason, status, difficulty_level, difficulty_explanation, created_at
- Indexes: idx_history_client, idx_history_mission_client
- Default mission_key: '1042' (public demo workspace)

**memory table**
- Columns: id, client_id, mission_key, planet_name, plant_name, survival_score, days_survived, mission_result, lesson_learned, created_at
- Indexes: idx_memory_client, idx_memory_mission_client
- Default mission_key: '1042' (public demo workspace)

### Migration & Backward Compatibility

When the backend starts, it automatically:
1. Creates tables if they don't exist (fresh deployment)
2. Adds `mission_key` column to existing tables if not present (existing deployment)
3. Sets default value of '1042' for all existing records
4. Maintains all existing data without data loss

This ensures seamless upgrades from non-mission-key deployments.

### API Endpoints with Mission Key Support

History and memory endpoints accept and respect the `X-Mission-Key` request header:

```
GET /history?client_id={uuid}&limit=100
Header: X-Mission-Key: 1042
Response: Only records for client_id + mission_key combination
Default: 1042 if header not provided

POST /history
Header: X-Mission-Key: 1042
Body: { client_id, planet_name, ... }
Action: Stores record associated with mission_key

GET /memory?client_id={uuid}
Header: X-Mission-Key: 1042
Response: Only records for client_id + mission_key combination
Default: 1042 if header not provided

POST /memory
Header: X-Mission-Key: 1042
Body: { client_id, planet_name, ... }
Action: Stores record associated with mission_key
```

CORS allows all origins and headers, including `X-Mission-Key`.

### Frontend Deployment (Vercel)

The `vercel.json` file is pre-configured for Vercel:

1. **Build Command**: `npm run build`
2. **Output Directory**: `dist` (Vite output)
3. **Environment Variables**:
   - `VITE_API_URL` - Backend URL (e.g., `https://api.yoursite.com`)
4. **Client-Side Routing**: HashRouter routing works with the catch-all rule
5. **Framework Detection**: React automatically detected

#### Setting VITE_API_URL on Vercel

In Vercel Project Settings > Environment Variables:
- Key: `VITE_API_URL`
- Value: Your Render backend URL (e.g., `https://life-beyond-earth-api.onrender.com`)

### Deployment Checklist

- [ ] Deploy backend to Render (or alternative host)
- [ ] Note the backend URL (e.g., `https://life-beyond-earth-api.onrender.com`)
- [ ] Deploy frontend to Vercel
- [ ] Set `VITE_API_URL` environment variable on Vercel
- [ ] Test on deployed frontend: visit home page, verify API connectivity
- [ ] Test mission key switching: generate new key, verify history isolation
- [ ] Test offline fallback: disconnect backend, verify demo mode

### Monitoring & Debugging

**Backend health check**: `GET /health` returns `{ "status": "ok" }`

**API logs**: Check Render dashboard or service logs for:
- Mission key validation errors
- Database operation failures
- CORS issues

**Frontend logs**: Browser DevTools Console
- Mission key stored in localStorage as `lbe_mission_key`
- API calls include `X-Mission-Key` header
- Demo mode activated if backend timeout/unavailable

### Production Recommendations

1. **Set NASA_API_KEY** to a personal key from https://api.nasa.gov (removes rate limiting)
2. **Monitor database size** as mission history grows (SQLite suitable for small-medium deployments)
3. **Regular backups** of the SQLite database file before major operations
4. **HTTPS enforcement** for both frontend and backend in production
5. **CORS review** if exposing to specific domains (currently allows all origins for demo purposes)

### Troubleshooting

**Backend unreachable from frontend**
- Verify `VITE_API_URL` environment variable is set correctly
- Check CORS headers in backend response (should include `Access-Control-Allow-Origin: *`)
- Verify backend service is running: `curl https://your-backend-url/health`

**Mission data not persisting**
- Verify SQLite database file is writable
- Check `LBE_DB_PATH` environment variable if customized
- Review backend logs for database errors

**Existing data missing after deployment**
- Check Render persistent storage is enabled
- If using fresh SQLite file, old records are not present (migration only applies to added column)
- For fresh deployment, use seed script if needed to populate demo data

### Security Notes

- Mission keys (1042-9999) are **not cryptographic** — they're workspace identifiers
- No authentication layer — this is a public demo application
- API accepts all CORS origins — suitable for demo, restrict in production use
- SQLite database should not be exposed to the internet
- NASA API keys should be kept private (use backend env var, not frontend)
