var axios = require("axios");

let geminiAPIUrl = "https://generativelanguage.googleapis.com";

exports.generateTextWithGemini = async function (credentials = null, prompt = "", options = {}) {
    try {
        if (!credentials || !credentials?.api_key) {
            throw new Error("API key is required for Gemini service.");
        }

        if (!prompt) {
            throw new Error("Prompt is required for Gemini service.");
        }

        let model = options?.model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
        var headers = {
            "Content-Type": "application/json"
        }

        var bodyContent = {
            contents: [{
                parts: [{ text: prompt }]
            }]
        }

        if (options?.temperature !== undefined || options?.maxOutputTokens) {
            bodyContent.generationConfig = {};
            if (options?.temperature !== undefined) {
                bodyContent.generationConfig.temperature = options.temperature;
            }
            if (options?.maxOutputTokens) {
                bodyContent.generationConfig.maxOutputTokens = options.maxOutputTokens;
            }
        }

        var apiUrl = `${geminiAPIUrl}/v1/models/${model}:generateContent?key=${credentials.api_key}`;
        var apiResponse = await axios.post(apiUrl, bodyContent, { headers }).then((res) => res.data).catch((error) => error);
        if (apiResponse?.response?.status && apiResponse?.response?.data?.error) {
            let error = apiResponse?.response?.data?.error;
            throw Error(error?.message || apiResponse?.response?.statusText || "Something went wrong with Gemini API.");
        } else if (apiResponse?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return apiResponse?.candidates?.[0]?.content?.parts?.[0]?.text.trim();
        } else {
            throw Error("No valid response received from Gemini API.");
        }

    } catch (error) {
        console.log("generateTextWithGemini catch ==== ", error);
        throw Error(error?.message);
    }
}
