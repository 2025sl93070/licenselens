# LicenseLens

**An Explainable Open-Source License Risk and Dependency Analysis Tool**

## Features

| Feature | Description |
|---|---|
| **Multi-ecosystem parsing** | npm (`package.json`, `package-lock.json`), pip (`requirements.txt`, `Pipfile.lock`) |
| **License Identification** | Identifies 15+ SPDX licenses with risk levels (low → critical) |
| **Explainable Risk Analysis** | Every flagged dependency includes a plain-English explanation of *why* it is risky |
| **Policy-Based Evaluation** | Three built-in policies: Enterprise Safe, Open Source Friendly, Permissive Only |
| **Conflict Detection** | Detects known incompatible license pairings (e.g. GPL-2.0 + Apache-2.0) |
| **Dependency Visualization** | Interactive SVG graph of direct & transitive dependencies, color-coded by risk |
| **Report Export** | Download analysis as CSV for further review or audit |
| **License Glossary** | Browse all supported licenses with permissions, conditions, and links |
| **Analysis History** | Persistent history via PostgreSQL (SQLite for local dev) |
| **CI/CD** | GitHub Actions runs pytest and Vite build on every push |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy, Uvicorn |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Recharts |
| Database | PostgreSQL (production), SQLite (local dev) |
| Containerization | Docker, docker-compose |
| CI/CD | GitHub Actions |

---

## Getting Started

### Prerequisites

- Python 3.10+ and pip
- Node.js 20+ and npm

### Local Development

```bash
# Backend (runs on SQLite by default — no Postgres needed)
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# API: http://localhost:8000
# Swagger docs: http://localhost:8000/docs

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
# UI: http://localhost:5173
```

### Docker (Production with PostgreSQL)

```bash
docker-compose up --build
# App: http://localhost
# API: http://localhost:8000
```

### Run Tests

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/analyze` | Upload a dependency file (multipart `file` field) |
| `POST` | `/api/analyze/demo` | Run analysis on built-in sample project |
| `GET` | `/api/analyze/{id}` | Fetch a saved analysis by ID |
| `GET` | `/api/analyze/{id}/export/csv` | Download analysis as CSV |
| `GET` | `/api/history` | List recent analyses |
| `GET` | `/api/licenses` | List all supported licenses |
| `GET` | `/api/policies` | List available policy presets |
| `GET` | `/api/health` | Health check |

### Upload example (curl)

```bash
curl -X POST http://localhost:8000/api/analyze \
  -F "file=@package.json" \
  -F "projectName=my-app" \
  -F "policy_id=enterprise-safe"
```

Swagger UI available at **http://localhost:8000/docs**

---

## Supported Licenses

MIT · Apache-2.0 · GPL-2.0 · GPL-3.0 · LGPL-2.1 · LGPL-3.0 · BSD-2-Clause · BSD-3-Clause · ISC · MPL-2.0 · EPL-2.0 · AGPL-3.0 · CC0-1.0 · Unlicense

---

## Project Structure

```
licenselens/
├── .github/
│   └── workflows/ci.yml     # GitHub Actions CI
├── backend/
│   ├── app/
│   │   ├── core/            # database.py (SQLAlchemy + SQLite/Postgres)
│   │   ├── data/            # license DB, policies, sample data
│   │   ├── parsers/         # npm & pip dependency parsers
│   │   ├── routers/         # FastAPI route handlers
│   │   ├── services/        # analysis engine, CSV report generator
│   │   └── main.py          # FastAPI application
│   ├── tests/               # pytest unit + integration tests
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (table, graph, charts)
│   │   ├── pages/           # Upload, Dashboard, History, Glossary
│   │   ├── lib/             # API client, utils
│   │   └── types/
│   └── Dockerfile
└── docker-compose.yml
```

---

## License Policies

| Policy | Description |
|---|---|
| **Enterprise Safe** | Blocks GPL and AGPL; warns on weak copyleft; blocks unknown |
| **Open Source Friendly** | Only blocks AGPL; warns on unknown |
| **Permissive Only** | Blocks all copyleft and unknown; allows only MIT, Apache, BSD, ISC, CC0 |

---

## Development Practices

- Public GitHub repository
- MIT License
- GitHub Issues for requirement tracking
- Feature branches and meaningful commits
- Pull requests with code review
- Unit and integration tests with pytest
- Automated CI via GitHub Actions
