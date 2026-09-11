"use client";

import type { GenitalWartsConsultationState } from "../lib/genital-warts-types";
import { PGD_VERSION_LINE } from "../lib/genital-warts-types";
import { doseSchedule } from "../lib/genital-warts-clinical-logic";
import type { ClinicalAlert } from "../../shared/types";
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface GenitalWartsSummaryReportProps {
  state: GenitalWartsConsultationState;
  alerts: ClinicalAlert[];
}

const PGD_NAME = "Genital Warts (podophyllotoxin and imiquimod)";

/**
 * Print-only consultation record. The PGD's records row requires consent,
 * patient identity and GP, practitioner, name and brand of medicine, date of
 * supply with dose, form, route and quantity, advice given (including to
 * excluded patients) and any adverse drug reactions. Until this component
 * existed the printed record was the on-screen success box.
 */
export function GenitalWartsSummaryReport({ state, alerts }: GenitalWartsSummaryReportProps) {
  const { patient, consent, assessment, treatment, counselling, summary } = state;
  const stopped = alerts.some((a) => a.severity === "stop");
  const isPodo = treatment.agent === "podophyllotoxin";
  const schedule = doseSchedule(treatment.agent);
  const medicineName =
    treatment.agent === "imiquimod"
      ? "Imiquimod 5% cream"
      : treatment.agent === "podophyllotoxin"
        ? treatment.podophyllotoxinForm === "cream"
          ? "Podophyllotoxin 0.15% cream"
          : "Podophyllotoxin 0.5% solution"
        : "Not selected";

  const exclusionsChecked = [
    assessment.internalWarts && "internal warts",
    (assessment.pregnancyStatus === "confirmed" || assessment.pregnancyStatus === "possible") && "pregnancy or pregnancy not excluded",
    assessment.breastfeeding && "breastfeeding",
    assessment.openWoundsPresent && "open wounds or broken skin",
    assessment.hypersensitivityPodophyllotoxin && "hypersensitivity to podophyllotoxin",
    assessment.hypersensitivityImiquimod && "hypersensitivity to imiquimod",
    assessment.suspiciousLesion && "atypical, bleeding or ulcerated lesion",
    isPodo && assessment.keratinised && "keratinised lesions (podophyllotoxin not indicated)",
    isPodo && assessment.treatmentAreaCm2 !== null && assessment.treatmentAreaCm2 > 4 && "treatment area above 4 cm2",
  ]
    .filter(Boolean)
    .join(", ");

  const cautions = [
    assessment.immunosuppressed && "immunocompromised",
    assessment.uncircumcisedMale && "uncircumcised male (phimosis risk with imiquimod)",
    assessment.autoimmuneCondition && "autoimmune condition",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="print:p-0 space-y-0">
      <div className="bg-navy-900 text-white px-6 py-4 mb-6 print:mb-4 print:px-4 print:py-3">
        <h1 className="text-2xl font-bold print:text-lg">Genital Warts ePGD</h1>
        <p className="text-sm text-gray-100 mt-1 print:text-xs">
          Patient Group Direction Consultation Record. {stopped ? "NOT SUPPLIED. Consultation under the" : "Supplied under the"} {PGD_VERSION_LINE}.
        </p>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Patient Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
          <Row label="DOB" value={patient.dateOfBirth} />
          <Row label="Age" value={patient.age !== null ? `${patient.age} years` : "Not recorded"} />
          <Row label="Address" value={patient.address || "Not recorded"} />
          <Row label="NHS Number" value={patient.nhsNumber || "Not recorded"} />
          <Row label="GP" value={patient.gpName || "Not recorded"} />
          <Row label="GP Practice" value={patient.gpPractice || "Not recorded"} />
          <Row label="Informed consent" value={consent.informedConsentGiven ? "Obtained" : "Not recorded"} />
          <Row label="ID verified" value={consent.idVerified ? `Yes${consent.idType ? ` (${consent.idType})` : ""}` : "Not recorded"} />
          <Row label="Private service" value={consent.patientAwarePrivateService ? "Patient aware" : "Not recorded"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Consultation Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Date" value={summary.consultationDate} />
          <Row label="Time" value={summary.consultationTime} />
          <Row label="Pharmacy" value={summary.pharmacyName || "Not recorded"} />
          <Row label="Pharmacy address" value={summary.pharmacyAddress || "Not recorded"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Wart Assessment</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="External warts confirmed" value={assessment.externalWartsConfirmed ? "Yes, on examination" : "Not confirmed"} />
          <Row label="Perianal external warts" value={assessment.perianalExternalWarts ? "Present" : "No"} />
          <Row label="Keratinised" value={assessment.keratinised ? "Yes" : "No"} />
          <Row label="Number of warts" value={assessment.wartCount !== null ? String(assessment.wartCount) : "Not recorded"} />
          <Row label="Treatment area" value={assessment.treatmentAreaCm2 !== null ? `${assessment.treatmentAreaCm2} cm2` : "Not recorded"} />
          <Row label="Able to self-apply to warts only" value={assessment.ableToSelfApply ? "Yes" : "No"} />
          <Row label="Sexual history taken" value={assessment.sexualHistoryTaken ? "Yes" : "No"} />
          <Row label="STI screening offered" value={assessment.stiScreeningOffered ? "Yes" : "No"} />
          <Row label="Cervical screening up to date" value={assessment.cervicalScreeningUpToDate ? "Yes" : "Not confirmed or not applicable"} />
          <Row
            label="Pregnancy status"
            value={
              assessment.pregnancyStatus === "not-applicable"
                ? "Not applicable"
                : assessment.pregnancyStatus === "not-pregnant"
                  ? "Not pregnant"
                  : assessment.pregnancyStatus === "possible"
                    ? "Pregnancy possible"
                    : assessment.pregnancyStatus === "confirmed"
                      ? "Pregnant"
                      : "Not recorded"
            }
          />
          <Row label="PGD exclusions checked" value={exclusionsChecked || "None present"} />
          <Row label="Cautions" value={cautions || "None"} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Alerts</SectionHeader>
        <AlertSummary alerts={alerts} />
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Outcome</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row
            label="Outcome"
            value={stopped ? "NOT SUPPLIED: exclusion criteria met; patient referred. See clinical alerts." : "Supplied under the PGD"}
          />
          {stopped && <Row label="Advice given and decision" value={summary.referralAdvice || "Not recorded"} />}
          <Row label="Adverse drug reactions" value={summary.adverseDrugReactions || "None reported"} />
        </div>
      </div>

      {!stopped && (
        <div className="px-6 py-4 print:px-4 print:py-2">
          <SectionHeader>Medicine Supplied under PGD</SectionHeader>
          <div className="space-y-2 text-xs print:space-y-1">
            <Row label="Medicine" value={medicineName} />
            <Row label="Brand" value={treatment.brand || "Not recorded"} />
            <Row
              label="Form and route"
              value={
                treatment.agent === "imiquimod"
                  ? "Cream, topical to external warts"
                  : treatment.podophyllotoxinForm === "cream"
                    ? "Cream, topical to external warts"
                    : "Cutaneous solution, topical to external warts"
              }
            />
            <Row label="Dose and frequency" value={schedule?.regimen || "Not selected"} />
            <Row label="Course" value={schedule?.course || "Not selected"} />
            <Row
              label="Supply number"
              value={
                treatment.supplyNumber !== null
                  ? isPodo
                    ? `Pack ${treatment.supplyNumber} of a maximum of 2 (one pack per course; a second only at the review after 2 cycles)`
                    : `Dispensing ${treatment.supplyNumber} of a maximum of 4 (16 weeks)`
                  : "Not recorded"
              }
            />
            {treatment.supplyNumber !== null && treatment.supplyNumber >= (isPodo ? 2 : 3) && (
              <Row
                label={isPodo ? "Review after 2 cycles" : "8-week review"}
                value={treatment.priorReviewOutcome === "persisting" ? "Warts persist: treatment continued" : treatment.priorReviewOutcome === "cleared" ? "Cleared" : "Not recorded"}
              />
            )}
            <Row label="Quantity" value={treatment.quantitySupplied || "Not recorded"} />
            <Row label="Batch" value={treatment.batchNumber || "Not recorded"} />
            <Row label="Expiry" value={treatment.expiryDate || "Not recorded"} />
            <Row label="Date of supply" value={summary.consultationDate} />
            <Row label="Review date" value={treatment.reviewDate || "Not recorded"} />
          </div>
        </div>
      )}

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Counselling Provided</SectionHeader>
        <CounsellingGrid
          items={[
            ["Application technique: warts only, not healthy skin", counselling.applicationTechniqueExplained],
            ["Petroleum jelly barrier on surrounding skin", counselling.barrierProtectionExplained],
            ["Local reactions discussed", counselling.localReactionsDiscussed],
            ["Avoid sexual contact while treatment is on the skin", counselling.avoidSexualContactWhileApplied],
            ["Consistent condom use counselled", counselling.condomsCounselled],
            ["Partner notification discussed", counselling.partnerNotificationDiscussed],
            ["Complete the full course", counselling.completeCourseAdvised],
            ["Hand washing after application", counselling.handWashingAdvised],
            ["HPV vaccination discussed", counselling.hpvVaccinationDiscussed],
            ["Yellow Card scheme explained", counselling.yellowCardExplained],
            ["Patient information leaflet supplied", counselling.pilSupplied],
            ["Safety netting given", counselling.safetyNettingGiven],
            ["Follow-up and screening advised", counselling.followUpAndScreeningAdvised],
            ...(isPodo
              ? ([
                  ["Podophyllotoxin: teratogenicity and contraception", counselling.contraceptionCounselled],
                  ...(treatment.podophyllotoxinForm === "solution"
                    ? ([["Podophyllotoxin solution: flammability warning", counselling.flammabilityWarningGiven]] as [string, boolean][])
                    : []),
                ] as [string, boolean][])
              : []),
            ...(treatment.agent === "imiquimod"
              ? ([["Imiquimod weakens condoms and diaphragms", counselling.condomWeakeningExplained]] as [string, boolean][])
              : []),
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
        {stopped ? (
          <>
            <SectionHeader>Practitioner Declaration</SectionHeader>
            <p className="text-xs text-gray-600 mb-4">
              I confirm that this consultation was conducted in accordance with the Patient Group Direction for {PGD_NAME}, that an exclusion criterion applied, that no medicine was supplied under the PGD, and that the advice given and the referral made are recorded above.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Practitioner name</p>
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
            pgdName={PGD_NAME}
            pharmacistName={summary.pharmacistName}
            pharmacistGPhC={summary.pharmacistGPhC}
            pharmacyName={summary.pharmacyName}
          />
        )}
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <ReportFooter pgdName={PGD_NAME} />
      </div>
    </div>
  );
}
