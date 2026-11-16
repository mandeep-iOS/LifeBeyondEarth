# Life Beyond Earth

An autonomous bio-dome mission simulator powered by **Super Intelligence (SI)** to explore humanity's agricultural future on extraterrestrial worlds. Combines real NASA climate data, machine learning predictions, and robot task-planning to test crop survival across planets.

**🏆 NASA Space Apps Challenge 2026 Hackathon Submission**

## Quick Start

## 🚀 Live Hosted Deployment & Demo

- **Live Web App (Vercel Frontend + Render Backend):** https://lifebeyondearth-public.vercel.app
- **Live FastAPI Swagger Docs (Render Backend):** https://lifebeyondearth.onrender.com
- **30-Second Project Demo Video:** https://youtu.be/Gf19hmTQ75Y

> *Note: The backend runs on Render's free tier and may take ~30–45 seconds to wake up on the very first request.*


### Local Development (One Command)

```bash
./start.sh
```

Then open:
- **Web App**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs

### Manual Setup

**Backend (Python 3.10+)**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # or \.venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Web App (Node 18+)**
```bash
cd web-app
npm install
npm run dev
```

## Features

### 🌍 Mission Workflow
- **Planets**: Explore Earth, Moon, Mars, and exoplanets with real NASA POWER climate data
- **Plants**: Select crops (Red Romaine Lettuce, Dwarf Tomato, Space Cabbage, etc.) from NASA GeneLab
- **Mission Prep**: Configure landing sites, survival challenges, and robot crew composition
- **Simulation**: Run day-by-day autonomous bio-dome survival with SI decision-making
- **Result**: Detailed mission report with survival bottlenecks, robot actions, and NASA OSDR biological citations

### 🤖 SI Command & Analytics
- **Bio-Dome Lab**: Deploy robot crews, manage dome construction, handle crises (solar flares, dust storms, dome breaches)
- **Power & ECLSS Grid**: Monitor autonomous energy, water, and thermal management (L.U.M.E.N., H.Y.D.R.O., A.C.E. systems)
- **Habitat Engineering**: Task-adaptive robot morphing (4 modes), radiation shielding calculator, closed-loop life support balance
- **Dashboard**: Real-time SI metrics, anomaly detection, crew health tracking
- **Robot Memory**: SI learns from mission history to improve future decisions
- **History**: Browse all past missions with detailed telemetry

### 🔬 SI & Machine Learning
- **Visual-Spatial Predictions**: Digital-twin forecasts for task timelines, energy draw, structural stress
- **Feature Importance**: SI ML model trained on 1000+ simulated missions + real history
- **NASA Telemetry Integration**: POWER (solar/climate), OSDR (biological stress), DONKI (space weather)
- **Autonomy by Latency**: Moon (1.3s delay) → human-supervised, Mars (4–24 min) → tactical SI, Deep Space (2+ hrs) → full SI autonomy

## Architecture

### Backend (FastAPI + Python)
```
backend/
├── app/
│   ├── main.py              # FastAPI app & CORS
│   ├── models.py            # Pydantic schemas
│   ├── nasa_service.py      # NASA API clients
│   ├── engines/
│   │   ├── survival.py      # Physics-based survival simulation
│   │   ├── biodome.py       # Multi-agent bio-dome orchestration
│   │   ├── robot.py         # Robot crew action planning
│   │   ├── prediction.py    # SI outcome forecasting
│   │   ├── ml.py            # ML model training & inference
│   │   └── trainer.py       # Power/thermal simulation
│   └── routers/
│       ├── planets.py       # Planet climate endpoints
│       ├── plants.py        # Crop & genetics endpoints
│       ├── simulation.py    # Day-by-day simulation runner
│       ├── biodome.py       # Bio-dome mission planning
│       └── ... (history, predictions, ML)
├── tests/                   # pytest test suite
├── requirements.txt         # Python dependencies
├── Dockerfile              # Container image
└── render.yaml             # Render.com deployment config
```

