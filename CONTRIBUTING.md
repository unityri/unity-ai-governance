# Contributing — AI Governance DSS

This fork extends Unity with an AI Governance section. All DSS work is additive.
The goal is a clean PR back to upstream when the section is ready.

## Rule: additive only

New features go in new files. Do not modify existing Unity logic.

**The only existing files you may edit:**

| File | Allowed change |
|------|---------------|
| `backend/routes/v1.js` | Route registration only |
| `frontend/src/routes.js` | Nav entry only |
| `frontend/src/utility/ApiEndPoints.js` | Endpoint constants only |
| `docker-compose.yaml` | Infrastructure only |
| `backend/Dockerfile` | Infrastructure only |

Everything else — controllers, services, models, views, components — goes in new files.

## Where DSS code lives

- `backend/controllers/dssBlock1.controller.js` — Block 1 runner
- `backend/services/dssNarration.service.js` — SLM → LLM narration pipeline (planned)
- `frontend/src/views/aiGovernanceDss/` — AI Governance section
