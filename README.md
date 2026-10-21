# Voicio — AI Voice Vocabulary Coach

> **"Learn words. Speak confidently."**

Voicio is an intelligent, voice-first English vocabulary coach powered by **Google Gemini** and browser **Web Speech APIs**. Designed as a modern educational SaaS experience, Voicio guides learners through natural spoken conversations, pronunciation drills, real-time semantic answer evaluations, and interactive quizzes across three difficulty tiers: **Beginner**, **Intermediate**, and **Advanced**.

---

## 🌟 Key Features

- 🎙️ **Voice-First AI Tutor**: Real browser speech recognition (`webkitSpeechRecognition` / `SpeechRecognition`) with an interactive 6-state microphone control (`idle`, `requesting`, `listening`, `processing`, `speaking`, `error`).
- 🔊 **Natural Voice Playback**: Browser SpeechSynthesis engine with customizable speech rate, pitch, and voice selection.
- 🧠 **Gemini API Intelligence**: Powered by the official `@google/genai` TypeScript SDK with configurable model support (default: `gemini-2.5-flash` with graceful fallback handling).
- 📝 **Semantic Sentence Evaluation**: Distinguishes between correct, partially correct, incorrect, and ambiguous usage. Checks vocabulary accuracy, grammar, and suggests natural native expressions.
- 🎯 **Multi-Format Practice**:
  - Definition multiple-choice questions
  - Fill-in-the-blank contextual challenges
  - Sentence construction with AI feedback
  - Synonym matching
- 📊 **Real Learning Progress**: Tracks daily streak, words mastered, quiz accuracy, revision queue, and activity history. All metrics are calculated strictly from real learner interaction and persisted locally via `LocalStorage`.
- 🛡️ **Graceful Fallbacks & Offline Mode**: Operates smoothly even before API keys are added or during quota exhaustion, displaying clear diagnostic status rather than crashing.
- 📱 **Responsive Desktop & Mobile Layouts**: Clean application shell with sidebar navigation on desktop and an ergonomic bottom bar with prominent mic button on mobile.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti |
| **Backend** | Node.js, Express, TypeScript, `@google/genai` SDK, CORS, Dotenv |
| **AI Engine** | Google Gemini API (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`) |
| **Voice Recognition** | Browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) |
| **Voice Synthesis** | Browser `SpeechSynthesis` API |
| **Persistence** | Browser `LocalStorage` (Zero database dependencies required) |

---

## 📂 Project Structure

```
Voicio/
├── client/                     # Frontend React + Vite application
│   ├── src/
│   │   ├── components/         # Modular UI components
│   │   │   ├── Layout/         # VoicioLogo, Sidebar, Header, MobileNav
│   │   │   ├── Voice/          # MicButton (6 states), AudioWaveform
│   │   │   ├── Tutor/          # ChatBubble, SuggestedPrompts
│   │   │   └── Common/         # Badge, Cards
│   │   ├── hooks/              # useSpeechRecognition, useSpeechSynthesis, useLearningProgress
│   │   ├── pages/              # Home, Learn, Tutor, Practise, Progress, Settings
│   │   ├── services/           # Typed API client calling backend endpoints
│   │   ├── types/              # Domain TypeScript interfaces
│   │   ├── App.tsx             # Root application orchestrator
│   │   └── main.tsx            # React entry point
│   ├── tailwind.config.js      # Custom theme colors & animations
│   ├── vite.config.ts          # Vite build & local API proxy configuration
│   └── vercel.json             # Vercel deployment routing configuration
├── server/                     # Backend Express API server
│   ├── src/
│   │   ├── config.ts           # Safe environment configuration & model fallback
│   │   ├── gemini.ts           # Official @google/genai client & prompt engineering
│   │   ├── data/
│   │   │   └── vocabulary.ts   # Curated starter vocabulary dataset
│   │   ├── routes/
│   │   │   ├── health.ts       # GET /api/health (Uptime & Gemini connectivity test)
│   │   │   ├── config.ts       # GET /api/config (Safe public client configuration)
│   │   │   ├── chat.ts         # POST /api/chat (Multi-turn conversational tutor)
│   │   │   ├── evaluate.ts     # POST /api/evaluate (Structured semantic evaluation)
│   │   │   ├── quiz.ts         # POST /api/quiz (Dynamic quiz question generator)
│   │   │   └── word.ts         # POST /api/word & GET /api/words
│   │   ├── middleware/         # Rate limiting (free tier protection) & error handler
│   │   └── index.ts            # Server entry point & static client asset serving
│   ├── tsconfig.json
│   └── .env.example            # Backend environment template
├── .env.example                # Root environment template
├── package.json                # Root package with multi-workspace scripts
└── README.md                   # Complete documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher recommended; verified on Node v24)
- **npm** (v9 or higher)
- A **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/) (Free tier works out of the box).

### 2. Installation

Clone or extract the repository and run:

```bash
# Install root, server, and client dependencies
npm run install:all
```

Or install separately:
```bash
npm install
cd server && npm install
cd ../client && npm install
```

### 3. Environment Configuration

Create a `.env` file in the `server` directory (or copy from `server/.env.example`):

```bash
cp server/.env.example server/.env
```

Set your configuration values:
```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

> **Security Note:** Never commit your `.env` file or paste your real API key into public repositories or chat transcripts. `.gitignore` is already pre-configured to exclude all `.env` files.

### 4. Running the Application

You can run both client and server concurrently with one command from the project root:

```bash
npm run dev
```

- **Frontend Client**: Runs on `http://localhost:5173`
- **Backend API**: Runs on `http://localhost:5000`

Alternatively, run each service in separate terminal tabs:
```bash
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend
npm run dev:client
```

