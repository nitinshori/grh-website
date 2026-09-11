"use client";

import type { HayfeverConsultationState } from "../lib/hayfever-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface HayfeverSummaryReportProps {
  state: HayfeverConsultationState;
  alerts: ClinicalAlert[];
  doseRecommendation: DoseRecommendation | null;
}

const PGD_NAME = "Fexofenadine and/or Dymista for Allergic Rhinitis (Hayfever, Prescription Strength)";

function NotSuppliedDeclaration({ pharmacistName, pharmacistGPhC, pharmacyName }: { pharmacistName: string; pharmacistGPhC: string; pharmacyName: string }) {
  return (
    <>
      <SectionHeader>Practitioner Declaration</SectionHeader>
      <p className="text-xs text-gray-600 mb-4">
        I confirm that this consultation was conducted under the Patient Group Direction for {PGD_NAME}, that an exclusion criterion applied, that no medicine was supplied under the PGD, and that the patient was advised on alternative options and referred as recorded.
      </p>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Practitioner name</p>
          <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{pharmacistName || ""}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">GPhC number</p>
          <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{pharmacistGPhC || ""}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Pharmacy</p>
          <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{pharmacyName || ""}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Signature</p>
          <div className="border-b border-gray-300 min-h-[2rem]" />
        </div>
      </div>
    </>
  );
}

