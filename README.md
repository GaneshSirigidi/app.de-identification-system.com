# MedShield — AI-Powered HIPAA Medical De-identification System

A full-stack prototype that automatically detects and redacts Protected Health Information (PHI) from medical documents using OpenAI (groq-sdk), with OCR support for PDFs and images.

---

## Architecture

```
┌──────────────────────┐        ┌───────────────────────────────────┐
│   React Frontend     │  HTTP  │   Hono.js Backend (Node.js)       │
│   (Vite + Tailwind)  │◄──────►│                                   │
│   Port 3000          │        │  ┌─────────────┐  ┌────────────┐ │
│                      │        │  │ OCR Service  │  │ PHI Detect │ │
│  • File Upload       │        │  │ pdf-parse    │  │ Groq API │ │
│  • Before/After View │        │  │ tesseract.js │  │            │ │
│  • Redaction Report  │        │  └─────────────┘  └────────────┘ │
│  • Compliance Dash   │        │  ┌─────────────┐  ┌────────────┐ │
└──────────────────────┘        │  │  Redactor   │  │   Store    │ │
                                │  │ (synthetic  │  │ (in-mem)   │ │
                                │  │  data gen)  │  │            │ │
                                │  └─────────────┘  └────────────┘ │
                                │   Port 3001                       │
                                └───────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended)
- **OR** Node.js 20+ for local development
- An [Groq API key](https://console.groq.com/)

---

### Option A — Docker Compose (recommended)

```bash
# 1. Clone the repository
git clone https://github.com/GaneshSirigidi/app.de-identification-system.com.git
cd automated-de-identification-system

# 2. Create your environment file
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 3. Build and start
docker compose up --build

