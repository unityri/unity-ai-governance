const express = require("express");
const router = express.Router();
var Authorization = require("../auth/authorization");
var uploadSingleFile = require("../upload/Uploadfile");

require("../controllers/crons.controller");

var ModulesController = require("../controllers/modules.controller");
var CompanyController = require("../controllers/company.controller");
var ConnectionController = require("../controllers/connection.controller");
var PermissionController = require("../controllers/permissions.controller");
var RoleController = require("../controllers/roles.controller");
var UserController = require("../controllers/users.controller");
var FrameworkController = require("../controllers/frameworks.controller");
var ControlController = require("../controllers/controls.controller");
var CISControlController = require("../controllers/cisControls.controller");
var EventLogController = require("../controllers/eventLogs.controller");
var CISScanHeaderController = require("../controllers/cisScanHeaders.controller");
var CompanyComplianceControlController = require("../controllers/companyComplianceControls.controller");
var AssessmentController = require("../controllers/assessments.controller");
var SectionController = require("../controllers/sections.controller");
var QuestionController = require("../controllers/questions.controller");
var QuestionAnswerController = require("../controllers/questionAnswers.controller");
var SettingController = require("../controllers/setting.controller");
var AssessmentReportController = require("../controllers/assessmentReports.controller");
var ProjectController = require("../controllers/projects.controller");
var AttachmentController = require("../controllers/attachments.controller");
var CommentController = require("../controllers/comments.controller");
var ProjectHistories = require("../controllers/projecthistory.controller");
var TestController = require("../controllers/test.controller");
var DashboardController = require("../controllers/dashboard.controller");
var CronSchedulerController = require("../controllers/cronSchedulers.controller");
var WazuhIndexerController = require("../controllers/wazuhIndexers.controller")
var ConfigurationAssessmentController = require("../controllers/configurationAssessments.controller");
var AgentController = require("../controllers/agents.controller");
var HelpdeskSupportController = require("../controllers/helpdeskSupports.controller");
var OpenVASScanReportController = require("../controllers/openVASScanReports.controller");
var CronSchedulerErrorController = require("../controllers/cronSchedulerErrors.controller");
var NetSwitchThreatIntelController = require("../controllers/netSwitchThreatIntels.controller");
var NetswitchThreatIntelStatsController = require("../controllers/netswitchThreatIntelsStats.controller");
var CompliancePriorityController = require("../controllers/compliancePriorities.controller");
var ContactController = require("../controllers/contacts.controller");
var AIPromptController = require("../controllers/aiPrompts.controller");
var DSSBlock0Controller = require("../controllers/dssBlock0.controller");
var DSSBlock1Controller = require("../controllers/dssBlock1.controller");
var DSSBlock2Controller = require("../controllers/dssBlock2.controller");
var DSSBlock3Controller = require("../controllers/dssBlock3.controller");
var DSSBlock4Controller = require("../controllers/dssBlock4.controller");

// ** Auth
router.post("/users/login", UserController.loginUser);
router.post("/users/forgotpassword", UserController.forgotPassword);
router.post("/users/resetpassword", UserController.resetPassword);

router.post("/users/changePassword", Authorization, UserController.changePassword);
router.get("/users/profile", Authorization, UserController.getUserProfile);
router.put("/user/profile", Authorization, UserController.updateUserProfile);
router.get("/auth/role", Authorization, RoleController.getAuthUserRole);
router.get("/auth/role-permission", Authorization, PermissionController.getAllPermissions);

router.post("/users/isemailunique", UserController.checkIsEmailUnique);
router.post("/users/isusernameunique", UserController.checkIsUserUnique);

router.get("/users/email-exist", UserController.checkEmailExist);
router.get("/users/username-exist", UserController.checkUsernameExist);

// ** Modules
router.post("/modules", Authorization, ModulesController.createModule);
router.get("/modules", Authorization, ModulesController.getModules);
router.put("/modules", Authorization, ModulesController.updateModule);
router.get("/modules/:id", Authorization, ModulesController.getModule);
router.delete("/modules/:id", Authorization, ModulesController.removeModule);

