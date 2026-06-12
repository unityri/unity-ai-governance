"use strict";
const DssNarrationService = require("../services/dssNarration.service");

function resolveDssServiceUrl() {
  return (process.env.DSS_SERVICE_URL || "http://127.0.0.1:5001").replace(/\/$/, "");
}

async function runBlock2Assessment(payload = {}) {
  const serviceUrl = resolveDssServiceUrl();
  const url = `${serviceUrl}/v1/block/2`;

  const body = {};
  if (payload.evidence_package) {
    body.evidence_package = payload.evidence_package;
  } else {
    body.fixture = payload.fixture || "partial";
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
    brief: data.brief || "",
  };
}

exports.runBlock2 = async (req, res) => {
  try {
    const output = await runBlock2Assessment(req.body || {});
    return res.json(output);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "DSS Block 2 run failed.",
      error: error.message,
      dss_traceback: error.dss_traceback,
    });
  }
};

exports.narrateBlock2 = async (req, res) => {
  try {
    const output = await runBlock2Assessment(req.body || {});
    const narration = await DssNarrationService.narrateBlock1Output(output);
    return res.json({ ...output, narration });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "DSS Block 2 narration failed.",
      error: error.message,
      dss_traceback: error.dss_traceback,
    });
  }
};

exports.runBlock2Assessment = runBlock2Assessment;
