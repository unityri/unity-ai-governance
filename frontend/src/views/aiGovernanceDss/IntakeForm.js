import React, { useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardBody,
  Col,
  FormGroup,
  Input,
  Label,
  Row,
} from "reactstrap";

import Axios from "utility/AxiosConfig";
import { API_ENDPOINTS } from "utility/ApiEndPoints";

const mutedStyle = { color: "#9a9a9a" };
const cardTitleStyle = { marginBottom: 16 };

const initialQuestionnaire = {
  organization: {
    client_id: "",
    org_name: "",
    industry: "",
    organization_size: "mid_market",
    assessment_date: new Date().toISOString().slice(0, 10),
  },
  block1_inventory: {
    declared_ai_tools: [],
    inventory_last_updated_date: "",
    inventory_owner_name: "",
    shadow_ai_monitoring_enabled: false,
  },
  block2_governance: {
    ai_acceptable_use_policy_exists: false,
    ai_acceptable_use_policy_date: "",
    approved_ai_tools_list_exists: false,
    sensitive_data_classification_rules_documented: false,
    ai_approval_workflow_documented: false,
    ai_approval_named_approver: "",
    ai_approval_escalation_path: "",
    staff_with_ai_access_count: "",
    staff_with_training_authorization_count: "",
    vendor_register_exists: false,
  },
  block3_monitoring: {
    activity_logs_exist: false,
    hitl_approval_records_exist: false,
    audit_trail_format: "",
    audit_trail_reviewer_name: "",
    log_retention_months: "",
  },
  block4_incident_response: {
    ir_playbook_exists: false,
    chain_of_custody_procedure_documented: false,
    exposure_notification_process_documented: false,
    ir_named_owner: "",
  },
};

const initialDocuments = {
  inventory: { artifact_type: "approved_tools_list", file_name: "", doc_text: "" },
  governance: { artifact_type: "aup", file_name: "", doc_text: "" },
  monitoring: { artifact_type: "audit_logs", file_name: "", doc_text: "" },
  incident: { artifact_type: "ir_playbook", file_name: "", doc_text: "" },
};

const blockConfigs = [
  {
    key: "inventory",
    label: "Inventory",
    section: "block1_inventory",
    artifactOptions: [{ value: "approved_tools_list", label: "Approved tools list" }],
  },
  {
    key: "governance",
    label: "Governance Policy",
    section: "block2_governance",
    artifactOptions: [
      { value: "aup", label: "Acceptable use policy" },
      { value: "approved_tools_list", label: "Approved tools list" },
      { value: "vendor_register", label: "Vendor register" },
      { value: "training_records", label: "Training records" },
    ],
  },
  {
    key: "monitoring",
    label: "Monitoring",
    section: "block3_monitoring",
    artifactOptions: [{ value: "audit_logs", label: "Audit logs" }],
  },
  {
    key: "incident",
    label: "Incident Response",
    section: "block4_incident_response",
    artifactOptions: [{ value: "ir_playbook", label: "IR playbook" }],
  },
];

function deepMerge(base, overlay) {
  const next = { ...base };
  Object.keys(overlay || {}).forEach((key) => {
    if (
      overlay[key] &&
      typeof overlay[key] === "object" &&
      !Array.isArray(overlay[key]) &&
      next[key] &&
      typeof next[key] === "object" &&
      !Array.isArray(next[key])
    ) {
      next[key] = deepMerge(next[key], overlay[key]);
    } else {
      next[key] = overlay[key];
    }
  });
  return next;
}

function normalizePackage(questionnaire, documents) {
  const toNumber = (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? undefined : numberValue;
  };

  const packageBody = {
    ...questionnaire,
    block2_governance: {
      ...questionnaire.block2_governance,
      staff_with_ai_access_count: toNumber(questionnaire.block2_governance.staff_with_ai_access_count),
      staff_with_training_authorization_count: toNumber(questionnaire.block2_governance.staff_with_training_authorization_count),
    },
    block3_monitoring: {
      ...questionnaire.block3_monitoring,
      log_retention_months: toNumber(questionnaire.block3_monitoring.log_retention_months),
    },
  };

  Object.keys(packageBody).forEach((section) => {
    if (packageBody[section] && typeof packageBody[section] === "object" && !Array.isArray(packageBody[section])) {
      Object.keys(packageBody[section]).forEach((fieldName) => {
        if (packageBody[section][fieldName] === undefined) {
          delete packageBody[section][fieldName];
        }
      });
    }
  });

  packageBody.artifacts = Object.keys(documents)
    .filter((key) => documents[key].file_name)
    .map((key) => ({
      artifact_id: `ART-B0-${key.toUpperCase()}`,
      artifact_type: documents[key].artifact_type,
      file_name: documents[key].file_name,
      evidence_status: "provided",
    }));

  return packageBody;
}