// ** Permissions
router.post("/permissions", Authorization, PermissionController.createPermission);
router.get("/permissions", Authorization, PermissionController.getPermissions);
router.put("/permissions", Authorization, PermissionController.updatePermission);
router.get("/permissions/:id", Authorization, PermissionController.getPermission);
router.delete("/permissions/:id", Authorization, PermissionController.removePermission);
router.get("/get-permissions", Authorization, PermissionController.getAllPermissions);
router.get("/role-permissions", Authorization, PermissionController.getGroupModulePermissions);

// ** Users
router.post("/users", Authorization, UserController.createUser);
router.get("/users", Authorization, UserController.getUsers);
router.get("/users/:id", Authorization, UserController.getUser);
router.put("/users", Authorization, UserController.updateUser);
router.delete("/users/:id", Authorization, UserController.removeUser);

// ** Roles
router.post("/roles", Authorization, RoleController.createRole);
router.get("/roles", Authorization, RoleController.getRoles);
router.put("/roles", Authorization, RoleController.updateRole);
router.get("/roles/:id", Authorization, RoleController.getRole);
router.delete("/roles/:id", Authorization, RoleController.removeRole);

// ** Companies
router.post("/company", Authorization, CompanyController.createCompany);
router.put("/company", Authorization, CompanyController.updateCompany);
router.get("/company", Authorization, CompanyController.getCompanies);
router.get("/company/:id", Authorization, CompanyController.getCompany);
router.delete("/company/:id", Authorization, CompanyController.softDeleteCompany);

// ** Connections
router.post("/connection", Authorization, ConnectionController.createConnection);
router.put("/connection", Authorization, ConnectionController.updateConnection);
router.get("/connections", Authorization, ConnectionController.getConnectiones);
router.get("/connection/:id", Authorization, ConnectionController.getConnection);
router.delete("/connection/:id", Authorization, ConnectionController.softDeleteConnection);

// ** Frameworks
router.post("/frameworks", Authorization, FrameworkController.createFramework);
router.put("/frameworks", Authorization, FrameworkController.updateFramework);
router.get("/frameworks", Authorization, FrameworkController.getFrameworks);
router.get("/frameworks/:id", Authorization, FrameworkController.getFramework);
router.delete("/frameworks/:id", Authorization, FrameworkController.removeFramework);
router.get("/frameworks-dropdown", Authorization, FrameworkController.getDropdownFrameworks);
router.get("/compilance/frameworks", Authorization, FrameworkController.getFrameworks);
router.get("/compilance/frameworkswithids", Authorization, FrameworkController.getFrameworksWithIds);

// ** Controls
router.post("/controls", Authorization, ControlController.createControl);
router.put("/controls", Authorization, ControlController.updateControl);
router.get("/controls", Authorization, ControlController.getControls);
router.get("/controls/:id", Authorization, ControlController.getControl);
router.delete("/controls/:id", Authorization, ControlController.removeControl);
router.get("/controls-frameworks", Authorization, ControlController.getControlsByFrameworkId);

// ** CISControls
router.post("/cis-controls", Authorization, CISControlController.createCISControl);
router.put("/cis-controls", Authorization, CISControlController.updateCISControl);
router.get("/cis-controls", Authorization, CISControlController.getCISControls);
router.get("/cis-controls/:id", Authorization, CISControlController.getCISControl);
router.delete("/cis-controls/:id", Authorization, CISControlController.removeCISControl);
router.get("/cis-controls-with-frameworkIds", Authorization, CISControlController.getComplinceCISControl);

router.get("/cis-controls-import-icon", CISControlController.importIcons);

// ** CompanyComplianceControls
router.get("/company-compliance-controls", Authorization, CompanyComplianceControlController.getCompanyComplianceControls);
router.get("/company-compliance-controls/:id", Authorization, CompanyComplianceControlController.getCompanyComplianceControl);
router.post("/company-compliance-controls", Authorization, CompanyComplianceControlController.createCompanyComplianceControl);
router.put("/company-compliance-controls", Authorization, CompanyComplianceControlController.updateCompanyComplianceControl);
router.post("/company-compliance-controls-many", Authorization, CompanyComplianceControlController.updateManyCompanyComplianceControl);
router.delete("/company-compliance-controls/:id", Authorization, CompanyComplianceControlController.removeCompanyComplianceControl);
router.get("/company-compliance-controls-list", Authorization, CompanyComplianceControlController.getCompanyComplianceControlList);
router.post("/company-multiple-compliance-controls", Authorization, CompanyComplianceControlController.createCompanyComplianceControls);

