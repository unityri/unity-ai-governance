import React, { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  Row,
  Table,
} from "reactstrap";

import Axios from "utility/AxiosConfig";
import { API_ENDPOINTS } from "utility/ApiEndPoints";

const resultColors = {
  pass: "#2BFD82",
  partial: "#f5a623",
  fail: "#ff5b5b",
};

const resultBadgeColors = {
  pass: "success",
  partial: "warning",
  fail: "danger",
};

const severityBadgeColors = {
  critical: "danger",
  high: "danger",
  medium: "warning",
  low: "info",
};

const cardTitleStyle = {
  marginBottom: 16,
};

const mutedStyle = {
  color: "#9a9a9a",
};

const sectionTitleStyle = {
  marginTop: 8,
  marginBottom: 16,
};

const formatPercent = (value) => {
  if (value === undefined || value === null || value === "") return "N/A";
  return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
};

const formatDays = (value) => {
  if (value === undefined || value === null || value === "") return "N/A";
  return `${Number(value).toLocaleString()} days`;
};

const formatCurrency = (value, currency = "USD") => {
  if (value === undefined || value === null || value === "") return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatUncertainty = (value) => {
  if (value === undefined || value === null || value === "") return "N/A";
  const numeric = Number(value);
  const percent = numeric <= 1 ? numeric * 100 : numeric;
  return `${percent.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
};

const StatCard = ({ label, value, subtext }) => (
  <Card>
    <CardBody>
      <div style={{ ...mutedStyle, fontSize: 12, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>{value}</div>
      {subtext ? <div style={{ ...mutedStyle, marginTop: 4 }}>{subtext}</div> : null}
    </CardBody>
  </Card>
);

const ResultBadge = ({ result }) => {
  const normalized = result || "partial";
  return (
    <Badge color={resultBadgeColors[normalized] || "secondary"} pill>
      {normalized.toUpperCase()}
    </Badge>
  );
};

const resultValue = (result) => (
  <span style={{ color: resultColors[result] || "#9a9a9a" }}>
    {(result || "N/A").toUpperCase()}
  </span>
);

const findScenarioForFinding = (finding = {}, scenarios = []) => {
  if (!scenarios.length) return null;

  const linkedRuleMatch = scenarios.find((scenario) => {
    const linkedRules = scenario.linked_validation_rules || [];
    return linkedRules.some((ruleId) => (finding.evidence_requested || []).join(" ").includes(ruleId));
  });

  if (linkedRuleMatch) return linkedRuleMatch;

  const findingText = [
    finding.finding_id,
    finding.remediation_id,
    finding.message,
    finding.why_it_matters,
  ].join(" ").toLowerCase();

  const tokenMatch = scenarios.find((scenario) => {
    const scenarioText = [
      scenario.scenario_id,
      scenario.name,
      scenario.fair_air_vector,
      scenario.risk_statement,
      ...(scenario.linked_validation_rules || []),
      ...(scenario.linked_risk_signals || []),
    ].join(" ").toLowerCase();

    return findingText
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 4)
      .some((token) => scenarioText.includes(token));
  });

  return tokenMatch || (scenarios.length === 1 ? scenarios[0] : null);
};

const DEMAND_SIGNAL_ORDER = [
  "COVERAGE_ELIGIBILITY",
  "CLAIM_DEFENSIBILITY",
  "POSTURE_DEMONSTRABILITY",
];

const DemandSignalCard = ({ block1Summary, block2Summary, block3Summary, block4Summary }) => {
  const summaries = [block1Summary, block2Summary, block3Summary, block4Summary].filter(Boolean);
  if (!summaries.length) return null;

  const merged = {};
  for (const summary of summaries) {
    for (const [code, data] of Object.entries(summary)) {
      if (!merged[code]) {
        merged[code] = { label: data.label, affected_finding_ids: [], affected_rule_ids: [], has_gaps: false };
      }
      merged[code].affected_finding_ids = [
        ...new Set([...merged[code].affected_finding_ids, ...(data.affected_finding_ids || [])]),
      ];
      merged[code].affected_rule_ids = [
        ...new Set([...merged[code].affected_rule_ids, ...(data.affected_rule_ids || [])]),
      ];
      if (data.has_gaps) merged[code].has_gaps = true;
    }
  }

  return (
    <Row>
      <Col md="12">
        <Card>
          <CardBody>
            <h4 style={{ ...cardTitleStyle, marginBottom: 6 }}>Demand Signal Coverage</h4>
            <p style={{ ...mutedStyle, marginBottom: 16, fontSize: 13 }}>
              Which insurer demand signals are affected by gaps across all blocks run so far.
            </p>
            <Table responsive style={{ marginBottom: 0 }}>
              <thead>
                <tr>
                  <th>Signal</th>
                  <th>Status</th>
                  <th>Affected findings</th>
                  <th>Rules in scope</th>
                </tr>
              </thead>
              <tbody>
                {DEMAND_SIGNAL_ORDER.filter((code) => merged[code]).map((code) => {
                  const { label, has_gaps, affected_finding_ids, affected_rule_ids } = merged[code];
                  return (
                    <tr key={code}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{label}</div>
                        <div style={{ ...mutedStyle, fontSize: 11 }}>{code}</div>
                      </td>
                      <td>
                        <Badge color={has_gaps ? "danger" : "success"} pill>
                          {has_gaps ? "GAPS" : "CLEAR"}
                        </Badge>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {affected_finding_ids.length
                          ? affected_finding_ids.join(", ")
                          : <span style={mutedStyle}>none</span>}
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {affected_rule_ids.length
                          ? affected_rule_ids.join(", ")
                          : <span style={mutedStyle}>none</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
};

const ValidationRulesTable = ({ rules = [] }) => (
  <Table responsive>
    <thead>
      <tr>
        <th>Rule</th>
        <th>Result</th>
        <th>Gap Type</th>
        <th>Message</th>
        <th>Artifacts</th>
      </tr>
    </thead>
    <tbody>
      {rules.map((rule) => (
        <tr key={rule.rule_id}>
          <td>{rule.rule_id}</td>
          <td><ResultBadge result={rule.result} /></td>
          <td>{rule.gap_type || "N/A"}</td>
          <td>{rule.message}</td>
          <td>{(rule.artifact_ids || []).join(", ") || "N/A"}</td>
        </tr>
      ))}
    </tbody>
  </Table>
);

const FindingsRemediation = ({ findings = [], scenarios = [], fallbackEvidence = [] }) => (
  <>
    {findings.length ? findings.map((finding) => {
      const scenario = findScenarioForFinding(finding, scenarios);
      const remediationActions = scenario?.remediation_actions || [];
      const evidenceRequested = finding.evidence_requested || fallbackEvidence || [];

      return (
        <div key={finding.finding_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 18, marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <strong>{finding.finding_id}</strong>
            <Badge color={severityBadgeColors[finding.severity] || "secondary"} pill>
              {(finding.severity || "unknown").toUpperCase()}
            </Badge>
          </div>
          <p style={{ marginTop: 8, marginBottom: 4 }}>{finding.message}</p>
          <p style={{ ...mutedStyle, marginBottom: 12 }}>{finding.why_it_matters}</p>
          {remediationActions.length ? (
            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                Remediation actions{scenario?.name ? ` from ${scenario.name}` : ""}
              </div>
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                {remediationActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
          ) : evidenceRequested.length ? (
            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{finding.remediation_id || "Evidence path"}</div>
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                {evidenceRequested.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p style={{ ...mutedStyle, marginBottom: 0 }}>No matched remediation available.</p>
          )}
        </div>
      );
    }) : <p style={mutedStyle}>No material findings.</p>}
  </>
);

const AIGovernanceDSS = () => {
  // Show fixture/test buttons only in local dev. Never visible in production builds.
  const isDev = process.env.NODE_ENV === "development";

  // Risk appetite — org-level parameters owned by the client's C-suite / auditors.
  // These are not ours to hardcode. Defaults match the engine defaults (Stanley: CUSTOMIZATION).
  const [riskAppetite, setRiskAppetite] = useState({
    organization_size: "mid_market",
    posture_min_multiplier: 0.65,
    posture_max_multiplier: 2.0,
    uncertainty_band_pct: 0.25,
    shadow_ai_max: 10,
  });
  const [showRiskAppetiteConfig, setShowRiskAppetiteConfig] = useState(false);

  const [block1LoadingFixture, setBlock1LoadingFixture] = useState("");
  const [block2LoadingFixture, setBlock2LoadingFixture] = useState("");
  const [block3LoadingFixture, setBlock3LoadingFixture] = useState("");
  const [block4LoadingFixture, setBlock4LoadingFixture] = useState("");
  const [block1NarrationLoading, setBlock1NarrationLoading] = useState(false);
  const [block2NarrationLoading, setBlock2NarrationLoading] = useState(false);
  const [block3NarrationLoading, setBlock3NarrationLoading] = useState(false);
  const [block4NarrationLoading, setBlock4NarrationLoading] = useState(false);
  const [block1Payload, setBlock1Payload] = useState(null);
  const [block2Payload, setBlock2Payload] = useState(null);
  const [block3Payload, setBlock3Payload] = useState(null);
  const [block4Payload, setBlock4Payload] = useState(null);
  const [block1AssessmentError, setBlock1AssessmentError] = useState("");
  const [block2AssessmentError, setBlock2AssessmentError] = useState("");
  const [block3AssessmentError, setBlock3AssessmentError] = useState("");
  const [block4AssessmentError, setBlock4AssessmentError] = useState("");
  const [block1NarrationError, setBlock1NarrationError] = useState("");
  const [block2NarrationError, setBlock2NarrationError] = useState("");
  const [block3NarrationError, setBlock3NarrationError] = useState("");
  const [block4NarrationError, setBlock4NarrationError] = useState("");

  const runBlock1 = async (fixture = "partial") => {
    setBlock1LoadingFixture(fixture);
    setBlock1AssessmentError("");

    try {
      const response = await Axios.post(API_ENDPOINTS.dss.block1Run, { fixture, risk_appetite: riskAppetite });
      setBlock1Payload(response.data);
    } catch (err) {
      setBlock1AssessmentError(err?.response?.data?.message || err?.message || "Unable to run Block 1 assessment.");
    } finally {
      setBlock1LoadingFixture("");
    }
  };

  const runBlock2 = async (fixture = "partial") => {
    setBlock2LoadingFixture(fixture);
    setBlock2AssessmentError("");

    try {
      const response = await Axios.post(API_ENDPOINTS.dss.block2Run, { fixture });
      setBlock2Payload(response.data);
    } catch (err) {
      setBlock2AssessmentError(err?.response?.data?.message || err?.message || "Unable to run Block 2 assessment.");
    } finally {
      setBlock2LoadingFixture("");
    }
  };

  const runBlock1Narration = async (fixture = "partial") => {
    setBlock1NarrationLoading(true);
    setBlock1NarrationError("");

    try {
      const response = await Axios.post(API_ENDPOINTS.dss.block1Narrate, { fixture, risk_appetite: riskAppetite });
      setBlock1Payload(response.data);
    } catch (err) {
      const message = err?.response?.data?.error || err?.response?.data?.message || err?.message;
      setBlock1NarrationError(message || "Unable to generate Block 1 narration.");
    } finally {
      setBlock1NarrationLoading(false);
    }
  };

  const runBlock2Narration = async (fixture = "partial") => {
    setBlock2NarrationLoading(true);
    setBlock2NarrationError("");

    try {
      const response = await Axios.post(API_ENDPOINTS.dss.block2Narrate, { fixture });
      setBlock2Payload(response.data);
    } catch (err) {
      const message = err?.response?.data?.error || err?.response?.data?.message || err?.message;
      setBlock2NarrationError(message || "Unable to generate Block 2 narration.");
    } finally {
      setBlock2NarrationLoading(false);
    }
  };

  const runBlock3 = async (fixture = "partial") => {
    setBlock3LoadingFixture(fixture);
    setBlock3AssessmentError("");

    try {
      const response = await Axios.post(API_ENDPOINTS.dss.block3Run, { fixture });
      setBlock3Payload(response.data);
    } catch (err) {
      setBlock3AssessmentError(err?.response?.data?.message || err?.message || "Unable to run Block 3 assessment.");
    } finally {
      setBlock3LoadingFixture("");
    }
  };

  const runBlock3Narration = async (fixture = "partial") => {
    setBlock3NarrationLoading(true);
    setBlock3NarrationError("");

    try {
      const response = await Axios.post(API_ENDPOINTS.dss.block3Narrate, { fixture });
      setBlock3Payload(response.data);
    } catch (err) {
      const message = err?.response?.data?.error || err?.response?.data?.message || err?.message;
      setBlock3NarrationError(message || "Unable to generate Block 3 narration.");
    } finally {
      setBlock3NarrationLoading(false);
    }
  };

  const runBlock4 = async (fixture = "partial") => {
    setBlock4LoadingFixture(fixture);
    setBlock4AssessmentError("");

    try {
      const response = await Axios.post(API_ENDPOINTS.dss.block4Run, { fixture });
      setBlock4Payload(response.data);
    } catch (err) {
      setBlock4AssessmentError(err?.response?.data?.message || err?.message || "Unable to run Block 4 assessment.");
    } finally {
      setBlock4LoadingFixture("");
    }
  };

  const runBlock4Narration = async (fixture = "partial") => {
    setBlock4NarrationLoading(true);
    setBlock4NarrationError("");

    try {
      const response = await Axios.post(API_ENDPOINTS.dss.block4Narrate, { fixture });
      setBlock4Payload(response.data);
    } catch (err) {
      const message = err?.response?.data?.error || err?.response?.data?.message || err?.message;
      setBlock4NarrationError(message || "Unable to generate Block 4 narration.");
    } finally {
      setBlock4NarrationLoading(false);
    }
  };

  const block1Results = block1Payload?.results || null;
  const block1Derived = block1Results?.derived_fields || {};
  const block1Findings = block1Results?.decision_outputs?.findings || [];
  const block1ValidationResults = block1Results?.validation_results || [];
  const block1Scenarios = block1Results?.scenario_contexts || [];
  const block1SliceResult = block1Results?.inventory_validation_result || "";
  const financialExposure = block1Payload?.financial_exposure || null;
  const exposureEstimate = financialExposure?.estimated_annual_loss_exposure || {};
  const currency = exposureEstimate.currency || "USD";
  const block1NarrationText = block1Payload?.narration?.narration?.text || "";
  const resilienceIndex = financialExposure?.resilience_index || null;
  const resilienceScore = resilienceIndex?.score ?? null;

  const block2Results = block2Payload?.results || null;
  const block2Derived = block2Results?.derived_fields || {};
  const block2Findings = block2Results?.decision_outputs?.findings || [];
  const block2ValidationResults = block2Results?.validation_results || [];
  const block2SliceResult = block2Results?.governance_validation_result || "";
  const block2NarrationText = block2Payload?.narration?.narration?.text || "";

  const block3Results = block3Payload?.results || null;
  const block3Findings = block3Results?.decision_outputs?.findings || [];
  const block3ValidationResults = block3Results?.validation_results || [];
  const block3SliceResult = block3Results?.monitoring_validation_result || "";
  const block3Derived = block3Results?.derived_fields || {};
  const block3NarrationText = block3Payload?.narration?.narration?.text || "";

  const block4Results = block4Payload?.results || null;
  const block4Findings = block4Results?.decision_outputs?.findings || [];
  const block4ValidationResults = block4Results?.validation_results || [];
  const block4SliceResult = block4Results?.ir_validation_result || "";
  const block4Derived = block4Results?.derived_fields || {};
  const block4NarrationText = block4Payload?.narration?.narration?.text || "";

  const block1DemandSignals = block1Results?.demand_signal_summary || null;
  const block2DemandSignals = block2Results?.demand_signal_summary || null;
  const block3DemandSignals = block3Results?.demand_signal_summary || null;
  const block4DemandSignals = block4Results?.demand_signal_summary || null;

  const pipelineLabel = "slm \u2192 boundary \u2192 llm";

  return (
    <div className="content">
      <Row>
        <Col md="12">
          <h2>AI Governance</h2>
          <p style={{ ...mutedStyle, maxWidth: 900 }}>
            AI Inventory and Governance Policy Verification with structured findings, scenario context, financial exposure, and read-only narration.
          </p>
        </Col>
      </Row>

      <Row>
        <Col md="12">
          <Card>
            <CardBody>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showRiskAppetiteConfig ? 16 : 0 }}>
                <div>
                  <strong style={{ fontSize: 14 }}>Risk Appetite</strong>
                  <span style={{ ...mutedStyle, fontSize: 12, marginLeft: 10 }}>
                    Multiplier floor/cap and org size — set by your leadership team, not preset by the vendor.
                  </span>
                </div>
                <Button size="sm" color="secondary" outline onClick={() => setShowRiskAppetiteConfig(v => !v)}>
                  {showRiskAppetiteConfig ? "Hide" : "Configure"}
                </Button>
              </div>

              {showRiskAppetiteConfig ? (
                <div style={{ background: '#1e1e2e', border: '1px solid #444', borderRadius: 6, padding: 16, marginBottom: 4 }}>
                  <p style={{ ...mutedStyle, fontSize: 12, marginBottom: 12 }}>
                    These parameters reflect your organization's risk appetite. Review and confirm these
                    ranges with your C-suite, auditors, or board before use — they should not be preset by
                    your vendor.
                  </p>
                  <Row>
                    <Col md="3">
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Organization size</label>
                        <select
                          value={riskAppetite.organization_size}
                          onChange={e => setRiskAppetite(r => ({ ...r, organization_size: e.target.value }))}
                          style={{ width: '100%', padding: '4px 8px', borderRadius: 4, background: '#2a2a3e', color: '#fff', border: '1px solid #555' }}
                        >
                          <option value="smb">SMB (&lt;$25M revenue)</option>
                          <option value="mid_market">Mid-market ($25M-$100M)</option>
                          <option value="large">Large (&gt;$100M)</option>
                          <option value="mega_enterprise">Mega-enterprise</option>
                        </select>
                      </div>
                    </Col>
                    <Col md="2">
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Multiplier floor</label>
                        <input
                          type="number"
                          min="0.1" max="1.5" step="0.05"
                          value={riskAppetite.posture_min_multiplier}
                          onChange={e => setRiskAppetite(r => ({ ...r, posture_min_multiplier: parseFloat(e.target.value) || 0.65 }))}
                          style={{ width: '100%', padding: '4px 8px', borderRadius: 4, background: '#2a2a3e', color: '#fff', border: '1px solid #555' }}
                        />
                        <div style={{ ...mutedStyle, fontSize: 11, marginTop: 2 }}>Best-posture multiplier</div>
                      </div>
                    </Col>
                    <Col md="2">
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Multiplier cap</label>
                        <input
                          type="number"
                          min="1.0" max="5.0" step="0.1"
                          value={riskAppetite.posture_max_multiplier}
                          onChange={e => setRiskAppetite(r => ({ ...r, posture_max_multiplier: parseFloat(e.target.value) || 2.0 }))}
                          style={{ width: '100%', padding: '4px 8px', borderRadius: 4, background: '#2a2a3e', color: '#fff', border: '1px solid #555' }}
                        />
                        <div style={{ ...mutedStyle, fontSize: 11, marginTop: 2 }}>Worst-posture ceiling</div>
                      </div>
                    </Col>
                    <Col md="2">
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Uncertainty band %</label>
                        <input
                          type="number"
                          min="5" max="60" step="5"
                          value={Math.round(riskAppetite.uncertainty_band_pct * 100)}
                          onChange={e => setRiskAppetite(r => ({ ...r, uncertainty_band_pct: (parseInt(e.target.value) || 25) / 100 }))}
                          style={{ width: '100%', padding: '4px 8px', borderRadius: 4, background: '#2a2a3e', color: '#fff', border: '1px solid #555' }}
                        />
                        <div style={{ ...mutedStyle, fontSize: 11, marginTop: 2 }}>Low/high range spread</div>
                      </div>
                    </Col>
                    <Col md="3">
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Shadow AI threshold</label>
                        <input
                          type="number"
                          min="1" max="100" step="1"
                          value={riskAppetite.shadow_ai_max}
                          onChange={e => setRiskAppetite(r => ({ ...r, shadow_ai_max: parseInt(e.target.value) || 10 }))}
                          style={{ width: '100%', padding: '4px 8px', borderRadius: 4, background: '#2a2a3e', color: '#fff', border: '1px solid #555' }}
                        />
                        <div style={{ ...mutedStyle, fontSize: 11, marginTop: 2 }}>Unregistered tools before hard-fail gate</div>
                      </div>
                    </Col>
                  </Row>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {isDev && (
      <Row>
        <Col md="12">
          <Card>
            <CardBody>
              <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <div style={{ ...mutedStyle, fontSize: 12, textTransform: "uppercase", marginBottom: 8 }}>Block 1 Inventory</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {["partial", "pass", "fail"].map((fixture) => (
                      <Button
                        key={`block1-${fixture}`}
                        color={fixture === "partial" ? "primary" : "secondary"}
                        disabled={Boolean(block1LoadingFixture)}
                        onClick={() => runBlock1(fixture)}
                      >
                        {block1LoadingFixture === fixture ? "Running..." : `Run Block 1 (${fixture})`}
                      </Button>
                    ))}
                    <Button color="success" disabled={block1NarrationLoading} onClick={() => runBlock1Narration("partial")}>
                      {block1NarrationLoading ? "Narrating..." : "Run Block 1 Narration"}
                    </Button>
                  </div>
                </div>

                <div>
                  <div style={{ ...mutedStyle, fontSize: 12, textTransform: "uppercase", marginBottom: 8 }}>Block 2 Governance</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {["partial", "pass", "fail"].map((fixture) => (
                      <Button
                        key={`block2-${fixture}`}
                        color={fixture === "partial" ? "primary" : "secondary"}
                        disabled={Boolean(block2LoadingFixture)}
                        onClick={() => runBlock2(fixture)}
                      >
                        {block2LoadingFixture === fixture ? "Running..." : `Run Block 2 (${fixture})`}
                      </Button>
                    ))}
                    <Button color="success" disabled={block2NarrationLoading} onClick={() => runBlock2Narration("partial")}>
                      {block2NarrationLoading ? "Narrating..." : "Run Block 2 Narration"}
                    </Button>
                  </div>
                </div>

                <div>
                  <div style={{ ...mutedStyle, fontSize: 12, textTransform: "uppercase", marginBottom: 8 }}>Block 3 Monitoring</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {["partial", "pass", "fail"].map((fixture) => (
                      <Button
                        key={`block3-${fixture}`}
                        color={fixture === "partial" ? "primary" : "secondary"}
                        disabled={Boolean(block3LoadingFixture)}
                        onClick={() => runBlock3(fixture)}
                      >
                        {block3LoadingFixture === fixture ? "Running..." : `Run Block 3 (${fixture})`}
                      </Button>
                    ))}
                    <Button color="success" disabled={block3NarrationLoading} onClick={() => runBlock3Narration("partial")}>
                      {block3NarrationLoading ? "Narrating..." : "Run Block 3 Narration"}
                    </Button>
                  </div>
                </div>

                <div>
                  <div style={{ ...mutedStyle, fontSize: 12, textTransform: "uppercase", marginBottom: 8 }}>Block 4 Incident Response</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {["partial", "pass", "fail"].map((fixture) => (
                      <Button
                        key={`block4-${fixture}`}
                        color={fixture === "partial" ? "primary" : "secondary"}
                        disabled={Boolean(block4LoadingFixture)}
                        onClick={() => runBlock4(fixture)}
                      >
                        {block4LoadingFixture === fixture ? "Running..." : `Run Block 4 (${fixture})`}
                      </Button>
                    ))}
                    <Button color="success" disabled={block4NarrationLoading} onClick={() => runBlock4Narration("partial")}>
                      {block4NarrationLoading ? "Narrating..." : "Run Block 4 Narration"}
                    </Button>
                  </div>
                </div>
              </div>

              {block1AssessmentError ? (
                <Alert color="danger" style={{ marginTop: 16, marginBottom: 0 }}>
                  Block 1 assessment error: {block1AssessmentError}
                </Alert>
              ) : null}
              {block2AssessmentError ? (
                <Alert color="danger" style={{ marginTop: 16, marginBottom: 0 }}>
                  Block 2 assessment error: {block2AssessmentError}
                </Alert>
              ) : null}
              {block3AssessmentError ? (
                <Alert color="danger" style={{ marginTop: 16, marginBottom: 0 }}>
                  Block 3 assessment error: {block3AssessmentError}
                </Alert>
              ) : null}
              {block4AssessmentError ? (
                <Alert color="danger" style={{ marginTop: 16, marginBottom: 0 }}>
                  Block 4 assessment error: {block4AssessmentError}
                </Alert>
              ) : null}
              {block1NarrationError ? (
                <Alert color="danger" style={{ marginTop: 16, marginBottom: 0 }}>
                  Block 1 narration error: {block1NarrationError}
                </Alert>
              ) : null}
              {block2NarrationError ? (
                <Alert color="danger" style={{ marginTop: 16, marginBottom: 0 }}>
                  Block 2 narration error: {block2NarrationError}
                </Alert>
              ) : null}
              {block3NarrationError ? (
                <Alert color="danger" style={{ marginTop: 16, marginBottom: 0 }}>
                  Block 3 narration error: {block3NarrationError}
                </Alert>
              ) : null}
              {block4NarrationError ? (
                <Alert color="danger" style={{ marginTop: 16, marginBottom: 0 }}>
                  Block 4 narration error: {block4NarrationError}
                </Alert>
              ) : null}
            </CardBody>
          </Card>
        </Col>
      </Row>
      )}

      {(block1Results || block2Results || block3Results || block4Results) ? (
        <Row>
          <Col md="12">
            <Card>
              <CardBody>
                <h4 style={{ ...cardTitleStyle, marginBottom: 6 }}>Mode A vs Mode B Gap</h4>
                <p style={{ ...mutedStyle, marginBottom: 16, fontSize: 13 }}>
                  Declared (Mode A) vs verified (Mode B). Where they align: defensibility evidence. Where they diverge: exposure.
                </p>
                <Table responsive style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th>Block</th>
                      <th>Mode A — Declared</th>
                      <th>Mode B — Verified</th>
                      <th>Gap Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>1 — Inventory</strong></td>
                      <td>
                        {block1Results
                          ? `${block1Derived.declared_ai_asset_count ?? "N/A"} assets declared`
                          : <span style={mutedStyle}>Not run</span>}
                      </td>
                      <td>
                        {block1Results ? (
                          <>
                            {block1Derived.discovered_ai_asset_count ?? "N/A"} found
                            {block1Derived.shadow_ai_asset_count > 0
                              ? `, ${block1Derived.shadow_ai_asset_count} shadow (unregistered)`
                              : ""}
                          </>
                        ) : <span style={mutedStyle}>Not run</span>}
                      </td>
                      <td>
                        {block1Results ? <ResultBadge result={block1SliceResult} /> : <span style={mutedStyle}>—</span>}
                      </td>
                    </tr>
                    <tr>
                      <td><strong>2 — Govern</strong></td>
                      <td>
                        {block2Results ? "Policies attested" : <span style={mutedStyle}>Not run</span>}
                      </td>
                      <td>
                        {block2Results ? (() => {
                          const d = block2Derived;
                          const attest = d.vendor_attestation_coverage_pct != null ? `${d.vendor_attestation_coverage_pct}% vendor attestation` : null;
                          const flow = d.vendor_data_flow_coverage_pct != null ? `${d.vendor_data_flow_coverage_pct}% data flow coverage` : null;
                          return [attest, flow].filter(Boolean).join(", ") || <span style={mutedStyle}>—</span>;
                        })() : <span style={mutedStyle}>Not run</span>}
                      </td>
                      <td>
                        {block2Results ? <ResultBadge result={block2SliceResult} /> : <span style={mutedStyle}>—</span>}
                      </td>
                    </tr>
                    <tr>
                      <td><strong>3 — Monitor</strong></td>
                      <td>
                        {block3Results ? "Monitoring attested" : <span style={mutedStyle}>Not run</span>}
                      </td>
                      <td>
                        {block3Results ? (() => {
                          const d = block3Derived;
                          const age = d.ai_activity_log_age_days != null ? `Last log: ${d.ai_activity_log_age_days}d ago` : null;
                          const ret = d.log_retention_months != null ? `${d.log_retention_months}-mo retention` : null;
                          return [age, ret].filter(Boolean).join(", ") || <span style={mutedStyle}>—</span>;
                        })() : <span style={mutedStyle}>Not run</span>}
                      </td>
                      <td>
                        {block3Results ? <ResultBadge result={block3SliceResult} /> : <span style={mutedStyle}>—</span>}
                      </td>
                    </tr>
                    <tr>
                      <td><strong>4 — Respond</strong></td>
                      <td>
                        {block4Results ? "Incident response attested" : <span style={mutedStyle}>Not run</span>}
                      </td>
                      <td>
                        {block4Results ? (() => {
                          const d = block4Derived;
                          const plan = d.ir_plan_age_months != null ? `Plan: ${d.ir_plan_age_months}mo old` : null;
                          const drill = d.ir_test_age_months != null ? `Last drill: ${d.ir_test_age_months}mo ago` : "Last drill: not recorded";
                          return [plan, drill].filter(Boolean).join(", ") || <span style={mutedStyle}>—</span>;
                        })() : <span style={mutedStyle}>Not run</span>}
                      </td>
                      <td>
                        {block4Results ? <ResultBadge result={block4SliceResult} /> : <span style={mutedStyle}>—</span>}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          </Col>
        </Row>
      ) : null}

      <DemandSignalCard
        block1Summary={block1DemandSignals}
        block2Summary={block2DemandSignals}
        block3Summary={block3DemandSignals}
        block4Summary={block4DemandSignals}
      />

      <Row>
        {[
          {
            layer: "Layer 1",
            label: "Understand",
            block: "Block 1 — Inventory",
            result: block1SliceResult,
            hasData: Boolean(block1Results),
            description: "AI asset register vs. discovered tools. Declares what exists; verifies what's actually running.",
          },
          {
            layer: "Layer 2",
            label: "Govern",
            block: "Block 2 — Policy",
            result: block2SliceResult,
            hasData: Boolean(block2Results),
            description: "AUP, data classification, approval workflow, vendor register. Declared governance posture.",
          },
          {
            layer: "Layer 3",
            label: "Monitor",
            block: "Block 3 — Monitoring",
            result: block3SliceResult,
            hasData: Boolean(block3Results),
            description: "Activity logs, HITL oversight records, audit trail retention and timestamping.",
          },
          {
            layer: "Layer 4",
            label: "Respond",
            block: "Block 4 — Incident Response",
            result: block4SliceResult,
            hasData: Boolean(block4Results),
            description: "IR plan, tabletop evidence, chain of custody, notification SLA. DFIR-IRIS timeline.",
          },
        ].map(({ layer, label, block, result, hasData, description }) => (
          <Col md="3" key={layer}>
            <Card style={{ height: "100%" }}>
              <CardBody>
                <div style={{ ...mutedStyle, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                  {layer} of 4 — {label}
                </div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{block}</div>
                <p style={{ ...mutedStyle, fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>{description}</p>
                {hasData ? (
                  <ResultBadge result={result} />
                ) : (
                  <span style={{ ...mutedStyle, fontSize: 12 }}>Not run</span>
                )}
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>

      {block1Results ? (
        <>
          <Row>
            <Col md="12">
              <h3 style={sectionTitleStyle}>
                Block 1 — Inventory
                <span style={{ ...mutedStyle, fontSize: 14, fontWeight: 400, marginLeft: 12 }}>
                  Layer 1 of 4: Understand
                </span>
              </h3>
            </Col>
          </Row>
          <Row>
            <Col md="3">
              <StatCard
                label="Overall Result"
                value={resultValue(block1SliceResult)}
                subtext={block1Results.inventory_gap_type}
              />
            </Col>
            <Col md="3">
              <StatCard label="Shadow AI Count" value={block1Derived.shadow_ai_asset_count ?? "N/A"} />
            </Col>
            <Col md="3">
              <StatCard label="Inventory Coverage %" value={formatPercent(block1Derived.ai_inventory_coverage_pct)} />
            </Col>
            <Col md="3">
              <StatCard label="Evidence Staleness" value={formatDays(block1Derived.inventory_staleness_days)} />
            </Col>
          </Row>
          {resilienceScore !== null ? (
            <Row>
              <Col md="3">
                <StatCard
                  label="Resilience Index"
                  value={`${resilienceScore.toFixed(1)} / 100`}
                  subtext={
                    resilienceIndex?.gate
                      ? resilienceIndex.gate.replace(/_/g, " ")
                      : resilienceIndex?.method === "weighted_block1_indicators"
                      ? "weighted posture indicators"
                      : resilienceIndex?.method || "computed"
                  }
                />
              </Col>
            </Row>
          ) : null}
          {block1NarrationText ? (
            <Row>
              <Col md="12">
                <Card>
                  <CardBody>
                    <h4 style={cardTitleStyle}>Block 1 Narration</h4>
                    <p style={{ whiteSpace: "pre-wrap", fontSize: 15, lineHeight: 1.7 }}>{block1NarrationText}</p>
                    <div style={{ ...mutedStyle, fontSize: 12, marginTop: 10 }}>{pipelineLabel}</div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          ) : null}

          {financialExposure ? (
            <Row>
              <Col md="12">
                <Card>
                  <CardBody>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <h4 style={{ ...cardTitleStyle, marginBottom: 0 }}>Financial Exposure</h4>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#856404',
                        background: '#fff3cd',
                        border: '1px solid #ffc107',
                        borderRadius: 4,
                        padding: '2px 8px',
                        letterSpacing: 0.3,
                      }}>ILLUSTRATIVE</span>
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: '#856404',
                      background: '#fff3cd',
                      border: '1px solid #ffc107',
                      borderRadius: 4,
                      padding: '6px 10px',
                      marginBottom: 12,
                    }}>
                      Multipliers not validated. For governance discussion only — not an actuarial or claims model.
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 700 }}>
                      {formatCurrency(exposureEstimate.point_estimate, currency)}
                    </div>
                    <div style={{ ...mutedStyle, marginTop: 8 }}>
                      Low/high range: {formatCurrency(exposureEstimate.range_low, currency)} - {formatCurrency(exposureEstimate.range_high, currency)}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      Uncertainty band: <strong>{formatUncertainty(exposureEstimate.uncertainty_band_pct)}</strong>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          ) : null}

          {block1Scenarios.length ? (
            <Row>
              <Col md="12">
                <Card>
                  <CardBody>
                    <h4 style={cardTitleStyle}>Scenario Context</h4>
                    {block1Scenarios.map((scenario) => (
                      <div key={scenario.scenario_id} style={{ marginBottom: 18 }}>
                        <div style={{ fontWeight: 700 }}>{scenario.name || scenario.scenario_id}</div>
                        <p style={{ marginBottom: 6 }}>{scenario.risk_statement}</p>
                        <p style={{ ...mutedStyle, marginBottom: 0 }}>
                          Underwriter question: {scenario.underwriter_question}
                        </p>
                      </div>
                    ))}
                  </CardBody>
                </Card>
              </Col>
            </Row>
          ) : null}

          <Row>
            <Col md="12">
              <Card>
                <CardBody>
                  <h4 style={cardTitleStyle}>Block 1 Findings + Remediation</h4>
                  <FindingsRemediation findings={block1Findings} scenarios={block1Scenarios} />
                </CardBody>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md="12">
              <Card>
                <CardBody>
                  <h4 style={cardTitleStyle}>Block 1 Validation Rules</h4>
                  <ValidationRulesTable rules={block1ValidationResults} />
                </CardBody>
              </Card>
            </Col>
          </Row>
        </>
      ) : null}

      {block2Results ? (
        <>
          <Row>
            <Col md="12">
              <h3 style={sectionTitleStyle}>
                Block 2 — Governance Policy
                <span style={{ ...mutedStyle, fontSize: 14, fontWeight: 400, marginLeft: 12 }}>
                  Layer 2 of 4: Govern
                </span>
              </h3>
            </Col>
          </Row>
          <Row>
            <Col md="3">
              <StatCard
                label="Governance Result"
                value={resultValue(block2SliceResult)}
                subtext={block2Results.governance_gap_type}
              />
            </Col>
            <Col md="3">
              <StatCard label="Vendor Register Coverage %" value={formatPercent(block2Derived.vendor_register_tool_coverage_pct)} />
            </Col>
            <Col md="3">
              <StatCard label="Attestation Coverage %" value={formatPercent(block2Derived.vendor_attestation_coverage_pct)} />
            </Col>
            <Col md="3">
              <StatCard label="Staff Training Coverage %" value={formatPercent(block2Derived.staff_training_authorization_coverage_pct)} />
            </Col>
          </Row>

          {block2NarrationText ? (
            <Row>
              <Col md="12">
                <Card>
                  <CardBody>
                    <h4 style={cardTitleStyle}>Block 2 Narration</h4>
                    <p style={{ whiteSpace: "pre-wrap", fontSize: 15, lineHeight: 1.7 }}>{block2NarrationText}</p>
                    <div style={{ ...mutedStyle, fontSize: 12, marginTop: 10 }}>{pipelineLabel}</div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          ) : null}

          <Row>
            <Col md="12">
              <Card>
                <CardBody>
                  <h4 style={cardTitleStyle}>Block 2 Findings + Remediation</h4>
                  <FindingsRemediation
                    findings={block2Findings}
                    fallbackEvidence={block2Results.decision_outputs?.evidence_requested || []}
                  />
                </CardBody>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md="12">
              <Card>
                <CardBody>
                  <h4 style={cardTitleStyle}>Block 2 Validation Rules</h4>
                  <ValidationRulesTable rules={block2ValidationResults} />
                </CardBody>
              </Card>
            </Col>
          </Row>
        </>
      ) : null}

      {block3Results ? (
        <>
          <Row>
            <Col md="12">
              <h3 style={sectionTitleStyle}>
                Block 3 — Monitoring
                <span style={{ ...mutedStyle, fontSize: 14, fontWeight: 400, marginLeft: 12 }}>
                  Layer 3 of 4: Monitor
                </span>
              </h3>
            </Col>
          </Row>
          <Row>
            <Col md="3">
              <StatCard
                label="Monitoring Result"
                value={resultValue(block3SliceResult)}
                subtext={block3Results.monitoring_gap_type}
              />
            </Col>
            <Col md="3">
              <StatCard label="Activity Log Age" value={block3Derived.ai_activity_log_age_days != null ? formatDays(block3Derived.ai_activity_log_age_days) : "N/A"} />
            </Col>
            <Col md="3">
              <StatCard label="Log Retention" value={block3Derived.log_retention_months != null ? `${block3Derived.log_retention_months} months` : "N/A"} />
            </Col>
            <Col md="3">
              <StatCard label="Shadow AI Review Cycles" value={block3Derived.shadow_ai_review_cycle_count ?? "N/A"} />
            </Col>
          </Row>

          {block3NarrationText ? (
            <Row>
              <Col md="12">
                <Card>
                  <CardBody>
                    <h4 style={cardTitleStyle}>Block 3 Narration</h4>
                    <p style={{ whiteSpace: "pre-wrap", fontSize: 16, lineHeight: 1.6 }}>{block3NarrationText}</p>
                    <div style={{ ...mutedStyle, fontSize: 12, marginTop: 10 }}>{pipelineLabel}</div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          ) : null}

          <Row>
            <Col md="12">
              <Card>
                <CardBody>
                  <h4 style={cardTitleStyle}>Block 3 Findings + Remediation</h4>
                  <FindingsRemediation
                    findings={block3Findings}
                    fallbackEvidence={block3Results.decision_outputs?.evidence_requested || []}
                  />
                </CardBody>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md="12">
              <Card>
                <CardBody>
                  <h4 style={cardTitleStyle}>Block 3 Validation Rules</h4>
                  <ValidationRulesTable rules={block3ValidationResults} />
                </CardBody>
              </Card>
            </Col>
          </Row>
        </>
      ) : null}

      {block4Results ? (
        <>
          <Row>
            <Col md="12">
              <h3 style={sectionTitleStyle}>
                Block 4 — Incident Response
                <span style={{ ...mutedStyle, fontSize: 14, fontWeight: 400, marginLeft: 12 }}>
                  Layer 4 of 4: Respond
                </span>
              </h3>
            </Col>
          </Row>
          <Row>
            <Col md="3">
              <StatCard
                label="Incident Response Result"
                value={resultValue(block4SliceResult)}
                subtext={block4Results.ir_gap_type}
              />
            </Col>
            <Col md="3">
              <StatCard label="IR Plan Age" value={block4Derived.ir_plan_age_months != null ? `${block4Derived.ir_plan_age_months} months` : "N/A"} />
            </Col>
            <Col md="3">
              <StatCard label="Last Test Age" value={block4Derived.ir_test_age_months != null ? `${block4Derived.ir_test_age_months} months` : "N/A"} />
            </Col>
            <Col md="3">
              <StatCard label="Notification SLA" value={block4Derived.exposure_notification_timeline_hours != null ? `${block4Derived.exposure_notification_timeline_hours} hours` : "N/A"} />
            </Col>
          </Row>

          {block4NarrationText ? (
            <Row>
              <Col md="12">
                <Card>
                  <CardBody>
                    <h4 style={cardTitleStyle}>Block 4 Narration</h4>
                    <p style={{ whiteSpace: "pre-wrap", fontSize: 16, lineHeight: 1.6 }}>{block4NarrationText}</p>
                    <div style={{ ...mutedStyle, fontSize: 12, marginTop: 10 }}>{pipelineLabel}</div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          ) : null}

          <Row>
            <Col md="12">
              <Card>
                <CardBody>
                  <h4 style={cardTitleStyle}>Block 4 Findings + Remediation</h4>
                  <FindingsRemediation
                    findings={block4Findings}
                    fallbackEvidence={block4Results.decision_outputs?.evidence_requested || []}
                  />
                </CardBody>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md="12">
              <Card>
                <CardBody>
                  <h4 style={cardTitleStyle}>Block 4 Validation Rules</h4>
                  <ValidationRulesTable rules={block4ValidationResults} />
                </CardBody>
              </Card>
            </Col>
          </Row>
        </>
      ) : null}
    </div>
  );
};

export default AIGovernanceDSS;
