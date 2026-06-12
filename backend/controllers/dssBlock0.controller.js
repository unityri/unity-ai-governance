const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const OllamaPromptService = require("../services/ollamaPrompt.service");

const defaultPrototypeDir = path.resolve(__dirname, "../../../dss-prototype/prototype");

const artifactScopes = {
  aup: {
    block2_governance: [
      "ai_acceptable_use_policy_exists",
      "ai_acceptable_use_policy_date",
      "sensitive_data_classification_rules_documented",
    ],
  },
  approved_tools_list: {
    block1_inventory: ["declared_ai_tools"],
    block2_governance: ["approved_ai_tools_list_exists"],
  },
  vendor_register: {
    block2_governance: ["vendor_register_exists"],
  },
  training_records: {
    block2_governance: [
      "staff_with_ai_access_count",
      "staff_with_training_authorization_count",
    ],
  },
  audit_logs: {
    block3_monitoring: [
      "activity_logs_exist",
      "hitl_approval_records_exist",
      "audit_trail_format",
      "audit_trail_reviewer_name",
      "log_retention_months",
    ],
  },
  ir_playbook: {
    block4_incident_response: [
      "ir_playbook_exists",
      "chain_of_custody_procedure_documented",
      "exposure_notification_process_documented",
      "ir_named_owner",
    ],
  },
};

function resolvePrototypeDir() {
  return process.env.DSS_PROTOTYPE_DIR || process.env.DSS_BLOCK0_PROTOTYPE_DIR || process.env.DSS_BLOCK1_PROTOTYPE_DIR || defaultPrototypeDir;
}

function runPythonJson(command, payload) {
  return new Promise((resolve, reject) => {
    const prototypeDir = resolvePrototypeDir();
    const runner = path.join(prototypeDir, "block0_intake.py");

    if (!fs.existsSync(runner)) {
      const error = new Error("DSS Block 0 intake runner was not found.");
      error.prototype_dir = prototypeDir;
      reject(error);
      return;
    }

    const child = spawn("python3", [runner, command], { cwd: prototypeDir });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      if (code !== 0) {
        const error = new Error(stderr || stdout || `Command exited with code ${code}`);
        error.code = code;
        error.stdout = stdout;
        error.stderr = stderr;
        error.prototype_dir = prototypeDir;
        reject(error);
        return;
      }

      try {
        resolve(JSON.parse(stdout || "{}"));
      } catch (parseError) {
        parseError.stdout = stdout;
        parseError.stderr = stderr;
        parseError.prototype_dir = prototypeDir;
        reject(parseError);
      }
    });

    child.stdin.write(JSON.stringify(payload || {}));
    child.stdin.end();
  });
}

function buildExtractionPrompt(docText, artifactType) {
  const allowed = artifactScopes[artifactType];
  if (!allowed) {
    throw new Error("Unsupported artifact type.");
  }

  return `You are extracting AI Governance DSS Block 0 intake fields.
Return strict JSON only. Do not include markdown, explanations, or fields not listed.

Artifact type: ${artifactType}
Allowed output sections and field names:
${JSON.stringify(allowed, null, 2)}

Use the Block 0 intake schema field names exactly. If a value is not directly supported by the document, omit it. Use booleans for yes/no fields, integers for counts/months, ISO YYYY-MM-DD strings for dates, and arrays for tool lists.

Document text:
${docText}`;
}

function parseJsonObject(text) {
  const parsed = JSON.parse(text || "{}");
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

function filterToScope(candidate, artifactType) {
  const scope = artifactScopes[artifactType] || {};
  return Object.keys(scope).reduce((acc, section) => {
    const sourceSection = candidate[section];
    if (!sourceSection || typeof sourceSection !== "object" || Array.isArray(sourceSection)) {
      return acc;
    }

    const allowedFields = scope[section];
    const values = allowedFields.reduce((sectionAcc, fieldName) => {
      if (sourceSection[fieldName] !== undefined && sourceSection[fieldName] !== null) {
        sectionAcc[fieldName] = sourceSection[fieldName];
      }
      return sectionAcc;
    }, {});

    if (Object.keys(values).length) {
      acc[section] = values;
    }
    return acc;
  }, {});
}

exports.submitBlock0 = async (req, res) => {
  try {
    const payload = req.body || {};
    const intakePackage = await runPythonJson("submit", {
      questionnaire: payload.questionnaire || {},
      extracted_fields: payload.extracted_fields || {},
    });

    return res.json({
      success: true,
      intake_package: intakePackage,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "DSS Block 0 intake submission failed.",
      error: error.message,
      prototype_dir: error.prototype_dir,
      stderr: error.stderr,
      stdout: error.stdout,
    });
  }
};

exports.extractBlock0 = async (req, res) => {
  try {
    const payload = req.body || {};
    const docText = payload.doc_text || "";
    const artifactType = payload.artifact_type || "";

    if (!docText.trim()) {
      return res.status(400).json({
        success: false,
        message: "Document text is required.",
      });
    }

    const prompt = buildExtractionPrompt(docText, artifactType);
    const response = await OllamaPromptService.generateWithOllama({
      prompt,
      format: "json",
      options: { temperature: 0.1 },
    });
    const extractedFields = filterToScope(parseJsonObject(response), artifactType);

    return res.json({
      success: true,
      artifact_type: artifactType,
      extracted_fields: extractedFields,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "DSS Block 0 extraction failed.",
      error: error.message,
    });
  }
};
