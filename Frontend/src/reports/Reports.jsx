import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import useDocumentTitle from "../hooks/useDocumentTitle";
import PageHeader from "../components/common/PageHeader";
import Tabs from "../components/common/Tabs";
import ReportRange from "./ReportRange";
import { PRESETS } from "./reportUtils";
import RevenueTab from "./tabs/RevenueTab";
import PatientsTab from "./tabs/PatientsTab";
import AdmissionsTab from "./tabs/AdmissionsTab";
import LabTab from "./tabs/LabTab";
import PharmacyTab from "./tabs/PharmacyTab";

const TABS = [
  { key: "revenue", label: "Revenue" },
  { key: "patients", label: "Patients" },
  { key: "admissions", label: "Admissions" },
  { key: "lab", label: "Laboratory" },
  { key: "pharmacy", label: "Pharmacy" },
];

export default function Reports() {
  useDocumentTitle("Reports");
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === params.get("tab")) ? params.get("tab") : "revenue";
  const [range, setRange] = useState(() => PRESETS[2].get()); // last 30 days

  const common = { from: range.from, to: range.to };

  return (
    <>
      <PageHeader title="Reports" subtitle="Revenue, patients, admissions, laboratory and pharmacy" />

      <ReportRange value={range} onChange={setRange} />
      <Tabs tabs={TABS} active={tab} onChange={(key) => setParams({ tab: key })} />

      {tab === "revenue" && <RevenueTab {...common} />}
      {tab === "patients" && <PatientsTab {...common} />}
      {tab === "admissions" && <AdmissionsTab {...common} />}
      {tab === "lab" && <LabTab {...common} />}
      {tab === "pharmacy" && <PharmacyTab {...common} />}
    </>
  );
}