### Frontend (React + TypeScript + Tailwind CSS)
```
web-app/
├── src/
│   ├── pages/
│   │   ├── Home.tsx                # Landing page
│   │   ├── Planets.tsx             # Planet selection
│   │   ├── Plants.tsx              # Crop selection
│   │   ├── MissionPrep.tsx         # Pre-flight config
│   │   ├── Simulation.tsx          # Real-time mission runner
│   │   ├── Result.tsx              # Detailed mission report (print-ready)
│   │   ├── BioDome.tsx             # Robot crew lab
│   │   ├── PowerGrid.tsx           # Energy & ECLSS monitoring
│   │   ├── HabitatEngineering.tsx  # Robot morphing & life support
│   │   ├── Dashboard.tsx           # SI analytics & metrics
│   │   └── ... (history, memory, planet/plant details)
│   ├── components/
│   │   ├── Navbar.tsx              # SI Command & Analytics sidebar
│   │   ├── SplitHero.tsx           # Mission briefing video + SI watermark
│   │   ├── BioDome.tsx             # Dome visualization & crisis handling
│   │   └── ... (UI components, modals, visualizations)
│   ├── api/
│   │   ├── client.ts               # Axios HTTP client
│   │   ├── types.ts                # TypeScript schemas
│   │   ├── demo.ts                 # Fallback demo data
│   │   └── biodomeDemo.ts          # Bio-dome demo crew
│   └── state/
│       └── AppState.tsx            # React Context for global app state
├── public/
│   ├── videos/
│   │   ├── mission-briefing.mp4   # Concept video (AI-generated with watermark)
│   │   └── ace-handover.mp4       # A.C.E. failover demo (AI-generated with watermark)
│   └── ...
├── vite.config.ts                  # Vite build config
├── vercel.json                      # Vercel deployment config
└── package.json                     # Node.js dependencies
```

## Deployment

### Local Docker
```bash
docker build -t lbe-api backend/
docker run -p 8000:8000 lbe-api
```

### Render.com (Free Tier)
1. Create a Render account and connect your GitHub repo
2. Deploy the backend using `backend/render.yaml`
3. Deploy the web-app as a static site pointing to `/web-app/dist`
4. Set environment variables (API URL, NASA keys)

### Vercel (Recommended for Web App)
```bash
cd web-app
vercel deploy
```

## Data Sources & Credits

### 🌍 NASA Open Data
- **NASA POWER**: Solar irradiance, temperature, and climate data for all planets
- **NASA Exoplanet Archive**: Exoplanet habitability metrics and atmosphere composition
- **NASA GeneLab**: SpaceFlight biological stress studies (plant gene expression)
- **NASA DONKI**: Space weather (solar flares, energetic particles) real-time alerts
- **ISS Veggie**: Active on-orbit plant cultivation experiments

### 🇨🇦 Canadian Space Agency (CSA)
- **Juno Lunar Rover**: Robotic mobility & terrain analysis for the Moon
- **LEADS (Lunar Environmental Advanced Drill System)**: Subsurface water & resource sampling
- **ISS Open Data**: Deep-space life sciences partnership experiments

### 🧬 Machine Learning & Validation
- **NASA OSDR (Open Science Data Repository)**: 500+ peer-reviewed studies on biological spaceflight stress
- All ML models trained on 1000+ physics-based simulations + real mission history

### ⚖️ Super Intelligence (SI) Disclosure
This application uses **Super Intelligence (SI) technology** to:
- Predict crop survival and guide autonomous robot crews
- Generate visual-spatial digital-twin forecasts (concept videos marked with "SI-Generated Concept Visual" watermark)
- Make strategic decisions under communication latency constraints (Moon/Mars/Deep Space)
- Learn from mission history to improve future predictions

**All SI-generated visuals comply with 2026 NASA Space Apps disclosure requirements.**

## AI-Generated Content Disclosure

### Videos with "AI-GENERATED CONCEPT VISUAL" Watermark
This project includes two AI-generated concept videos in `/public/videos/`:

**1. mission-briefing.mp4** (36 seconds)
- **Purpose:** Concept visualization of spacecraft systems and mission briefing procedures
- **AI Tool:** Unknown
- **Tool Version:** Not recorded
- **Creation Date:** November 11, 2026
- **Human Review:** Not recorded
- **Compliance:** Includes visible "AI-GENERATED CONCEPT VISUAL" watermark per NASA Space Apps Challenge 2026 requirements

**2. ace-handover.mp4** (8 seconds)
- **Purpose:** Concept visualization of A.C.E. failover procedures and autonomous system handover
- **AI Tool:** Unknown
- **Tool Version:** Not recorded
- **Creation Date:** November 11, 2026
- **Human Review:** Not recorded
- **Compliance:** Includes visible "AI-GENERATED CONCEPT VISUAL" watermark per NASA Space Apps Challenge 2026 requirements

**Compliance Statement:** Both videos comply with the NASA Space Apps Challenge 2026 AI-generated content disclosure requirements and include mandatory visible "AI-GENERATED CONCEPT VISUAL" watermarks.

## Technology Stack

### Backend
- **FastAPI**: Async HTTP API framework
- **Pydantic**: Data validation & serialization
- **scikit-learn**: Machine learning (survival prediction model)
- **NumPy**: Physics engine calculations
- **pytest**: Test suite

