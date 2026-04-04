"use client";

import type { HRTConsultationState } from "../lib/hrt-types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

export function HRTSummaryReport({ state }: { state: HRTConsultationState }) {
  return (
    <div className="space-y-4 print:text-xs print:space-y-2">
      <div className="border-b-2 border-navy-900 pb-2 mb-4">
        <h2 className="text-lg font-bold text-navy-900 print:text-base">
          HRT Initiation ePGD Consultation Record
        </h2>
        <p className="text-xs text-gray-500">Hormone Replacement Therapy for menopausal symptoms</p>
      </div>

      <SectionHeader>Patient Details</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Full Name" value={`${state.patient.firstName} ${state.patient.lastName}`} />
        <Row label="Date of Birth" value={state.patient.dateOfBirth} />
        <Row label="Age" value={state.patient.age ? `${state.patient.age} years` : "—"} />
        <Row label="NHS Number" value={state.patient.nhsNumber || "—"} />
      </div>

      <SectionHeader>Menopause Assessment</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Menopause Status" value={state.assessment.menopauseStatus || "—"} />
        <Row label="Last Menstrual Period" value={state.assessment.lastMenstrualPeriod || "—"} />
        <Row label="Years Post-Menopause" value={state.assessment.yearsPostmenopause ? `${state.assessment.yearsPostmenopause} years` : "—"} />
      </div>

      <SectionHeader>Symptom Score (Menopause Rating Scale)</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Hot Flushes" value={state.assessment.symptomScore.hotFlushes} />
        <Row label="Night Sweats" value={state.assessment.symptomScore.nightSweats} />
        <Row label="Vaginal Dryness" value={state.assessment.symptomScore.vaginDryness} />
        <Row label="Mood Disturbance" value={state.assessment.symptomScore.moodDisturbance} />
        <Row label="Sleep Problems" value={state.assessment.symptomScore.sleepProblem} />
        <Row label="Joint/Muscle Pain" value={state.assessment.symptomScore.jointMuscPain} />
        <Row label="Total Score" value={state.assessment.symptomScore.totalScore} />
      </div>

      <SectionHeader>Medical History & Contraindications</SectionHeader>
      <CounsellingGrid
        items={[
          ["Undiagnosed vaginal bleeding", state.medicalHistory.undiagnosedVaginalBleeding],
          ["Current breast cancer", state.medicalHistory.currentBreastCancer],
          ["Recent breast cancer (within 5y)", state.medicalHistory.recentBreastCancer],
          ["Active liver disease", state.medicalHistory.activeLiverDisease],
          ["Active VTE/DVT/PE", state.medicalHistory.activeVTE],
          ["Untreated endometrial hyperplasia", state.medicalHistory.untreatEndometrialHyperplasia],
          ["Family history breast cancer", state.medicalHistory.familyHistBreastCancer],
          ["BMI >30", state.medicalHistory.bmiOver30],
          ["Migraine with aura", state.medicalHistory.migraineWithAura],
          ["History of VTE/DVT/PE", state.medicalHistory.historyVTE],
        ]}
      />

      <SectionHeader>Current Medications</SectionHeader>
      <div className="space-y-1.5">
        <Row label="Other hormonal therapies" value={state.medications.otherHormones || "None"} />
        <Row label="Other medications" value={state.medications.otherMedications || "None"} />
        <Row label="Allergies" value={state.medications.allergies || "NKDA"} />
      </div>

      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={state.alerts} />

      {state.doseRecommendation && (
        <>
          <SectionHeader>HRT Recommendation</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Medicine" value={state.doseRecommendation.medicine} />
            <Row label="HRT Type" value={state.hrtSelection.hrtType || "—"} />
            <Row label="Oestrogen Route" value={state.hrtSelection.oestroaddressRoute || "—"} />
            <Row label="Dose Recommendation" value={state.doseRecommendation.dose} />
          </div>
        </>
      )}

      <SectionHeader>Counselling & Patient Education</SectionHeader>
      <CounsellingGrid
        items={[
          ["Benefits vs. risks discussed", state.counselling.benefitsVsRisks],
          ["3-month trial period", state.counselling.threeMonthTrial],
          ["Breakthrough bleeding explained", state.counselling.breakthroughBleeding],
          ["Transdermal advantages", state.counselling.transdermalAdvantage],
          ["Breast awareness counselled", state.counselling.breastAwareness],
          ["Annual review arranged", state.counselling.annualReview],
          ["Lifestyle advice provided", state.counselling.lifeStyleAdvice],
          ["Follow-up scheduled", state.counselling.followUpArranged],
        ]}
      />

      <PharmacistDeclaration
        pgdName="HRT Initiation"
        pharmacistName={state.summary.pharmacistName}
        pharmacistGPhC={state.summary.pharmacistGPhC}
        pharmacyName={state.summary.pharmacyName}
      />

      {state.summary.clinicalNotes && (
        <>
          <SectionHeader>Additional Clinical Notes</SectionHeader>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">{state.summary.clinicalNotes}</p>
        </>
      )}

      <ReportFooter pgdName="HRT Initiation" />
    </div>
  );
}