// ** EventLogs
router.post("/event-logs", Authorization, EventLogController.createEventLog);
router.put("/event-logs", Authorization, EventLogController.updateEventLog);
router.get("/event-logs", Authorization, EventLogController.getEventLogs);
router.get("/event-logs/:id", Authorization, EventLogController.getEventLog);
router.delete("/event-logs/:id", Authorization, EventLogController.removeEventLog);

// ** CIS
router.get("/cis", Authorization, CISScanHeaderController.getCISScanHeaders);
router.get("/downloadfromstorage", Authorization, CISScanHeaderController.downloadFromStorage);

// ** CISScanHeaders
router.get("/cis-scan-headers", Authorization, CISScanHeaderController.getCISScanHeaders);
router.get("/s3-storage-file-download", Authorization, CISScanHeaderController.downloadFromStorage);

// ** Assessments
router.get("/assessments", Authorization, AssessmentController.getAssessments);
router.get("/assessments/:id", Authorization, AssessmentController.getAssessment);
router.post("/assessments", Authorization, AssessmentController.createAssessment);
router.put("/assessments", Authorization, AssessmentController.updateAssessment);
router.delete("/assessments/:id", Authorization, AssessmentController.removeAssessment);

// ** Sections
router.get("/sections", Authorization, SectionController.getSections);
router.get("/sections/:id", Authorization, SectionController.getSection);
router.post("/sections", Authorization, SectionController.createSection);
router.put("/sections", Authorization, SectionController.updateSection);
router.delete("/sections/:id", Authorization, SectionController.removeSection);
router.get("/section/byassessment", Authorization, SectionController.getSectionByAssessment);

// ** Questions
router.get("/questions", Authorization, QuestionController.getQuestions);
router.get("/questions/:id", Authorization, QuestionController.getQuestion);
router.post("/questions", Authorization, QuestionController.createQuestion);
router.put("/questions", Authorization, QuestionController.updateQuestion);
router.delete("/questions/:id", Authorization, QuestionController.removeQuestion);
router.put("/questions/bulk-order-update", Authorization, QuestionController.updateOrderMultipleListing);
router.get("/questionfilters", Authorization, QuestionController.getQuestionFilter);

// ** AssessmentReports
router.get("/assessment-reports", AssessmentReportController.getAssessmentReports);
router.get("/assessment-reports/:id", AssessmentReportController.getAssessmentReport);
router.post("/assessment-reports", AssessmentReportController.createAssessmentReport);
router.put("/assessment-reports", AssessmentReportController.updateAssessmentReport);
router.delete("/assessment-reports/:id", AssessmentReportController.removeAssessmentReport);

router.get("/assessment-reports-questions", QuestionController.getQuestionByAssessmentId);

router.post("/assessment-code-verification", AssessmentReportController.verifyAssessmentReport);
router.post("/assessment-report-pdf", AssessmentReportController.generateAssessmentReport);
router.post("/assessment-report-email", AssessmentReportController.sentAttachmentReportViaEmail);

// ** QuestionAnswers
router.get("/question-answers", Authorization, QuestionAnswerController.getQuestionAnswers);
router.get("/question-answers/:id", Authorization, QuestionAnswerController.getQuestionAnswer);
router.post("/question-answers", QuestionAnswerController.createQuestionAnswer);
router.put("/question-answers", QuestionAnswerController.updateQuestionAnswer);
router.delete("/question-answers/:id", Authorization, QuestionAnswerController.removeQuestionAnswer);

// ** Setting
router.get("/settings", Authorization, SettingController.getSettings);
router.get("/settings/:id", Authorization, SettingController.getSetting);
router.post("/settings", Authorization, SettingController.createSetting);
router.put("/settings", Authorization, SettingController.updateSetting);
router.get("/settings-slug/:slug", Authorization, SettingController.getSettingSlug);
router.delete("/settings/:id", Authorization, SettingController.removeSetting);
router.get("/app-settings", SettingController.getAppSettings);

