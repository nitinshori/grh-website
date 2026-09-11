"use client";

import type { BasePatientDetails, BaseConsent, BaseSummary, ClinicalAlert } from "../../shared/types";
import type { Clinical } from "../FungalInfectionClient";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

const PGD_NAME = "Fungal Skin Infection (Miconazole 2% cream / Trimovate cream)";
const PGD_VERSION = "PGD version 004, issued 11 September 2026";

const PRESENTATION_LABELS: Record<string, string> = {
  "athletes-foot": "Athlete's foot (tinea pedis)",
  ringworm: "Ringworm (tinea corporis)",
  "other-superficial": "Other superficial fungal infection",
  "candidal-intertrigo": "Candidal intertrigo (superficial fungal, miconazole arm)",
  "inflamed-mixed": "Inflamed intertrigo, infected eczema or seborrhoeic dermatitis with suspected secondary bacterial or candidal component (Trimovate arm)",
};

interface Props {
  patient: BasePatientDetails;
  consent: BaseConsent;
  clinical: Clinical;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
}

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

/**
 * Printed consultation record. Until this existed, "Save & Print Record"
 * printed the on-screen form: a page of tick boxes with no patient on it
 * (adversarial review, 11 Sep 2026).
 */
export function FungalInfectionSummaryReport({ patient, consent, clinical: c, summary, alerts }: Props) {
  const hasStops = alerts.some((a) => a.severity === "stop");
  const yesNo = (v: boolean | undefined) => (v ? "Yes" : "No");
  const age = patient.age;
  const retention =
    age !== null && age < 18
      ? `Retain until the patient's ${age === 17 ? "26th" : "25th"} birthday (under 18 at treatment)`
      : "Retain for 8 years (adult)";
  const productName =
    c.product === "miconazole"
      ? "Miconazole 2% cream (P)"
      : c.product === "trimovate"
        ? "Trimovate cream (POM): clobetasone 17-butyrate 0.05% w/w, oxytetracycline 3.0% w/w, nystatin 100,000 units per gram"
        : "Not selected";
  const dose =
    c.product === "miconazole"
      ? "Apply thinly twice daily to the clean, dry affected area; continue for at least one week after all signs and symptoms disappear. Minimum 2 weeks, maximum 4 weeks."
      : c.product === "trimovate"
        ? "Apply thinly once or twice daily, using only enough to cover the area. Maximum 7 to 10 days continuous use without review."
        : "";

  return (
    <div className="print:p-0 space-y-0">
      <div className="bg-navy-900 text-white px-6 py-4 mb-6 print:mb-4 print:px-4 print:py-3">
        <h1 className="text-2xl font-bold print:text-lg">Fungal Skin Infection ePGD</h1>
        <p className="text-sm text-gray-100 mt-1 print:text-xs">Patient Group Direction Consultation Record. {PGD_VERSION}</p>
      </div>

      {hasStops && (
        <div className="mx-6 mb-4 px-4 py-3 border-2 border-red-600 rounded-lg print:mx-4">
          <p className="text-sm font-bold text-red-700 uppercase">Not supplied: exclusion criteria met</p>
          <p className="text-xs text-red-700 mt-1">No medicine was supplied under this PGD. The exclusion(s) are listed under Clinical Alerts. Advice given and the referral decision are recorded in the clinical notes.</p>
        </div>
      )}

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Patient Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
          <Row label="DOB" value={patient.dateOfBirth} />
          <Row label="Age" value={age !== null ? `${age} years` : "Not recorded"} />
          <Row label="Address" value={patient.address || "Not recorded"} />
          <Row label="NHS number" value={patient.nhsNumber || "Not recorded"} />
          <Row label="GP" value={patient.gpName || "Not recorded"} />
          <Row label="GP Practice" value={patient.gpPractice || "Not recorded"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Consent</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Informed consent given" value={yesNo(consent.informedConsentGiven)} />
          <Row label="ID verified" value={consent.idVerified ? `Yes${consent.idType ? ` (${consent.idType})` : ""}` : "No"} />
          <Row label="Aware this is a private service" value={yesNo(consent.patientAwarePrivateService)} />
          <Row label="Copy to GP" value={yesNo(consent.notifyGp)} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Consultation Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Date" value={summary.consultationDate} />
          <Row label="Time" value={summary.consultationTime} />
          <Row label="Pharmacy" value={summary.pharmacyName || "Not recorded"} />
          <Row label="PGD" value={PGD_VERSION} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Presentation and History</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Presentation" value={PRESENTATION_LABELS[c.presentation] || c.presentation || "Not recorded"} />
          <Row label="Affected site" value={c.site || "Not recorded"} />
          <Row label="Allergies" value={c.allergies || "Not recorded"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Exclusions and Cautions (each asked and recorded)</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Nail or scalp involvement" value={yesNo(c.nailOrScalp)} />
          <Row label="Infected, broken, ulcerated, oozing or weeping skin" value={yesNo(c.brokenOozing)} />
          <Row label="Signs of systemic infection" value={yesNo(c.systemic)} />
          <Row label="Skin infection requiring systemic therapy" value={yesNo(c.requiresSystemicTherapy)} />
          <Row label="Primary bacterial or viral skin infection suspected" value={yesNo(c.bacterialOrViral)} />
          <Row label="Affected area is the face or genitals" value={yesNo(c.faceOrGenitals)} />
          <Row label="Pregnant or breastfeeding" value={yesNo(c.pregnantOrBreastfeeding)} />
          <Row label="Hypersensitivity to miconazole or excipients" value={yesNo(c.miconazoleAllergy)} />
          <Row label="Hypersensitivity to corticosteroids, nystatin, oxytetracycline or excipients" value={yesNo(c.steroidOrTrimovateAllergy)} />
          <Row label="Warfarin or other vitamin K antagonist (caution)" value={yesNo(c.warfarin)} />
          <Row label="Blurred vision or visual disturbance (caution)" value={yesNo(c.visualDisturbance)} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Alerts</SectionHeader>
        <AlertSummary alerts={alerts} />
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>{hasStops ? "Medicine" : "Medicine Supplied"}</SectionHeader>
        {hasStops ? (
          <p className="text-xs font-semibold text-red-700">NOT SUPPLIED. Exclusion criteria met; see Clinical Alerts.</p>
        ) : (
          <div className="space-y-2 text-xs print:space-y-1">
            <Row label="Product" value={productName} />
            <Row label="Brand supplied" value={c.brand || "Not recorded"} />
            <Row label="Form and route" value="Cream, topical (cutaneous)" />
            <Row label="Dose" value={dose || "Not recorded"} />
            <Row label="Quantity supplied" value={c.quantity === "one-30g-tube" ? "One 30 g tube (one treatment course)" : c.quantity || "Not recorded"} />
            <Row label="Date of supply" value={summary.consultationDate} />
          </div>
        )}
      </div>

      {!hasStops && (
        <div className="px-6 py-4 print:px-4 print:py-2">
          <SectionHeader>Counselling Provided</SectionHeader>
          <CounsellingGrid
            items={[
              [c.product === "trimovate" ? "Treatment period: maximum 7 to 10 days without review; re-evaluate if not improved in 7 days" : "Complete the course: at least one week after symptoms clear; minimum 2, maximum 4 weeks", c.completeCourse],
              ["Application advice given", c.applicationAdvice],
              ["Follow-up advice: seek advice if worsening, not improved in 3 to 4 weeks, or systemically unwell", c.reviewAdvice],
              ["Hygiene advice given", c.hygieneAdvice],
              ["Patient information leaflet supplied", c.pilSupplied],
            ]}
          />
          <p className="text-xs text-gray-600 mt-2">Suspected adverse effects to be reported via the Yellow Card scheme (yellowcard.mhra.gov.uk) and the GP informed as appropriate.</p>
        </div>
      )}

      {summary.clinicalNotes && (
        <div className="px-6 py-4 print:px-4 print:py-2">
          <SectionHeader>Clinical Notes{hasStops ? " and Advice Given" : ""}</SectionHeader>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">{summary.clinicalNotes}</p>
        </div>
      )}

      <div className="px-6 py-4 print:px-4 print:py-2">
        {hasStops ? (
          <NotSuppliedDeclaration pharmacistName={summary.pharmacistName} pharmacistGPhC={summary.pharmacistGPhC} pharmacyName={summary.pharmacyName} />
        ) : (
          <PharmacistDeclaration
            pgdName={PGD_NAME}
            pharmacistName={summary.pharmacistName}
            pharmacistGPhC={summary.pharmacistGPhC}
            pharmacyName={summary.pharmacyName}
          />
        )}
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <p className="text-[10px] text-gray-500 text-center">Record retention: {retention}.</p>
        <ReportFooter pgdName={PGD_NAME} />
      </div>
    </div>
  );
}
