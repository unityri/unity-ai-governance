// ** Tool Config
import {
  wazuhKey,
  openVASKey,
  helpdeskSupportTicketKey,
  netswitchThreatIntelKey
} from "configs/toolConfig";

// ** PNG Icons
import dashboardIcon from "assets/img/icons/dashboard.png";
import discoveryIcon from "assets/img/icons/discovery.png";
import governanceIcon from "assets/img/icons/governance.png";
import toolsIcon from "assets/img/icons/tools.png";
import masterIcon from "assets/img/icons/master.png";
import settingIcon from "assets/img/icons/setting.png";

// ** Module Imports
import Dashboard from "views/dashboard/Dashboard";
import GlobalSetting from "views/global";
import UserProfile from "views/users/profile";
import CompanyProfile from "views/companies/profile";

import UserManagement from "views/users";
import AddUser from "views/users/add";
import EditUser from "views/users/edit";

import RoleManagement from "views/roles";
import ModulePermission from "views/roles/ModulePermission";

import CompanyList from "views/companies";
import AddCompany from "views/companies/add";
import EditCompany from "views/companies/edit";

import ConnectionManagement from "views/connections";
import AddConnection from "views/connections/add";
import EditConnection from "views/connections/edit";

import RiskAssessmentMethod from "views/ram";
import ComplianceBuilder from "views/CompilanceBuilders";
import ResilienceIndex from "views/resilienceIndex";
import AIGovernanceDSS from "views/aiGovernanceDss";
import AIGovernanceOverview from "views/aiGovernanceDss/Overview";
import IntakeForm from "views/aiGovernanceDss/IntakeForm";
import CVELookupTool from "views/cveLookupTool";
// import ComplianceLookupTool from "views/complianceLookupTool";

import EventLogList from "views/eventLogs";
import EventLogDetail from "views/eventLogs/detail";

import SectionsList from "views/section";
import AddSection from "views/section/AddSection";
import EditSection from "views/section/EditSection";

import QuestionsList from "views/questions";
import AddQuestion from "views/questions/AddQuestion";
import EditQuestion from "views/questions/EditQuestion";

import AssessmentList from "views/Assessment";
import AddAssessmentForm from "views/Assessment/add";
import EditAssessmentForm from "views/Assessment/edit";
import AssessmentFormDetail from "views/Assessment/detail";

import AddProject from "views/projects/AddProject";
import EditProject from "views/projects/EditProject";
import ProjectDetails from "views/ram/ProjectDetails";

import HelpdeskGraphs from "views/helpdesks";
import AssessmentReportList from "views/AssessmentReport";
import AssessmentReportDetail from "views/AssessmentReport/detail";

import VulnerabilityScanner from "views/vulnerability-scanner";
import SIEM from "views/SIEM";
import LogCollector from "views/LogCollector";
import SeverityGraph from "views/dashboard/wazuhGraph/SeverityGraph";

import CronSchedulerList from "views/cronSchedulers";
import AddCronScheduler from "views/cronSchedulers/add";
import EditCronScheduler from "views/cronSchedulers/edit";
import CronSchedulerAlertDetail from "views/cronSchedulers/cronAlertDetail";

import ConfigurationAssessmentChart from "views/configurationAssessments/configurationAssessmentChart";

import OpenVASScanReportList from "views/openVASScanReports";
import AddOpenVASScanReport from "views/openVASScanReports/add";
import EditOpenVASScanReport from "views/openVASScanReports/edit";

import NetswitchThreatIntelList from "views/netswitchThreatIntels";

// ** Constant
import {
  masterGroupPermissionId,
  rolesPermissionId,
  usersPermissionId,
  companiesPermissionId,
  eventLogPermissionId,

  discoveryGroupPermissionId,
  // sectionsPermissionId,
  // questionsPermissionId,
  assessmentFormsPermissionId,

  governanceGroupPermissionId,
  riskAssessmentPermissionId,
  complianceBuilderPermissionId,
  resilienceIndexPermissionId,
  helpdeskTicketPermissionId,

  toolsGroupPermissionId,
  cveLookupPermissionId,
  // complianceLookupPermissionId,
  vulnerabilityScannerPermissionId,
  siemPermissionId,
  logCollectorPermissionId,

  settingGroupPermissionId,
  connectionPermissionId,
  cronSchedulerPermissionId,
  openVasScanReportPermissionId
} from "utility/reduxConstant";


