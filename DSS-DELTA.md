# DSS Integration Delta

Changes and additions made to UnityRI for the AI Governance DSS integration.
Intended for the engineer who wires UnityRI to the DSS engine service.

Last updated: 2026-06-17 (v0.5.1)

---

## Summary

The DSS (Decision Support System) is a four-block AI governance assessment engine
running as a **sealed HTTP service** (systemd + Caddy/TLS) at `DSS_SERVICE_URL`.
UnityRI calls it over HTTP and never embeds, spawns, or co-locates the engine
source. No rule logic, scoring, CRI, or financial-exposure math ships in this repo.

**Engine version:** v0.5.1 — 4 blocks, 47 rules (28 core + 19 EU alignment),
FAIR-lite financial exposure, Resilience Index, EU intake (Block 0), Wazuh Block 3
adapter, Chatty SARA MCP narration seam, all 8 evidence slices wired, standalone
AI-BOM engine (VAL-BOM-001), and tamper-evident signed export. 174 tests passing.

All DSS additions are isolated to clearly named files (`dss*`) and a single new
frontend view. Nothing in the existing helpdesk, assessment, compliance, or
dashboard flows was modified.

---

## Engine service contract

Base URL: `DSS_SERVICE_URL` (env var, falls back to `http://127.0.0.1:5001`)

Full contract: `docs/service-api.md` in `dss-prototype` repo.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness + engine version |
| POST | `/v1/block/0` | Intake — build evidence package from questionnaire (incl. EU alignment section) |
| POST | `/v1/block/1` | Block 1 — AI inventory verification + financial exposure + resilience feed |
| POST | `/v1/block/2` | Block 2 — governance & TPRM |
| POST | `/v1/block/3` | Block 3 — monitoring (Wazuh adapter available) |
| POST | `/v1/block/4` | Block 4 — incident response |
| POST | `/v1/assess` | All four blocks → unified resilience feed |
| POST | `/v1/narrate` | Narration: local SLM digest → Chatty SARA MCP `narrate_dss` |
| POST | `/v1/seal` | Tamper-evident sealed export of an output (canonical SHA-256; HMAC-SHA256 when `DSS_EXPORT_SIGNING_KEY` set) |
| POST | `/v1/verify-seal` | Verify a sealed output is intact |

### Resilience feed (Block 1 / `/v1/assess`)

Block 1 and `/v1/assess` return a `resilience_feed` object containing everything
a dashboard needs to render: resilience index + components, indicators,
control_status, scenario_contexts, decision_outputs, financial_exposure range.
Rendering is a frontend job — the engine emits the feed, not the chart.

### Audit trail

