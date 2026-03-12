# Architecture Diagram (Creative Storyteller)

```mermaid
flowchart LR
  U[Player] --> FE[React/Vite Frontend]
  FE -->|Optional game-state routing via VITE_BACKEND_URL| BE[Cloud Run Backend API]
  FE -->|Direct multimodal calls (current path)| G[Gemini Models via GenAI SDK]
  BE -->|Structured story commands| G
  BE --> LOG[Cloud Logging]
  BE --> LIVE[Live/ADK Session Endpoint /api/live/session]
  G --> FE
```

## Notes for judges

- Frontend supports local direct Gemini mode and Cloud backend mode.
- Cloud backend path is designed for competition compliance and production hardening.
- Live/ADK endpoint scaffold exists and is the next implementation target for full requirement closure.
