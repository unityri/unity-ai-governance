"use strict";

// DSS engine runs as a sealed HTTP service.
// All extraction logic (SLM prompt, artifact schema, Ollama call) lives inside
// the engine at POST /v1/block/0/extract. Unity proxies; it holds no schema.
function resolveDssServiceUrl() {
  return (process.env.DSS_SERVICE_URL || "http://127.0.0.1:5001").replace(/\/$/, "");
}

exports.submitBlock0 = async (req, res) => {
  try {
    const payload = req.body || {};
    const serviceUrl = resolveDssServiceUrl();

    const response = await fetch(`${serviceUrl}/v1/block/0`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionnaire: payload.questionnaire || {},
        extracted_fields: payload.extracted_fields || {},
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw Object.assign(new Error(data.error || `DSS service responded ${response.status}`), {
        dss_traceback: data.traceback,
      });
    }

    return res.json({ success: true, intake_package: data.intake_package });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "DSS Block 0 intake submission failed.",
      error: error.message,
      dss_traceback: error.dss_traceback,
    });
  }
};

exports.extractBlock0 = async (req, res) => {
  try {
    const payload = req.body || {};
    const serviceUrl = resolveDssServiceUrl();

    const response = await fetch(`${serviceUrl}/v1/block/0/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doc_text: payload.doc_text || "",
        artifact_type: payload.artifact_type || "",
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw Object.assign(new Error(data.error || `DSS service responded ${response.status}`), {
        dss_traceback: data.traceback,
      });
    }

    return res.json({
      success: true,
      artifact_type: data.artifact_type,
      extracted_fields: data.extracted_fields,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "DSS Block 0 extraction failed.",
      error: error.message,
    });
  }
};
