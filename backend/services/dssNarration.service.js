var axios = require("axios");
var DssGeminiService = require("./dssGemini.service");
var OllamaPromptService = require("./ollamaPrompt.service");
var { aiServiceTypes, getAIIntegrationCredentials } = require("../helper");

const ollama = "ollama";

const DEFAULT_NARRATION_INSTRUCTIONS = `You are narrating an AI Governance DSS Block 1 assessment for a client, underwriter, or risk leader.

Write a plain-language narration. Do not change, override, or recalculate any validation result, score, scenario record, indicator, or finding.

Cover:
1. What the assessment found.
2. What it means for the client's AI governance defensibility.
3. What an underwriter will likely ask.
4. What remediation evidence should be produced next.

Keep it concise, concrete, and non-chatty. Do not invent missing facts.`;

function safeJsonParse(text, fallback = null) {
  try {
    if (!text) return fallback;
    let jsonText = text.replace(/```json/i, "").replace(/```/g, "").trim();
    return JSON.parse(jsonText);
  } catch (error) {
    return fallback;
  }
}

function pickNarrationFacts(block1Output = {}) {
  const results = block1Output.results || {};
  return {
    assessment: {
      client_id: results.client_id,
      assessment_date: results.assessment_date,
      evidence_slice: results.evidence_slice,
      result: results.inventory_validation_result,
      gap_type: results.inventory_gap_type,
    },
    derived_fields: results.derived_fields || {},
    validation_results: results.validation_results || [],
    indicators: results.indicators || [],
    risk_signals: results.risk_signals || [],
    scenario_contexts: results.scenario_contexts || [],
    findings: results.decision_outputs?.findings || [],
    evidence_requested: results.decision_outputs?.evidence_requested || [],
    defensibility: results.decision_outputs?.defensibility || {},
    financial_exposure: block1Output.financial_exposure || null,
    brief: block1Output.brief || "",
  };
}

function buildSlmPrompt(block1Output = {}) {
  const facts = pickNarrationFacts(block1Output);
  return `You are the local SLM preparation layer for an AI Governance DSS.

Task:
- Read the Block 1 engine output.
- Identify what matters for a one-shot narration.
- Produce a structured prompt for the external LLM.
- Do not modify validation results, scores, indicators, findings, or scenario records.
- Keep raw output facts intact. Use only the supplied synthetic data.

Return strict JSON only:
{
  "llm_prompt": "Prompt for narrator",
  "surfaced_items": [
    { "type": "validation|indicator|scenario|finding|evidence|defensibility|financial", "id": "string", "reason": "string" }
  ],
  "local_context": {
    "assessment_result": "pass|partial|fail",
    "scenario_ids": ["string"],
    "underwriter_questions": ["string"],
    "evidence_gaps": ["string"]
  }
}

Required LLM instruction to include:
${DEFAULT_NARRATION_INSTRUCTIONS}

Block 1 facts:
${JSON.stringify(facts, null, 2)}`;
}

function buildFallbackHandoff(block1Output = {}) {
  const facts = pickNarrationFacts(block1Output);
  const scenarioIds = facts.scenario_contexts.map((item) => item.scenario_id).filter(Boolean);
  const underwriterQuestions = facts.scenario_contexts
    .map((item) => item.underwriter_question)
    .filter(Boolean);

  return {
    llm_prompt: `${DEFAULT_NARRATION_INSTRUCTIONS}

Block 1 structured facts:
${JSON.stringify(facts, null, 2)}`,
    surfaced_items: [
      ...facts.validation_results.map((item) => ({
        type: "validation",
        id: item.rule_id,
        reason: item.message,
      })),
      ...facts.scenario_contexts.map((item) => ({
        type: "scenario",
        id: item.scenario_id,
        reason: item.risk_statement,
      })),
    ],
    local_context: {
      assessment_result: facts.assessment.result,
      scenario_ids: scenarioIds,
      underwriter_questions: underwriterQuestions,
      evidence_gaps: facts.evidence_requested,
    },
  };
}

