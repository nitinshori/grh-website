"use client";

import type { ClinicalAlert } from "../../shared/types";
import { PGD_STRAPLINE, describeMedicine, type EyeConsultationState } from "../lib/eye-infections-state";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
} from "../../shared/components/SummaryReportShell";

interface Props {
  state: EyeConsultationState;
  alerts: ClinicalAlert[];
  hasStops: boolean;
}

const EYE_LABEL: Record<string, string> = { left: "Left eye", right: "Right eye", both: "Both eyes" };
const DURATION_LABEL: Record<string, string> = { "<24h": "Less than 24 hours", "1-3d": "1 to 3 days", "3-7d": "3 to 7 days", ">7d": "More than 7 days" };

export function EyeInfectionsSummaryReport({ state, alerts, hasStops }: Props) {
  const { patient, consent, assessment, treatment, counselling, summary } = state;
  const medicine = describeMedicine(treatment);
  const supplied = !hasStops && !!medicine;
  const isChild = patient.age !== null && patient.age < 18;
  const drops = treatment.formulation === "drops" || treatment.formulation === "both";
  const ointment = treatment.formulation === "ointment" || treatment.formulation === "both";
  const consentBasisText =
    patient.age !== null && patient.age < 16
      ? consent.consentBasis === "gillick"
        ? "Child assessed as Gillick competent and consented"
        : consent.consentBasis === "parental"
          ? `Person with parental responsibility: ${consent.consentGivenByName || "name not recorded"} (${consent.consentGivenByRelationship || "relationship not recorded"})`
          : "Not recorded"
      : "Patient (16 years or over)";

  return (
    <div className="print:p-0 space-y-0">
      <div className="bg-navy-900 text-white px-6 py-4 mb-6 print:mb-4 print:px-4 print:py-3">
        <h1 className="text-2xl font-bold print:text-lg">Eye Infections (Chloramphenicol) ePGD</h1>
        <p className="text-sm text-gray-100 mt-1 print:text-xs">Patient Group Direction Consultation Record</p>
        <p className="text-xs text-gray-100 mt-1 print:text-[10px]">{PGD_STRAPLINE}</p>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Outcome</SectionHeader>
        <div className={`text-sm font-semibold px-3 py-2 rounded ${hasStops ? "bg-red-50 text-red-700" : supplied ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"}`}>
          {hasStops
            ? "NOT SUPPLIED: exclusion criteria met, patient advised and referred as appropriate"
            : supplied
              ? "Supplied under PGD"
              : "Not supplied: no formulation selected"}
        </div>
        {hasStops && summary.exclusionAdvice && (
          <div className="mt-2">
            <Row label="Advice given / referral" value={summary.exclusionAdvice} />
          </div>
        )}
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Patient Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
          <Row label="DOB" value={patient.dateOfBirth} />
          <Row label="Age" value={patient.age !== null ? `${patient.age} years` : "Not recorded"} />
          <Row label="Address" value={patient.address || "Not recorded"} />
          <Row label="GP" value={patient.gpName || "Not recorded"} />
          <Row label="GP Practice" value={patient.gpPractice || "Not recorded"} />
          <Row label="NHS Number" value={patient.nhsNumber || "Not recorded"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Consultation Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Date" value={summary.consultationDate} />
          <Row label="Time" value={summary.consultationTime} />
          <Row label="Pharmacy" value={summary.pharmacyName || "Not recorded"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Consent</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Informed consent" value={consent.informedConsentGiven ? "Obtained" : "NOT recorded"} />
          <Row label="Consent given by" value={consentBasisText} />
          <Row label="ID verified" value={consent.idVerified ? consent.idType || "Yes" : "No"} />
          <Row label="Private service" value={consent.patientAwarePrivateService ? "Patient aware" : "NOT recorded"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Assessment</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Eye affected" value={EYE_LABEL[assessment.eyeAffected] || "Not recorded"} />
          <Row label="Duration of symptoms" value={DURATION_LABEL[assessment.durationSymptoms] || "Not recorded"} />
          <Row
            label="Symptoms"
            value={
              [
                assessment.stickyDischarge && "Purulent discharge",
                assessment.redEye && "Red eye / conjunctival injection",
                assessment.grittySensation && "Gritty sensation",
                assessment.eyelidSwelling && "Eyelid swelling",
                assessment.crustingOnWaking && "Crusting on waking",
              ]
                .filter(Boolean)
                .join(", ") || "None recorded"
            }
          />
          <Row label="Able to instil (or carer)" value={assessment.ableToInstil ? "Yes" : "NOT confirmed"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Exclusion Criteria and Red Flags</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Hypersensitivity to chloramphenicol / excipients" value={assessment.chloramphenicolAllergy ? "Yes" : "No"} />
          <Row label="Aplastic anaemia / blood dyscrasia (personal or family)" value={assessment.boneMarrowProblems ? "Yes" : "No"} />
          <Row label="Bone marrow suppression or chemotherapy" value={assessment.boneMarrowSuppressionOrChemo ? "Yes" : "No"} />
          <Row label="Severe eye pain" value={assessment.painInsideEye ? "Yes" : "No"} />
          <Row label="Photophobia or reduced vision" value={assessment.photophobia ? "Yes" : "No"} />
          <Row label="Suspected corneal ulceration or abrasion" value={assessment.suspectedCornealUlcerOrAbrasion ? "Yes" : "No"} />
          <Row label="Suspected viral aetiology" value={assessment.suspectedViral ? "Yes" : "No"} />
          <Row label="Recent eye surgery or trauma" value={assessment.recentSurgeryOrTrauma ? "Yes" : "No"} />
          <Row label="Symptoms over 7 days or recurrent" value={assessment.symptomsRecurrent || assessment.durationSymptoms === ">7d" ? "Yes" : "No"} />
          <Row label="Only one functional eye" value={assessment.onlyOneFunctionalEye ? "Yes" : "No"} />
          <Row label="Contact lens wearer" value={assessment.contactLensWearer ? "Yes" : "No"} />
          <Row label="Pregnant or breastfeeding" value={assessment.pregnantOrBreastfeeding ? "Yes" : "No"} />
          <Row label="Questions put to patient" value={assessment.questionsAsked ? "Yes, confirmed by pharmacist" : "NOT confirmed"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Alerts</SectionHeader>
        <AlertSummary alerts={alerts} />
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Medicine Supplied</SectionHeader>
        {hasStops ? (
          <p className="text-xs text-red-700 font-medium">No medicine supplied: exclusion criteria met.</p>
        ) : medicine ? (
          <div className="space-y-2 text-xs print:space-y-1">
            <Row label="Medicine (name and brand)" value={medicine.name} />
            <Row label="Dose, route and frequency" value={`Ocular (topical). ${medicine.dose}`} />
            <Row label="Quantity supplied" value={medicine.quantity} />
            <Row label="Duration" value={medicine.duration} />
            <Row label="Date of supply" value={summary.consultationDate} />
            {drops && (
              <Row label="Eye drops batch / expiry" value={`${treatment.dropsBatchNumber || "Not recorded"} / ${treatment.dropsExpiry || "Not recorded"}`} />
            )}
            {ointment && (
              <Row label="Eye ointment batch / expiry" value={`${treatment.ointmentBatchNumber || "Not recorded"} / ${treatment.ointmentExpiry || "Not recorded"}`} />
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-500">No formulation selected.</p>
        )}
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Counselling Provided</SectionHeader>
        <CounsellingGrid
          items={[
            ["Wash hands before and after use", counselling.handsBeforeAfter],
            ["Do not share towels, pillows or cosmetics", counselling.noSharing],
            ...(assessment.contactLensWearer ? [["Contact lenses: remove during treatment and for 48 hours after", counselling.discardContactLenses] as [string, boolean]] : []),
            ...(drops ? [["Drops: inner canthus pressure after instillation", counselling.innerCanthusPressure] as [string, boolean]] : []),
            ["Complete the 5-day course; do not extend without review", counselling.completeCourse],
            ["Discard 28 days after opening", counselling.discard28Days],
            ["Review with GP if no improvement in 48 hours", counselling.returnIfWorse],
            ["Seek immediate advice if pain, photophobia or vision change", counselling.urgentSymptoms],
            ["Transient stinging / blurred vision warning", counselling.blurredVisionWarning],
            ["Report adverse reactions", counselling.reportAdverse],
            ...(assessment.pregnantOrBreastfeeding ? [["Pregnancy: inform a healthcare provider", counselling.pregnancyInform] as [string, boolean]] : []),
            ["Patient information leaflet supplied", counselling.pilSupplied],
          ]}
        />
      </div>

      {summary.clinicalNotes && (
        <div className="px-6 py-4 print:px-4 print:py-2">
          <SectionHeader>Clinical Notes</SectionHeader>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">{summary.clinicalNotes}</p>
        </div>
      )}

      <div className="px-6 py-4 print:px-4 print:py-2">
        {hasStops ? (
          <>
            <SectionHeader>Pharmacist Declaration</SectionHeader>
            <p className="text-xs text-gray-600 mb-4">
              I confirm that this consultation was conducted in accordance with the Patient Group Direction for Chloramphenicol eye drops and eye ointment, that the patient met one or more exclusion criteria, that no medicine was supplied under this PGD, and that the advice given and the decision reached have been recorded above.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Pharmacist name</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacistName || ""}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">GPhC number</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacistGPhC || ""}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Pharmacy</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacyName || ""}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Signature</p>
                <div className="border-b border-gray-300 min-h-[2rem]" />
              </div>
            </div>
          </>
        ) : (
          <PharmacistDeclaration
            pgdName="Chloramphenicol eye drops and eye ointment (Bacterial Conjunctivitis)"
            pharmacistName={summary.pharmacistName}
            pharmacistGPhC={summary.pharmacistGPhC}
            pharmacyName={summary.pharmacyName}
          />
        )}
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <div className="mt-8 pt-4 border-t border-gray-300 text-center">
          <p className="text-[10px] text-gray-400">
            Get Real Health ePGD, Eye Infections (Chloramphenicol) Consultation Record | Confidential Patient Information |{" "}
            {isChild
              ? patient.age === 17
                ? "Retain until the patient's 26th birthday (patient aged 17 at completion)"
                : "Retain until the patient's 25th birthday (patient under 18)"
              : "Retain for 8 years (adults)"}
          </p>
        </div>
      </div>
    </div>
  );
}