# App is now available at:
#   Frontend:  http://localhost:3000
#   Backend:   http://localhost:3001
#   Health:    http://localhost:3001/health
```

To stop:
```bash
docker compose down
```

---

### Option B — Local Development

**Backend:**
```bash
cd backend
npm install
cp ../.env.example .env   # add your key
npm run dev               # starts on http://localhost:3001
```

**Frontend** (in a separate terminal):
```bash
cd frontend
npm install
npm run dev               # starts on http://localhost:3000
```

The Vite dev server proxies `/api` requests to `localhost:3001` automatically.

---

## Usage

1. Open **http://localhost:3000**
2. Choose **Upload File** (PDF, PNG, JPG, TIFF, TXT) or **Paste Text**
3. Click **"Load sample note"** to try it instantly without uploading anything
4. Click **De-identify Document**
5. Review the **Before/After comparison** with colour-coded PHI highlights
6. Switch to the **Redaction Report** tab for a detailed audit trail
7. Visit `/dashboard` to see aggregate compliance statistics

---

## Features

### Core
| Feature | Details |
|---------|---------|
| PHI Detection | All 18 HIPAA Safe Harbor identifiers via openAI |
| Synthetic Data | Realistic replacements (names, dates, SSNs, phones) preserve clinical meaning |
| OCR — PDFs | Text extraction via `pdf-parse` |
| OCR — Images | Text extraction via `tesseract.js` (PNG, JPG, TIFF, BMP, WebP) |
| Audit Trail | Per-document redaction report with entity counts and timing |
| Compliance Dashboard | Aggregate charts and recent-upload history |

### Bonus
- **Synthetic data generation** — replacements are contextually appropriate, not just `[REDACTED]` placeholders
- **Handwritten / scanned document support** — Tesseract OCR handles image uploads including scanned notes
- **Compliance Dashboard** — bar charts and tables aggregating PHI detection across all uploads

---

## PHI Types Detected

| Type | Examples |
|------|---------|
| `PATIENT_NAME` | "John Smith", "J. Smith" |
| `RELATIVE_NAME` | Spouse, parent, child names |
| `PROVIDER_NAME` | Physician/nurse names |
| `DATE` | DOB, admission, discharge, follow-up |
| `PHONE` / `FAX` | All phone and fax numbers |
| `EMAIL` | Email addresses |
| `SSN` | Social Security Numbers |
| `MRN` | Medical Record Numbers |
| `HEALTH_PLAN_ID` | Insurance beneficiary IDs |
| `ACCOUNT_NUMBER` | Account numbers |
| `GEO_LOCATION` | Addresses, cities, zip codes |
| `IP_ADDRESS` | IP addresses |
| `URL` | Web URLs |
| `DEVICE_ID` | Device serial numbers |
| `VIN` | Vehicle identifiers |
| `BIOMETRIC` | Fingerprint/voice print references |
| `AGE_OVER_89` | Ages greater than 89 |

## Implementation Design

### Model Choice — OpenAI (Groq)

An OpenAI-compatible model served via Groq was chosen over specialised NER models (spaCy, Presidio, AWS Comprehend Medical) for three reasons:

1. **Context awareness** — Clinical language is highly ambiguous. The LLM understands that "Dr. Nguyen" is a provider name and "penicillin allergy noted by patient's sister Jane" contains a relative name, without additional training.
2. **Instruction following** — A single, well-crafted system prompt reliably returns structured JSON covering all 18 HIPAA identifiers with synthetic replacements, eliminating the need for a separate anonymisation step.
3. **Zero infrastructure** — No GPU, no model hosting, no fine-tuning pipeline. Groq's inference API provides low-latency responses out of the box.

The default model is `openai/gpt-oss-120b`. Switch to a different Groq-hosted model via the `GROQ_MODEL` env var for faster, cheaper processing on high-volume workloads.

### OCR Strategy

| Input type | Library | Notes |
|------------|---------|-------|
| Plain text (`.txt`) | Native Buffer → UTF-8 | Instant |
| PDF | `pdf-parse` | Handles text-layer PDFs |
| Images (PNG, JPG, TIFF…) | `tesseract.js` v5 | Handles scanned documents and handwriting |

Handwritten notes are OCR'd by Tesseract's LSTM engine. Quality depends on scan resolution; 300 DPI or higher is recommended.

### Context Preservation (Synthetic Data)

Rather than replacing PHI with opaque tokens like `[REDACTED]`, the system generates **contextually appropriate synthetic values**:

- **Names** → common English names different from the original
- **Dates** → same format, shifted ~2 years (e.g., `01/15/2022` → `01/15/2024`)
- **SSNs** → `000-XX-XXXX` format (000 prefix is never issued by SSA)
- **Phone numbers** → `(555) XXX-XXXX` (universally understood as fictional)
- **Addresses** → fictional but realistic street addresses
- **MRNs** → `MRN-XXXXXX`
- **Emails** → `synthetic_name@example.com`

The replacement map is built per-document, so the same patient name always maps to the same synthetic name within a single document, preserving narrative coherence.

### Consistency & Overlap Handling

1. Entities are sorted longest-first before replacement to avoid partial overlaps (e.g., replacing "John" before "John Smith").
2. A global regex replace ensures every occurrence is substituted, not just the first.
3. Position tracking uses case-insensitive string matching for the highlighted "Before" view.

---

## Project Structure

```
automated-de-identification-system/
├── backend/
│   ├── src/
│   │   ├── index.ts                  # Hono app + server
│   │   ├── types.ts                  # Shared TypeScript types
│   │   ├── routes/
│   │   │   ├── deidentify.ts         # POST /api/deidentify
│   │   │   └── dashboard.ts          # GET /api/dashboard
│   │   └── services/
│   │       ├── ocr.ts                # PDF + image text extraction
│   │       ├── phi-detector.ts       # Groq API PHI detection
│   │       ├── redactor.ts           # String replacement + positions
│   │       └── store.ts              # In-memory record store
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── types.ts
│   │   ├── api/client.ts             # Axios API wrapper
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   ├── DocumentComparison.tsx
│   │   │   ├── RedactionReport.tsx
│   │   │   └── ComplianceDashboard.tsx
│   │   └── pages/
│   │       ├── HomePage.tsx
│   │       └── DashboardPage.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | ✅ | — | Your Groq API key |
| `GROQ_MODEL` | ❌ | `openai/gpt-oss-120b` | OpenAI model ID |
| `PORT` | ❌ | `3001` | Backend port |
| `NODE_ENV` | ❌ | `production` | Node environment |

---

## Limitations (Prototype)

- **In-memory storage** — dashboard data resets on server restart. Replace `store.ts` with a database (PostgreSQL, SQLite) for production.
- **No authentication** — add JWT/OAuth before any real deployment.
- **50 000 character limit** — very long documents are chunked automatically but may produce slightly different results per chunk.
- **Image OCR accuracy** — handwriting recognition quality depends on scan clarity.