function normalizeSlmHandoff(slmResponse, block1Output = {}) {
  const parsed = safeJsonParse(slmResponse);
  if (!parsed || !parsed.llm_prompt) {
    return buildFallbackHandoff(block1Output);
  }

  return {
    llm_prompt: parsed.llm_prompt,
    surfaced_items: Array.isArray(parsed.surfaced_items) ? parsed.surfaced_items : [],
    local_context: parsed.local_context || buildFallbackHandoff(block1Output).local_context,
  };
}

async function prepareWithLocalSlm(block1Output = {}) {
  const slmPrompt = buildSlmPrompt(block1Output);
  const response = await OllamaPromptService.generateWithOllama({
    model: process.env.OLLAMA_MODEL || "mistral",
    prompt: slmPrompt,
    format: "json",
    options: {
      temperature: 0.1,
      num_ctx: 1024,
      num_predict: 700
    }
  });

  return normalizeSlmHandoff(response, block1Output);
}

async function applyMcpBoundary(slmHandoff = {}) {
  // MCP policy gateway / redaction seam.
  // When DSS_MCP_URL + DSS_MCP_JWT + DSS_MCP_ORG_ID are set, narration routes
  // through Chatty SARA's narrate_dss MCP tool (provider-agnostic, no LLM key
  // in this service). When not configured, falls back to the Gemini driver.
  const mcpConfigured = !!(
    process.env.DSS_MCP_URL &&
    process.env.DSS_MCP_JWT &&
    process.env.DSS_MCP_ORG_ID
  );

  return {
    stage: mcpConfigured ? "mcp_ready" : "mcp_not_configured",
    mcp_configured: mcpConfigured,
    prompt_for_llm: slmHandoff.llm_prompt,
    local_context: slmHandoff.local_context,
    surfaced_items: slmHandoff.surfaced_items,
  };
}

function attachLocalContext(narrationText = "", boundaryPayload = {}) {
  return {
    text: narrationText,
    reattached_local_context: boundaryPayload.local_context || {},
    surfaced_items: boundaryPayload.surfaced_items || [],
  };
}

async function narrateWithMcp(boundaryPayload = {}) {
  const response = await axios.post(
    `${process.env.DSS_MCP_URL}/tools/narrate_dss`,
    {
      prompt: boundaryPayload.prompt_for_llm,
      org_id: process.env.DSS_MCP_ORG_ID,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.DSS_MCP_JWT}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    }
  );

  const text = response.data?.result || response.data?.text || "";
  if (!text) throw new Error("narrate_dss MCP returned no narration text.");
  return text;
}

async function narrateWithGemini(boundaryPayload = {}) {
  const credentials = await getAIIntegrationCredentials();
  if (credentials?.type !== aiServiceTypes.gemini) {
    throw new Error("Gemini must be selected in AI integration settings for DSS narration.");
  }

  return DssGeminiService.generateTextWithGemini(
    credentials,
    boundaryPayload.prompt_for_llm,
    {
      temperature: 0.2,
      maxOutputTokens: 1200,
    }
  );
}

exports.narrateBlock1Output = async function (block1Output = {}) {
  const slmHandoff = await prepareWithLocalSlm(block1Output);
  const boundaryPayload = await applyMcpBoundary(slmHandoff);

  let narrationText;
  let llmProvider;
  let llmModel;

  if (boundaryPayload.mcp_configured) {
    narrationText = await narrateWithMcp(boundaryPayload);
    llmProvider = "chatty_sara_mcp";
    llmModel = "narrate_dss";
  } else {
    narrationText = await narrateWithGemini(boundaryPayload);
    llmProvider = aiServiceTypes.gemini;
    llmModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  }

  return {
    pipeline: {
      slm: {
        provider: ollama,
        model: process.env.OLLAMA_MODEL || "mistral",
        role: "local_prompt_preparation",
      },
      boundary: {
        type: boundaryPayload.stage,
        mcp_enabled: boundaryPayload.mcp_configured,
      },
      llm: {
        provider: llmProvider,
        model: llmModel,
        role: "plain_language_narration",
      },
      read_only: true,
    },
    handoff: {
      slm_to_mcp: {
        surfaced_items: slmHandoff.surfaced_items,
        local_context: slmHandoff.local_context,
      },
      mcp_to_llm: {
        stage: boundaryPayload.stage,
        prompt_for_llm: boundaryPayload.prompt_for_llm,
      },
    },
    narration: attachLocalContext(narrationText, boundaryPayload),
  };
}
