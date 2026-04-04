"use client";

import type { TravelCoreConsultationState } from "../lib/travel-core-types";
import type { ClinicalAlert } from "../../shared/types";
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
}

export function TravelCoreSummaryReport({
  state,
  alerts,
}: TravelCoreSummaryReportProps) {
  const { patient, destination, malariaRisk, preventiveMeasures, medicinesSupplied, summary } = state;

  return (
    <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm print:shadow-none">
      {/* Header */}
      <div className="mb-6 pb-6 border-b-2 border-gray-300">
        <h1 className="text-lg font-bold text-navy-900">
          Travel Health Core Package Consultation Record
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Destination: {destination.destination} | Duration:{" "}
          {destination.duration || "N/A"} days
        </p>
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

      {/* Malaria Risk */}
      {destination.isEndemicMalariaZone && (
        <>
          <SectionHeader>Malaria Risk Assessment</SectionHeader>
          <Row label="Malaria Zone" value={malariaRisk.malariaZone ? "Yes" : "No"} />
          <Row label="Resistance Profile" value={malariaRisk.resistanceProfile || "N/A"} />
          <Row
            label="Chemoprophylaxis Advised"
            value={malariaRisk.chemoprophylaxisAdvised ? "Yes" : "No"}
          />
          <Row
            label="Recommended Drug"
            value={malariaRisk.recommendedDrug || "None specified"}
          />
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

      {/* Pharmacist Declaration */}
      <PharmacistDeclaration
        pgdName="Travel Health Core Package"
        pharmacistName={summary.pharmacistName}
        pharmacistGPhC={summary.pharmacistGPhC}
        pharmacyName={summary.pharmacyName}
      />

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

      <ReportFooter pgdName="Travel Health Core Package" />
    </div>
  );
}