const routes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    mini: "D",
    // icon: "tim-icons icon-chart-pie-36",
    icon: "",
    imgIcon: dashboardIcon,
    layout: "/admin",
    component: (<Dashboard />)
  },
  {
    collapse: true,
    name: "DISCOVERY",
    mini: "DS",
    state: "DiscoveryCollapse",
    // customClass: "d-none",
    // icon: "tim-icons icon-zoom-split",
    icon: "",
    imgIcon: discoveryIcon,
    permissionId: discoveryGroupPermissionId,
    views: [
      {
        path: "/sections/add",
        name: "Add Sections",
        mini: "SE",
        layout: "/admin",
        component: (<AddSection />),
        permissionId: assessmentFormsPermissionId,
        redirect: true
      },
      {
        path: "/sections/edit/:id",
        name: "Edit Sections",
        mini: "SE",
        layout: "/admin",
        component: (<EditSection />),
        permissionId: assessmentFormsPermissionId,
        redirect: true
      },
      {
        path: "/sections",
        name: "Sections",
        mini: "SE",
        layout: "/admin",
        customClass: "d-none",
        component: (<SectionsList />),
        permissionId: assessmentFormsPermissionId
      },
      {
        path: "/questions/add",
        name: "Add Questions",
        mini: "QE",
        layout: "/admin",
        component: (<AddQuestion />),
        permissionId: assessmentFormsPermissionId,
        redirect: true
      },
      {
        path: "/questions/edit/:id",
        name: "Edit Question",
        mini: "QE",
        layout: "/admin",
        component: (<EditQuestion />),
        permissionId: assessmentFormsPermissionId,
        redirect: true
      },
      {
        path: "/questions",
        name: "Questions",
        mini: "QE",
        layout: "/admin",
        customClass: "d-none",
        component: (<QuestionsList />),
        permissionId: assessmentFormsPermissionId
      },
      {
        path: "/assessment-forms/detail/:id",
        name: "Assessment Form Detail",
        mini: "AF",
        layout: "/admin",
        component: (<AssessmentFormDetail />),
        permissionId: assessmentFormsPermissionId,
        redirect: true
      },
      {
        path: "/assessment-forms/add",
        name: "Add Assessment Form",
        mini: "AF",
        layout: "/admin",
        component: (<AddAssessmentForm />),
        permissionId: assessmentFormsPermissionId,
        redirect: true
      },
      {
        path: "/assessment-forms/edit/:id",
        name: "Edit Assessment Form",
        mini: "AF",
        layout: "/admin",
        component: (<EditAssessmentForm />),
        permissionId: assessmentFormsPermissionId,
        redirect: true
      },
      {
        path: "/assessment-forms",
        name: "Assessment Forms",
        mini: "AF",
        layout: "/admin",
        component: (<AssessmentList />),
        permissionId: assessmentFormsPermissionId
      },
      {
        path: "/assessment-reports/detail/:id",
        name: "Assessment Report Detail",
        mini: "AR",
        layout: "/admin",
        component: (<AssessmentReportDetail />),
        permissionId: assessmentFormsPermissionId,
        redirect: true
      },
      {
        path: "/assessment-reports/:id",
        name: "Assessment Reports",
        mini: "AR",
        layout: "/admin",
        component: (<AssessmentReportList />),
        permissionId: assessmentFormsPermissionId,
        redirect: true,
      }
    ]
  },
  {
    collapse: true,
    name: "Governance",
    mini: "GV",
    state: "GovernanceCollapse",
    // icon: "tim-icons icon-bank",
    icon: "",
    imgIcon: governanceIcon,
    permissionId: governanceGroupPermissionId,
    views: [
      {
        path: "/compliance-builder",
        name: "Compliance Builder",
        mini: "CB",
        layout: "/admin",
        customClass: "",
        component: (<ComplianceBuilder />),
        permissionId: complianceBuilderPermissionId,
      },
      {
        path: "/resilience-index",
        name: "Resilience Index",
        mini: "RI",
        layout: "/admin",
        customClass: "",
        component: (<ResilienceIndex />),
        permissionId: resilienceIndexPermissionId,
      },
      {
        path: "/risk-assessment",
        name: "Risk Assessment",
        mini: "RA",
        layout: "/admin",
        customClass: "",
        component: (<RiskAssessmentMethod />),
        permissionId: riskAssessmentPermissionId,
      },
      {
        path: "/project/add",
        name: "Add Project",
        mini: "PR",
        layout: "/admin",
        customClass: "",
        component: (<AddProject />),
        permissionId: riskAssessmentPermissionId,
        redirect: true,
      },
      {
        path: "/project/edit/:id",
        name: "Edit Project",
        mini: "PR",
        layout: "/admin",
        customClass: "",
        component: (<EditProject />),
        permissionId: riskAssessmentPermissionId,
        redirect: true,
      },
      {
        path: "/project-details/:id",
        name: "Project Details",
        mini: "PR",
        layout: "/admin",
        component: (<ProjectDetails />),
        permissionId: riskAssessmentPermissionId,
        redirect: true,
      },
      {
        path: "/helpdesk-graph-data",
        name: "Helpdesk Ticket",
        mini: "HT",
        layout: "/admin",
        customClass: "",
        component: (<HelpdeskGraphs />),
        toolId: helpdeskSupportTicketKey,
        permissionId: helpdeskTicketPermissionId
      }
    ]
  },
  {
    collapse: true,
    name: "AI Governance",
    mini: "AG",
    state: "AIGovernanceCollapse",
    icon: "",
    imgIcon: governanceIcon,
    views: [
      {
        path: "/ai-governance-intake",
        name: "Intake",
        mini: "IN",
        layout: "/admin",
        customClass: "",
        component: (<IntakeForm />),
      },
      {
        path: "/ai-governance-overview",
        name: "Overview",
        mini: "OV",
        layout: "/admin",
        customClass: "",
        component: (<AIGovernanceOverview />),
      },
      {
        path: "/ai-governance-dss",
        name: "DSS Detail",
        mini: "DS",
        layout: "/admin",
        customClass: "",
        component: (<AIGovernanceDSS />),
      },
    ],
  },
  {
    collapse: true,
    name: "TOOLS",
    mini: "TL",
    state: "ToolsCollapse",
    // icon: "tim-icons icon-settings",
    icon: "",
    imgIcon: toolsIcon,
    permissionId: toolsGroupPermissionId,
    views: [
      {
        path: "/cve-lookup",
        name: "CVE Lookup",
        mini: "CV",
        layout: "/admin",
        customClass: "",
        component: (<CVELookupTool />),
        permissionId: cveLookupPermissionId
      },
      // {
      //   path: "/compliance-lookup",
      //   name: "Compliance Lookup",
      //   mini: "CL",
      //   layout: "/admin",
      //   customClass: "",
      //   component: (<ComplianceLookupTool />),
      //   permissionId: complianceLookupPermissionId
      // },
      {
        path: "/vulnerability-scanner",
        name: "Vulnerability Scanner",
        mini: "VS",
        layout: "/admin",
        customClass: "",
        component: (<VulnerabilityScanner />),
        permissionId: vulnerabilityScannerPermissionId
      },
      {
        path: "/siem",
        name: "SIEM",
        mini: "SM",
        layout: "/admin",
        customClass: "",
        component: (<SIEM />),
        permissionId: siemPermissionId
      },
      {
        path: "/log-collector",
        name: "Log Collector",
        mini: "LC",
        layout: "/admin",
        customClass: "",
        component: (<LogCollector />),
        permissionId: logCollectorPermissionId
      }
    ]
  },
  {
    collapse: true,
    name: "Master",
    mini: "MS",
    state: "MasterCollapse",
    // icon: "tim-icons icon-settings-gear-63",
    icon: "",
    imgIcon: masterIcon,
    permissionId: masterGroupPermissionId,
    views: [
      {
        path: "/roles/permission/:id",
        name: "Role Module Permissions",
        mini: "RL",
        layout: "/admin",
        customClass: "d-none",
        component: (<ModulePermission />),
        permissionId: rolesPermissionId
      },
      {
        path: "/roles",
        name: "Roles",
        mini: "RL",
        layout: "/admin",
        customClass: "",
        component: (<RoleManagement />),
        permissionId: rolesPermissionId
      },
      {
        path: "/users/add",
        name: "Add User",
        mini: "UR",
        layout: "/admin",
        customClass: "",
        component: (<AddUser />),
        permissionId: usersPermissionId,
        redirect: true
      },
      {
        path: "/users/edit/:id",
        name: "Edit User",
        mini: "UR",
        layout: "/admin",
        customClass: "",
        component: (<EditUser />),
        permissionId: usersPermissionId,
        redirect: true
      },
      {
        path: "/users",
        name: "Users",
        mini: "UR",
        layout: "/admin",
        customClass: "",
        component: (<UserManagement />),
        permissionId: usersPermissionId
      },
      {
        path: "/companies/add",
        name: "Add Location",
        mini: "LN",
        layout: "/admin",
        customClass: "",
        component: (<AddCompany />),
        permissionId: companiesPermissionId,
        redirect: true
      },
      {
        path: "/companies/edit/:id",
        name: "Edit Location",
        mini: "LN",
        layout: "/admin",
        component: (<EditCompany />),
        permissionId: companiesPermissionId,
        customClass: "",
        redirect: true
      },
      {
        path: "/companies",
        name: "Locations",
        mini: "LN",
        layout: "/admin",
        component: (<CompanyList />),
        permissionId: companiesPermissionId
      },
      {
        path: "/event-logs/detail/:id",
        name: "Event Log Detail",
        mini: "EL",
        layout: "/admin",
        component: (<EventLogDetail />),
        permissionId: eventLogPermissionId,
        redirect: true
      },
      {
        path: "/event-logs",
        name: "Event Logs",
        mini: "EL",
        layout: "/admin",
        component: (<EventLogList />),
        permissionId: eventLogPermissionId
      }
    ]
  },
  {
    collapse: true,
    name: "SETTING",
    mini: "ST",
    state: "SETTINGSCollapse",
    // icon: "tim-icons icon-settings-gear-63",
    icon: "",
    imgIcon: settingIcon,
    permissionId: settingGroupPermissionId,
    views: [
      {
        path: "/connections/add",
        name: "Add Connections",
        mini: "CN",
        layout: "/admin",
        customClass: "",
        component: (<AddConnection />),
        permissionId: connectionPermissionId,
        redirect: true
      },
      {
        path: "/connections/edit/:id",
        name: "Edit Connections",
        mini: "CN",
        layout: "/admin",
        customClass: "",
        component: (<EditConnection />),
        permissionId: connectionPermissionId,
        redirect: true
      },
      {
        path: "/connections",
        name: "Connections",
        mini: "CN",
        layout: "/admin",
        component: (<ConnectionManagement />),
        permissionId: connectionPermissionId
      },
      {
        path: "/cron-schedulers/add",
        name: "Add Cron Scheduler",
        mini: "CS",
        layout: "/admin",
        customClass: "",
        component: (<AddCronScheduler />),
        permissionId: cronSchedulerPermissionId,
        redirect: true
      },
      {
        path: "/cron-schedulers/edit/:id",
        name: "Edit Cron Scheduler",
        mini: "CS",
        layout: "/admin",
        customClass: "",
        component: (<EditCronScheduler />),
        permissionId: cronSchedulerPermissionId,
        redirect: true
      },
      {
        path: "/cron-schedulers/alert-detail/:id",
        name: "Cron Scheduler Alert Detail",
        mini: "CS",
        layout: "/admin",
        customClass: "",
        component: (<CronSchedulerAlertDetail />),
        permissionId: cronSchedulerPermissionId,
        redirect: true
      },
      {
        path: "/cron-schedulers",
        name: "Cron Schedulers",
        mini: "CS",
        layout: "/admin",
        component: (<CronSchedulerList />),
        permissionId: cronSchedulerPermissionId
      },
      {
        path: "/openvas-scan-reports/add",
        name: "Add OpenVAS Scan Report",
        mini: "OS",
        layout: "/admin",
        customClass: "",
        component: (<AddOpenVASScanReport />),
        toolId: openVASKey,
        permissionId: openVasScanReportPermissionId,
        redirect: true
      },
      {
        path: "/openvas-scan-reports/edit/:id",
        name: "Edit OpenVAS Scan Report",
        mini: "OS",
        layout: "/admin",
        customClass: "",
        component: (<EditOpenVASScanReport />),
        toolId: openVASKey,
        permissionId: openVasScanReportPermissionId,
        redirect: true
      },
      {
        path: "/openvas-scan-reports",
        name: "OpenVAS Scan Reports",
        mini: "OS",
        layout: "/admin",
        component: (<OpenVASScanReportList />),
        toolId: openVASKey,
        permissionId: openVasScanReportPermissionId
      }
    ]
  },
  {
    path: "/profile",
    name: "Profile",
    mini: "P",
    icon: "tim-icons icon-single-02",
    layout: "/admin",
    customClass: "",
    component: (<UserProfile />),
    redirect: true
  },
  {
    path: "/company-profile",
    name: "Location Profile",
    mini: "LP",
    icon: "tim-icons icon-single-02",
    layout: "/admin",
    customClass: "",
    component: (<CompanyProfile />),
    redirect: true
  },
  {
    path: "/global-setting",
    name: "Global Setting",
    mini: "GS",
    icon: "tim-icons icon-chart-pie-36",
    layout: "/admin",
    component: (<GlobalSetting />),
    redirect: true
  },
  {
    path: "/level-severity-graph",
    name: "Level Severity Graph",
    mini: "LS",
    icon: "tim-icons icon-chart-pie-36",
    layout: "/admin",
    toolId: wazuhKey,
    component: (<SeverityGraph />),
    redirect: true
  },
  {
    path: "/configuration-assessment-chart",
    name: "Configuration Assessment Chart",
    mini: "CA",
    icon: "tim-icons icon-chart-pie-36",
    layout: "/admin",
    toolId: wazuhKey,
    component: (<ConfigurationAssessmentChart />),
    redirect: true
  },
  {
    path: "/netswitch-threat-intels",
    name: "Netswitch Threat Intels",
    mini: "TI",
    icon: "tim-icons icon-chart-pie-36",
    layout: "/admin",
    toolId: netswitchThreatIntelKey,
    component: (<NetswitchThreatIntelList />),
    redirect: true
  }
]

export default routes;
