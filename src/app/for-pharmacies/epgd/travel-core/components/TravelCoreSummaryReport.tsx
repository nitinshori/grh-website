"use client";

import type { TravelCoreConsultationState } from "../lib/travel-core-types";
import { TRAVEL_CORE_PGD_VERSION } from "../lib/travel-core-types";
import { getVaccineDoseText, type BoosterDue } from "../lib/travel-core-clinical-logic";

const PGD_NAME = "Hepatitis A (Havrix/Avaxim), Typhoid (Typhim Vi) and Cholera (Dukoral) Travel Health";

const PLAN_LABEL: Record<string, string> = {
  "": "Not recorded",
  "not-required": "Not required per TravelHealthPro (bite avoidance only)",
  "supplied-antimalarials-pgd": "Supplied under the anti-malarials PGD (separate record)",
  "referred-antimalarials-pgd": "Booked for an anti-malarials PGD consultation",
  "referred-gp-travel-clinic": "Referred to GP or travel health clinic",
  declined: "Declined; risks explained",
};

const REFERRAL_LABEL: Record<string, string> = {
  "": "Not recorded",
  "gp-informed": "GP informed",
  "gp-referred": "Referred to GP",
  "travel-clinic": "Referred to a travel health clinic",
  declined: "Patient declined referral; advice given",
};
import type { ClinicalAlert } from "../../shared/types";

const SITE_LABEL: Record<string, string> = {
  "left-deltoid": "Left deltoid",
  "right-deltoid": "Right deltoid",
};
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from "../../shared/components/SummaryReportShell";

interface TravelCoreSummaryReportProps {
  state: TravelCoreConsultationState;
  alerts: ClinicalAlert[];
  boosterDue: BoosterDue[];
  /** A stop exists: the record prints "not supplied", no vaccine, and a
   *  declaration that does not say "no exclusion criteria applied". */
  isBlocked: boolean;
}

