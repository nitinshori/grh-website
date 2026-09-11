"use client";

import type { AsthmaConsultationState } from "../lib/asthma-types";
import { PGD_STRAPLINE } from "../lib/asthma-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";
import {
  SALBUTAMOL_RECOMMENDATION,
  prednisoloneRecommendation,
  acuteSevereFeatures,
} from "../lib/asthma-clinical-logic";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface AsthmaSummaryReportProps {
  state: AsthmaConsultationState;
  alerts: ClinicalAlert[];
  doseRecommendations: DoseRecommendation[];
}

const REFERRED_LABELS: Record<string, string> = {
  "999": "Emergency: 999 or A&E",
  "urgent-care": "Same-day GP or urgent care",
  gp: "GP (routine review)",
  other: "Other",
};

const EVIDENCE_LABEL: Record<string, string> = {
  "gp-record": "GP record",
  "repeat-prescription": "Repeat prescription for an asthma inhaler",
  "action-plan": "Asthma action plan",
  none: "None (previous inhaler use only)",
};

export function AsthmaSummaryReport({
  state,
  alerts,
  doseRecommendations,
}: AsthmaSummaryReportProps) {
  const ms = state.medicineSupply;
  const o = state.observations;
  const pred = prednisoloneRecommendation(state);
  const severe = acuteSevereFeatures(state);
  // A stop anywhere means nothing was supplied under this PGD: the supply
  // section and the "no exclusion criteria applied" declaration must not
  // print (adversarial review, 11 Sep 2026).
  const hasStop = alerts.some((a) => a.severity === "stop");
  const supplied = !hasStop && doseRecommendations.length > 0;
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 print:border-0 print:shadow-none print:p-0 text-xs print:text-[11px]">
      {/* Header */}
      <div className="text-center mb-6 pb-4 border-b border-gray-300">
        <h2 className="text-base font-bold text-navy-900 mb-1 print:text-sm">
          Asthma Rescue: Consultation Record
        </h2>
        <p className="text-gray-500">
          Get Real Health ePGD Consultation Tool
        </p>
        <p className="text-gray-500">{PGD_STRAPLINE}</p>
      </div>

      {/* Patient Details */}
      <SectionHeader>Patient Details</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Row
            label="Name"
            value={`${state.patient.firstName} ${state.patient.lastName}`}
          />
          <Row label="Date of Birth" value={state.patient.dateOfBirth} />
          <Row label="Age" value={state.patient.age ? `${state.patient.age} years` : "Not recorded"} />
          <Row label="Address" value={state.patient.address || "Not recorded"} />
        </div>
        <div>
          <Row label="GP Name" value={state.patient.gpName || "Not recorded"} />
          <Row label="GP Practice" value={state.patient.gpPractice || "Not recorded"} />
          <Row label="NHS Number" value={state.patient.nhsNumber || "Not recorded"} />
        </div>
      </div>

      {/* Consultation Details */}
      <SectionHeader>Consultation Details</SectionHeader>
      <Row label="Date" value={state.summary.consultationDate} />
      <Row label="Time" value={state.summary.consultationTime} />
      <Row label="Informed consent given" value={state.consent.informedConsentGiven ? "Yes" : "No"} />

      {/* Clinical Alerts */}
      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={alerts} />

      {/* Asthma Assessment */}
      <SectionHeader>Asthma Assessment</SectionHeader>
      <Row
        label="Confirmed asthma diagnosis"
        value={state.assessment.hasExistingDiagnosis ? "Yes" : "No"}
      />
      <Row
        label="Diagnosis documented by"
        value={EVIDENCE_LABEL[state.assessment.diagnosisEvidence] || "Not recorded"}
      />
      <Row
        label="Normally uses SABA"
        value={state.assessment.normallyUsesSABA ? "Yes" : "No"}
      />
      <Row
        label="Current SABA medication"
        value={state.assessment.currentSABAMedication || "Not recorded"}
      />
      <Row
        label="Preventer (inhaled corticosteroid) therapy"
        value={state.assessment.onPreventer ? `Yes${state.assessment.preventerDetails ? `: ${state.assessment.preventerDetails}` : ""}` : "None recorded"}
      />
      <Row
        label="Rescue courses needed in last 12 months (any source)"
        value={state.assessment.rescueCoursesLast12Months !== null ? String(state.assessment.rescueCoursesLast12Months) : "Not recorded"}
      />
      <Row
        label="Rescue courses supplied under this PGD in last 12 months"
        value={state.assessment.pgdRescueCoursesLast12Months !== null ? String(state.assessment.pgdRescueCoursesLast12Months) : "Not recorded"}
      />
      <Row label="Acute exacerbation with bronchospasm" value={state.assessment.acuteExacerbation ? "Yes" : "No"} />
      <Row label="Can use inhaler or willing to use spacer" value={state.assessment.canUseInhalerOrSpacer ? "Yes" : "No"} />
      <Row label="Incomplete response to salbutamol" value={state.assessment.incompleteResponseToSalbutamol ? "Yes" : "No"} />
      <Row label="Able to take oral medication" value={state.assessment.ableToTakeOralMedication ? "Yes" : "No"} />
      <Row label="Reason for supply" value={state.assessment.reasonForSupply || "Not recorded"} />
      <Row
        label="Frequent use (>3 days/week)"
        value={state.assessment.frequentUse ? "Yes" : "No"}
      />
      <Row
        label="Nocturnal symptoms"
        value={state.assessment.nocturnalSymptoms ? "Yes" : "No"}
      />
      <Row
        label="Activity limitation"
        value={state.assessment.activityLimitation ? "Yes" : "No"}
      />

      {/* Observations */}
      <SectionHeader>Observations</SectionHeader>
      <Row label="SpO2 on air" value={o.spo2 !== null ? `${o.spo2}%` : "Not recorded"} />
      <Row label="Respiratory rate" value={o.respiratoryRate !== null ? `${o.respiratoryRate}/min` : "Not recorded"} />
      <Row label="Heart rate" value={o.heartRate !== null ? `${o.heartRate}/min` : "Not recorded"} />
      <Row label="PEF (% of best or predicted)" value={o.pefMeasured ? (o.pefPercentBest !== null ? `${o.pefPercentBest}%` : "Not recorded") : "Peak flow meter not available"} />
      <Row label="Able to complete sentences in one breath" value={o.canCompleteSentences ? "Yes" : "No"} />
      <Row label="Acute severe or life-threatening features" value={severe.length ? severe.join(", ") : "None"} />

      {/* Medical History */}
      <SectionHeader>Medical History</SectionHeader>
      <Row label="Prednisolone exclusions and cautions asked and answered" value={state.medicalHistory.exclusionsAskedAndAnswered ? "Yes" : "Not recorded"} />
      <Row label="Allergy status confirmed with patient" value={state.redFlags.allergyStatusConfirmed ? "Yes" : "Not recorded"} />
      <Row
        label="Other respiratory conditions"
        value={state.medicalHistory.otherRespiratoryConditions || "None reported"}
      />
      <Row label="Allergies" value={state.medicalHistory.allergies || "None reported"} />
      <Row label="Other conditions" value={state.medicalHistory.otherConditions || "None"} />
      <CounsellingGrid
        items={[
          ["Cardiovascular disease", state.medicalHistory.cardiovascularDisease],
          ["Diabetes", state.medicalHistory.diabetes],
          ["Hyperthyroidism", state.medicalHistory.hyperthyroidism],
          ["Hypokalaemia", state.medicalHistory.hypokalaemia],
          ["Pregnant", state.medicalHistory.pregnancy],
          ["Breastfeeding", state.medicalHistory.breastfeeding],
          ["Untreated systemic infection", state.medicalHistory.systemicInfectionUntreated],
          ["Live vaccine during treatment", state.medicalHistory.liveVaccineDuringTreatment],
          ["Severe hepatic dysfunction", state.medicalHistory.severeHepaticDysfunction],
          ["Uncontrolled hypertension / cardiac disease", state.medicalHistory.uncontrolledHypertensionOrCardiac],
          ["Osteoporosis", state.medicalHistory.osteoporosis],
          ["Peptic ulcer / GI upset", state.medicalHistory.pepticUlcer],
          ["Psychiatric history", state.medicalHistory.psychiatricHistory],
          ["Renal impairment", state.medicalHistory.renalImpairment],
          ["Hypertension", state.medicalHistory.hypertension],
          ["Infection", state.medicalHistory.infection],
        ]}
      />

      {/* Red Flags */}
      <SectionHeader>Exclusions and Red Flags</SectionHeader>
      <Row label="Salbutamol / beta-2 agonist hypersensitivity" value={state.redFlags.salbutamolAllergy ? "Yes: STOP (salbutamol)" : "No"} />
      <Row label="Prednisolone / corticosteroid hypersensitivity" value={state.redFlags.prednisoloneAllergy ? "Yes: STOP (prednisolone)" : "No"} />
      <Row
        label="No documented diagnosis (first presentation)"
        value={state.redFlags.noExistingDiagnosis ? "Yes: STOP" : "No"}
      />
      <Row
        label="Not used salbutamol before"
        value={state.redFlags.neverUsedSalbutamolBefore ? "Yes: caution" : "No"}
      />
      <Row
        label="Increasing use"
        value={state.redFlags.increasingUse ? "Yes: Refer" : "No"}
      />
      <Row
        label="Nocturnal wakenings"
        value={state.redFlags.nocturnalWakenings ? "Yes: Refer" : "No"}
      />
      <Row
        label="Activity limitation"
        value={state.redFlags.activityLimitation ? "Yes: Refer" : "No"}
      />

      {hasStop && (
        <>
          <SectionHeader>Outcome: Not Supplied</SectionHeader>
          <Row label="Medicine supplied" value="None. Exclusion criteria met; see clinical alerts above." />
          <Row label="Referred to" value={REFERRED_LABELS[state.exclusionOutcome.referredTo] || "Not recorded"} />
          <Row label="Advice given and decision reached" value={state.exclusionOutcome.adviceGiven || "Not recorded"} />
        </>
      )}

      {/* Medicine Supply */}
      {supplied && (
        <>
          <SectionHeader>Medicine Supply &amp; Dosing</SectionHeader>
          {ms.salbutamol100mcgPMDI && (
            <>
              <Row label="Medicine" value={SALBUTAMOL_RECOMMENDATION.medicine} />
              <Row label="Brand" value={ms.salbutamolBrand || "Not recorded"} />
              <Row label="Dose" value={SALBUTAMOL_RECOMMENDATION.dose} />
              <Row label="Frequency" value={SALBUTAMOL_RECOMMENDATION.frequency || ""} />
              <Row label="Quantity" value={SALBUTAMOL_RECOMMENDATION.duration || ""} />
              <Row label="PIL supplied" value={ms.salbutamolPilSupplied ? "Yes" : "No"} />
            </>
          )}
          {ms.prednisolone5mg && pred && (
            <>
              <Row label="Medicine" value={pred.medicine} />
              <Row label="Brand" value={ms.prednisoloneBrand || "Not recorded"} />
              <Row label="Dose" value={pred.dose} />
              <Row label="How to take" value={pred.frequency || ""} />
              <Row label="Course and quantity" value={`${pred.duration}; ${ms.prednisoloneTablets ?? "?"} tablets supplied`} />
              <Row label="Tablet count checked against dose" value={ms.tabletCountChecked ? "Yes" : "No"} />
              <Row label="PIL supplied" value={ms.prednisolonePilSupplied ? "Yes" : "No"} />
            </>
          )}
          <Row label="Supplied under" value={PGD_STRAPLINE} />
        </>
      )}

      {/* Counselling Provided */}
      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ["Reliever only, not preventer", state.counselling.relieverNotPreventer],
          [
            "Inhaler technique demonstrated, technique sheet given",
            state.counselling.inhalerTechniqueDemonstration,
          ],
          ["Spacer use recommended", state.counselling.spacerUse],
          ["Emergency care if no improvement within 15 to 30 minutes", state.counselling.emergencyIfNoImprovement],
          ["Salbutamol limits: 8 puffs in 24 hours; more often than 4-hourly or most days is same-day GP; 10 puffs via spacer without relief is 999", state.counselling.salbutamolLimits],
          ["Prednisolone: full 5 day course (40mg each morning), do not stop abruptly", state.counselling.prednisoloneFullCourse],
          ["Prednisolone: with food if stomach upset", state.counselling.prednisoloneWithFood],
          ["Prednisolone: diabetes glucose monitoring", state.counselling.prednisoloneDiabetes],
          ["Prednisolone: inform providers of steroid use", state.counselling.prednisoloneOtherMedicines],
          ["Immediate attention: severe breathlessness, chest pain, confusion, exhaustion", state.counselling.seekImmediateAttention],
          [
            "Seek urgent care if not resolving",
            state.counselling.seekUrgentCareIfNotResolving,
          ],
          ["Review action plan and triggers with GP after recovery", state.counselling.reviewActionPlan],
          ["Maintenance therapy to be optimised", state.counselling.maintenanceOptimised],
        ]}
      />
      <p className="text-gray-600 mt-2">
        Adverse effects: report suspected adverse effects via the Yellow Card scheme (https://yellowcard.mhra.gov.uk) and inform the GP as appropriate.
      </p>

      {/* Clinical Notes */}
      {state.summary.clinicalNotes && (
        <>
          <SectionHeader>Clinical Notes</SectionHeader>
          <p className="text-gray-600 whitespace-pre-wrap">
            {state.summary.clinicalNotes}
          </p>
        </>
      )}

      {/* Pharmacist Declaration */}
      {hasStop ? (
        <>
          <SectionHeader>Pharmacist Declaration</SectionHeader>
          <p className="text-xs text-gray-600 mb-4">
            I confirm that this consultation was conducted in accordance with the Patient Group Direction for Asthma Rescue,
            that exclusion criteria applied, that no medicine was supplied under the PGD, and that the advice given and the
            decision reached are recorded above.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Pharmacist name</p>
              <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{state.summary.pharmacistName || ""}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">GPhC number</p>
              <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{state.summary.pharmacistGPhC || ""}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Pharmacy</p>
              <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{state.summary.pharmacyName || ""}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Signature</p>
              <div className="border-b border-gray-300 min-h-[2rem]" />
            </div>
          </div>
        </>
      ) : (
        <PharmacistDeclaration
          pgdName="Asthma Rescue"
          pharmacistName={state.summary.pharmacistName}
          pharmacistGPhC={state.summary.pharmacistGPhC}
          pharmacyName={state.summary.pharmacyName}
        />
      )}

      <ReportFooter pgdName="Asthma Rescue" />
    </div>
  );
}
