const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const DssNarrationService = require("../services/dssNarration.service");

const defaultPrototypeDir = path.resolve(__dirname, "../../../dss-prototype/prototype");

function resolvePrototypeDir() {
  return process.env.DSS_PROTOTYPE_DIR || process.env.DSS_BLOCK1_PROTOTYPE_DIR || defaultPrototypeDir;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
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
        reject(error);
        return;
      }

      resolve({ stdout, stderr });
    });
  });
}

async function runBlock1Assessment(payload = {}) {
  const prototypeDir = resolvePrototypeDir();
  const runner = path.join(prototypeDir, "run_assessment.py");

  if (!fs.existsSync(runner)) {
    const error = new Error("DSS Block 1 runner was not found.");
    error.prototype_dir = prototypeDir;
    throw error;
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "unity-dss-block1-"));
  const outputDir = path.join(tempDir, "output");

  try {
    let inputPath;
    const evidencePackage = payload && payload.evidence_package;

    if (evidencePackage) {
      inputPath = path.join(tempDir, "evidence-package.json");
      fs.writeFileSync(inputPath, JSON.stringify(evidencePackage, null, 2));
    } else {
      const fixture = payload && payload.fixture ? payload.fixture : "partial";
      const allowedFixtures = ["pass", "partial", "fail"];
      const fixtureName = allowedFixtures.includes(fixture) ? fixture : "partial";
      inputPath = path.join(prototypeDir, "fixtures", `${fixtureName}_client.json`);
    }

    const cmdArgs = [runner, "--input", inputPath, "--output-dir", outputDir];

    // Risk appetite: org-level parameters set by the client's leadership team.
    // Passed through as-is — we do not validate or constrain the values here;
    // that is intentional (see Stanley's CUSTOMIZATION point).
    const riskAppetite = payload && payload.risk_appetite ? payload.risk_appetite : null;
    if (riskAppetite && typeof riskAppetite === "object") {
      cmdArgs.push("--risk-appetite", JSON.stringify(riskAppetite));
    }

    await runCommand("python3", cmdArgs, { cwd: prototypeDir });

    const results = readJson(path.join(outputDir, "results.json"));
    const uriFeed = readJson(path.join(outputDir, "uri_feed_stub.json"));
    const financialExposure = fs.existsSync(path.join(outputDir, "financial_exposure.json"))
      ? readJson(path.join(outputDir, "financial_exposure.json"))
      : null;
    const resilienceFeed = fs.existsSync(path.join(outputDir, "resilience_feed.json"))
      ? readJson(path.join(outputDir, "resilience_feed.json"))
      : null;
    const brief = fs.readFileSync(path.join(outputDir, "brief.md"), "utf8");

    return {
      success: true,
      runner: "prototype/run_assessment.py",
      prototype_dir: prototypeDir,
      results,
      uri_feed: uriFeed,
      financial_exposure: financialExposure,
      resilience_feed: resilienceFeed,
      brief,
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
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
      prototype_dir: error.prototype_dir,
      stderr: error.stderr,
      stdout: error.stdout,
    });
  }
};

exports.narrateBlock1 = async (req, res) => {
  try {
    const output = await runBlock1Assessment(req.body || {});
    const narration = await DssNarrationService.narrateBlock1Output(output);

    return res.json({
      ...output,
      narration,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "DSS Block 1 narration failed.",
      error: error.message,
      prototype_dir: error.prototype_dir,
      stderr: error.stderr,
      stdout: error.stdout,
    });
  }
};

exports.runBlock1Assessment = runBlock1Assessment;
