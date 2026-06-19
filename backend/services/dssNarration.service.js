var axios = require("axios");

function getDssServiceUrl() {
  return (process.env.DSS_SERVICE_URL || "http://127.0.0.1:5001").replace(/\/$/, "");
}

// Narration is handled entirely by the sealed DSS engine service.
// The engine runs the local SLM digest, applies the MCP boundary, and calls
// Chatty SARA's narrate_dss tool. Unity holds no LLM key and makes no direct
// LLM call. Provider selection is the engine's concern, not Unity's.
exports.narrateBlock1Output = async function (blockOutput = {}) {
  const url = `${getDssServiceUrl()}/v1/narrate`;
  const response = await axios.post(url, blockOutput, {
    headers: { "Content-Type": "application/json" },
    timeout: 60000,
  });
  return response.data;
};