export function TravelCoreSummaryReport({
  state,
  alerts,
  boosterDue,
  isBlocked,
}: TravelCoreSummaryReportProps) {
  const { patient, destination, malariaRisk, preventiveMeasures, medicinesSupplied, vaccines, summary } = state;
  const anyVaccine = (vaccines.hepAGiven || vaccines.typhoidGiven || vaccines.choleraGiven) && !isBlocked;
  const doseLines = getVaccineDoseText(vaccines);

  return (
    <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm print:shadow-none">
      {/* Header */}
      <div className="mb-6 pb-6 border-b-2 border-gray-300">
        <h1 className="text-lg font-bold text-navy-900">
          Travel Health Vaccination Consultation Record
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Destination: {destination.destination} | Duration:{" "}
          {destination.duration || "N/A"} days
        </p>
        <p className="text-xs text-gray-500 mt-1">{TRAVEL_CORE_PGD_VERSION}</p>
        {isBlocked && (
          <p className="mt-2 text-sm font-semibold text-red-700">NOT SUPPLIED: exclusion criteria met. No vaccine was administered under this PGD.</p>
        )}
      </div>

      {/* Patient Details */}
      <SectionHeader>Patient Details</SectionHeader>
      <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
      <Row label="Age" value={patient.age ? `${patient.age} years` : "N/A"} />
      <Row label="DOB" value={patient.dateOfBirth} />
      <Row label="NHS Number" value={patient.nhsNumber || "Not provided"} />
      <Row label="GP" value={patient.gpName || "Not provided"} />

      {/* Clinical Alerts */}
      <SectionHeader>Clinical Alerts</SectionHeader>
      <AlertSummary alerts={alerts} />

      {/* Destination Assessment */}
      <SectionHeader>Destination Assessment</SectionHeader>
      <Row label="Destination" value={destination.destination} />
      <Row label="Departure Date" value={destination.departureDate} />
      <Row label="Return Date" value={destination.returnDate} />
      <Row label="Duration" value={`${destination.duration || 0} days`} />
      <Row
        label="Malaria Endemic Zone"
        value={destination.isEndemicMalariaZone ? "Yes" : "No"}
      />
      <Row
        label="Food/Water Risk"
        value={destination.foodWaterRiskLevel.charAt(0).toUpperCase() + destination.foodWaterRiskLevel.slice(1)}
      />
      <Row
        label="Sun Exposure Risk"
        value={destination.sunExposureRisk.charAt(0).toUpperCase() + destination.sunExposureRisk.slice(1)}
      />

      {/* Malaria Risk (advice only; chemoprophylaxis is outside this PGD) */}
      {malariaRisk.malariaZone && (
        <>
          <SectionHeader>Malaria Risk Assessment (advice only)</SectionHeader>
          <Row label="Malaria Zone" value="Yes" />
          <Row label="TravelHealthPro note" value={malariaRisk.resistanceProfile || "N/A"} />
          <Row
            label="Chemoprophylaxis Advised"
            value={malariaRisk.chemoprophylaxisAdvised ? "Yes" : "No"}
          />
          <Row label="Chemoprophylaxis plan" value={PLAN_LABEL[malariaRisk.chemoprophylaxisPlan] ?? malariaRisk.chemoprophylaxisPlan} />
        </>
      )}

      {/* Preventive Measures Advised */}
      <SectionHeader>Preventive Measures Advised</SectionHeader>
      <CounsellingGrid
        items={[
          ["Insect Repellent", preventiveMeasures.insectRepellentAdvised],
          ["Bed Net Use", preventiveMeasures.bedNetAdvised],
          ["Light Clothing", preventiveMeasures.lightClothingAdvised],
          ["Vaccination Check", preventiveMeasures.vaccineCheckAdvised],
          ["Sun Protection", preventiveMeasures.sunProtectionAdvised],
          ["Food/Water Precautions", preventiveMeasures.foodWaterPrecautionsAdvised],
        ]}
      />
      {preventiveMeasures.travellersVaccineNotes && (
        <Row label="Vaccine Notes" value={preventiveMeasures.travellersVaccineNotes} />
      )}

      {/* Medicines &amp; Supplies */}
      <SectionHeader>Medicines &amp; Supplies Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ["Bite Avoidance Kit", medicinesSupplied.biteAvoidanceKitSupplied],
          ["Anti-Diarrhoeals", medicinesSupplied.antidiarrhoealsAdvised],
          ["First Aid Kit", medicinesSupplied.firstAidKitAdvised],
          ["Antihistamine", medicinesSupplied.antihistamineSupplied],
          ["Skin Cream", medicinesSupplied.skinCreamSupplied],
        ]}
      />
      {medicinesSupplied.otherMedicinesNotes && (
        <Row label="Other Medicines" value={medicinesSupplied.otherMedicinesNotes} />
      )}

      {/* Exclusion outcome, or vaccines administered under the PGD */}
      {isBlocked ? (
        <>
          <SectionHeader>Exclusion Outcome</SectionHeader>
          <Row label="Reason" value={alerts.filter((a) => a.severity === "stop").map((a) => a.message).join("; ")} />
          <Row label="Advice given and decision" value={vaccines.exclusionAdvice || "Not recorded"} />
          <Row label="GP informed or referral" value={REFERRAL_LABEL[vaccines.exclusionReferral] ?? vaccines.exclusionReferral} />
          <Row label="Vaccines" value="Not supplied" />
        </>
      ) : (
        <>
          <SectionHeader>Vaccines Administered Under This PGD</SectionHeader>
          {!anyVaccine && (
            <Row label="Vaccines" value={vaccines.noVaccineToday ? "No vaccine administered at this visit" : "None recorded"} />
          )}
          {vaccines.hepAGiven && (
            <>
              <Row
                label="Hepatitis A"
                value={`${vaccines.hepAProduct === "havrix" ? "Havrix Monodose 1440 EL.U/1.0 mL, 1.0 mL" : vaccines.hepAProduct === "avaxim" ? "Avaxim 160 U/0.5 mL, 0.5 mL" : "Product not recorded"}; ${vaccines.hepADose === "booster" ? `booster dose (primary dose ${vaccines.hepAPrimaryDoseDate || "date not recorded"}, ${vaccines.hepAPrimaryProduct || "product not recorded"})` : "primary dose"}; intramuscular`}
              />
              <Row label="Hepatitis A batch / expiry / site" value={`${vaccines.hepABatch} / ${vaccines.hepAExpiry} / ${SITE_LABEL[vaccines.hepASite] || "Not recorded"}`} />
            </>
          )}
          {vaccines.typhoidGiven && (
            <>
              <Row label="Typhoid" value={`Typhim Vi 25 mcg/0.5 mL, 0.5 mL, intramuscular${vaccines.typhoidPreviousDose ? ` (previous dose ${vaccines.typhoidPreviousDoseDate || "date not recorded"})` : ""}`} />
              <Row label="Typhim Vi batch / expiry / site" value={`${vaccines.typhoidBatch} / ${vaccines.typhoidExpiry} / ${SITE_LABEL[vaccines.typhoidSite] || "Not recorded"}`} />
            </>
          )}
          {vaccines.choleraGiven && (
            <>
              <Row label="Cholera" value={`Dukoral, oral, one 3 mL vial with buffer; ${vaccines.choleraDose === "booster" ? `booster (last course ${vaccines.choleraLastCourseDate || "date not recorded"})` : `primary course dose ${vaccines.choleraDose || "?"} of 2${vaccines.choleraDose === "2" ? ` (dose 1 on ${vaccines.choleraDose1Date || "date not recorded"})` : ""}`}`} />
              <Row label="Dukoral batch / expiry" value={`${vaccines.choleraBatch} / ${vaccines.choleraExpiry}`} />
            </>
          )}
          {anyVaccine && (
            <>
              {boosterDue.map((b) => (
                <Row key={b.vaccine} label={`${b.vaccine}: next dose or booster due`} value={b.due ? `${b.due}. ${b.note}` : b.note} />
              ))}
              <Row label="Date of administration" value={summary.consultationDate} />
              <Row label="Administered via PGD" value="Yes" />
              <Row label="Adverse reaction" value={vaccines.adverseReaction ? vaccines.adverseReactionDetails || "Yes, details not recorded" : "None observed"} />
              <CounsellingGrid
                items={[
                  ["Adrenaline 1 in 1,000, telephone and anaphylaxis protocol available", vaccines.adrenalineAvailable],
                  ["15 minute seated observation completed", vaccines.observationCompleted],
                  ["PIL supplied and booster schedule explained", vaccines.pilSupplied],
                  ["Follow-up advice given", vaccines.followUpAdviceGiven],
                ]}
              />
              {doseLines.map((line, i) => (
                <p key={i} className="text-xs text-gray-600 mt-1">{line}</p>
              ))}
            </>
          )}
        </>
      )}

      {/* Pharmacist Declaration */}
      {isBlocked ? (
        <>
          <SectionHeader>Pharmacist Declaration</SectionHeader>
          <p className="text-xs text-gray-600 mb-4">
            I confirm that this patient was assessed under the Patient Group Direction for {PGD_NAME}, that exclusion criteria applied, that no vaccine was administered under the PGD, and that the advice given and the decision reached are recorded above.
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
        </>
      ) : (
        <PharmacistDeclaration
          pgdName={PGD_NAME}
          pharmacistName={summary.pharmacistName}
          pharmacistGPhC={summary.pharmacistGPhC}
          pharmacyName={summary.pharmacyName}
        />
      )}

      {/* Clinical Notes */}
      <SectionHeader>Clinical Notes</SectionHeader>
      <div className="text-xs text-navy-900 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200 min-h-[60px]">
        {summary.clinicalNotes || "No additional notes"}
      </div>

      {/* Consultation Details */}
      <SectionHeader>Consultation Details</SectionHeader>
      <Row label="Date" value={summary.consultationDate} />
      <Row label="Time" value={summary.consultationTime} />
      <Row label="Pharmacy" value={summary.pharmacyName || "N/A"} />
      <Row label="Address" value={summary.pharmacyAddress || "N/A"} />

      <ReportFooter pgdName={PGD_NAME} />
    </div>
  );
}
