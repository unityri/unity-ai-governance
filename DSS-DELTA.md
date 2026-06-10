# DSS Integration Delta

Changes and additions made to UnityRI for the AI Governance DSS integration.
Intended for the engineer who merges this fork back into the upstream repo.

Last updated: 2026-06-10

---

## Summary

The DSS (Decision Support System) is a four-block AI governance assessment engine
built as a separate Python prototype. This delta adds a UnityRI surface for it:
backend API routes that shell out to the Python engine, and a frontend view that
renders results.

All DSS additions are isolated to clearly named files (`dss*`) and a single new
frontend view. Nothing in the existing helpdesk, assessment, compliance, or
dashboard flows was modified.

---

## New files (safe to add, no conflicts expected)

### Backend controllers

| File | What it does |
|---|---|
| `backend/controllers/dssBlock0.controller.js` | Intake form submission and questionnaire extraction |
| `backend/controllers/dssBlock1.controller.js` | Block 1 (AI inventory) — runs `run_assessment.py`, returns findings + financial exposure |
| `backend/controllers/dssBlock2.controller.js` | Block 2 (governance policy) — runs `block2_govern.py` |
| `backend/controllers/dssBlock3.controller.js` | Block 3 (monitoring) — runs `block3_monitor.py`, returns `monitoring_validation_result` |
| `backend/controllers/dssBlock4.controller.js` | Block 4 (incident response) — runs `block4_respond.py`, returns `ir_validation_result` |

All four controllers resolve the DSS prototype directory via `DSS_BLOCK1_PROTOTYPE_DIR`
env var (falls back to `../DSS Prototype/prototype` relative to the repo root).

### Backend services

| File | What it does |
|---|---|
| `backend/services/dssNarration.service.js` | LLM narration layer — calls Ollama (local) or falls back gracefully |
| `backend/services/dssGemini.service.js` | Gemini API narration alternative |
| `backend/services/ollamaPrompt.service.js` | Ollama prompt wrapper used by dssNarration |

### Frontend view

| File | What it does |
|---|---|
| `frontend/src/views/aiGovernanceDss/index.js` | Main AI Governance page — block runner buttons, Mode A/B gap table, demand signal card, findings, validation rules, financial exposure, narration |
| `frontend/src/views/aiGovernanceDss/IntakeForm.js` | Block 0 intake form (questionnaire) |

---

## Modified files (review before merging)

### `backend/routes/v1.js`

Added 8 DSS routes after the existing `ai-description-write` route block:

```js
// ** AI Governance DSS
router.post("/dss/block0/submit", Authorization, DSSBlock0Controller.submitBlock0);
router.post("/dss/block0/extract", Authorization, DSSBlock0Controller.extractBlock0);
router.post("/dss/block1/run", Authorization, DSSBlock1Controller.runBlock1);
router.post("/dss/block1/narrate", Authorization, DSSBlock1Controller.narrateBlock1);
router.post("/dss/block2/run", Authorization, DSSBlock2Controller.runBlock2);
router.post("/dss/block2/narrate", Authorization, DSSBlock2Controller.narrateBlock2);
router.post("/dss/block3/run", Authorization, DSSBlock3Controller.runBlock3);
router.post("/dss/block3/narrate", Authorization, DSSBlock3Controller.narrateBlock3);
router.post("/dss/block4/run", Authorization, DSSBlock4Controller.runBlock4);
router.post("/dss/block4/narrate", Authorization, DSSBlock4Controller.narrateBlock4);
```

Block 3 and Block 4 are deliberately **separate** — separate controllers, separate endpoints,
separate Python engines (`block3_monitor.py` and `block4_respond.py` do not import each other).
An earlier build had a single merged `/dss/block34` endpoint and a `dssBlock34.controller.js`;
that was removed. Both blocks read the same client evidence package
(`fixtures/block34_*_scenario/evidence_package.json` on the DSS Prototype side) because one
client's evidence covers both monitoring and IR fields — that shared folder name is the only
remaining `block34` string and does not imply the blocks are merged.

