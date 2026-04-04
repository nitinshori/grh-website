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
  RSVPatientDetails,
  RSVConsent,
  RSVSummary,
} from '../rsv-types';

interface RSVSummaryReportProps {
  patientDetails: RSVPatientDetails;
  consent: RSVConsent;
  summary: RSVSummary;
  medicalHistory: {
    anaphylaxisToVaccine: boolean;
    anaphylaxisToVaccineComponent: boolean;
    severeFebrilleIllness: boolean;
    immunosuppressed: boolean;
    bleedingDisorder: boolean;
  };
  clinicalAlerts: ClinicalAlert[];
  postVaccineAdvice: {
    patientAdvised: boolean;
    counselledReactions: boolean;
    counselledNoBooster: boolean;
    counselledSeason: boolean;
  };
  onBack: () => void;
}

export default function RSVSummaryReport({
  patientDetails,
  consent,
  summary,
  medicalHistory,
  clinicalAlerts,
  postVaccineAdvice,
  onBack,
}: RSVSummaryReportProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header with print styles */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 print:bg-white print:border-0 print:pb-4">
        <h2 className="text-lg font-bold text-navy-900">Consultation Summary Report</h2>
        <p className="text-sm text-gray-500 mt-1">RSV Vaccination ePGD</p>
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

        {/* Eligibility Assessment */}
        <div>
          <SectionHeader>RSV Vaccination Eligibility</SectionHeader>
          <div className="space-y-1.5">
            <Row
              label="Patient category"
              value={
                patientDetails.patientCategory === 'adult-60-plus'
                  ? 'Adult 60+ years'
                  : patientDetails.patientCategory === 'pregnant-woman'
                  ? 'Pregnant woman'
                  : 'Not specified'
              }
            />
            {patientDetails.patientCategory === 'pregnant-woman' && patientDetails.pregnancyWeeks && (
              <Row label="Gestational age" value={`${patientDetails.pregnancyWeeks} weeks`} />
            )}
            {patientDetails.patientCategory === 'adult-60-plus' && (
              <Row
                label="At increased risk"
                value={patientDetails.atIncreasedrisk ? 'Yes' : 'No'}
              />
            )}
            {patientDetails.riskFactors && (
              <Row label="Risk factors" value={patientDetails.riskFactors} />
            )}
          </div>
        </div>

        {/* Medical History */}
        <div>
          <SectionHeader>Medical History & Contraindications</SectionHeader>
          <CounsellingGrid
            items={[
              ['Anaphylaxis to previous RSV vaccine', medicalHistory.anaphylaxisToVaccine],
              ['Anaphylaxis to vaccine component', medicalHistory.anaphylaxisToVaccineComponent],
              ['Severe acute febrile illness', medicalHistory.severeFebrilleIllness],
              ['Immunosuppressed', medicalHistory.immunosuppressed],
              ['Bleeding disorder', medicalHistory.bleedingDisorder],
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
            <Row
              label="Vaccine type"
              value={
                summary.vaccineType === 'abrysvo'
                  ? 'Abrysvo (Pfizer)'
                  : summary.vaccineType === 'mresvia'
                  ? 'mRESVIA (Moderna)'
                  : 'Not specified'
              }
            />
            <Row label="Batch number" value={summary.batchNumber} />
            <Row label="Expiry date" value={summary.expiryDate} />
            <Row
              label="Administration site"
              value={
                summary.administrationSite === 'left-deltoid'
                  ? 'Left deltoid (IM)'
                  : 'Right deltoid (IM)'
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
              ['Understands vaccine protection', consent.understandsVaccineProtection],
              ['Understands no booster recommended', consent.understandsNoBooster],
              ['Aware of adverse events', consent.understandsAdverseEvents],
              ...(patientDetails.patientCategory === 'pregnant-woman'
                ? [['Understands ~6 months newborn protection', consent.understands6MonthsProtection || false] as [string, boolean]]
                : []),
              ['Advised of common reactions', !!postVaccineAdvice.counselledReactions] as [string, boolean],
              ['Understands no booster schedule', !!postVaccineAdvice.counselledNoBooster] as [string, boolean],
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
          pgdName="RSV Vaccination"
          pharmacistName={summary.pharmacistName}
          pharmacistGPhC={summary.pharmacistGPhC}
          pharmacyName={summary.pharmacyName}
        />

        <ReportFooter pgdName="RSV Vaccination" />
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
