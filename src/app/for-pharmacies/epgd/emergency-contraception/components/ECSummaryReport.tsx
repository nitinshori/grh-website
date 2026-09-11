"use client";

import type { ECConsultationState } from "../lib/ec-types";
import { PGD_VERSION_LABEL } from "../lib/ec-types";
import { calculateBmi } from "../lib/ec-clinical-logic";
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
  const stopped = alerts.some((a) => a.severity === "stop");
  const supplied = !stopped && (medicineSelection.medicine === "levonorgestrel" || medicineSelection.medicine === "ulipristal");

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
        <p className="text-[10px] text-gray-400 mt-1">{PGD_VERSION_LABEL}</p>
      </div>

      {/* Patient Details */}
      <SectionHeader>Patient Details</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
        <Row label="Age" value={patient.age ? `${patient.age} years` : "Not recorded"} />
        <Row label="Date of birth" value={patient.dateOfBirth || "Not recorded"} />
        <Row label="Address" value={patient.address || "Not provided"} />
        <Row
          label="NHS number"
          value={patient.nhsNumber || "Not provided"}
        />
        <Row label="GP name" value={patient.gpName || "Not provided"} />
        <Row label="GP practice" value={patient.gpPractice || "Not provided"} />
        <Row label="Female confirmed" value={patient.femaleConfirmed ? "Yes" : "No"} />
      </div>

      {patient.age !== null && patient.age <= 15 && (
        <>
          <SectionHeader>Safeguarding</SectionHeader>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {patient.age < 13 ? (
              <>
                <Row label="Under 13" value="Not supplied under this ePGD (Get Real Health service decision); same-day referral to GP or sexual health service" />
                <Row label="Under 13: safeguarding referral (mandatory)" value={patient.safeguardingReferralMade ? "Made" : "NOT made"} />
              </>
            ) : (
              <>
                <Row label="Fraser competence" value={patient.fraserOutcome === "competent" ? "Competent (all criteria met)" : patient.fraserOutcome === "not-competent" ? "Not competent: not supplied" : "Not recorded"} />
                <Row label="Coercion" value={patient.coercionReported === "yes" ? "Yes, reported (safeguarding pathway)" : patient.coercionReported === "no" ? "None reported (asked)" : "Not asked"} />
                <Row label="Partner age" value={patient.partnerAge || "Not recorded"} />
                <Row label="Safeguarding concern" value={patient.safeguardingConcern ? "Yes, local pathway followed" : "None identified"} />
              </>
            )}
            <Row label="Safeguarding record" value={patient.safeguardingNotes || "Not recorded"} />
          </div>
        </>
      )}

      {/* Consultation Details */}
      <SectionHeader>Consultation Details</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Row
          label="Consultation date"
          value={summary.consultationDate || "Not recorded"}
        />
        <Row
          label="Consultation time"
          value={summary.consultationTime || "Not recorded"}
        />
        <Row label="Pharmacy" value={summary.pharmacyName || "Not recorded"} />
        <Row label="Valid informed consent given" value={state.consent.informedConsentGiven ? "Yes" : "No"} />
      </div>

      {/* Clinical Assessment */}
      <SectionHeader>Clinical Assessment</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Row
          label="Date of UPSI"
          value={clinicalAssessment.upsiDate || "Not recorded"}
        />
        <Row
          label="Time of UPSI"
          value={clinicalAssessment.upsiTime || "Not recorded"}
        />
        <Row
          label="Hours since UPSI"
          value={
            clinicalAssessment.hoursSinceUPSI !== null
              ? `${Math.round(clinicalAssessment.hoursSinceUPSI * 10) / 10} hours`
              : "Not recorded"
          }
        />
        <Row
          label="Last menstrual period"
          value={clinicalAssessment.lastMenstrualPeriod || "Not recorded"}
        />
        <Row
          label="Menstrual cycle"
          value={
            clinicalAssessment.cycleRegular
              ? `Regular (${clinicalAssessment.cycleLength ?? "Not recorded"} days)`
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
            value={clinicalAssessment.contraceptionFailureType || "Not recorded"}
          />
        )}
        <Row
          label="Pregnancy symptoms"
          value={clinicalAssessment.currentPregnancySymptoms ? "Yes" : "No"}
        />
        <Row
          label="Previous EC this cycle"
          value={
            clinicalAssessment.previousEC
              ? `${clinicalAssessment.previousECType || "type not recorded"}${clinicalAssessment.previousECDetails ? `: ${clinicalAssessment.previousECDetails}` : ""}`
              : "No"
          }
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
          label="Known or suspected pregnancy"
          value={medicalHistory.currentlyPregnant ? "Yes" : "No"}
        />
        <Row
          label="Weight / height / BMI"
          value={`${medicalHistory.weightKg !== null ? medicalHistory.weightKg + " kg" : "not recorded"} / ${medicalHistory.heightCm !== null ? medicalHistory.heightCm + " cm" : "not recorded"} / ${calculateBmi(medicalHistory.weightKg, medicalHistory.heightCm) ?? "not calculated"}`}
        />
        <Row
          label="Hypersensitivity (LNG / UPA)"
          value={`${medicalHistory.lngHypersensitivity ? "Yes" : "No"} / ${medicalHistory.upaHypersensitivity ? "Yes" : "No"}`}
        />
        <Row
          label="Hereditary galactose intolerance"
          value={medicalHistory.galactoseIntolerance ? "Yes" : "No"}
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
        <Row
          label="Progestogen in previous 7 days"
          value={medications.progestogenLast7Days ? "Yes" : "No"}
        />
      </div>

      {/* Clinical Alerts */}
      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={alerts} />

      {/* Medicine Selection */}
      <SectionHeader>Medicine Selection & Dosing</SectionHeader>
      {supplied ? (
        <div className="space-y-2 mb-4">
          <Row
            label="Medicine and brand"
            value={
              medicineSelection.medicine === "levonorgestrel"
                ? "Levonorgestrel 1.5mg tablet (Levonelle)"
                : "Ulipristal acetate 30mg tablet (ellaOne)"
            }
          />
          <Row label="Dose" value={medicineSelection.dose || "Not recorded"} />
          <Row label="Form and route" value="Tablet, oral (swallowed whole with water)" />
          <Row
            label="Quantity supplied"
            value={medicineSelection.medicine === "ulipristal" ? "1 tablet (30 mg)" : medicineSelection.dose === "3mg" ? "2 tablets (3 mg double dose)" : "1 tablet (1.5 mg)"}
          />
          <Row label="Date and time of supply" value={`${summary.consultationDate || "not recorded"} ${summary.consultationTime || ""}`.trim()} />
          {medicineSelection.dose === "3mg" && (
            <Row
              label="Reason for 3 mg dose"
              value={
                medicineSelection.doubleDoseReason === "enzyme-inducers"
                  ? "Enzyme-inducing drugs in the last 4 weeks (licensed)"
                  : medicineSelection.doubleDoseReason === "weight-bmi"
                    ? `Weight 70 kg or over, or BMI 26 or over (off-label per FSRH); explained to patient: ${medicineSelection.offLabelExplained ? "Yes" : "No"}`
                    : "Not recorded"
              }
            />
          )}
          {medications.takesEnzymeInducers && (
            <Row label="Copper IUD offered" value={medicineSelection.copperIudOffered ? "Yes, declined" : "No"} />
          )}
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          <Row
            label="Outcome"
            value={
              stopped
                ? "NOT SUPPLIED: exclusion criteria met. Patient advised and referred as recorded."
                : medicineSelection.medicine === "not-supplied"
                  ? "NOT SUPPLIED: patient declined or referred."
                  : "No medicine selected."
            }
          />
          {stopped && (
            <Row label="Referred to" value={({ "sexual-health": "Sexual health service", gp: "GP", other: "Other" } as Record<string, string>)[medicineSelection.referredTo] || "Not recorded"} />
          )}
          <Row label="Advice given and decision reached" value={medicineSelection.notSuppliedReason || "Not recorded"} />
        </div>
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
            "Advised not 100% effective: backup contraception needed",
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
            "How to restart/continue regular contraception (5 day wait after ulipristal)",
            counselling.hormonalContraceptionRestart,
          ],
          ...(medicalHistory.breastfeeding
            ? [["Breastfeeding: avoid 8 hours (LNG) or 7 days (UPA)", counselling.breastfeedingAdvice] as [string, boolean]]
            : []),
          ["PIL supplied", counselling.pilSupplied],
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

      {/* Pharmacist Declaration (not the "no exclusion criteria applied"
          wording when the patient was excluded or nothing was supplied) */}
      {supplied ? (
        <PharmacistDeclaration
          pgdName="Emergency Hormonal Contraception"
          pharmacistName={summary.pharmacistName}
          pharmacistGPhC={summary.pharmacistGPhC}
          pharmacyName={summary.pharmacyName}
        />
      ) : (
        <>
          <SectionHeader>Practitioner</SectionHeader>
          <p className="text-xs text-gray-600 mb-2">
            {stopped
              ? "The patient met one or more exclusion criteria and no medicine was supplied under this PGD. Advice given and the decision reached are recorded above."
              : "No medicine was supplied under this PGD. Advice given and the decision reached are recorded above."}
          </p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Row label="Name" value={summary.pharmacistName || "Not recorded"} />
            <Row label="GPhC number" value={summary.pharmacistGPhC || "Not recorded"} />
            <Row label="Pharmacy" value={summary.pharmacyName || "Not recorded"} />
            <Row label="Date" value={summary.consultationDate || "Not recorded"} />
          </div>
        </>
      )}

      {/* Footer */}
      <ReportFooter pgdName="Emergency Hormonal Contraception" />
    </div>
  );
}