### Frontend
- **React 19**: UI framework
- **React Router 7**: Navigation
- **TypeScript 7**: Type safety
- **Tailwind CSS 4**: Styling
- **Lucide React**: Icon library
- **Recharts**: Data visualization (charts)
- **Vite**: Build tool

### Deployment
- **Docker**: Container orchestration
- **Render.com**: Backend hosting (free tier)
- **Vercel**: Frontend hosting (recommended)

## Project Structure

```
LifeBeyondEarth/
├── backend/                    # Python FastAPI backend
│   ├── app/
│   ├── tests/
│   ├── Dockerfile
│   ├── render.yaml
│   └── requirements.txt
├── web-app/                    # React TypeScript frontend
│   ├── src/
│   ├── public/
│   ├── dist/                   # Built output (Vercel deploy)
│   ├── vite.config.ts
│   ├── vercel.json
│   └── package.json
├── LifeBeyondEarth/            # SwiftUI iOS app (NOT included in hackathon sprint)
├── start.sh                    # One-command local startup
├── README.md                   # This file
├── DEMO_SCRIPT.md              # 30-second video pitch script
└── .github/
    └── workflows/              # CI/CD pipelines (optional)
```

## Running Tests

### Backend
```bash
cd backend
pytest tests/ -v
```

### Frontend
```bash
cd web-app
npm run build  # Type-check & build
```

## Print-Ready Mission Reports

Result pages are optimized for printing:
1. Click "Print Summary" to open the browser print dialog
2. Save as PDF or print directly
3. Includes mission timeline, SI telemetry, and NASA OSDR citations
4. Properly formatted for multi-page documents

## Environment Variables

### Backend (`.env`)
```
NASA_API_KEY=your_key_here
DATABASE_URL=sqlite:///./lbe.db
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

### Frontend (`.env.production`)
```
VITE_API_URL=https://api.yourdomain.com
VITE_VERSION=0.2.0
```

## Troubleshooting

**Backend won't start?**
- Ensure Python 3.10+ is installed
- Check that port 8000 is available: `lsof -i :8000`
- Verify virtual environment is activated

**Frontend won't load?**
- Check Node.js version: `node -v` (need 18+)
- Clear npm cache: `npm cache clean --force`
- Delete node_modules: `rm -rf node_modules && npm install`

**API requests failing?**
- Check CORS settings in `backend/app/main.py`
- Verify backend is running: `curl http://localhost:8000/health`
- Check browser console for detailed error messages

## Performance Notes

- NASA API calls are cached (5-minute TTL)
- ML predictions use a pre-trained model (~15ms inference time)
- Simulation runs deterministically (seeded random for reproducibility)
- Frontend uses React Context for state management (no Redux overhead)

## Future Enhancements

- [ ] Real-time collaborative missions (WebSocket support)
- [ ] AR visualization of robot crews on device camera
- [ ] Advanced SI training with user feedback loops
- [ ] Exoplanet-specific atmospheric models
- [ ] Lunar regolith simulant manufacturing cost estimates
- [ ] Integration with JPL's Perseverance rover telemetry

## License

Educational project for NASA Space Apps Challenge 2026. Use of NASA data follows [NASA's Data Policy](https://www.nasa.gov/open/data).

## Pre-Existing Personal Research Core vs. Nov 14–15 Hackathon Sprint

### Pre-Existing (Prior Art)
- Core survival physics engine (SurvivalEngine, RobotPlanner)
- Planet & plant data models (NASA POWER, Exoplanet Archive, GeneLab)
- Basic web UI architecture (React, Tailwind, API client patterns)
- SwiftUI iOS companion app (LifeBeyondEarth/ folder — NOT in hackathon submission)

### Hackathon Sprint (Nov 14–15, 2026)
- **Power & ECLSS Grid tab**: Full energy management UI with L.U.M.E.N., H.Y.D.R.O., A.C.E. systems
- **Habitat Engineering tab**: Robot morphing (4 modes), radiation calculator, signal latency autonomy matrix
- **SI watermark compliance**: Video overlay watermarks for NASA 2026 disclosure requirements
- **Print-ready Result page**: Fixed multi-page layout, break-inside-avoid CSS, proper badge placement
- **Deployment configs**: Dockerfile, render.yaml, vercel.json, .env.production.example
- **./start.sh script**: One-command local startup with color output and cleanup
- **Judge-ready README.md**: Full architecture, data credits, deployment guide
- **DEMO_SCRIPT.md**: Crisp ≤30-second video pitch matching Space Apps 30s limit

## Questions or Feedback?

Open an issue on GitHub or reach out to the hackathon team. May the robots tend your garden! 🚀🌱