Four `require()` imports were also added at the top of the file for the four controllers.
No existing routes were changed.

### `frontend/src/routes.js`

Added two imports and one new nav section:

```js
import AIGovernanceDSS from "views/aiGovernanceDss";
import IntakeForm from "views/aiGovernanceDss/IntakeForm";
```

New route block (added after the Resilience Index section):

```js
{
  collapse: true,
  name: "AI Governance",
  mini: "AG",
  state: "AIGovernanceCollapse",
  icon: "",
  imgIcon: governanceIcon,
  views: [
    { path: "/ai-governance-dss", name: "AI Governance", ... component: <AIGovernanceDSS /> },
    { path: "/ai-governance-intake", name: "AI Governance Intake", ... component: <IntakeForm /> },
  ],
}
```

No existing routes were removed or modified.

### `frontend/src/utility/ApiEndPoints.js`

Added a `dss` key to the `API_ENDPOINTS` export:

```js
dss: {
  block0Submit: `/dss/block0/submit`,
  block0Extract: `/dss/block0/extract`,
  block1Run: `/dss/block1/run`,
  block1Narrate: `/dss/block1/narrate`,
  block2Run: `/dss/block2/run`,
  block2Narrate: `/dss/block2/narrate`,
  block3Run: `/dss/block3/run`,
  block3Narrate: `/dss/block3/narrate`,
  block4Run: `/dss/block4/run`,
  block4Narrate: `/dss/block4/narrate`,
}
```

No existing endpoints were modified.

### `backend/Dockerfile`

Switched base image from `ubuntu:latest` (with manual Node 16 + Google Chrome install)
to `node:16-bullseye` with `chromium` package. Also:
- Sets `PUPPETEER_SKIP_DOWNLOAD=true` and `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`
- Fixes exposed port from `3306` (MySQL default — likely a typo in original) to `3006`

This is a build environment fix, not DSS-specific. Confirm the upstream Dockerfile
has not diverged before merging.

---

## Deleted files

| File | Why deleted |
|---|---|
| `frontend/src/utility/graph.js` | Dead mock data — none of its 6 exports were imported anywhere. Contained real client PII from original commit. Safe to delete. |
| `backend/helper/helpdeskJson.js` | Contained real helpdesk sample data with PII. Confirm upstream has addressed this. |
| `.env`, `backend/.env`, `frontend/.env` | Live credentials removed from tracked files. Use `example.env` as template. |

---

## Environment variables required

The DSS integration requires one additional env var on the server:

```
DSS_BLOCK1_PROTOTYPE_DIR=/path/to/DSS Prototype/prototype
```

If not set, the controllers fall back to `../DSS Prototype/prototype` relative to
the repo root (works when both repos sit side by side on the same machine or VM).

Optional (for LLM narration):
```
OLLAMA_HOST=http://localhost:11434   # or wherever Ollama is running
GEMINI_API_KEY=...                   # if using Gemini fallback
```

---

## Naming note: `risk_appetite`

The DSS uses a `risk_appetite` object (passed from the AI Governance view into the Block 1
financial model via `--risk-appetite`). Its fields are FAIR-lite calibration inputs:
`organization_size`, `posture_min_multiplier`, `posture_max_multiplier`, `uncertainty_band_pct`,
`shadow_ai_max`.

This is **not** the same object as the CSRR / dashboard `risk_appetite` entity in the Fluree
work (board residual-risk tolerance: `escalation_threshold`, `max_acceptable_residual_exposure`,
`regulatory_overrides`, etc.). They collide on the name only. The DSS `risk_appetite` does not
read from or write to Fluree or any CSRR record — it is self-contained to the exposure estimate.
Flagging so the two are not conflated at merge time.

## What has not been touched

- All helpdesk views and controllers
- All assessment / compliance / framework flows
- Dashboard, connections, OpenVAS, Wazuh views
- Auth / user management
- Any existing API routes
