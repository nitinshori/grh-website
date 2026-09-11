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
  TyphoidPatientDetails,
  TyphoidConsent,
  TyphoidSummary,
} from '../typhoid-types';

interface TyphoidSummaryReportProps {
  patientDetails: TyphoidPatientDetails;
  consent: TyphoidConsent;
  summary: TyphoidSummary;
  medicalHistory: {
    anaphylaxisToVaccine: boolean;
    anaphylaxisToVaccineComponent: boolean;
    severeFebrilleIllness: boolean;
    feverAfterTravel: boolean;
    pregnantOrBreastfeeding: boolean;
    pregnancyDecision: string;
    bleedingDisorder: boolean;
    immunosuppressed: boolean;
  };
  clinicalAlerts: ClinicalAlert[];
  postVaccineAdvice: {
    patientAdvised: boolean;
    counselledReactions: boolean;
    counselledValidity: boolean;
    counselledCertificate: boolean;
    counselledFoodWater: boolean;
    counselledFeverWarning: boolean;
    observationCompleted: boolean;
  };
  onBack: () => void;
}

const CONSENT_BASIS_LABEL: Record<string, string> = {
  self: 'Patient (aged 16 and over)',
  parental: 'Person with parental responsibility',
  gillick: 'Young person, assessed as Gillick competent',
};

export default function TyphoidSummaryReport({
  patientDetails,
  consent,
  summary,
  medicalHistory,
  clinicalAlerts,
  postVaccineAdvice,
  onBack,
}: TyphoidSummaryReportProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header with print styles */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 print:bg-white print:border-0 print:pb-4">
        <h2 className="text-lg font-bold text-navy-900">Consultation Summary Report</h2>
        <p className="text-sm text-gray-500 mt-1">Typhoid ePGD. Typhoid (Vi Polysaccharide Vaccine) PGD v005, issued 11 September 2026</p>
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
            <Row label="Risk region" value={patientDetails.travelReason || 'Not specified'} />
            <Row label="Departure date" value={patientDetails.departureDate} />
            <Row label="Itinerary" value={patientDetails.itinerary || 'Not recorded'} />
            <Row label="Source consulted for the recommendation" value={patientDetails.recommendationSource || 'Not recorded'} />
            <Row
              label="Previous Typhoid dose"
              value={
                patientDetails.previousTyphoidDose
                  ? `Yes (${patientDetails.previousDoseDate || 'date not specified'})${patientDetails.previousDoseRenewalReason ? `; renewal reason: ${patientDetails.previousDoseRenewalReason}` : ''}`
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
              ['Anaphylaxis to previous typhoid vaccine', medicalHistory.anaphylaxisToVaccine],
              ['Anaphylaxis to vaccine component', medicalHistory.anaphylaxisToVaccineComponent],
              ['Acute severe febrile illness', medicalHistory.severeFebrilleIllness],
              ['Fever following recent travel to a risk area', medicalHistory.feverAfterTravel],
              ['Pregnant or breastfeeding', medicalHistory.pregnantOrBreastfeeding],
              ['Bleeding disorder or anticoagulation', medicalHistory.bleedingDisorder],
              ['Immunosuppressed', medicalHistory.immunosuppressed],
            ]}
          />
          {medicalHistory.pregnantOrBreastfeeding && (
            <div className="mt-2">
              <Row label="Pregnancy or breastfeeding decision" value={medicalHistory.pregnancyDecision || 'Not recorded'} />
            </div>
          )}
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
              label="Vaccine"
              value={
                summary.vaccineType === 'typhim-vi'
                  ? 'Typhim Vi (Sanofi), typhoid Vi polysaccharide vaccine 25 micrograms in 0.5 mL'
                  : summary.vaccineType === 'other-vi'
                  ? `${summary.vaccineBrand || 'Brand not recorded'}, Vi polysaccharide typhoid vaccine 25 micrograms in 0.5 mL`
                  : 'Not recorded'
              }
            />
            <Row label="Dose and route" value="0.5 mL by intramuscular injection" />
            <Row label="Batch number" value={summary.batchNumber} />
            <Row label="Expiry date" value={summary.expiryDate} />
            <Row
              label="Administration site"
              value={
                summary.administrationSite === 'left-deltoid'
                  ? 'Left deltoid'
                  : summary.administrationSite === 'right-deltoid'
                  ? 'Right deltoid'
                  : 'Not recorded'
              }
            />
            <Row label="Administration time" value={summary.administrationTime} />
            <Row label="Next booster due" value={summary.nextBoosterDue || 'Not recorded'} />
            <Row label="Adrenaline 1 in 1,000, anaphylaxis protocol and telephone available" value={summary.adrenalineAvailable ? 'Confirmed' : 'Not confirmed'} />
            <Row label="15 minute observation completed" value={postVaccineAdvice.observationCompleted ? 'Yes' : 'No'} />
          </div>
        </div>

        {/* Patient Counselling */}
        <div>
          <SectionHeader>Patient Counselling & Consent</SectionHeader>
          <div className="space-y-1.5 mb-3">
            <Row label="Consent given by" value={CONSENT_BASIS_LABEL[patientDetails.consentBasis] || 'Not recorded'} />
            {patientDetails.consentDetail && (
              <Row
                label={patientDetails.consentBasis === 'gillick' ? 'Basis of Gillick assessment' : 'Person with parental responsibility'}
                value={patientDetails.consentDetail}
              />
            )}
          </div>
          <CounsellingGrid
            items={[
              ['Informed consent obtained', consent.informedConsentGiven],
              ['ID verified', consent.idVerified],
              ['Patient aware of private service', consent.patientAwarePrivateService],
              ['Understands booster every 3 years if travel continues', consent.understands5YearValidity],
              ['Understands at least 2 weeks before travel timing', consent.understandsTimingRequirement],
              ['Understands 70 to 80% efficacy, no paratyphoid cover, food and water precautions', consent.certificateRequirement],
              ['Food and water hygiene advice given and sheet supplied', postVaccineAdvice.counselledFoodWater],
              ['Post-travel fever warning given', postVaccineAdvice.counselledFeverWarning],
              ['Advised of common reactions, PIL supplied', postVaccineAdvice.counselledReactions],
              ['Understands booster every 3 years', postVaccineAdvice.counselledValidity],
              ['Advised to report adverse reactions (Yellow Card)', postVaccineAdvice.counselledCertificate],
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
          pgdName="Typhoid"
          pharmacistName={summary.pharmacistName}
          pharmacistGPhC={summary.pharmacistGPhC}
          pharmacyName={summary.pharmacyName}
        />

        <ReportFooter pgdName="Typhoid" />
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