Every assessment payload includes:
```json
{ "input_hash": "sha256:...", "rule_engine_version": "v0.5.1", "assessment_date": "..." }
```
This is the hook for Fluree consumer-side writes (Rahul's side).

### EU alignment (Block 0 + EU lens)

Block 0 accepts an optional `eu_alignment` section in the questionnaire. When
present, `translate_eu_answers()` populates `declared_governance_claims` and the
EU lens fires across all four blocks (19 EU rules: VAL-SCP, VAL-INV-EU,
VAL-GOV-EU, VAL-TPRM-EU, VAL-MON-EU, VAL-IR-EU). Non-EU clients are unaffected
— EU rules gate by omission.

---

## New files (safe to add, no conflicts expected)

### Backend controllers

| File | What it does |
|---|---|
| `backend/controllers/dssBlock0.controller.js` | Intake form submission (calls `/v1/block/0`) + questionnaire extraction (Ollama, local) |
| `backend/controllers/dssBlock1.controller.js` | Block 1 (AI inventory) — calls `/v1/block/1`, returns findings + financial exposure + resilience feed |
| `backend/controllers/dssBlock2.controller.js` | Block 2 (governance policy) — calls `/v1/block/2` |
| `backend/controllers/dssBlock3.controller.js` | Block 3 (monitoring) — calls `/v1/block/3` |
| `backend/controllers/dssBlock4.controller.js` | Block 4 (incident response) — calls `/v1/block/4` |

All five controllers call the DSS engine over HTTP at `DSS_SERVICE_URL`
(falls back to `http://127.0.0.1:5001`). They use Node's built-in `fetch` —
no Python, no subprocess, no temp files, no engine source in this repo.

### Backend services

| File | What it does |
|---|---|
| `backend/services/dssNarration.service.js` | Narration layer — calls `/v1/narrate`, which routes through Chatty SARA MCP `narrate_dss` (when `DSS_MCP_URL` + `DSS_MCP_JWT` + `DSS_MCP_ORG_ID` set on the engine host) |
| `backend/services/ollamaPrompt.service.js` | Ollama prompt wrapper used by dssNarration |

**Note on narration:** the engine's `/v1/narrate` endpoint handles the full
pipeline (local SLM digest → Chatty SARA MCP). UnityRI does not call Gemini or
any LLM directly for DSS narration — it calls `/v1/narrate` and renders whatever
`narration.text` contains. If MCP is not yet configured, `narration.text` is null
and the deterministic brief is rendered instead.

### Frontend view

| File | What it does |
|---|---|
| `frontend/src/views/aiGovernanceDss/index.js` | Main AI Governance page — block runner buttons, Mode A/B gap table, demand signal card, findings, validation rules, financial exposure, narration |
| `frontend/src/views/aiGovernanceDss/IntakeForm.js` | Block 0 intake form (questionnaire, including EU alignment section) |

---

## Modified files (review before merging)

### `backend/routes/v1.js`

Added 10 DSS routes after the existing `ai-description-write` route block:

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

No existing routes were changed.

### `frontend/src/routes.js`

Added two imports and one new nav section:

```js
import AIGovernanceDSS from "views/aiGovernanceDss";
import IntakeForm from "views/aiGovernanceDss/IntakeForm";
```

New route block (after Resilience Index section):

```js
{
  collapse: true,
  name: "AI Governance",
  mini: "AG",
  state: "AIGovernanceCollapse",
  views: [
    { path: "/ai-governance-dss", name: "AI Governance", component: <AIGovernanceDSS /> },
    { path: "/ai-governance-intake", name: "AI Governance Intake", component: <IntakeForm /> },
  ],
}
```

### `frontend/src/utility/ApiEndPoints.js`

Added a `dss` key to `API_ENDPOINTS`:

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

### `backend/Dockerfile`

Switched base image from `ubuntu:latest` to `node:16-bullseye` with `chromium`.
Also sets `PUPPETEER_SKIP_DOWNLOAD=true`, fixes exposed port from `3306` to `3006`.
Build environment fix — not DSS-specific. Confirm upstream Dockerfile hasn't diverged.

---

## Deleted files

| File | Why |
|---|---|
| `frontend/src/utility/graph.js` | Dead mock data — none of its 6 exports were imported anywhere. Contained real client PII. |
| `backend/helper/helpdeskJson.js` | Contained real helpdesk sample data with PII. Confirm upstream has addressed this. |
| `.env`, `backend/.env`, `frontend/.env` | Live credentials removed from tracked files. Use `example.env`. |

---

## Environment variables required

```
DSS_SERVICE_URL=https://<dss-engine-host>   # sealed DSS engine service; falls back to http://127.0.0.1:5001
```

Narration (set on the **engine host**, not UnityRI):
```
DSS_MCP_URL=<chatty-sara-mcp-endpoint>      # Chatty SARA MCP server (Rahul to provide)
DSS_MCP_JWT=<service-jwt>                   # service JWT for narrate_dss entitlement
DSS_MCP_ORG_ID=<org-id>                     # tenant org_id (/^[a-z0-9-]{3,64}$/)
```

When `DSS_MCP_*` vars are not set, `narration.text` is null and the deterministic
brief is rendered. No change needed in UnityRI — it just renders what the engine
returns.

---

## Naming note: `risk_appetite`

The DSS uses a `risk_appetite` object for FAIR-lite calibration inputs
(`organization_size`, `posture_min_multiplier`, etc.). This is **not** the same
as the CSRR / dashboard `risk_appetite` entity in Fluree (board residual-risk
tolerance: `escalation_threshold`, `max_acceptable_residual_exposure`, etc.).
They share a name only. The DSS `risk_appetite` does not read from or write to
Fluree or any CSRR record.

---

## What has not been touched

- All helpdesk views and controllers
- All assessment / compliance / framework flows
- Dashboard, connections, OpenVAS, Wazuh views
- Auth / user management
- Any existing API routes
- `aiPrompt.service.js` (tool description writer — separate from DSS narration)