### 5. Unified Production Build

You can also build both packages into a single production bundle:

```bash
npm run build
npm start
```
The server will start on `http://localhost:5000` and automatically serve both the `/api` endpoints and the compiled React frontend application.

---

## 📡 API Specification

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/health` | `GET` | Backend health check and live Gemini model connection test. |
| `/api/config` | `GET` | Returns safe client configuration, supported levels, and feature flags. |
| `/api/words` | `GET` | Returns the vocabulary catalog, optionally filtered by `?level=Beginner`. |
| `/api/word` | `POST` | Fetches word details or requests a rich AI-generated explanation. |
| `/api/chat` | `POST` | Interacts with the AI tutor, maintaining conversation context and suggested prompts. |
| `/api/evaluate` | `POST` | Evaluates a student's sentence or definition with structured feedback and grammar guidance. |
| `/api/quiz` | `POST` | Generates a dynamic vocabulary question (MCQ, fill-in-blank, or synonym match). |

---

## 🎤 Browser Voice & Microphone Guide

Voicio leverages standard, native browser APIs for voice interaction:
1. **Speech Recognition**: Uses the browser's `SpeechRecognition` or `webkitSpeechRecognition` implementation. Supported in **Google Chrome**, **Microsoft Edge**, **Brave**, and **Safari**.
2. **Speech Synthesis**: Uses the browser's `window.speechSynthesis` API. Supported across all major modern desktop and mobile browsers.
3. **Text Fallback**: If a browser does not support voice input, or if microphone permission is withheld, a text-input box is available with identical conversational intelligence.
4. **HTTPS Requirement**: Modern browsers enforce microphone access strictly on `https://` origins (or `http://localhost`). Ensure public deployments use HTTPS.

---

## 🧪 Verification & Test Results

All 17 requirements specified in the project test plan were verified:

| # | Test Scenario | Status | Verified Result |
| :-: | :--- | :---: | :--- |
| 1 | Backend starts successfully | ✅ PASSED | Server runs cleanly on port 5000 with TypeScript compilation. |
| 2 | Health endpoint responds | ✅ PASSED | `GET /api/health` responds with HTTP 200 and system uptime. |
| 3 | Gemini returns real response with configured model | ✅ PASSED | Connected via official `@google/genai` 2.x SDK using `gemini-2.5-flash`. |
| 4 | Tutor introduces vocabulary word | ✅ PASSED | Tutor introduces target word with definition, phonetic guide, and example. |
| 5 | User asks question using text | ✅ PASSED | Text input accepts queries and routes them to `/api/chat`. |
| 6 | AI response appears in conversation | ✅ PASSED | Real-time chat bubbles render with role avatars and timestamps. |
| 7 | Speech synthesis reads response aloud | ✅ PASSED | `useSpeechSynthesis` invokes browser TTS when audio is enabled. |
| 8 | Speech recognition works with permission | ✅ PASSED | Captured microphone input streams into interim and final transcripts. |
| 9 | Unsupported speech displays text fallback | ✅ PASSED | Graceful notification and fully functional text input fallback. |
| 10 | Learner submits an answer | ✅ PASSED | Sentence submitted via voice or keyboard triggers evaluation. |
| 11 | Answer evaluation produces feedback | ✅ PASSED | Returns verdict, score (0-100), grammar notes, and natural phrasing. |
| 12 | Learner completes a quiz | ✅ PASSED | MCQ, fill-in-the-blank, and synonym match quizzes validate answers. |
| 13 | Progress updates correctly | ✅ PASSED | Real-time updates to words encountered, mastered, and accuracy %. |
| 14 | Progress survives browser refresh | ✅ PASSED | `LocalStorage` maintains state across browser reloads. |
| 15 | Invalid API credentials produce clear error | ✅ PASSED | Returns HTTP 400 with user-friendly error message; no crash. |
| 16 | API quota exhaustion handled gracefully | ✅ PASSED | Rate limits caught; offline demo mode preserves learning state. |
| 17 | Responsive desktop & mobile layouts | ✅ PASSED | Tested across desktop sidebar layout and mobile bottom navigation. |

---

## 🚢 Deployment Guide

### Option A: Two-Tier Deployment (Recommended for Vercel + Backend Host)

#### 1. Deploy Frontend to Vercel
1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/), import the repository.
3. Set the **Root Directory** to `client`.
4. Framework Preset: **Vite**.
5. Add the Environment Variable:
   - `VITE_API_URL`: `https://your-backend-service.onrender.com/api` (URL of your deployed backend)
6. Click **Deploy**.

#### 2. Deploy Backend to Render, Railway, or Fly.io
1. Create a new **Web Service** pointing to your repository.
2. Set Root Directory to `server`.
3. Build Command: `npm install && npm run build`
4. Start Command: `npm run start`
5. Configure Environment Variables in the hosting dashboard:
   - `PORT`: `5000` (or provided by host)
   - `CLIENT_ORIGIN`: `https://your-voicio-app.vercel.app`
   - `GEMINI_API_KEY`: `<your_gemini_api_key>`
   - `GEMINI_MODEL`: `gemini-2.5-flash`
6. Deploy the service.

### Option B: Unified Fullstack Deployment (Single URL)
Because Voicio's Express server serves compiled static client assets directly from `client/dist`, you can also deploy the entire application as a single Node.js service on Render, Railway, or Heroku:
1. Build Command: `npm run build`
2. Start Command: `npm start`
3. Environment Variables:
   - `GEMINI_API_KEY`: `<your_gemini_api_key>`
   - `GEMINI_MODEL`: `gemini-2.5-flash`

---

## 📄 License
MIT License. Built as an AI Voice Vocabulary Coach prototype.
