<div align="center">
  <img width="1200" height="475" alt="Dungeons & Dragons Adventure Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  # Dungeons & Dragons Adventure (Voice + AI Media)

  An interactive, turn-based fantasy web app where players make choices, evolve story state, and generate scene images/videos with Gemini.
</div>

---

## 🎮 What this project does

This app is a **D&D-style narrative experience** with a lightweight game engine + GenAI pipeline:

- Create 1–4 characters with role/backstory
- Play through branching, turn-based story decisions
- Generate cinematic scene images
- Generate scene videos from the current state
- Build a video plan from gameplay logs
- Play with in-app background music and animated UI transitions

---

## ✨ Highlights

- **State-driven gameplay loop** (`GameState`, choices, logs, current player turn)
- **Gemini text generation** for story progression
- **Gemini image generation** for cover, portraits, and scenes
- **Gemini video generation** for scene animation
- **Fallback/error handling** for quota/permission issues
- **Dark-fantasy UX** with Motion-based transitions

---

## 🧱 Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Animation/UI:** Motion, Lucide React
- **AI:** `@google/genai` (Gemini)
- **Media:** In-app `<video>` playback + BGM audio controller

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A Gemini API key (with image/video access for full feature set)

### 1) Install

```bash
npm install
```

### 2) Configure environment

Create or edit `.env.local`:

```bash
GEMINI_API_KEY=your_key_here
```

> You can also use `API_KEY`, but `GEMINI_API_KEY` is preferred.

### 3) Run

```bash
npm run dev
```

Open: `http://localhost:5173`

### 4) Build / Preview

```bash
npm run build
npm run preview
```

---

## 🎬 Demo

- YouTube Demo: https://youtu.be/VU-bBSGqal0
- Sample local media assets are in `video111/` (includes `1.mp4` and scene images)

### Google Studio scene images

![Google Studio Scene 11](./video111/11.png)
![Google Studio Scene 22](./video111/22.png)

---

## 📂 Project Structure

```txt
.
├── App.tsx
├── components/
│   ├── CharacterCreation.tsx
│   ├── CoverPage.tsx
│   ├── GameDisplay.tsx
│   ├── MusicPlayer.tsx
│   └── VideoPlanModal.tsx
├── services/
│   └── geminiService.ts
├── constants.ts
├── types.ts
└── HANDBOOK.md
```

---

## 🧠 AI + Game Flow

1. User creates characters
2. App requests initial game state from Gemini
3. Player actions resolve into next `GameState`
4. Optional media generation:
   - image generation from scene context
   - video generation from image + scene prompt
5. Logs can be transformed into a cinematic video plan

---

## ⚠️ Notes & Limitations

- Image/video generation requires proper model permissions and quota.
- Video generation can be slow and may fail on quota/network issues.
- This project is demo-oriented and currently has no full automated test suite.

---

## 📘 Additional Docs

- Player guide / operational notes: [`HANDBOOK.md`](./HANDBOOK.md)

---

## 🙌 Credits

Built by Ching-Wei Kang as an AI + game UX exploration project.