// ** Project
router.post("/projects", Authorization, ProjectController.createProject);
router.get("/projects", Authorization, ProjectController.getProjects);
router.put("/projects", Authorization, ProjectController.updateProject);
router.get("/projects/:id", Authorization, ProjectController.getProject);
router.delete("/projects/:id", Authorization, ProjectController.removeProject);

// ** Attachments
router.post("/upload", Authorization, uploadSingleFile, AttachmentController.createAttachment);
router.get("/attachments", Authorization, AttachmentController.getAttachments);
router.put("/attachments", Authorization, AttachmentController.updateAttachment);
router.get("/attachments/:id", Authorization, AttachmentController.getAttachment);
router.delete("/attachments/:id", Authorization, AttachmentController.removeAttachment);

// ** Comments
router.post("/comments", Authorization, CommentController.createComment);
router.get("/comments", Authorization, CommentController.getComments);
router.put("/comments", Authorization, CommentController.updateComment);
router.get("/comments/:id", Authorization, CommentController.getComment);
router.delete("/comments/:id", Authorization, CommentController.removeComment);

// ** ProjectHistories
router.post("/project_histories", Authorization, ProjectHistories.createProjectHistory);
router.get("/project_histories", Authorization, ProjectHistories.getProjectHistories);
router.put("/project_histories", Authorization, ProjectHistories.updateProjectHistory);
router.get("/project_histories/:id", Authorization, ProjectHistories.getProjectHistory);
router.delete("/project_histories/:id", Authorization, ProjectHistories.removeProjectHistory);

router.post("/sms", AssessmentReportController.sendSMSPostment);

// ** ProjectHistories
router.post("/project_histories", Authorization, ProjectHistories.createProjectHistory);
router.get("/project_histories", Authorization, ProjectHistories.getProjectHistories);
router.put("/project_histories", Authorization, ProjectHistories.updateProjectHistory);
router.get("/project_histories/:id", Authorization, ProjectHistories.getProjectHistory);
router.delete("/project_histories/:id", Authorization, ProjectHistories.removeProjectHistory);

// ** CronScheduler
router.get("/cron-schedulers", Authorization, CronSchedulerController.getCronSchedulers);
router.post("/cron-schedulers", Authorization, CronSchedulerController.createCronScheduler);
router.put("/cron-schedulers", Authorization, CronSchedulerController.updateCronScheduler);
router.get("/cron-schedulers/alert-warning", Authorization, CronSchedulerController.getCronSchedulerAlertWarning);
router.get("/cron-schedulers/:id", Authorization, CronSchedulerController.getCronScheduler);
router.delete("/cron-schedulers/:id", Authorization, CronSchedulerController.softDeleteCronScheduler);

// ** Dashboard
router.get("/dashboard-widgets-order", Authorization, DashboardController.getDashboardWidgets);
router.post("/dashboard-widgets-order-update", Authorization, DashboardController.updateDashboardData);
router.put("/dashboard-widgets-update-toggle", Authorization, DashboardController.updateDashboardWidgetToggleUpdate);

router.get("/wazuh-indexer-severity-counts", Authorization, DashboardController.wazuhIndexerStatisticsData);
router.get("/wazuh-indexer-graph/filter", Authorization, DashboardController.filterWazuhIndexerStatisticsGraphData);
router.get("/incident-trend-wazuh-stats-graph/filter", Authorization, DashboardController.incidentTrendingWazuhIndexerStatsGraphData);
router.get("/configuration-assessment-stats-graph/filter", Authorization, DashboardController.configurationAssessmentStatsGraphData);
router.get("/openvas-scan-report-stats-graph/filter", Authorization, DashboardController.openVASScanReportStatsGraphData);
router.get("/netswitch-threat-intels-stats-count/filter", Authorization, DashboardController.getNetswitchThreatIntelsStatsCount);

