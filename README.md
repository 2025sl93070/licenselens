# LicenseLens

**An Explainable Open-Source License Risk and Dependency Analysis Tool**

> Assignment Project — BITS Pilani WILP | FSAD Feb-Jul 2026  
> Team: Anshu Kushwaha (2025sl93057) · Anushka Saini (2025sl93070) · Ayushi Setiya (2025sl93103)

---

## Features

| Feature | Description |
|---|---|
| **Multi-ecosystem parsing** | npm (`package.json`, `package-lock.json`), pip (`requirements.txt`, `Pipfile.lock`), Maven (`pom.xml`) |
| **License Identification** | Identifies 16 SPDX licenses with risk levels (low → critical) |
| **Explainable Risk Analysis** | Every flagged dependency includes a plain-English explanation of *why* it is risky |
| **Policy-Based Evaluation** | Three built-in policies (Enterprise Safe, Open Source Friendly, Permissive Only) |
| **Conflict Detection** | Detects known incompatible license pairings (e.g. GPL-2.0 + Apache-2.0) |
| **Dependency Visualization** | Interactive SVG graph of direct & transitive deps, color-coded by risk |
| **License Glossary** | Browse all 16 supported licenses with permissions, conditions, and links |
| **Analysis History** | In-memory history of recent analyses |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20, TypeScript, Express, Multer |
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Containerization | Docker, docker-compose |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+

### Local Development

```bash
# Backend
cd backend
npm install
npm run dev        # http://localhost:3001

# Frontend (separate terminal)
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### Docker (Production)

```bash
docker-compose up --build
# App: http://localhost
# API: http://localhost:3001
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/analyze` | Upload a dependency file (multipart `file` field) |
| `POST` | `/api/analyze/demo` | Run analysis on built-in sample project |
| `GET` | `/api/analyze/:id` | Fetch a saved analysis by ID |
| `GET` | `/api/history` | List recent analyses (no dependency array) |
| `GET` | `/api/licenses` | List all supported licenses |
| `GET` | `/api/policies` | List available policy presets |
| `GET` | `/api/health` | Health check |

### Upload example

```bash
curl -X POST http://localhost:3001/api/analyze \
  -F "file=@package.json" \
  -F "projectName=my-app" \
  -F "policyId=enterprise-safe"
```

---

## Supported Licenses

MIT · Apache-2.0 · GPL-2.0 · GPL-3.0 · LGPL-2.1 · LGPL-3.0 · BSD-2-Clause · BSD-3-Clause · ISC · MPL-2.0 · CDDL-1.0 · EPL-1.0 · EPL-2.0 · AGPL-3.0 · CC0-1.0 · Unlicense

---

## Project Structure

```
licenselens/
├── backend/
│   ├── src/
│   │   ├── data/          # license DB, policies, sample data
│   │   ├── parsers/       # npm, pip, maven parsers
│   │   ├── routes/        # Express API
│   │   ├── services/      # analysis engine
│   │   ├── types/         # TypeScript types
│   │   └── server.ts
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/    # UI components (table, graph, charts)
│   │   ├── pages/         # Upload, Dashboard, History, Glossary
│   │   ├── lib/           # API client, utils
│   │   └── types/
│   └── Dockerfile
└── docker-compose.yml
```
