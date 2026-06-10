var axios = require("axios");

let ollamaAPIUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

exports.generateWithOllama = async function (payload = null) {
    try {
        let prompt = payload?.prompt || "";
        if (!prompt) {
            throw new Error("Prompt is required for the local Mistral SLM service.");
        }

        let model = payload?.model || process.env.OLLAMA_MODEL || "mistral";
        let apiUrl = `${process.env.OLLAMA_BASE_URL || ollamaAPIUrl}/api/generate`;

        var bodyContent = {
            model,
            prompt,
            stream: false,
            format: payload?.format || undefined,
            options: payload?.options || {
                temperature: 0.1
            }
        }

        var apiResponse = await axios.post(apiUrl, bodyContent, {
            headers: { "Content-Type": "application/json" },
            timeout: payload?.timeout || 120000
        }).then((res) => res.data).catch((error) => error);

        if (apiResponse?.response?.status) {
            let error = apiResponse?.response?.data?.error;
            throw Error(error || apiResponse?.response?.statusText || "The local Mistral SLM service returned an error.");
        } else if (apiResponse?.response) {
            return apiResponse.response.trim();
        } else if (apiResponse?.code === "ECONNREFUSED") {
            throw Error("The local Mistral SLM service is not running. Start Ollama in Docker before running narration.");
        } else if (apiResponse?.message) {
            throw Error(`The local Mistral SLM service did not respond: ${apiResponse.message}`);
        } else {
            throw Error("No valid response received from the local Mistral SLM service.");
        }
    } catch (error) {
        console.log("generateWithOllama catch ==== ", error);
        throw Error(error?.message);
    }
}