// ** wazuh-indexer
router.post("/wazuh-indexer-statistic", Authorization, WazuhIndexerController.createWazuhIndexer);
router.get("/wazuh-indexer-statistic", Authorization, WazuhIndexerController.getWazuhIndexers);
router.put("/wazuh-indexer-statistic", Authorization, WazuhIndexerController.updateWazuhIndexer);
router.get("/wazuh-indexer-statistic/:id", Authorization, WazuhIndexerController.getWazuhIndexer);
router.delete("/wazuh-indexer-statistic/:id", Authorization, WazuhIndexerController.removeWazuhIndexer);
router.get('/incident-trending', WazuhIndexerController.getIncidentTrendingData);
router.get('/data/last-24-hours', WazuhIndexerController.getLast24HoursData);
// router.get("/wazuh-indexer/filter", Authorization, WazuhIndexerController.filterWazuhData);
// router.get("/wazuh-indexer/total", Authorization, WazuhIndexerController.wazuhIndexerStatisticsData);

// ** Configuration Assessments
router.get("/configuration-assessments", Authorization, ConfigurationAssessmentController.getConfigurationAssessments);
router.post("/configuration-assessments", Authorization, ConfigurationAssessmentController.createConfigurationAssessment);
router.put("/configuration-assessments", Authorization, ConfigurationAssessmentController.updateConfigurationAssessment);
router.get("/configuration-assessments/:id", Authorization, ConfigurationAssessmentController.getConfigurationAssessment);
router.delete("/configuration-assessments/:id", Authorization, ConfigurationAssessmentController.softDeleteConfigurationAssessment);

// ** Agents
router.get("/agents/status-count", Authorization, AgentController.getActiveAndInactiveAgentsCount);
router.get("/agents", Authorization, AgentController.getAgents);
router.post("/agents", Authorization, AgentController.createAgent);
router.put("/agents", Authorization, AgentController.updateAgent);
router.get("/agents/:id", Authorization, AgentController.getAgent);
router.delete("/agents/:id", Authorization, AgentController.softDeleteAgent);

// ** Helpdesk Supports
// router.get("/helpdesk-supports-filter/last-20-days",Authorization, HelpdeskSupportController.getLast20DaysData);
router.get("/helpdesk-graph-data", Authorization, HelpdeskSupportController.getHelpdeskSupportGraphData);
router.get("/helpdesk-supports", Authorization, HelpdeskSupportController.getHelpdeskSupports);
router.post("/helpdesk-supports", Authorization, HelpdeskSupportController.createHelpdeskSupport);
router.put("/helpdesk-supports", Authorization, HelpdeskSupportController.updateHelpdeskSupport);
router.get("/helpdesk-supports/:id", Authorization, HelpdeskSupportController.getHelpdeskSupport);
router.delete("/helpdesk-supports/:id", Authorization, HelpdeskSupportController.softDeleteHelpdeskSupport);

// ** OpenVAS Scan Results
router.post("/openvas-scan-reports/insert-multipal", Authorization, OpenVASScanReportController.insertMultipleOpenVASScanReport);
router.get("/openvas-scan-reports", Authorization, OpenVASScanReportController.getOpenVASScanReports);
router.post("/openvas-scan-reports", Authorization, OpenVASScanReportController.createOpenVASScanReport);
router.put("/openvas-scan-reports", Authorization, OpenVASScanReportController.updateOpenVASScanReport);
router.get("/openvas-scan-reports/:id", Authorization, OpenVASScanReportController.getOpenVASScanReport);
router.delete("/openvas-scan-reports/:id", Authorization, OpenVASScanReportController.softDeleteOpenVASScanReport);

// ** CronScheduler Errors
router.get("/cron-scheduler-errors", Authorization, CronSchedulerErrorController.getCronSchedulerErrors);
router.post("/cron-scheduler-errors", Authorization, CronSchedulerErrorController.createCronSchedulerError);
router.put("/cron-scheduler-errors", Authorization, CronSchedulerErrorController.updateCronSchedulerError);
router.get("/cron-scheduler-errors/:id", Authorization, CronSchedulerErrorController.getCronSchedulerError);
router.delete("/cron-scheduler-errors/:id", Authorization, CronSchedulerErrorController.softDeleteCronSchedulerError);

