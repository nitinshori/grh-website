"use client";

import type { MounjaroConsultationState } from "../lib/mounjaro-types";
import { COMORBIDITY_OPTIONS, PGD_VERSION_LABEL, DOSE_BY_STAGE } from "../lib/mounjaro-types";
import { getPercentWeightLost } from "../lib/mounjaro-clinical-logic";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

const NOT_RECORDED = "Not recorded";

const SUPPLY_TYPE_LABELS: Record<string, string> = {
  "new-start": "New start (2.5 mg titration dose)",
  continue: "Continuing the same dose",
  escalate: "Escalating to the next dose",
  reduce: "Reducing to a lower dose",
  restart: "Restarting after a break (re-titrated from 2.5 mg)",
};

export function MounjaroSummaryReport({ state }: { state: MounjaroConsultationState }) {
  const comorbidityLabels = state.weightAssessment.comorbidities.map(
    (id) => COMORBIDITY_OPTIONS.find((c) => c.id === id)?.label ?? id
  );
  const stopsExist = state.alerts.some((a) => a.severity === "stop");
  const percentLost = getPercentWeightLost(state);

  return (
    <div className="space-y-4 print:text-xs print:space-y-2">
      {/* Header */}
      <div className="border-b-2 border-navy-900 pb-2 mb-4">
        <h2 className="text-lg font-bold text-navy-900 print:text-base">
          Mounjaro (Tirzepatide) ePGD Consultation Record
        </h2>
        <p className="text-xs text-gray-500">Dual GIP/GLP-1 receptor agonist for weight management</p>
        <p className="text-xs text-gray-500">{PGD_VERSION_LABEL}. Supplied via PGD.</p>
      </div>

      {/* Patient Details */}
      <SectionHeader>Patient Details</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Full Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
        <Row label="Date of Birth" value={state.patient.dateOfBirth} />
        <Row label="Age" value={state.patient.age ? `${state.patient.age} years` : NOT_RECORDED} />
        <Row label="Address" value={state.patient.address || NOT_RECORDED} />
        <Row label="NHS Number" value={state.patient.nhsNumber || NOT_RECORDED} />
        <Row label="GP Name" value={state.patient.gpName || NOT_RECORDED} />
        <Row label="GP Practice" value={state.patient.gpPractice || NOT_RECORDED} />
      </div>

      {/* Weight Assessment */}
      <SectionHeader>Weight Assessment & BMI</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Height" value={state.weightAssessment.height ? `${state.weightAssessment.height} cm` : NOT_RECORDED} />
        <Row label="Weight" value={state.weightAssessment.weight ? `${state.weightAssessment.weight} kg` : NOT_RECORDED} />
        <Row label="BMI" value={state.weightAssessment.bmi ? `${state.weightAssessment.bmi.toFixed(1)} kg/m²` : NOT_RECORDED} />
        <Row label="BMI at start of treatment" value={state.weightAssessment.startingBMI !== null ? `${state.weightAssessment.startingBMI.toFixed(1)} kg/m²` : NOT_RECORDED} />
        <Row label="BMI Category" value={state.weightAssessment.bmiCategory || NOT_RECORDED} />
        <Row
          label="Weight-Related Comorbidities"
          value={comorbidityLabels.length > 0 ? comorbidityLabels.join(", ") : "None"}
        />
        <Row
          label="Target weight agreed"
          value={state.weightAssessment.targetWeight ? `${state.weightAssessment.targetWeight} kg` : NOT_RECORDED}
        />
        <Row
          label="Initial assessment completed (face to face)"
          value={state.weightAssessment.initialAssessmentCompleted ? "Yes" : "No"}
        />
        <Row
          label="Willing to follow reduced-calorie diet and increase activity"
          value={state.weightAssessment.lifestylePlanAgreed ? "Yes" : "No"}
        />
      </div>

      {/* Medical History */}
      <SectionHeader>Medical History & Contraindications</SectionHeader>
      <div className="space-y-1.5 text-xs">
        <p className="font-semibold text-navy-900">Exclusion Criteria Checked:</p>
        <CounsellingGrid
          items={[
            ["Hypersensitivity to tirzepatide or excipients", state.medicalHistory.hypersensitivity],
            ["Personal MTC history", state.medicalHistory.personalMTCHistory],
            ["Family MTC history", state.medicalHistory.familyMTCHistory],
            ["MEN 2", state.medicalHistory.men2],
            ["History of pancreatitis", state.medicalHistory.pancreatitisHistory],
            ["Severe GI disease / gastroparesis", state.medicalHistory.severeGIDisease],
            ["Current cholelithiasis or cholecystitis", state.medicalHistory.gallbladderDisease],
            ["Cholecystectomy within 3 months", state.medicalHistory.recentCholecystectomy],
            ["Type 1 diabetes", state.medicalHistory.type1Diabetes],
            ["Diabetic retinopathy", state.medicalHistory.diabeticRetinopathy],
            ["Severe renal impairment / ESRD", state.medicalHistory.severeRenalImpairment],
            ["Severe hepatic impairment", state.medicalHistory.severeHepaticImpairment],
            ["Heart failure with reduced EF", state.medicalHistory.heartFailureReducedEF],
            ["Active eating disorder", state.medicalHistory.activeEatingDisorder],
            ["Currently pregnant", state.medicalHistory.pregnant],
            ["Currently breastfeeding", state.medicalHistory.breastfeeding],
            ["Planning pregnancy", state.medicalHistory.planningPregnancy],
            ["No effective contraception (childbearing potential)", state.medicalHistory.noEffectiveContraception],
            ["Not suitable (clinical judgement)", state.medicalHistory.notSuitableClinicalJudgement],
          ]}
        />
        <p className="font-semibold text-navy-900 mt-3">Cautions & Monitoring:</p>
        <CounsellingGrid
          items={[
            ["Mild to moderate renal impairment", state.medicalHistory.renalImpairment],
            ["Untreated or unassessed endocrine cause of obesity (caution: GP informed)", state.medicalHistory.endocrineObesity],
            ["Suicidal ideation / severe mental illness", state.medicalHistory.depression],
            ["Psychiatric oversight absent with concern", state.medicalHistory.mentalHealthOversightAbsent],
            ["Pre-existing increased heart rate", state.medicalHistory.preExistingTachycardia],
            ["Thyroid disease", state.medicalHistory.thyroidDisease],
          ]}
        />
      </div>

      {/* Medications */}
      <SectionHeader>Current Medications & Interactions</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Insulin-treated diabetes" value={state.medications.takesInsulin ? "Yes (excluded)" : "No"} />
        {state.medications.takesInsulin && (
          <Row label="Insulin details" value={state.medications.insulinDetails || NOT_RECORDED} />
        )}
        <Row
          label="Other GLP-1 agonist or insulin secretagogue (any indication)"
          value={state.medications.currentGLP1 ? "Yes (excluded)" : "No"}
        />
        {state.medications.currentGLP1 && (
          <Row label="Details" value={state.medications.otherGLP1Details || NOT_RECORDED} />
        )}
        <Row
          label="T2DM on metformin / SGLT2 inhibitor / DPP-4 inhibitor only"
          value={state.medications.t2dmOralAgents ? "Yes (GP to be informed)" : "No"}
        />
        <Row label="Warfarin user" value={state.medications.warfarinUser ? "Yes" : "No"} />
        <Row label="Oral contraceptives" value={state.medications.takesOralContraceptives ? "Yes" : "No"} />
        <Row label="Oral HRT" value={state.medications.takesHRT ? "Yes" : "No"} />
        <Row label="Other medications" value={state.medications.otherMedications || "None recorded"} />
        <Row label="Allergies" value={state.medications.allergies || "NKDA"} />
      </div>

      {/* Clinical Alerts */}
      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={state.alerts} />

      {/* Medicine supplied, or the outcome when a stop exists (never print a
          supply over a STOP: adversarial review, 11 Sep 2026) */}
      {(stopsExist || !state.doseRecommendation || !state.doseSelection.dose) && (
        <>
          <SectionHeader>Outcome</SectionHeader>
          <div className="space-y-1.5">
            <Row
              label="Medicine"
              value={stopsExist ? "NOT SUPPLIED: exclusion criteria met (see clinical alerts above)" : "No medicine supplied"}
            />
            <Row label="Nature of supply" value={SUPPLY_TYPE_LABELS[state.doseSelection.supplyType] ?? NOT_RECORDED} />
          </div>
        </>
      )}
      {!stopsExist && state.doseRecommendation && state.doseSelection.dose && (
        <>
          <SectionHeader>Medicine Supplied</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Name and brand" value={state.doseRecommendation.medicine} />
            <Row label="Form" value="Solution for injection in a multi-dose pre-filled pen (KwikPen), POM" />
            <Row label="Dose" value={state.doseRecommendation.dose} />
            <Row label="Frequency and route" value={state.doseRecommendation.frequency || NOT_RECORDED} />
            <Row label="Quantity supplied" value={state.doseRecommendation.duration || NOT_RECORDED} />
            <Row label="Dosing Regimen" value={state.doseRecommendation.dosingRegimen || NOT_RECORDED} />
            <Row label="Reason" value={state.doseRecommendation.reason} />
            <Row
              label="Nature of supply"
              value={SUPPLY_TYPE_LABELS[state.doseSelection.supplyType] ?? NOT_RECORDED}
            />
            <Row
              label="Weeks on current or previous dose"
              value={
                state.doseSelection.weeksAtCurrentDose !== null
                  ? `${state.doseSelection.weeksAtCurrentDose} weeks`
                  : NOT_RECORDED
              }
            />
            <Row
              label="Dose the patient has been on"
              value={state.doseSelection.previousDose ? DOSE_BY_STAGE[state.doseSelection.previousDose] ?? NOT_RECORDED : "Not applicable (new start or restart)"}
            />
            {state.doseSelection.initialWeight !== null && (
              <Row
                label="Weight at initiation"
                value={`${state.doseSelection.initialWeight} kg${percentLost !== null ? ` (${percentLost.toFixed(1)}% lost)` : ""}`}
              />
            )}
            {state.doseSelection.treatmentStartDate && (
              <Row label="Treatment start date" value={state.doseSelection.treatmentStartDate} />
            )}
            {state.doseSelection.monthsOnMaxToleratedDose !== null && (
              <Row label="Months on maximum tolerated dose" value={`${state.doseSelection.monthsOnMaxToleratedDose} months`} />
            )}
            {state.doseSelection.continuationDecision.trim() && (
              <Row label="Decision on continuation (5% rule)" value={state.doseSelection.continuationDecision} />
            )}
            <Row label="More than 2 doses missed" value={state.doseSelection.missedMoreThanTwoDoses ? "Yes (reduce and re-escalate)" : "No"} />
            <Row label="Batch number" value={state.doseSelection.batchNumber || NOT_RECORDED} />
            <Row label="Expiry date" value={state.doseSelection.expiryDate || NOT_RECORDED} />
            <Row label="Injection site advised" value={state.doseSelection.injectionSite || NOT_RECORDED} />
            <Row label="Date of supply" value={state.summary.consultationDate} />
          </div>
        </>
      )}

      {/* Counselling */}
      <SectionHeader>Counselling & Patient Education</SectionHeader>
      <CounsellingGrid
        items={[
          ["Injection technique explained", state.counselling.injectionTechnique],
          ["Injection site rotation", state.counselling.injectionSiteRotation],
          ["Storage: refrigerate 2 to 8°C; after first use up to 30 days unrefrigerated at not above 30°C, then discard", state.counselling.storageRefrigeration],
          ["Missed dose protocol", state.counselling.missedDoseProtocol],
          ["GI side effects and fluid intake discussed", state.counselling.giSideEffects],
          ["Warning symptoms needing urgent attention", state.counselling.warningSymptoms],
          ["Pancreatitis warning signs", state.counselling.pancreatitisWarning],
          ["Gallbladder warning signs", state.counselling.gallbladderWarning],
          ["Retinopathy monitoring", state.counselling.retinopathyWarning],
          ["Oral medicine, contraceptive and HRT absorption", state.counselling.oralMedicationAbsorption],
          ["General anaesthesia / deep sedation advice", state.counselling.anaesthesiaWarning],
          ["Pen device use", state.counselling.penDeviceUse],
          ["Follow-up schedule arranged (6-month 5% review)", state.counselling.followUpSchedule],
          ["Diet & exercise advice", state.counselling.dietExerciseAdvice],
          ["PIL and written lifestyle advice given", state.counselling.writtenInfoProvided],
          ["GP informed", state.counselling.gpInformed],
        ]}
      />

      {/* Pharmacist Declaration */}
      {stopsExist ? (
        <>
          <SectionHeader>Pharmacist Declaration</SectionHeader>
          <p className="text-xs text-gray-600 mb-4">
            I confirm that this consultation was conducted in accordance with the
            Patient Group Direction for Mounjaro (Tirzepatide), that exclusion
            criteria applied, that no medicine was supplied, and that the patient
            was given the advice recorded above.
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
          pgdName="Mounjaro (Tirzepatide)"
          pharmacistName={state.summary.pharmacistName}
          pharmacistGPhC={state.summary.pharmacistGPhC}
          pharmacyName={state.summary.pharmacyName}
        />
      )}

      {/* Clinical Notes */}
      {state.summary.clinicalNotes && (
        <>
          <SectionHeader>Additional Clinical Notes</SectionHeader>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">{state.summary.clinicalNotes}</p>
        </>
      )}

      {/* Footer */}
      <ReportFooter pgdName="Mounjaro (Tirzepatide)" />
    </div>
  );
}
