"use client";

import type { ClinicalAlert, BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";
import { SectionHeader, Row, CounsellingGrid, ReportFooter } from "../../shared/components/SummaryReportShell";
import { YF_PGD_VERSION, type Clinical } from "../yellow-fever-types";

/**
 * Printed record for the yellow fever ePGD. Until this existed, Save & Print
 * printed the last step's checkboxes: no batch, no site, no consent basis,
 * no certificate number (adversarial review, 11 Sep 2026). Every item in the
 * document's "Records to be kept" list is here.
 */
export function YellowFeverSummaryReport({
  patient,
  consent,
  clinical: c,
  summary,
  alerts,
  ageMonths,
}: {
  patient: BasePatientDetails;
  consent: BaseConsent;
  clinical: Clinical;
  summary: BaseSummary;
  alerts: ClinicalAlert[];
  ageMonths: number | null;
}) {
  const hasStops = alerts.some((a) => a.severity === "stop");
  const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString("en-GB") : "Not recorded");
  const underSixteen = patient.age !== null && patient.age < 16;

  const consentText = !consent.informedConsentGiven
    ? "Not recorded"
    : underSixteen
      ? c.consentBasis === "parental"
        ? `Valid informed consent given by a person with parental responsibility: ${c.consentGiverDetails || "not recorded"}`
        : c.consentBasis === "gillick"
          ? `Valid informed consent given by the young person, assessed as Gillick competent: ${c.consentGiverDetails || "basis not recorded"}`
          : "Under 16: consent basis not recorded"
      : "Valid informed consent given by the individual";

  const doseText =
    c.doseType === "first"
      ? "First dose"
      : c.doseType === "reinforcing"
        ? `Reinforcing dose (${c.reinforcingReason || "group not recorded"})`
        : c.doseType === "booster"
          ? "Booster after 10 years for prolonged high-risk exposure"
          : "Not recorded";

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-8 print:p-0 print:border-0 print:rounded-none">
      <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yellow Fever Vaccination Record</h1>
          <p className="text-xs text-gray-500 mt-1">{YF_PGD_VERSION}</p>
          <p className="text-xs text-gray-500">YFVC designation number: {c.yfvcCode || "Not recorded"}</p>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p className="font-medium">{summary.consultationDate}</p>
          <p>{summary.consultationTime}</p>
        </div>
      </div>

      <SectionHeader>Patient</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
        <Row
          label="Date of birth"
          value={`${fmtDate(patient.dateOfBirth)} (${patient.age ?? "?"} years${ageMonths !== null && ageMonths < 24 ? `, ${ageMonths} months` : ""})`}
        />
        <Row label="Address" value={patient.address || "Not recorded"} />
        <Row label="NHS number" value={patient.nhsNumber || "Not provided"} />
        <Row label="GP" value={patient.gpPractice || patient.gpName || "Not recorded"} />
        <Row label="Consent" value={consentText} />
      </div>

      <SectionHeader>Travel and Risk Assessment</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Row label="Destination" value={c.destination || "Not recorded"} />
        <Row label="Departure" value={fmtDate(c.departureDate)} />
        <Row
          label="Certificate requirement"
          value={
            c.certificateRequired === "required"
              ? "Required as a condition of entry"
              : c.certificateRequired === "recommended"
                ? "Vaccination recommended; no certificate requirement"
                : c.certificateRequired === "not-required"
                  ? "Neither required nor recommended"
                  : "Not recorded"
          }
        />
        <Row label="MMR" value={c.mmrToday ? "MMR today: not given on the same day" : c.mmrWithin28Days ? `Within 28 days; reason: ${c.mmrWithin28DaysReason || "not recorded"}` : "No MMR within 28 days"} />
        {(c.breastfeedingInfantUnder9m || c.hivPositive || c.lowDoseImmunomodulator) && (
          <Row
            label="Specialist advice"
            value={c.specialistAdviceObtained ? `Obtained: ${c.specialistAdviceDetails || "details not recorded"}` : "Not obtained"}
          />
        )}
      </div>

      {alerts.length > 0 && (
        <>
          <SectionHeader>Clinical Alerts</SectionHeader>
          <div className="space-y-1 mb-6">
            {alerts.map((a) => (
              <p key={a.code} className="text-xs text-gray-800">
                <span className="font-semibold uppercase">{a.severity}:</span> {a.message}
              </p>
            ))}
          </div>
        </>
      )}

      <SectionHeader>{hasStops ? "Outcome" : "Vaccine Administered under this PGD"}</SectionHeader>
      {hasStops ? (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Row label="Outcome" value="NOT VACCINATED: exclusion criteria met" />
          <Row label="Exclusion" value={alerts.filter((a) => a.severity === "stop").map((a) => a.message).join("; ")} />
          <Row label="Explained why and the alternatives" value={c.exclusionExplained ? "Yes" : "Not recorded"} />
          {c.certificateRequired === "required" && (
            <Row label="Medical Letter of Exemption offered" value={c.exemptionLetterDiscussed ? "Yes" : "Not recorded"} />
          )}
          <Row label="Bite avoidance reinforced" value={c.biteAvoidanceAdvice ? "Yes" : "Not recorded"} />
          <Row label="Alternative provision advised" value={c.alternativeProvisionAdvised ? "Yes" : "Not recorded"} />
          <Row label="GP informed" value={c.gpInformed ? "Yes" : "Not recorded"} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Row label="Vaccine (name and brand)" value="Stamaril, yellow fever vaccine (live attenuated 17D-204 strain), powder and solvent for suspension for injection" />
          <Row label="Dose, form and route" value={`0.5 ml reconstituted suspension, ${c.route || "route not recorded"}`} />
          <Row label="Quantity administered" value="1 x 0.5 ml dose" />
          <Row label="Dose type" value={doseText} />
          <Row label="Date of administration" value={summary.consultationDate} />
          <Row label="Batch number" value={c.batchNumber || "Not recorded"} />
          <Row label="Expiry date" value={c.expiryDate || "Not recorded"} />
          <Row label="Anatomical site" value={c.site || "Not recorded"} />
          {c.otherVaccinesSites && <Row label="Other vaccines and sites" value={c.otherVaccinesSites} />}
          <Row label="Immuniser" value={c.administeringClinician || summary.pharmacistName || "Not recorded"} />
          <Row label="Adrenaline available before vaccination" value={c.anaphylaxisKit ? "Yes" : "No"} />
          <Row label="15 minute seated observation completed" value={c.observationCompleted ? "Yes" : "No"} />
          <Row
            label="Certificate (ICVP)"
            value={
              c.certificateIssued
                ? `Issued: number ${c.certificateNumber || "not recorded"}, valid from ${fmtDate(c.certificateValidFrom)}`
                : `Not issued: ${c.certificateNotIssuedReason || "reason not recorded"}`
            }
          />
          <Row label="Administered under" value={YF_PGD_VERSION} />
        </div>
      )}

      {!hasStops && (
        <>
          <SectionHeader>Advice Given</SectionHeader>
          <div className="mb-6">
            <CounsellingGrid
              items={[
                ["Certificate valid 10 days after this dose, then for life; replacement if lost", c.validFromExplained],
                ["Patient information leaflet offered", c.pilOffered],
                ["Adverse effects and when to seek urgent attention (fever, jaundice, severe illness)", c.adverseEventAdvice],
                ["Mosquito bite avoidance reinforced; malaria prophylaxis may still be required", c.biteAvoidanceAdvice],
                [
                  c.avoidPregnancyAdvice === "not-applicable" ? "Avoid pregnancy for one month: not applicable" : "Avoid pregnancy for one month after vaccination",
                  c.avoidPregnancyAdvice !== "",
                ],
                ["GP informed", c.gpInformed],
                ...(c.lateTravelAdviceGiven ? ([["Late traveller: certificate not valid in time, entry may be refused", true]] as [string, boolean][]) : []),
              ]}
            />
          </div>
        </>
      )}

      {summary.clinicalNotes && (
        <>
          <SectionHeader>Clinical Notes</SectionHeader>
          <div className="bg-gray-50 rounded p-4 mb-6">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{summary.clinicalNotes}</p>
          </div>
        </>
      )}

      <div className="mt-8 pt-6 border-t border-gray-200">
        <SectionHeader>Pharmacist Declaration</SectionHeader>
        <p className="text-xs text-gray-600 mb-4">
          {hasStops
            ? "I confirm that this consultation was conducted in accordance with the Patient Group Direction for yellow fever vaccine (Stamaril) at a designated Yellow Fever Vaccination Centre, that the patient met an exclusion criterion, that NO vaccine was administered, and that the advice recorded above was given."
            : "I confirm that I am a registered pharmacist administering at a designated Yellow Fever Vaccination Centre, that this vaccine was administered under the Patient Group Direction for yellow fever vaccine (Stamaril), that the patient met the inclusion criteria and no exclusion criteria applied, and that the advice recorded above was given."}
        </p>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Pharmacist name</p>
            <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacistName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">GPhC number</p>
            <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacistGPhC}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Pharmacy</p>
            <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacyName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Signature</p>
            <div className="border-b border-gray-300 min-h-[2rem]" />
          </div>
        </div>
      </div>

      <ReportFooter pgdName="Yellow Fever ePGD" />
    </div>
  );
}
