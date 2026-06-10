import React, { useState } from "react";
import {
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

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const mutedStyle = { color: "#9a9a9a" };

const resultBadgeColors = {
  pass: "success",
  partial: "warning",
  fail: "danger",
};

const DEMAND_SIGNAL_ORDER = [
  "COVERAGE_ELIGIBILITY",
  "CLAIM_DEFENSIBILITY",
  "POSTURE_DEMONSTRABILITY",
];

const DEMAND_SIGNAL_LABELS = {
  COVERAGE_ELIGIBILITY: "Coverage eligibility",
  CLAIM_DEFENSIBILITY: "Claim defensibility",
  POSTURE_DEMONSTRABILITY: "Posture demonstrability",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const ResultBadge = ({ result }) => {
  const normalized = result || null;
  if (!normalized) return <span style={mutedStyle}>—</span>;
  return (
    <Badge color={resultBadgeColors[normalized] || "secondary"} pill>
      {normalized.toUpperCase()}
    </Badge>
  );
};

// Large pass/partial/fail chip used in the scorecard row
const ScoreChip = ({ result }) => {
  if (!result) {
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        minWidth: 100, height: 36, borderRadius: 6,
        background: "#2a2a3a", color: "#666", fontSize: 13, fontWeight: 700,
        letterSpacing: 1,
      }}>
        —
      </div>
    );
  }
  const colors = { pass: "#0d2b1a", partial: "#2b1e00", fail: "#2b0000" };
  const borders = { pass: "#2BFD82", partial: "#f5a623", fail: "#ff5b5b" };
  const text = { pass: "#2BFD82", partial: "#f5a623", fail: "#ff5b5b" };
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: 100, height: 36, borderRadius: 6,
      background: colors[result] || "#2a2a3a",
      border: `1.5px solid ${borders[result] || "#555"}`,
      color: text[result] || "#aaa",
      fontSize: 13, fontWeight: 800, letterSpacing: 1.5,
    }}>
      {result.toUpperCase()}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Overview component
// ---------------------------------------------------------------------------