export function HayfeverSummaryReport({
  state,
  alerts,
  doseRecommendation,
}: HayfeverSummaryReportProps) {
  const hasStops = alerts.some((a) => a.severity === "stop");
  const age = state.patient.age;
  // Document: adults 8 years; under 18 until the 25th birthday (26th if 17
  // at completion). This PGD accepts patients from 12.
  const retention =
    age !== null && age < 18
      ? `Retain until the patient's ${age === 17 ? "26th" : "25th"} birthday (under 18 at treatment)`
      : "Retain for 8 years (adult)";
  const med = state.medicineSupply.medicineSelected;
  const quantityText = [
    (med === "fexofenadine" || med === "combination") && state.medicineSupply.fexofenadineQuantity
      ? `${state.medicineSupply.fexofenadineQuantity} x fexofenadine 120 mg tablets`
      : null,
    (med === "dymista" || med === "combination") && state.medicineSupply.dymistaBottles
      ? `${state.medicineSupply.dymistaBottles} x Dymista 23 g bottle (approx. 120 sprays)`
      : null,
  ]
    .filter(Boolean)
    .join(" + ");
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 print:border-0 print:shadow-none print:p-0 text-xs print:text-[11px]">
      <div className="text-center mb-6 pb-4 border-b border-gray-300">
        <h2 className="text-base font-bold text-navy-900 mb-1 print:text-sm">
          Hayfever (Prescription Strength), Consultation Record
        </h2>
        <p className="text-gray-500">Get Real Health ePGD Consultation Tool</p>
        <p className="text-gray-500">Fexofenadine and/or Dymista for Allergic Rhinitis PGD, version 004, issued 11 September 2026</p>
      </div>

      {hasStops && (
        <div className="mb-4 px-4 py-3 border-2 border-red-600 rounded-lg">
          <p className="text-sm font-bold text-red-700 uppercase">Not supplied: exclusion criteria met</p>
          <p className="text-red-700 mt-1">No medicine was supplied under this PGD. The exclusion(s) are listed under Clinical Alerts. Advice given and the referral decision are recorded in the clinical notes.</p>
        </div>
      )}

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

      <SectionHeader>Consent</SectionHeader>
      <Row label="Informed consent given" value={state.consent.informedConsentGiven ? "Yes" : "No"} />
      <Row label="ID verified" value={state.consent.idVerified ? `Yes${state.consent.idType ? ` (${state.consent.idType})` : ""}` : "No"} />
      <Row label="Aware this is a private service" value={state.consent.patientAwarePrivateService ? "Yes" : "No"} />

      <SectionHeader>Consultation Details</SectionHeader>
      <Row label="Date" value={state.summary.consultationDate} />
      <Row label="Time" value={state.summary.consultationTime} />
      <Row label="Pharmacy" value={state.summary.pharmacyName || "Not recorded"} />

      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={alerts} />

      <SectionHeader>Symptom Assessment</SectionHeader>
      <Row label="Symptom severity" value={state.assessment.symptomSeverity || "Not recorded"} />
      <Row label="Type" value={state.assessment.seasonalOrPerennial || "Not recorded"} />
      <Row label="Affected systems" value={state.assessment.affectedSystems.join(", ") || "Not recorded"} />
      <Row label="Previous OTC treatment" value={state.assessment.previousOTCUse || "Not recorded"} />
      <Row
        label="Previous diagnosis of allergic rhinitis or recurrence of known symptoms"
        value={state.assessment.previousDiagnosisOrRecurrence ? "Yes" : "No"}
      />

      <SectionHeader>Medical History</SectionHeader>
      <Row label="Asthma or LRTI" value={state.medicalHistory.asthmaOrLrti ? "Yes" : "No"} />
      <Row
        label="Severe hepatic impairment"
        value={state.medicalHistory.severeHepaticImpairment ? "Yes" : "No"}
      />
      <Row
        label="Severe renal impairment"
        value={state.medicalHistory.renalImpairment ? "Yes" : "No"}
      />
      <Row
        label="Recent nasal surgery or trauma"
        value={state.medicalHistory.recentNasalSurgery ? "Yes" : "No"}
      />
      <Row
        label="Untreated nasal infection"
        value={state.medicalHistory.untreatedNasalInfection ? "Yes" : "No"}
      />
      <Row
        label="History of cardiovascular disease"
        value={state.medicalHistory.cardiovascularDisease ? "Yes" : "No"}
      />
      <Row label="Glaucoma" value={state.medicalHistory.glaucoma ? "Yes" : "No"} />
      <Row label="Tuberculosis" value={state.medicalHistory.tuberculosis ? "Yes" : "No"} />
      <Row
        label="Phenylketonuria"
        value={state.medicalHistory.phenylketonuria ? "Yes" : "No"}
      />

      <SectionHeader>Contraindications Check</SectionHeader>
      <Row label="Pregnant" value={state.contraindications.pregnant ? "Yes" : "No"} />
      <Row label="Breastfeeding" value={state.contraindications.breastfeeding ? "Yes" : "No"} />
      <Row
        label="Child under 12"
        value={state.contraindications.childUnder12 ? "Yes" : "No"}
      />
      <Row
        label="Hypersensitivity to fexofenadine or any component"
        value={state.contraindications.hypersensitivityFexofenadine ? "Yes" : "No"}
      />
      <Row
        label="Hypersensitivity to azelastine, fluticasone or any excipient"
        value={state.contraindications.hypersensitivityDymista ? "Yes" : "No"}
      />

      {hasStops ? (
        <>
          <SectionHeader>Medicine</SectionHeader>
          <p className="font-semibold text-red-700">NOT SUPPLIED. Exclusion criteria met; see Clinical Alerts.</p>
        </>
      ) : (
        doseRecommendation && (
          <>
            <SectionHeader>Medicine Supplied &amp; Dosing</SectionHeader>
            <Row label="Medicine" value={doseRecommendation.medicine} />
            <Row label="Dose and route" value={doseRecommendation.dose} />
            <Row label="Frequency" value={doseRecommendation.frequency || "Not recorded"} />
            <Row label="Quantity supplied" value={quantityText || "Not recorded"} />
            <Row label="Treatment period" value={doseRecommendation.duration || "Not recorded"} />
            <Row label="Date of supply" value={state.summary.consultationDate} />
            <Row label="Dosage confirmed with patient" value={state.medicineSupply.dosageConfirmed ? "Yes" : "No"} />
          </>
        )
      )}

      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ["Allergen avoidance measures discussed", state.counselling.allergenAvoidance],
          ["Correct nasal spray technique advised (Dymista)", state.counselling.nasalSprayTechnique],
          ["Effectiveness timeline explained (Dymista: assess after 2 to 4 weeks; fexofenadine: refer if persisting beyond 7 days or worsening)", state.counselling.effectivenessTimeline],
          ["Combination therapy rationale explained", state.counselling.combinationRationale],
          ["Wraparound sunglasses recommended", state.counselling.wrapsunglasses],
          ["Pollen forecast checking advised", state.counselling.pollenForecastAdvice],
          ["Avoid alcohol and other sedating antihistamines (fexofenadine)", state.counselling.alcoholSedatingAdvice],
          ["Non-sedating but occasional drowsiness may still occur (fexofenadine)", state.counselling.drowsinessAdvice],
          ["Possible side effects and ongoing review if used long-term (Dymista)", state.counselling.sideEffectsAdvice],
          ["Follow-up advice: seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3 to 4 weeks, or systemically very unwell", state.counselling.followUpAdvice],
          ["Patient information leaflet supplied", state.counselling.pilSupplied],
        ]}
      />

      {state.summary.clinicalNotes && (
        <>
          <SectionHeader>Clinical Notes</SectionHeader>
          <p className="text-gray-600 whitespace-pre-wrap">
            {state.summary.clinicalNotes}
          </p>
        </>
      )}

      {hasStops ? (
        <NotSuppliedDeclaration
          pharmacistName={state.summary.pharmacistName}
          pharmacistGPhC={state.summary.pharmacistGPhC}
          pharmacyName={state.summary.pharmacyName}
        />
      ) : (
        <PharmacistDeclaration
          pgdName={PGD_NAME}
          pharmacistName={state.summary.pharmacistName}
          pharmacistGPhC={state.summary.pharmacistGPhC}
          pharmacyName={state.summary.pharmacyName}
        />
      )}

      <p className="mt-4 text-[10px] text-gray-500 text-center">
        Record retention: {retention}. Suspected adverse effects to be reported via the Yellow Card scheme (yellowcard.mhra.gov.uk).
      </p>
      <ReportFooter pgdName="Hayfever (Prescription Strength)" />
    </div>
  );
}
