'use client';

import React from 'react';
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from '../../shared/components/SummaryReportShell';
import type { ClinicalAlert } from '../../shared/types';
import type {
  YellowFeverPatientDetails,
  YellowFeverConsent,
  YellowFeverSummary,
} from '../yellow-fever-types';

interface YellowFeverSummaryReportProps {
  patientDetails: YellowFeverPatientDetails;
  consent: YellowFeverConsent;
  summary: YellowFeverSummary;
  medicalHistory: {
    anaphylaxisToVaccine: boolean;
    anaphylaxisToVaccineComponent: boolean;
    severeFebrilleIllness: boolean;
    bleedingDisorder: boolean;
    immunosuppressed: boolean;
  };
  clinicalAlerts: ClinicalAlert[];
  postVaccineAdvice: {
    patientAdvised: boolean;
    counselledReactions: boolean;
    counselledValidity: boolean;
    counselledCertificate: boolean;
  };
  onBack: () => void;
}

export default function YellowFeverSummaryReport({
  patientDetails,
  consent,
  summary,
  medicalHistory,
  clinicalAlerts,
  postVaccineAdvice,
  onBack,
}: YellowFeverSummaryReportProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header with print styles */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 print:bg-white print:border-0 print:pb-4">
        <h2 className="text-lg font-bold text-navy-900">Consultation Summary Report</h2>
        <p className="text-sm text-gray-500 mt-1">Yellow Fever ePGD</p>
      </div>

      {/* Report content */}
      <div className="px-6 py-6 space-y-6 print:space-y-4">
        {/* Patient Details */}
        <div>
          <SectionHeader>Patient Details</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Name" value={`${patientDetails.firstName} ${patientDetails.lastName}`} />
            <Row label="Date of Birth" value={patientDetails.dateOfBirth} />
            <Row label="Age" value={patientDetails.age !== null ? `${patientDetails.age} years` : 'N/A'} />
            <Row label="NHS Number" value={patientDetails.nhsNumber || 'Not provided'} />
            <Row label="GP Name" value={patientDetails.gpName || 'Not provided'} />
            <Row label="GP Practice" value={patientDetails.gpPractice || 'Not provided'} />
          </div>
        </div>

        {/* Travel Information */}
        <div>
          <SectionHeader>Travel Assessment</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Destination" value={patientDetails.travelDestination} />
            <Row label="Reason for travel" value={patientDetails.travelReason || 'Not specified'} />
            <Row label="Departure date" value={patientDetails.departureDate} />
            <Row
              label="Previous YellowFever dose"
              value={
                patientDetails.previousYellowFeverDose
                  ? `Yes (${patientDetails.previousDoseDate || 'date not specified'})`
                  : 'No'
              }
            />
          </div>
        </div>

        {/* Medical History */}
        <div>
          <SectionHeader>Medical History & Risk Factors</SectionHeader>
          <CounsellingGrid
            items={[
              ['Anaphylaxis to previous YellowFever', medicalHistory.anaphylaxisToVaccine],
              ['Anaphylaxis to vaccine component', medicalHistory.anaphylaxisToVaccineComponent],
              ['Severe acute febrile illness', medicalHistory.severeFebrilleIllness],
              ['Bleeding disorder', medicalHistory.bleedingDisorder],
              ['Immunosuppressed', medicalHistory.immunosuppressed],
            ]}
          />
        </div>

        {/* Clinical Alerts */}
        <div>
          <SectionHeader>Clinical Alerts</SectionHeader>
          <AlertSummary alerts={clinicalAlerts} />
        </div>

        {/* Vaccine Administration */}
        <div>
          <SectionHeader>Vaccine Administration</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Vaccine type" value={summary.vaccineType === 'nimenrix' ? 'Nimenrix' : 'Menveo'} />
            <Row label="Batch number" value={summary.batchNumber} />
            <Row label="Expiry date" value={summary.expiryDate} />
            <Row
              label="Administration site"
              value={
                summary.administrationSite === 'left-deltoid'
                  ? 'Left deltoid'
                  : 'Right deltoid'
              }
            />
            <Row label="Administration time" value={summary.administrationTime} />
          </div>
        </div>

        {/* Patient Counselling */}
        <div>
          <SectionHeader>Patient Counselling & Consent</SectionHeader>
          <CounsellingGrid
            items={[
              ['Informed consent obtained', consent.informedConsentGiven],
              ['ID verified', consent.idVerified],
              ['Patient aware of private service', consent.patientAwarePrivateService],
              ['Understands 5-year validity', consent.understands5YearValidity],
              ['Understands ≥10 days before travel timing', consent.understandsTimingRequirement],
              ['Aware of certificate requirement', consent.certificateRequirement],
              ['Advised of common reactions', postVaccineAdvice.counselledReactions],
              ['Understands vaccine validity period', postVaccineAdvice.counselledValidity],
              ['Advised to report serious adverse events', postVaccineAdvice.counselledCertificate],
            ]}
          />
        </div>

        {/* Clinical Notes */}
        {summary.clinicalNotes && (
          <div>
            <SectionHeader>Clinical Notes</SectionHeader>
            <p className="text-xs text-gray-600 whitespace-pre-wrap">{summary.clinicalNotes}</p>
          </div>
        )}

        {/* Consultation Details */}
        <div>
          <SectionHeader>Consultation Details</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Consultation date" value={summary.consultationDate} />
            <Row label="Consultation time" value={summary.consultationTime} />
          </div>
        </div>

        {/* Pharmacist Declaration */}
        <PharmacistDeclaration
          pgdName="Yellow Fever"
          pharmacistName={summary.pharmacistName}
          pharmacistGPhC={summary.pharmacistGPhC}
          pharmacyName={summary.pharmacyName}
        />

        <ReportFooter pgdName="Yellow Fever" />
      </div>

      {/* Back button */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-navy-900 transition-colors"
        >
          &larr; Back to Consultation
        </button>
        <button
          onClick={() => window.print()}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-navy-900 hover:bg-navy-950 text-white transition-colors"
        >
          Print Consultation Record
        </button>
      </div>
    </div>
  );
}
