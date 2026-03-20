# Dungeons & Dragons Adventure — Player Handbook

This handbook teaches new players how to run and enjoy this AI-powered D&D adventure app.

---

## 1) What This App Does

This is a turn-based, story-driven fantasy game where:
- You create **1 to 4 players**
- The AI acts as Dungeon Master
- You choose actions each round
- Character stats/inventory/reputation evolve over time
- You can generate:
  - scene images
  - cover art
  - character portraits
  - optional scene videos

---

## 2) Quick Start

### Requirements
- Node.js + npm
- A valid Gemini API key with image/video model access

### Setup
1. Open project folder.
2. Create/update `.env.local`:

```bash
GEMINI_API_KEY=YOUR_KEY_HERE
```

3. Install dependencies:

```bash
npm install
```

4. Start dev server:

```bash
npm run dev
```

5. Open the URL shown in terminal (usually `http://127.0.0.1:5173/`).

---

## 3) How To Play

### Step A — Character Creation
For each player:
1. Enter a **name**
2. Choose a **role/class**
3. Write a short **backstory/personality**
4. Generate a portrait (recommended)

Tip: Add distinct personalities so the game feels richer.

### Step B — Start Adventure
Click start/begin game. The AI generates the opening scene and your first options.

### Step C — Take Turns
Each round:
1. Read current scene text
2. Pick one of the presented choices **or** enter a custom action
3. Let AI resolve consequences
4. Review updated stats/inventory/reputation

### Step D — Keep Narrative Momentum
Good actions are:
- specific
- risky but logical
- collaborative with other party members

Example custom actions:
- "I cast light on my shield and scout ahead quietly."
- "I distract the guard while the rogue picks the lock."

---

## 4) Stats Guide (Simple)

- **Health**: survival in danger
- **Mana**: magical resource
- **Strength**: physical power
- **Agility**: speed/precision/stealth
- **Intellect**: knowledge/analysis
- **Charisma**: persuasion/social outcomes
- **Luck**: random-event influence
- **XP**: progression

Also watch:
- **Inventory** (tools and consumables)
- **Reputation** (faction relationships)

---

## 5) Best Practices for Better Runs

- Keep each character role unique
- Use teamwork actions often
- Use inventory items creatively
- Mix safe choices with bold gambits
- Keep a story theme (e.g., heroic, dark, political)

---

## 6) Common Problems

### "API key missing"
- Ensure `.env.local` contains `GEMINI_API_KEY=...`
- Restart `npm run dev` after changing env

### "Quota exceeded" / 429
- Your key/project hit usage limits
- Use a key with available quota or billing enabled

### Portrait/image/video generation fails
- Key may not have access to image/video models
- Verify key/project permissions and quota

---

## 7) Demo Format (Recommended)

For a clean showcase/demo:
1. Use **4 players**
2. Play at least **5 rounds**
3. Include at least one custom action per round
4. Show stats panel after each resolution
5. End with a strong cliffhanger scene

---

## 8) Safety Notes

- Never commit real API keys to git.
- Keep `.env.local` private.
- If a key is leaked, rotate it immediately.

---

## 9) Useful Commands

```bash
npm run dev      # start local server
npm run build    # production build
npm run preview  # preview built app
```

---

Enjoy your adventure ⚔️🐉