const BooleanSelect = ({ value, onChange }) => (
  <Input type="select" value={String(Boolean(value))} onChange={(event) => onChange(event.target.value === "true")}>
    <option value="true">Yes</option>
    <option value="false">No</option>
  </Input>
);

const IntakeForm = () => {
  const [questionnaire, setQuestionnaire] = useState(initialQuestionnaire);
  const [documents, setDocuments] = useState(initialDocuments);
  const [extractedFields, setExtractedFields] = useState({});
  const [toolText, setToolText] = useState("[]");
  const [loadingExtract, setLoadingExtract] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const setField = (section, fieldName, value) => {
    setQuestionnaire((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [fieldName]: value,
      },
    }));
  };

  const setDocumentField = (blockKey, fieldName, value) => {
    setDocuments((current) => ({
      ...current,
      [blockKey]: {
        ...current[blockKey],
        [fieldName]: value,
      },
    }));
  };

  const handleFile = async (blockKey, file) => {
    if (!file) return;
    const docText = await file.text();
    setDocuments((current) => ({
      ...current,
      [blockKey]: {
        ...current[blockKey],
        file_name: file.name,
        doc_text: docText,
      },
    }));
  };

  const applyExtractedFields = (fields) => {
    if (fields.block1_inventory?.declared_ai_tools) {
      setToolText(JSON.stringify(fields.block1_inventory.declared_ai_tools, null, 2));
    }
    setQuestionnaire((current) => deepMerge(current, fields));
    setExtractedFields((current) => deepMerge(current, fields));
  };

  const extractBlock = async (blockKey) => {
    const documentPayload = documents[blockKey];
    setLoadingExtract(blockKey);
    setError("");

    try {
      const response = await Axios.post(API_ENDPOINTS.dss.block0Extract, {
        doc_text: documentPayload.doc_text,
        artifact_type: documentPayload.artifact_type,
      });
      const fields = response.data?.extracted_fields || {};
      applyExtractedFields(fields);
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || err?.message || "Unable to extract fields.");
    } finally {
      setLoadingExtract("");
    }
  };

  const submitIntake = async () => {
    setSubmitting(true);
    setError("");

    try {
      let declaredTools = [];
      if (toolText.trim()) {
        declaredTools = JSON.parse(toolText);
      }

      const questionnairePayload = normalizePackage({
        ...questionnaire,
        block1_inventory: {
          ...questionnaire.block1_inventory,
          declared_ai_tools: Array.isArray(declaredTools) ? declaredTools : [],
        },
      }, documents);

      const response = await Axios.post(API_ENDPOINTS.dss.block0Submit, {
        questionnaire: questionnairePayload,
        extracted_fields: extractedFields,
      });
      setResult(response.data?.intake_package || response.data);
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || err?.message || "Unable to submit intake.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="content">
      <Row>
        <Col md="12">
          <h2>AI Governance Intake</h2>
        </Col>
      </Row>

      {error ? (
        <Row>
          <Col md="12">
            <Alert color="danger">{error}</Alert>
          </Col>
        </Row>
      ) : null}

      <Row>
        <Col md="12">
          <Card>
            <CardBody>
              <h4 style={cardTitleStyle}>Organization</h4>
              <Row>
                <Col md="3">
                  <FormGroup>
                    <Label>Org name</Label>
                    <Input value={questionnaire.organization.org_name} onChange={(event) => setField("organization", "org_name", event.target.value)} />
                  </FormGroup>
                </Col>
                <Col md="3">
                  <FormGroup>
                    <Label>Industry</Label>
                    <Input type="select" value={questionnaire.organization.industry} onChange={(event) => setField("organization", "industry", event.target.value)}>
                      <option value="">Select</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Financial Services">Financial Services</option>
                      <option value="Technology">Technology</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Retail">Retail</option>
                      <option value="Public Sector">Public Sector</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="3">
                  <FormGroup>
                    <Label>Size tier</Label>
                    <Input type="select" value={questionnaire.organization.organization_size} onChange={(event) => setField("organization", "organization_size", event.target.value)}>
                      <option value="smb">SMB</option>
                      <option value="mid_market">Mid-market</option>
                      <option value="large">Large</option>
                      <option value="mega_enterprise">Mega-enterprise</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="3">
                  <FormGroup>
                    <Label>Assessment date</Label>
                    <Input type="date" value={questionnaire.organization.assessment_date} onChange={(event) => setField("organization", "assessment_date", event.target.value)} />
                  </FormGroup>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {blockConfigs.map((block) => (
        <Row key={block.key}>
          <Col md="12">
            <Card>
              <CardBody>
                <h4 style={cardTitleStyle}>{block.label}</h4>
                <Row>
                  <Col md="4">
                    <FormGroup>
                      <Label>Document</Label>
                      <Input type="file" accept=".pdf,.md,.markdown,application/pdf,text/markdown,text/plain" onChange={(event) => handleFile(block.key, event.target.files[0])} />
                    </FormGroup>
                  </Col>
                  <Col md="4">
                    <FormGroup>
                      <Label>Artifact type</Label>
                      <Input type="select" value={documents[block.key].artifact_type} onChange={(event) => setDocumentField(block.key, "artifact_type", event.target.value)}>
                        {block.artifactOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col md="4" style={{ display: "flex", alignItems: "center" }}>
                    <Button color="primary" disabled={loadingExtract === block.key || !documents[block.key].doc_text} onClick={() => extractBlock(block.key)}>
                      {loadingExtract === block.key ? "Extracting..." : "Extract fields with AI"}
                    </Button>
                  </Col>
                </Row>

                {block.key === "inventory" ? (
                  <>
                    <Row>
                      <Col md="12">
                        <FormGroup>
                          <Label>Declared tools</Label>
                          <Input type="textarea" rows="5" value={toolText} onChange={(event) => setToolText(event.target.value)} />
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row>
                      <Col md="4">
                        <FormGroup>
                          <Label>Inventory date</Label>
                          <Input type="date" value={questionnaire.block1_inventory.inventory_last_updated_date} onChange={(event) => setField("block1_inventory", "inventory_last_updated_date", event.target.value)} />
                        </FormGroup>
                      </Col>
                      <Col md="4">
                        <FormGroup>
                          <Label>Owner</Label>
                          <Input value={questionnaire.block1_inventory.inventory_owner_name} onChange={(event) => setField("block1_inventory", "inventory_owner_name", event.target.value)} />
                        </FormGroup>
                      </Col>
                      <Col md="4">
                        <FormGroup>
                          <Label>Shadow AI monitoring</Label>
                          <BooleanSelect value={questionnaire.block1_inventory.shadow_ai_monitoring_enabled} onChange={(value) => setField("block1_inventory", "shadow_ai_monitoring_enabled", value)} />
                        </FormGroup>
                      </Col>
                    </Row>
                  </>
                ) : null}

                {block.key === "governance" ? (
                  <>
                    <Row>
                      <Col md="3">
                        <FormGroup>
                          <Label>AUP</Label>
                          <BooleanSelect value={questionnaire.block2_governance.ai_acceptable_use_policy_exists} onChange={(value) => setField("block2_governance", "ai_acceptable_use_policy_exists", value)} />
                        </FormGroup>
                      </Col>
                      <Col md="3">
                        <FormGroup>
                          <Label>AUP date</Label>
                          <Input type="date" value={questionnaire.block2_governance.ai_acceptable_use_policy_date} onChange={(event) => setField("block2_governance", "ai_acceptable_use_policy_date", event.target.value)} />
                        </FormGroup>
                      </Col>
                      <Col md="3">
                        <FormGroup>
                          <Label>Approved tools</Label>
                          <BooleanSelect value={questionnaire.block2_governance.approved_ai_tools_list_exists} onChange={(value) => setField("block2_governance", "approved_ai_tools_list_exists", value)} />
                        </FormGroup>
                      </Col>
                      <Col md="3">
                        <FormGroup>
                          <Label>Data classification</Label>
                          <BooleanSelect value={questionnaire.block2_governance.sensitive_data_classification_rules_documented} onChange={(value) => setField("block2_governance", "sensitive_data_classification_rules_documented", value)} />
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row>
                      <Col md="3">
                        <FormGroup>
                          <Label>Approval workflow</Label>
                          <BooleanSelect value={questionnaire.block2_governance.ai_approval_workflow_documented} onChange={(value) => setField("block2_governance", "ai_approval_workflow_documented", value)} />
                        </FormGroup>
                      </Col>
                      <Col md="3">
                        <FormGroup>
                          <Label>Approver</Label>
                          <Input value={questionnaire.block2_governance.ai_approval_named_approver} onChange={(event) => setField("block2_governance", "ai_approval_named_approver", event.target.value)} />
                        </FormGroup>
                      </Col>
                      <Col md="3">
                        <FormGroup>
                          <Label>Escalation path</Label>
                          <Input value={questionnaire.block2_governance.ai_approval_escalation_path} onChange={(event) => setField("block2_governance", "ai_approval_escalation_path", event.target.value)} />
                        </FormGroup>
                      </Col>
                      <Col md="3">
                        <FormGroup>
                          <Label>Vendor register</Label>
                          <BooleanSelect value={questionnaire.block2_governance.vendor_register_exists} onChange={(value) => setField("block2_governance", "vendor_register_exists", value)} />
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row>
                      <Col md="6">
                        <FormGroup>
                          <Label>Staff with AI access</Label>
                          <Input type="number" min="0" value={questionnaire.block2_governance.staff_with_ai_access_count} onChange={(event) => setField("block2_governance", "staff_with_ai_access_count", event.target.value)} />
                        </FormGroup>
                      </Col>
                      <Col md="6">
                        <FormGroup>
                          <Label>Staff training authorization</Label>
                          <Input type="number" min="0" value={questionnaire.block2_governance.staff_with_training_authorization_count} onChange={(event) => setField("block2_governance", "staff_with_training_authorization_count", event.target.value)} />
                        </FormGroup>
                      </Col>
                    </Row>
                  </>
                ) : null}

                {block.key === "monitoring" ? (
                  <Row>
                    <Col md="3">
                      <FormGroup>
                        <Label>Logs</Label>
                        <BooleanSelect value={questionnaire.block3_monitoring.activity_logs_exist} onChange={(value) => setField("block3_monitoring", "activity_logs_exist", value)} />
                      </FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup>
                        <Label>HITL records</Label>
                        <BooleanSelect value={questionnaire.block3_monitoring.hitl_approval_records_exist} onChange={(value) => setField("block3_monitoring", "hitl_approval_records_exist", value)} />
                      </FormGroup>
                    </Col>
                    <Col md="2">
                      <FormGroup>
                        <Label>Audit trail</Label>
                        <Input value={questionnaire.block3_monitoring.audit_trail_format} onChange={(event) => setField("block3_monitoring", "audit_trail_format", event.target.value)} />
                      </FormGroup>
                    </Col>
                    <Col md="2">
                      <FormGroup>
                        <Label>Reviewer</Label>
                        <Input value={questionnaire.block3_monitoring.audit_trail_reviewer_name} onChange={(event) => setField("block3_monitoring", "audit_trail_reviewer_name", event.target.value)} />
                      </FormGroup>
                    </Col>
                    <Col md="2">
                      <FormGroup>
                        <Label>Retention months</Label>
                        <Input type="number" min="0" value={questionnaire.block3_monitoring.log_retention_months} onChange={(event) => setField("block3_monitoring", "log_retention_months", event.target.value)} />
                      </FormGroup>
                    </Col>
                  </Row>
                ) : null}

                {block.key === "incident" ? (
                  <Row>
                    <Col md="3">
                      <FormGroup>
                        <Label>IR playbook</Label>
                        <BooleanSelect value={questionnaire.block4_incident_response.ir_playbook_exists} onChange={(value) => setField("block4_incident_response", "ir_playbook_exists", value)} />
                      </FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup>
                        <Label>Chain of custody</Label>
                        <BooleanSelect value={questionnaire.block4_incident_response.chain_of_custody_procedure_documented} onChange={(value) => setField("block4_incident_response", "chain_of_custody_procedure_documented", value)} />
                      </FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup>
                        <Label>Notification process</Label>
                        <BooleanSelect value={questionnaire.block4_incident_response.exposure_notification_process_documented} onChange={(value) => setField("block4_incident_response", "exposure_notification_process_documented", value)} />
                      </FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup>
                        <Label>IR owner</Label>
                        <Input value={questionnaire.block4_incident_response.ir_named_owner} onChange={(event) => setField("block4_incident_response", "ir_named_owner", event.target.value)} />
                      </FormGroup>
                    </Col>
                  </Row>
                ) : null}
              </CardBody>
            </Card>
          </Col>
        </Row>
      ))}

      <Row>
        <Col md="12">
          <Card>
            <CardBody>
              <Button color="success" disabled={submitting} onClick={submitIntake}>
                {submitting ? "Submitting..." : "Submit intake"}
              </Button>
              {result ? (
                <pre style={{ marginTop: 16, whiteSpace: "pre-wrap", color: "#e8e8e8" }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              ) : (
                <p style={{ ...mutedStyle, marginTop: 16, marginBottom: 0 }}>No intake package submitted yet</p>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default IntakeForm;