// ** NetSwitch Threat Intels
router.get("/netswitch-threat-intels",Authorization, NetSwitchThreatIntelController.getNetswitchThreatIntels);
router.post("/netswitch-threat-intels",Authorization, NetSwitchThreatIntelController.createNetswitchThreatIntel);
router.put("/netswitch-threat-intels",Authorization, NetSwitchThreatIntelController.updateNetSwitchThreatIntel);
router.get("/netswitch-threat-intels/:id",Authorization, NetSwitchThreatIntelController.getNetswitchThreatIntel);
router.post("/netswitch-threat-intels-createBulk",Authorization, NetSwitchThreatIntelController.createNetswitchThreatIntelBulk);
router.delete("/netswitch-threat-intels/:id",Authorization, NetSwitchThreatIntelController.softDeleteNetSwitchThreatIntel);
router.delete("/netswitch-threat-intels-deleteAll",Authorization, NetSwitchThreatIntelController.deleteManyNetSwitchThreatIntel);

// ** NetSwitch Threat Intels Stats
router.get("/netswitch-threat-intels-stats", Authorization, NetswitchThreatIntelStatsController.getNetswitchThreatIntelsStats);
router.post("/netswitch-threat-intels-stats", Authorization, NetswitchThreatIntelStatsController.createNetswitchThreatIntelStats);
router.put("/netswitch-threat-intels-stats", Authorization, NetswitchThreatIntelStatsController.updateNetSwitchThreatIntelStats);
router.get("/netswitch-threat-intels-stats/:id", Authorization, NetswitchThreatIntelStatsController.getNetswitchThreatIntelStats);
router.post("/netswitch-threat-intels-createBulk-stats", Authorization, NetswitchThreatIntelStatsController.createNetswitchThreatIntelBulkStats);
router.delete("/netswitch-threat-intels-stats/:id", Authorization, NetswitchThreatIntelStatsController.softDeleteNetSwitchThreatIntelStats);
router.delete("/netswitch-threat-intels-deleteAll-stats", Authorization, NetswitchThreatIntelStatsController.deleteManyNetSwitchThreatIntelStats);
router.delete("/netswitch-threat-intels-country-stats/filter", Authorization, NetswitchThreatIntelStatsController.getCountBasedOnCountryStats);

// ** Compliance Priority
router.get("/compliance-priorities", Authorization, CompliancePriorityController.getCompliancePriorities);
router.post("/compliance-priorities", Authorization, CompliancePriorityController.createCompliancePriority);
router.put("/compliance-priorities", Authorization, CompliancePriorityController.updateCompliancePriority);
router.get("/compliance-priorities/:id", Authorization, CompliancePriorityController.getCompliancePriority);
router.delete("/compliance-priorities/:id", Authorization, CompliancePriorityController.softDeleteCompliancePriority);
router.post("/company-compliance-priorities", Authorization, CompliancePriorityController.createCompanyCompliancesPriotity);

// ** AI Prompts
router.post("/ai-description-write", Authorization, AIPromptController.writeAiDescription);

// ** AI Governance DSS
router.post("/dss/block0/submit", Authorization, DSSBlock0Controller.submitBlock0);
router.post("/dss/block0/extract", Authorization, DSSBlock0Controller.extractBlock0);
router.post("/dss/block1/run", Authorization, DSSBlock1Controller.runBlock1);
router.post("/dss/block1/narrate", Authorization, DSSBlock1Controller.narrateBlock1);
router.post("/dss/block2/run", Authorization, DSSBlock2Controller.runBlock2);
router.post("/dss/block2/narrate", Authorization, DSSBlock2Controller.narrateBlock2);
router.post("/dss/block3/run", Authorization, DSSBlock3Controller.runBlock3);
router.post("/dss/block3/narrate", Authorization, DSSBlock3Controller.narrateBlock3);
router.post("/dss/block4/run", Authorization, DSSBlock4Controller.runBlock4);
router.post("/dss/block4/narrate", Authorization, DSSBlock4Controller.narrateBlock4);

router.post("/tool-solution-contact", Authorization, ContactController.toolSolutionContact);

module.exports = router;
