const fs = require("fs");
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

function resolveFixturePath(prototypeDir, fixture = "partial") {
  const allowedFixtures = ["pass", "partial", "fail"];
  const fixtureName = allowedFixtures.includes(fixture) ? fixture : "partial";
  return path.join(prototypeDir, "fixtures", `block2_${fixtureName}_scenario`, "evidence_package.json");
}

async function runBlock2Assessment(payload = {}) {
  const prototypeDir = resolvePrototypeDir();
  const runner = path.join(prototypeDir, "block2_govern.py");

  if (!fs.existsSync(runner)) {
    const error = new Error("DSS Block 2 runner was not found.");
    error.prototype_dir = prototypeDir;
    throw error;
  }

  let inputPath;
  const evidencePackage = payload && payload.evidence_package;

  if (evidencePackage) {
    inputPath = null;
  } else {
    inputPath = resolveFixturePath(prototypeDir, payload && payload.fixture);
    if (!fs.existsSync(inputPath)) {
      const error = new Error("DSS Block 2 fixture was not found.");
      error.prototype_dir = prototypeDir;
      error.fixture_path = inputPath;
      throw error;
    }
  }

  const pythonCode = `
import json
import sys
from pathlib import Path
from block2_govern import build_results_payload

if len(sys.argv) > 1:
    package = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
else:
    package = json.load(sys.stdin)

print(json.dumps(build_results_payload(package), indent=2, sort_keys=True))
`;

  const args = inputPath ? ["-c", pythonCode, inputPath] : ["-c", pythonCode];
  const options = { cwd: prototypeDir };
  if (evidencePackage) {
    options.input = JSON.stringify(evidencePackage);
  }

  const output = await new Promise((resolve, reject) => {
    const child = spawn("python3", args, options);
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

    if (evidencePackage) {
      child.stdin.write(JSON.stringify(evidencePackage));
      child.stdin.end();
    }
  });

  const results = JSON.parse(output.stdout || "{}");

  return {
    success: true,
    runner: "prototype/block2_govern.py",
    prototype_dir: prototypeDir,
    fixture_path: inputPath,
    results,
    brief: results.brief || "",
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
      prototype_dir: error.prototype_dir,
      fixture_path: error.fixture_path,
      stderr: error.stderr,
      stdout: error.stdout,
    });
  }
};

exports.narrateBlock2 = async (req, res) => {
  try {
    const output = await runBlock2Assessment(req.body || {});
    const narration = await DssNarrationService.narrateBlock1Output(output);

    return res.json({
      ...output,
      narration,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "DSS Block 2 narration failed.",
      error: error.message,
      prototype_dir: error.prototype_dir,
      fixture_path: error.fixture_path,
      stderr: error.stderr,
      stdout: error.stdout,
    });
  }
};

exports.runBlock2Assessment = runBlock2Assessment;
