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
  MeningitisACWYPatientDetails,
  MeningitisACWYConsent,
  MeningitisACWYSummary,
  MeningitisACWYMedicalHistory,
  MeningitisACWYPostVaccineAdvice,
} from '../meningitis-acwy-travel-types';

const SITE_LABELS: Record<string, string> = {
  'left-deltoid': 'Left deltoid',
  'right-deltoid': 'Right deltoid',
  'left-thigh': 'Left anterolateral thigh',
  'right-thigh': 'Right anterolateral thigh',
};

const DOSE_NUMBER_LABELS: Record<string, string> = {
  single: 'Single dose',
  '1st': '1st dose of two (infant course)',
  '2nd': '2nd dose of two (infant course)',
  'booster-12-months': 'Booster at 12 months of age',
  'repeat-certificate': 'Repeat for certificate (previous dose more than 5 years ago)',
};

interface MeningitisACWYSummaryReportProps {
  patientDetails: MeningitisACWYPatientDetails;
  consent: MeningitisACWYConsent;
  summary: MeningitisACWYSummary;
  medicalHistory: MeningitisACWYMedicalHistory;
  clinicalAlerts: ClinicalAlert[];
  postVaccineAdvice: MeningitisACWYPostVaccineAdvice;
  pgdVersion?: string;
  /** Standalone use: back button and print footer. */
  onBack?: () => void;
  /** Rendered inside the summary step, where StepWrapper owns Save & Print. */
  embedded?: boolean;
}

