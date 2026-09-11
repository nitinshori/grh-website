"use client";
import type { ThrushConsultationState } from "../lib/thrush-types";
import { PGD_VERSION_LABEL } from "../lib/thrush-types";
import { getSupplyDetails } from "../lib/thrush-clinical-logic";
import { SectionHeader, Row, AlertSummary, CounsellingGrid, PharmacistDeclaration, ReportFooter } from "../../shared/components/SummaryReportShell";

function formatDate(iso: string): string {
  if (!iso) return "(not recorded)";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB");
}

const REFERRED_LABELS: Record<string, string> = {
  gp: "GP",
  "sexual-health": "Sexual health service",
  other: "Other",
};

export function ThrushSummaryReport({ state }: { state: ThrushConsultationState }) {
  const stopped = state.alerts.some((a) => a.severity === "stop");
  const supply = getSupplyDetails(state.medicineSelection.medicineChoice);
  const dash = "(not recorded)";
  return (
    <div className="space-y-4 print:text-xs print:space-y-2">
      <div className="border-b-2 border-navy-900 pb-2 mb-4">
        <h2 className="text-lg font-bold text-navy-900 print:text-base">Vaginal Thrush ePGD Consultation Record</h2>
        <p className="text-xs text-gray-500">Uncomplicated vulvovaginal candidiasis treatment</p>
        <p className="text-[10px] text-gray-400">{PGD_VERSION_LABEL}</p>
      </div>
      <SectionHeader>Patient Details</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Full Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
        <Row label="Date of birth" value={formatDate(state.patient.dateOfBirth)} />
        <Row label="Age" value={state.patient.age !== null ? `${state.patient.age} years` : dash} />
        <Row label="Female confirmed" value={state.medicalHistory.femaleConfirmed ? "Yes" : "No"} />
        <Row label="Address" value={state.patient.address || dash} />
        <Row label="NHS Number" value={state.patient.nhsNumber || dash} />
        <Row label="GP" value={[state.patient.gpName, state.patient.gpPractice].filter(Boolean).join(", ") || dash} />
      </div>
      <SectionHeader>Consent</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Valid informed consent given" value={state.consent.informedConsentGiven ? "Yes" : "No"} />
        <Row label="ID verified" value={state.consent.idVerified ? `Yes${state.consent.idType ? ` (${state.consent.idType})` : ""}` : "No"} />
        <Row label="Aware this is a private service" value={state.consent.patientAwarePrivateService ? "Yes" : "No"} />
      </div>
      <SectionHeader>Clinical Presentation</SectionHeader>
      <CounsellingGrid items={[["Vulval itching", state.assessment.vulvalItching], ["Vulval soreness", state.assessment.vulvalSoreness], ["Thick white discharge", state.assessment.thickWhiteDischarge], ["Dyspareunia", state.assessment.dyspareunia], ["Dysuria", state.assessment.dysuria], ["Internal dysuria (exclusion)", state.assessment.dysuria && state.assessment.dysuriaType === "internal"], ["Dysuria with urinary frequency or urgency (exclusion)", state.assessment.dysuria && state.assessment.urinaryFrequencyOrUrgency], ["Lower abdominal pain (exclusion)", state.assessment.pelvicPain], ["Fever (exclusion)", state.assessment.fever], ["Systemic upset (exclusion)", state.assessment.systemicUpset], ["Blood-stained bleeding (exclusion)", state.assessment.bloodStainedDischarge], ["Vulval ulcers, sores or blisters (exclusion)", state.assessment.vulvalUlcers], ["Foul-smelling discharge (exclusion)", state.assessment.offensiveSmell]]} />
      <div className="mt-2 space-y-1.5">
        <Row label="Episodes in last 12 months" value={state.assessment.recurrentEpisodes !== null ? String(state.assessment.recurrentEpisodes) : dash} />
        <Row label="Symptom exclusions asked" value={state.assessment.exclusionsAsked ? "Yes, all asked and recorded" : "Not confirmed"} />
      </div>
      <SectionHeader>Medical History & Contraindications</SectionHeader>
      <CounsellingGrid items={[["First episode", state.medicalHistory.firstEpisode], ["Recurrent (4+ in 12 months or 2 in 6 months)", state.medicalHistory.recurrentThrush], ["Immunosuppression", state.medicalHistory.immunocompromised], ["Diabetes", state.medicalHistory.diabetes], ["Diabetes poorly controlled", state.medicalHistory.diabetesPoorlyControlled], ["Possible STI exposure or partner with STI", state.medicalHistory.stiExposure], ["Pregnancy", state.medicalHistory.pregnancy], ["Breastfeeding", state.medicalHistory.breastfeeding], ["Hypersensitivity to fluconazole/azoles", state.medicalHistory.azoleHypersensitivity], ["Hypersensitivity to clotrimazole/imidazoles", state.medicalHistory.imidazoleHypersensitivity], ["QT-prolonging interacting drugs", state.medications.qtDrugs], ["QT prolongation or arrhythmia history", state.medicalHistory.qtHistory], ["Severe hepatic impairment", state.medicalHistory.severeHepatic], ["Severe renal impairment", state.medicalHistory.severeRenal], ["Mild to moderate hepatic impairment", state.medicalHistory.mildModerateHepatic], ["Mild to moderate renal impairment", state.medicalHistory.mildModerateRenal], ["May not retain a pessary", state.medicalHistory.cannotRetainPessary], ["Warfarin/anticoagulant", state.medications.warfarin], ["Statins", state.medications.statins], ["Phenytoin", state.medications.phenytoin], ["Rifampicin", state.medications.rifampicin]]} />
      <div className="mt-2 space-y-1.5">
        <Row label="Exclusions and cautions asked" value={state.medicalHistory.exclusionsAsked ? "Yes, all asked and recorded" : "Not confirmed"} />
        {state.medications.otherMedications && <Row label="Other history and medicines" value={state.medications.otherMedications} />}
      </div>
      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={state.alerts} />
      <SectionHeader>Supply</SectionHeader>
      {stopped || !state.doseRecommendation || !supply ? (
        <div className="space-y-1.5">
          <Row label="Outcome" value={stopped ? "NOT SUPPLIED: exclusion criteria met. Patient advised and referred as recorded." : "No medicine selected"} />
          {stopped && (
            <>
              <Row label="Referred to" value={REFERRED_LABELS[state.exclusionOutcome.referredTo] || dash} />
              <Row label="Advice given and decision reached" value={state.exclusionOutcome.adviceGiven || dash} />
            </>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <Row label="Medicine" value={state.doseRecommendation.medicine} />
          <Row label="Brand" value={state.medicineSelection.brand || dash} />
          <Row label="Dose" value={state.doseRecommendation.dose} />
          <Row label="Form" value={supply.form} />
          <Row label="Route" value={supply.route} />
          <Row label="Quantity supplied" value={supply.quantity} />
          <Row label="Dosing Regimen" value={state.doseRecommendation.dosingRegimen || dash} />
          <Row label="Date and time of supply" value={`${formatDate(state.summary.consultationDate)} ${state.summary.consultationTime}`.trim()} />
          {state.medicineSelection.medicineChoice === "clotrimazole-pessary" && (
            <Row label="Able to insert pessary" value={state.medicineSelection.abilityConfirmed ? "Confirmed" : "Not confirmed"} />
          )}
        </div>
      )}
      <SectionHeader>Counselling</SectionHeader>
      <CounsellingGrid items={[["Typical symptoms explained", state.counselling.typicalSymptoms], ["Avoid irritants (douches, scented products, tight clothing)", state.counselling.avoidPerfumedProducts], ["Cotton underwear advised", state.counselling.cottonUnderwear], ["Complete treatment", state.counselling.completesTreatment], ["Resolves in 5 to 7 days; contact GP if persists or worsens", state.counselling.timelineToRelief], ["Avoid intercourse for at least 5 days (barrier damage)", state.counselling.avoidIntercourse], ["Pessary: insert with fingers, not applicator", state.counselling.insertWithFingers], ["Recurrence (4+ per year): contact GP", state.counselling.recurrenceAdvice], ["Yellow Card advice", state.counselling.yellowCardAdvice], ["PIL supplied", state.counselling.pilSupplied]]} />
      {state.summary.clinicalNotes && (
        <div className="mt-2 space-y-1.5">
          <Row label="Clinical notes and advice given" value={state.summary.clinicalNotes} />
        </div>
      )}
      {stopped ? (
        <>
          <SectionHeader>Practitioner</SectionHeader>
          <p className="text-xs text-gray-600 mb-2">The patient met one or more exclusion criteria and no medicine was supplied under this PGD. Advice given and the decision reached are recorded above.</p>
          <div className="space-y-1.5">
            <Row label="Name" value={state.summary.pharmacistName || dash} />
            <Row label="GPhC number" value={state.summary.pharmacistGPhC || dash} />
            <Row label="Pharmacy" value={state.summary.pharmacyName || dash} />
            <Row label="Date" value={formatDate(state.summary.consultationDate)} />
          </div>
        </>
      ) : (
        <PharmacistDeclaration pgdName="Vaginal Thrush" pharmacistName={state.summary.pharmacistName} pharmacistGPhC={state.summary.pharmacistGPhC} pharmacyName={state.summary.pharmacyName} />
      )}
      <ReportFooter pgdName="Vaginal Thrush" />
    </div>
  );
}
