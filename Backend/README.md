# TypeMind AI — Backend API

> **Every typing test makes the next test smarter.**

Production-quality Node.js/Express/MongoDB backend for the TypeMind AI adaptive typing application.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — fill in MONGO_URI, JWT_SECRET, AI_API_KEY

# 3. Start development server
npm run dev

# 4. Seed development data (optional)
npm run seed

# 5. Run tests
npm test
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + HTTP-only cookies |
| Security | Helmet, CORS, express-rate-limit |
| Validation | Joi |
| AI | OpenAI-compatible API |
| Testing | Jest |

---

## Architecture

```
POST /api/typing/sessions
       ↓
  Auth Middleware
       ↓
  Joi Validation
       ↓
  typingController
       ↓
  typingAnalysisService → WPM, accuracy, consistency, keystrokes
  fingerAnalysisService → per-finger stats
  wordAnalysisService   → per-word stats
  typingIQService       → deterministic IQ score
       ↓
  MongoDB (TypingSession, KeyPerformance, WordPerformance)
       ↓
  User stats update
       ↓
  achievementService (deterministic unlock checks)
       ↓
  aiService (async, non-blocking) → AIAnalysis
       ↓
  HTTP Response
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | No | `development` or `production` |
| `MONGO_URI` | **Yes** | MongoDB connection string |
| `JWT_SECRET` | **Yes** | JWT signing secret (min 32 chars) |
| `JWT_EXPIRES_IN` | No | Token lifetime (default: `7d`) |
| `CLIENT_URL` | No | Allowed CORS origin |
| `AI_API_KEY` | No | OpenAI-compatible API key |
| `AI_MODEL` | No | Model name (default: `gpt-4o-mini`) |
| `AI_BASE_URL` | No | Custom base URL for alternative providers |
| `BCRYPT_ROUNDS` | No | Bcrypt rounds (default: 12) |

---

## Seed Data

```bash
npm run seed
```

Creates 5 test users (all password: `Password123!`):
- `alex@typemind.dev` — advanced typist (95+ WPM)
- `sofia@typemind.dev` — intermediate typist (72 WPM)
- `ryan@typemind.dev` — beginner typist (45 WPM)
- `emma@typemind.dev` — expert typist (118 WPM)
- `test@typemind.dev` — new user (38 WPM)

---

## Tests

```bash
npm test
```

Test coverage:
- WPM calculation (all edge cases)
- Accuracy calculation
- Keystroke analysis
- Weak key detection (minimum attempts threshold)
- Consistency calculation
- Error counting
- Finger mapping (all QWERTY keys)
- Finger performance analysis
- Word performance analysis
- Typing IQ (determinism, level bands, improvement)
- Adaptive difficulty (all boundary conditions)
- Key trend analysis
- Content deduplication

---

## AI Provider Configuration

The AI service uses an OpenAI-compatible interface. Configure via `.env`:

**OpenAI:**
```env
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
```

**Google Gemini:**
```env
AI_API_KEY=AIza...
AI_MODEL=gemini-1.5-flash
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
```

If `AI_API_KEY` is not set, the server still runs — AI endpoints return `503`.
All deterministic analysis (WPM, IQ, achievements, streaks) functions without AI.