export default function MeningitisACWYSummaryReport({
  patientDetails,
  consent,
  summary,
  medicalHistory,
  clinicalAlerts,
  postVaccineAdvice,
  pgdVersion,
  onBack,
  embedded = false,
}: MeningitisACWYSummaryReportProps) {
  const underSixteen = patientDetails.age !== null && patientDetails.age < 16;
  const stopped = clinicalAlerts.some((a) => a.severity === 'stop');
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header with print styles */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 print:bg-white print:border-0 print:pb-4">
        <h2 className="text-lg font-bold text-navy-900">Consultation Summary Report</h2>
        <p className="text-sm text-gray-500 mt-1">Meningitis ACWY Travel ePGD{pgdVersion ? `, ${pgdVersion}` : ''}</p>
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
            <Row label="Address" value={patientDetails.address || 'Not provided'} />
            <Row label="GP Name" value={patientDetails.gpName || 'Not provided'} />
            <Row label="GP Practice" value={[patientDetails.gpPractice, patientDetails.gpAddress].filter(Boolean).join(', ') || 'Not provided'} />
            {underSixteen && (
              <Row
                label="Under 16 consent basis"
                value={
                  consent.consentBasis === 'gillick'
                    ? `Gillick competent: ${consent.consentGiverDetails}`
                    : `Parental responsibility: ${consent.consentGiverDetails}`
                }
              />
            )}
          </div>
        </div>

        {/* Travel Information */}
        <div>
          <SectionHeader>Travel Assessment</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Destination" value={patientDetails.travelDestination} />
            <Row label="Passport number" value={patientDetails.passportNumber || 'Not recorded'} />
            <Row label="Reason for travel" value={patientDetails.travelReason || 'Not specified'} />
            <Row label="Departure date" value={patientDetails.departureDate} />
            <Row
              label="Previous MenACWY dose"
              value={
                patientDetails.previousMenACWYDose
                  ? `Yes (${patientDetails.previousDoseDate || 'date not specified'})`
                  : 'No'
              }
            />
            {patientDetails.repeatDoseReason && (
              <Row label="Reason for repeat dose" value={patientDetails.repeatDoseReason} />
            )}
          </div>
        </div>

        {/* Medical History */}
        <div>
          <SectionHeader>Medical History & Risk Factors</SectionHeader>
          <CounsellingGrid
            items={[
              ['Anaphylaxis to previous dose of the same vaccine', medicalHistory.anaphylaxisToVaccine],
              ['Anaphylaxis to excipient or manufacturing residue', medicalHistory.anaphylaxisToVaccineComponent],
              ['Hypersensitivity to diphtheria toxoid or CRM197 (Menveo excluded)', medicalHistory.diphtheriaToxoidHypersensitivity],
              ['Acute severe febrile illness', medicalHistory.severeFebrilleIllness],
              ['Outbreak or contact management', medicalHistory.outbreakOrContact],
              ['Pregnant', medicalHistory.pregnant],
              ['Bleeding disorder or anticoagulation', medicalHistory.bleedingDisorder],
              ['Immunosuppressed', medicalHistory.immunosuppressed],
              ['Asplenia, complement deficiency or complement inhibitor', medicalHistory.nhsEligibleRiskGroup],
            ]}
          />
        </div>

        {/* Clinical Alerts */}
        <div>
          <SectionHeader>Clinical Alerts</SectionHeader>
          <AlertSummary alerts={clinicalAlerts} />
        </div>

        {/* Vaccine Administration */}
        {stopped ? (
          <div>
            <SectionHeader>Vaccine Administration</SectionHeader>
            <div className="p-3 rounded-lg border border-red-300 bg-red-50 text-sm">
              <p className="font-semibold text-red-900">Outcome: NOT SUPPLIED. Exclusion criteria met; no vaccine administered.</p>
              <p className="text-red-800 text-xs mt-1">
                {clinicalAlerts.filter((a) => a.severity === 'stop').map((a) => a.message).join('; ')}
              </p>
            </div>
          </div>
        ) : (
        <div>
          <SectionHeader>Vaccine Administration</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Vaccine type" value={summary.vaccineType === 'nimenrix' ? 'Nimenrix' : summary.vaccineType === 'menquadfi' ? 'MenQuadfi' : summary.vaccineType === 'menveo' ? 'Menveo' : 'Not recorded'} />
            <Row label="Batch number" value={summary.batchNumber} />
            <Row label="Expiry date" value={summary.expiryDate} />
            <Row label="Dose and route" value="0.5 mL intramuscular" />
            <Row
              label="Administration site"
              value={SITE_LABELS[summary.administrationSite] ?? summary.administrationSite}
            />
            <Row label="Dose number" value={DOSE_NUMBER_LABELS[summary.doseNumber] ?? summary.doseNumber} />
            {summary.nextDueDate && <Row label="Next dose due" value={summary.nextDueDate} />}
            <Row label="Administration time" value={summary.administrationTime} />
            <Row label="15 minute observation completed" value={postVaccineAdvice.observationCompleted ? 'Yes' : 'No'} />
            <Row label="Administered under PGD" value={pgdVersion ? `Yes, ${pgdVersion}` : 'Yes'} />
          </div>
        </div>
        )}

        {/* Patient Counselling */}
        <div>
          <SectionHeader>Patient Counselling & Consent</SectionHeader>
          <CounsellingGrid
            items={[
              ['Informed consent obtained', consent.informedConsentGiven],
              ['ID verified', consent.idVerified],
              ['Patient aware of private service', consent.patientAwarePrivateService],
              ['Understands conjugate certificate accepted for 5 years', consent.understands5YearValidity],
              ['Understands at least 10 days before arrival timing', consent.understandsTimingRequirement],
              ['Aware of certificate requirement', consent.certificateRequirement],
              ['Patient information leaflet supplied', postVaccineAdvice.leafletGiven],
              ['Advised of common reactions', postVaccineAdvice.counselledReactions],
              ['Understands vaccine validity period', postVaccineAdvice.counselledValidity],
              ['Certificate states conjugate vaccine; 10 days before arrival', postVaccineAdvice.counselledConjugateCertificate],
              ['Told vaccine does not protect against group B', postVaccineAdvice.counselledNotMenB],
              ['Meningitis and septicaemia signs counselled', postVaccineAdvice.counselledMeningitisSigns],
              ['Next dose booked (where a course is involved)', postVaccineAdvice.nextDoseBooked],
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
          pgdName="Meningitis ACWY Travel"
          pharmacistName={summary.pharmacistName}
          pharmacistGPhC={summary.pharmacistGPhC}
          pharmacyName={summary.pharmacyName}
        />

        <ReportFooter pgdName="Meningitis ACWY Travel" />
      </div>

      {/* Back button (standalone use only) */}
      {!embedded && (
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
      )}
    </div>
  );
}
