"use client";

import type { ECConsultationState } from "../lib/ec-types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface ECSummaryReportProps {
  state: ECConsultationState;
}

export function ECSummaryReport({ state }: ECSummaryReportProps) {
  const { patient, clinicalAssessment, medicalHistory, medications, medicineSelection, counselling, summary, alerts, doseRecommendation } = state;

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white text-navy-900 print:p-6">
      {/* Header */}
      <div className="text-center mb-6 pb-4 border-b border-gray-300">
        <h1 className="text-xl font-bold">Get Real Health</h1>
        <p className="text-sm text-gray-600 mt-1">
          Emergency Contraception Consultation Record
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Patient Group Direction: Emergency Hormonal Contraception
        </p>
      </div>

      {/* Patient Details */}
      <SectionHeader>Patient Details</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
        <Row label="Age" value={patient.age ? `${patient.age} years` : "—"} />
        <Row label="Date of birth" value={patient.dateOfBirth || "—"} />
        <Row
          label="NHS number"
          value={patient.nhsNumber || "Not provided"}
        />
        <Row label="GP name" value={patient.gpName || "Not provided"} />
        <Row label="GP practice" value={patient.gpPractice || "Not provided"} />
      </div>

      {/* Consultation Details */}
      <SectionHeader>Consultation Details</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Row
          label="Consultation date"
          value={summary.consultationDate || "—"}
        />
        <Row
          label="Consultation time"
          value={summary.consultationTime || "—"}
        />
        <Row label="Pharmacy" value={summary.pharmacyName || "—"} />
      </div>

      {/* Clinical Assessment */}
      <SectionHeader>Clinical Assessment</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Row
          label="Date of UPSI"
          value={clinicalAssessment.upsiDate || "—"}
        />
        <Row
          label="Time of UPSI"
          value={clinicalAssessment.upsiTime || "—"}
        />
        <Row
          label="Hours since UPSI"
          value={
            clinicalAssessment.hoursSinceUPSI !== null
              ? `${Math.round(clinicalAssessment.hoursSinceUPSI * 10) / 10} hours`
              : "—"
          }
        />
        <Row
          label="Last menstrual period"
          value={clinicalAssessment.lastMenstrualPeriod || "—"}
        />
        <Row
          label="Menstrual cycle"
          value={
            clinicalAssessment.cycleRegular
              ? `Regular (${clinicalAssessment.cycleLength ?? "—"} days)`
              : "Irregular"
          }
        />
        <Row
          label="Contraception"
          value={clinicalAssessment.regularContraception ? clinicalAssessment.contraceptionType : "None / not regular"}
        />
        {clinicalAssessment.regularContraception && (
          <Row
            label="Contraception failure type"
            value={clinicalAssessment.contraceptionFailureType || "—"}
          />
        )}
        <Row
          label="Pregnancy symptoms"
          value={clinicalAssessment.currentPregnancySymptoms ? "Yes" : "No"}
        />
      </div>

      {/* Medical History */}
      <SectionHeader>Medical History</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Row
          label="Pregnancy test result"
          value={
            medicalHistory.pregnancyTestResult === "positive"
              ? "Positive"
              : medicalHistory.pregnancyTestResult === "negative"
                ? "Negative"
                : "Not done"
          }
        />
        <Row
          label="Breastfeeding"
          value={medicalHistory.breastfeeding ? "Yes" : "No"}
        />
        <Row
          label="Severe hepatic impairment"
          value={medicalHistory.severeHepatic ? "Yes" : "No"}
        />
        <Row
          label="Severe asthma"
          value={medicalHistory.severeAsthma ? "Yes" : "No"}
        />
        <Row
          label="Previous ectopic pregnancy"
          value={medicalHistory.previousEctopic ? "Yes" : "No"}
        />
        <Row
          label="Crohn's disease"
          value={medicalHistory.crohnsDisease ? "Yes" : "No"}
        />
        <Row
          label="Porphyria"
          value={medicalHistory.porphyria ? "Yes" : "No"}
        />
      </div>

      {/* Medications */}
      <SectionHeader>Current Medications & Interactions</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Row
          label="Enzyme-inducing drugs"
          value={
            medications.takesEnzymeInducers
              ? medications.enzymeInducerDetails || "Yes"
              : "No"
          }
        />
        <Row
          label="Previous ulipristal use (this cycle)"
          value={medications.takesUPA ? "Yes" : "No"}
        />
        <Row
          label="Current hormonal contraception"
          value={
            medications.currentHormonalContraception
              ? medications.hormonalContraceptionType || "Yes"
              : "No"
          }
        />
      </div>

      {/* Clinical Alerts */}
      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={alerts} />

      {/* Medicine Selection */}
      <SectionHeader>Medicine Selection & Dosing</SectionHeader>
      {medicineSelection.medicine ? (
        <div className="space-y-2 mb-4">
          <Row
            label="Medicine selected"
            value={
              medicineSelection.medicine === "levonorgestrel"
                ? "Levonorgestrel (Postinor 2 / generic)"
                : "Ulipristal (EllaOne)"
            }
          />
          <Row label="Dose" value={medicineSelection.dose || "—"} />
          {medicineSelection.doubleDosingRequired && (
            <Row
              label="Double-dosing"
              value="Yes — enzyme inducers present"
            />
          )}
          {medicineSelection.pharmacistOverride && (
            <Row
              label="Pharmacist override"
              value={medicineSelection.overrideReason || "—"}
            />
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-500 mb-4">
          No medicine supplied — patient referred (see clinical alerts).
        </p>
      )}

      {/* Recommendation */}
      {doseRecommendation && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">
          <p className="font-semibold mb-1">Clinical Recommendation:</p>
          <p>{doseRecommendation.reason}</p>
        </div>
      )}

      {/* Counselling */}
      <SectionHeader>Counselling & Follow-up Advice</SectionHeader>
      <CounsellingGrid
        items={[
          ["When to take the medicine", counselling.timingAdvice],
          ["What to do if vomiting occurs", counselling.vomitingAdvice],
          [
            "Advised not 100% effective — backup contraception needed",
            counselling.notGuaranteed,
          ],
          [
            "Advised to take pregnancy test if period >7 days late",
            counselling.pregnancyTestAdvice,
          ],
          [
            "Future contraception options discussed",
            counselling.futureContraceptionDiscussed,
          ],
          ["When to contact GP / return for review", counselling.returnToGPAdvice],
          ["STI screening advice provided", counselling.stiScreeningAdvice],
          [
            "Side effects explained (nausea, headache, irregular bleeding)",
            counselling.sideEffectsExplained,
          ],
          [
            "How to restart/continue regular contraception",
            counselling.hormonalContraceptionRestart,
          ],
        ]}
      />

      {/* Clinical Notes */}
      {summary.clinicalNotes && (
        <>
          <SectionHeader>Additional Clinical Notes</SectionHeader>
          <p className="text-xs text-gray-700 mb-4 whitespace-pre-wrap">
            {summary.clinicalNotes}
          </p>
        </>
      )}

      {/* Pharmacist Declaration */}
      <PharmacistDeclaration
        pgdName="Emergency Hormonal Contraception"
        pharmacistName={summary.pharmacistName}
        pharmacistGPhC={summary.pharmacistGPhC}
        pharmacyName={summary.pharmacyName}
      />

      {/* Footer */}
      <ReportFooter pgdName="Emergency Hormonal Contraception" />
    </div>
  );
}