const AIGovernanceOverview = () => {
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState("");

  const [block1Payload, setBlock1Payload] = useState(null);
  const [block2Payload, setBlock2Payload] = useState(null);
  const [block3Payload, setBlock3Payload] = useState(null);
  const [block4Payload, setBlock4Payload] = useState(null);

  // Derived
  const block1Results = block1Payload?.results || null;
  const block2Results = block2Payload?.results || null;
  const block3Results = block3Payload?.results || null;
  const block4Results = block4Payload?.results || null;

  const block1Derived = block1Results?.derived_fields || {};

  const block1SliceResult = block1Results?.inventory_validation_result || "";
  const block2SliceResult = block2Results?.governance_validation_result || "";
  const block3SliceResult = block3Results?.monitoring_validation_result || "";
  const block4SliceResult = block4Results?.ir_validation_result || "";

  const b1DemandSignals = block1Results?.demand_signal_summary || null;
  const b2DemandSignals = block2Results?.demand_signal_summary || null;
  const b3DemandSignals = block3Results?.demand_signal_summary || null;
  const b4DemandSignals = block4Results?.demand_signal_summary || null;

  // Overall posture: worst result across all four blocks
  const resultRank = { fail: 0, partial: 1, pass: 2 };
  const runResults = [block1SliceResult, block2SliceResult, block3SliceResult, block4SliceResult].filter(Boolean);
  const overallResult = runResults.length
    ? runResults.reduce((worst, r) => (resultRank[r] < resultRank[worst] ? r : worst), "pass")
    : null;

  // Merge demand signals across all blocks
  const allDemandSignals = [b1DemandSignals, b2DemandSignals, b3DemandSignals, b4DemandSignals].filter(Boolean);
  const mergedSignals = {};
  for (const summary of allDemandSignals) {
    for (const [code, data] of Object.entries(summary)) {
      if (!mergedSignals[code]) {
        mergedSignals[code] = {
          label: data.label || DEMAND_SIGNAL_LABELS[code] || code,
          affected_finding_ids: [],
          affected_rule_ids: [],
          has_gaps: false,
        };
      }
      mergedSignals[code].affected_finding_ids = [
        ...new Set([...mergedSignals[code].affected_finding_ids, ...(data.affected_finding_ids || [])]),
      ];
      mergedSignals[code].affected_rule_ids = [
        ...new Set([...mergedSignals[code].affected_rule_ids, ...(data.affected_rule_ids || [])]),
      ];
      if (data.has_gaps) mergedSignals[code].has_gaps = true;
    }
  }
  const hasDemandSignals = Object.keys(mergedSignals).length > 0;

  // Run all four blocks in parallel using the "partial" fixture (realistic mixed scenario)
  const runAssessment = async () => {
    setRunning(true);
    setError("");

    try {
      const [r1, r2, r3, r4] = await Promise.allSettled([
        Axios.post(API_ENDPOINTS.dss.block1Run, { fixture: "partial" }),
        Axios.post(API_ENDPOINTS.dss.block2Run, { fixture: "partial" }),
        Axios.post(API_ENDPOINTS.dss.block3Run, { fixture: "partial" }),
        Axios.post(API_ENDPOINTS.dss.block4Run, { fixture: "partial" }),
      ]);

      if (r1.status === "fulfilled") setBlock1Payload(r1.value.data);
      if (r2.status === "fulfilled") setBlock2Payload(r2.value.data);
      if (r3.status === "fulfilled") setBlock3Payload(r3.value.data);
      if (r4.status === "fulfilled") setBlock4Payload(r4.value.data);

      const failed = [r1, r2, r3, r4].filter((r) => r.status === "rejected");
      if (failed.length === 4) {
        setError("Assessment could not run. Check that the backend is running.");
      } else if (failed.length > 0) {
        setError(`${failed.length} block(s) failed to run. Results shown are partial.`);
      }

      setHasRun(true);
    } catch (err) {
      setError(err?.message || "Unexpected error running assessment.");
    } finally {
      setRunning(false);
    }
  };

  // Overall posture color
  const postureColor = { pass: "#2BFD82", partial: "#f5a623", fail: "#ff5b5b" }[overallResult] || "#555";
  const postureLabel = { pass: "COMPLIANT", partial: "PARTIAL", fail: "GAPS FOUND" }[overallResult] || "NOT RUN";

  return (
    <div className="content">

      {/* ------------------------------------------------------------------ */}
      {/* Page header + run button                                            */}
      {/* ------------------------------------------------------------------ */}
      <Row style={{ marginBottom: 8 }}>
        <Col md="8">
          <h2 style={{ marginBottom: 4 }}>AI Governance Assessment</h2>
          <p style={{ ...mutedStyle, maxWidth: 700, marginBottom: 0 }}>
            Declared posture (Mode A) scored against verified evidence (Mode B).
            Gap result drives coverage eligibility, claim defensibility, and posture demonstrability.
          </p>
        </Col>
        <Col md="4" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          <Button
            color="primary"
            size="lg"
            disabled={running}
            onClick={runAssessment}
            style={{ minWidth: 180 }}
          >
            {running ? "Running…" : hasRun ? "Re-run Assessment" : "Run Assessment"}
          </Button>
        </Col>
      </Row>

      {error ? (
        <Row>
          <Col md="12">
            <div style={{ background: "#2b0000", border: "1px solid #ff5b5b", borderRadius: 6, padding: "10px 16px", marginBottom: 16, color: "#ff9a9a", fontSize: 13 }}>
              {error}
            </div>
          </Col>
        </Row>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Overall posture banner — only shows after run                       */}
      {/* ------------------------------------------------------------------ */}
      {hasRun && overallResult ? (
        <Row style={{ marginBottom: 8 }}>
          <Col md="12">
            <div style={{
              borderRadius: 8,
              border: `1.5px solid ${postureColor}`,
              background: `${postureColor}11`,
              padding: "20px 28px",
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: postureColor, letterSpacing: 2 }}>
                {postureLabel}
              </div>
              <div style={{ ...mutedStyle, fontSize: 13, maxWidth: 560 }}>
                Overall AI governance posture across all four assessment blocks.
                {overallResult === "fail" && " One or more blocks have critical gaps that affect defensibility."}
                {overallResult === "partial" && " Some controls are attested but verification gaps remain."}
                {overallResult === "pass" && " All assessed controls align with declared posture."}
              </div>
            </div>
          </Col>
        </Row>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* HERO: Mode A vs Mode B gap table                                    */}
      {/* ------------------------------------------------------------------ */}
      <Row>
        <Col md="12">
          <Card>
            <CardBody>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <h3 style={{ marginBottom: 0 }}>Mode A vs Mode B Gap</h3>
                {!hasRun && (
                  <span style={{ ...mutedStyle, fontSize: 12 }}>Run the assessment to populate results</span>
                )}
              </div>
              <p style={{ ...mutedStyle, marginBottom: 20, fontSize: 13 }}>
                Declared governance (Mode A) vs verified evidence (Mode B).
                Where they align: defensibility evidence. Where they diverge: exposure.
              </p>

              <Table responsive style={{ marginBottom: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: "18%" }}>Block</th>
                    <th style={{ width: "30%" }}>Mode A — Declared</th>
                    <th style={{ width: "30%" }}>Mode B — Verified</th>
                    <th style={{ width: "22%", textAlign: "center" }}>Gap Result</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Block 1 — Inventory */}
                  <tr>
                    <td>
                      <strong>1 — Inventory</strong>
                      <div style={{ ...mutedStyle, fontSize: 11 }}>AI asset registry</div>
                    </td>
                    <td>
                      {block1Results
                        ? `${block1Derived.declared_ai_asset_count ?? "N/A"} assets declared`
                        : <span style={mutedStyle}>—</span>}
                    </td>
                    <td>
                      {block1Results ? (
                        <>
                          {block1Derived.discovered_ai_asset_count ?? "N/A"} found
                          {block1Derived.shadow_ai_asset_count > 0
                            ? `, ${block1Derived.shadow_ai_asset_count} shadow (unregistered)`
                            : ""}
                        </>
                      ) : <span style={mutedStyle}>—</span>}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <ScoreChip result={block1SliceResult || null} />
                    </td>
                  </tr>

                  {/* Block 2 — Governance */}
                  <tr>
                    <td>
                      <strong>2 — Govern</strong>
                      <div style={{ ...mutedStyle, fontSize: 11 }}>Policy and oversight</div>
                    </td>
                    <td>
                      {block2Results ? "Policies attested" : <span style={mutedStyle}>—</span>}
                    </td>
                    <td>
                      <span style={mutedStyle}>Mode B — coming in Phase 2</span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <ScoreChip result={block2SliceResult || null} />
                    </td>
                  </tr>

                  {/* Block 3 — Monitoring */}
                  <tr>
                    <td>
                      <strong>3 — Monitor</strong>
                      <div style={{ ...mutedStyle, fontSize: 11 }}>Log coverage and review</div>
                    </td>
                    <td>
                      {block3Results ? "Monitoring attested" : <span style={mutedStyle}>—</span>}
                    </td>
                    <td>
                      <span style={mutedStyle}>Mode B — coming in Phase 2</span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <ScoreChip result={block3SliceResult || null} />
                    </td>
                  </tr>

                  {/* Block 4 — Incident Response */}
                  <tr>
                    <td>
                      <strong>4 — Respond</strong>
                      <div style={{ ...mutedStyle, fontSize: 11 }}>IR plan and drills</div>
                    </td>
                    <td>
                      {block4Results ? "Incident response attested" : <span style={mutedStyle}>—</span>}
                    </td>
                    <td>
                      <span style={mutedStyle}>Mode B — coming in Phase 2</span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <ScoreChip result={block4SliceResult || null} />
                    </td>
                  </tr>
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* ------------------------------------------------------------------ */}
      {/* Demand signal coverage — only after run                             */}
      {/* ------------------------------------------------------------------ */}
      {hasDemandSignals ? (
        <Row>
          <Col md="12">
            <Card>
              <CardBody>
                <h4 style={{ marginBottom: 6 }}>Insurer Demand Signal Coverage</h4>
                <p style={{ ...mutedStyle, marginBottom: 16, fontSize: 13 }}>
                  Which signals are clear vs. have gaps across all assessed blocks.
                </p>
                <Row>
                  {DEMAND_SIGNAL_ORDER.filter((code) => mergedSignals[code]).map((code) => {
                    const { label, has_gaps, affected_finding_ids } = mergedSignals[code];
                    const chipColor = has_gaps ? "#ff5b5b" : "#2BFD82";
                    const chipBg = has_gaps ? "#2b000011" : "#0d2b1a11";
                    return (
                      <Col md="4" key={code} style={{ marginBottom: 12 }}>
                        <div style={{
                          border: `1.5px solid ${chipColor}`,
                          borderRadius: 8,
                          padding: "16px 20px",
                          background: chipBg,
                          height: "100%",
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <strong style={{ fontSize: 14 }}>{label}</strong>
                            <Badge color={has_gaps ? "danger" : "success"} pill>
                              {has_gaps ? "GAPS" : "CLEAR"}
                            </Badge>
                          </div>
                          <div style={{ ...mutedStyle, fontSize: 11 }}>{code}</div>
                          {affected_finding_ids.length > 0 ? (
                            <div style={{ ...mutedStyle, fontSize: 11, marginTop: 8 }}>
                              {affected_finding_ids.length} finding{affected_finding_ids.length !== 1 ? "s" : ""} in scope
                            </div>
                          ) : null}
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Pre-run empty state                                                 */}
      {/* ------------------------------------------------------------------ */}
      {!hasRun && (
        <Row>
          <Col md="12">
            <div style={{ textAlign: "center", padding: "40px 0", color: "#555" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>◎</div>
              <div style={{ fontSize: 15, marginBottom: 8 }}>No assessment data yet</div>
              <div style={{ fontSize: 13, color: "#444" }}>
                Click <strong>Run Assessment</strong> above to evaluate all four governance blocks.
              </div>
            </div>
          </Col>
        </Row>
      )}

    </div>
  );
};

export default AIGovernanceOverview;
