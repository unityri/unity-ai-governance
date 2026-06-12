"use strict";
const DssNarrationService = require("../services/dssNarration.service");

// DSS engine runs as a sealed HTTP service.
// Set DSS_SERVICE_URL in .env to point at the running engine (local or VM).
// Default: localhost:5001 for local dev.
function resolveDssServiceUrl() {
  return (process.env.DSS_SERVICE_URL || "http://127.0.0.1:5001").replace(/\/$/, "");
}

async function runBlock1Assessment(payload = {}) {
  const serviceUrl = resolveDssServiceUrl();
  const url = `${serviceUrl}/v1/block/1`;

  const body = {};
  if (payload.evidence_package) {
    body.evidence_package = payload.evidence_package;
  } else {
    body.fixture = payload.fixture || "partial";
  }
  if (payload.risk_appetite) {
    body.risk_appetite = payload.risk_appetite;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    const error = new Error(data.error || `DSS service responded ${response.status}`);
    error.dss_traceback = data.traceback;
    throw error;
  }

  return {
    success: true,
    runner: data.runner,
    results: data.results,
    uri_feed: data.uri_feed,
    financial_exposure: data.financial_exposure,
    resilience_feed: data.resilience_feed,
    brief: data.brief,
  };
}

exports.runBlock1 = async (req, res) => {
  try {
    const output = await runBlock1Assessment(req.body || {});
    return res.json(output);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "DSS Block 1 run failed.",
      error: error.message,
      dss_traceback: error.dss_traceback,
    });
  }
};

exports.narrateBlock1 = async (req, res) => {
  try {
    const output = await runBlock1Assessment(req.body || {});
    const narration = await DssNarrationService.narrateBlock1Output(output);
    return res.json({ ...output, narration });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "DSS Block 1 narration failed.",
      error: error.message,
      dss_traceback: error.dss_traceback,
    });
  }
};

exports.runBlock1Assessment = runBlock1Assessment;
