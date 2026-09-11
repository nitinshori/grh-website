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
  RSVMedicalHistory,
  RSVPostVaccineAdvice,
} from '../rsv-types';

interface RSVSummaryReportProps {
  patientDetails: RSVPatientDetails;
  consent: RSVConsent;
  summary: RSVSummary;
  medicalHistory: RSVMedicalHistory;
  clinicalAlerts: ClinicalAlert[];
  postVaccineAdvice: RSVPostVaccineAdvice;
  nhsStatus?: '' | 'not-eligible' | 'eligible-prefers-private';
}

/**
 * The printed consultation record. Rendered inside the final step so that
 * StepWrapper's Save & Print prints it (it used to be unreachable).
 */
export default function RSVSummaryReport({
  patientDetails,
  consent,
  summary,
  medicalHistory,
  clinicalAlerts,
  postVaccineAdvice,
  nhsStatus,
}: RSVSummaryReportProps) {
  const hasStop = clinicalAlerts.some((a) => a.severity === 'stop');
  const vaccineLabel =
    summary.vaccineType === 'abrysvo'
      ? 'Abrysvo powder and solvent for solution for injection (Pfizer)'
      : summary.vaccineType === 'arexvy'
        ? 'Arexvy powder and suspension for suspension for injection (GSK)'
        : 'Not specified';
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header with print styles */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 print:bg-white print:border-0 print:pb-4">
        <h2 className="text-lg font-bold text-navy-900">Consultation Summary Report</h2>
        <p className="text-sm text-gray-500 mt-1">RSV Vaccination ePGD (Abrysvo or Arexvy PGD v006)</p>
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
            <Row label="Address" value={patientDetails.address || 'Not provided'} />
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
            <Row
              label="NHS eligibility"
              value={
                nhsStatus === 'not-eligible'
                  ? 'Does not qualify for a free NHS vaccination'
                  : nhsStatus === 'eligible-prefers-private'
                  ? 'Qualifies for NHS vaccination, prefers private'
                  : 'Not recorded'
              }
            />
          </div>
        </div>

        {patientDetails.age !== null && patientDetails.age < 16 && (
          <div>
            <SectionHeader>Consent (under 16)</SectionHeader>
            <div className="space-y-1.5">
              <Row
                label="Consent given by"
                value={
                  consent.consentBasis === 'parental'
                    ? `Person with parental responsibility: ${consent.parentName} (${consent.parentRelationship})`
                    : consent.consentBasis === 'gillick'
                    ? 'Young person, assessed as Gillick competent'
                    : 'Not recorded'
                }
              />
              {consent.consentBasis === 'gillick' && (
                <Row label="Gillick assessment basis" value={consent.gillickBasis || 'Not recorded'} />
              )}
            </div>
          </div>
        )}

        {/* Medical History */}
        <div>
          <SectionHeader>Medical History & Contraindications</SectionHeader>
          <CounsellingGrid
            items={[
              ['Already received a complete dose of an RSV vaccine', medicalHistory.previousRSVVaccine],
              ['Severe allergic reaction to a previous RSV vaccine', medicalHistory.anaphylaxisToVaccine],
              ['Severe allergic reaction to any vaccine component', medicalHistory.anaphylaxisToVaccineComponent],
              ['Acute febrile illness', medicalHistory.severeFebrilleIllness],
              ['Pregnant or breastfeeding (Arexvy exclusion)', medicalHistory.pregnantOrBreastfeeding],
              ['Immunocompromised (caution)', medicalHistory.immunosuppressed],
              ['Coagulation disorder (caution)', medicalHistory.bleedingDisorder],
              ['Influenza vaccine same day (caution)', medicalHistory.fluVaccineSameDay],
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
          {hasStop ? (
            <div className="space-y-1.5">
              <Row label="Outcome" value="NOT SUPPLIED: exclusion criteria met (see clinical alerts above)" />
              <Row
                label="Advice given"
                value={summary.clinicalNotes || 'Advised on alternative options and how to access them; informed or referred to the GP as appropriate'}
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Row label="Vaccine type" value={vaccineLabel} />
              <Row label="Dose and route" value="0.5 mL intramuscular injection" />
              <Row label="Batch number" value={summary.batchNumber} />
              <Row label="Expiry date" value={summary.expiryDate} />
              <Row
                label="Administration site"
                value={
                  summary.administrationSite === 'left-deltoid'
                    ? 'Left deltoid (IM)'
                    : summary.administrationSite === 'right-deltoid'
                      ? 'Right deltoid (IM)'
                      : 'Not recorded'
                }
              />
              <Row label="Administration time" value={summary.administrationTime} />
              <Row
                label="15 minute observation"
                value={postVaccineAdvice.observedFifteenMinutes ? 'Completed' : 'NOT recorded'}
              />
            </div>
          )}
        </div>

        {/* Adverse reactions (PGD records row) */}
        <div>
          <SectionHeader>Adverse Reactions</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Adverse reaction" value={postVaccineAdvice.adverseReaction.trim() || 'None observed'} />
            {postVaccineAdvice.adverseReaction.trim() && (
              <>
                <Row label="Action taken" value={postVaccineAdvice.adverseReactionAction || 'Not recorded'} />
                <Row
                  label="Yellow Card"
                  value={postVaccineAdvice.yellowCardSubmitted ? 'Reported via yellowcard.mhra.gov.uk' : 'Not yet reported'}
                />
              </>
            )}
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
              ['Advised on side effects and when to seek medical attention', !!postVaccineAdvice.counselledReactions] as [string, boolean],
              ['Follow-up advice given (PGD v006 list)', !!postVaccineAdvice.followUpAdviceGiven] as [string, boolean],
              ['Patient information leaflet supplied', !!postVaccineAdvice.pilSupplied] as [string, boolean],
              ['Understands one-time vaccination', !!postVaccineAdvice.counselledNoBooster] as [string, boolean],
            ]}
          />
        </div>

        <p className="text-[10px] text-gray-500">
          Patient Group Direction for Abrysvo or Arexvy (RSV), version 006, issued 11 September 2026.
        </p>

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

        {/* Practitioner Declaration */}
        {hasStop ? (
          <>
            <SectionHeader>Practitioner Declaration</SectionHeader>
            <p className="text-xs text-gray-600 mb-4">
              I confirm that this consultation was conducted in accordance with the Patient Group
              Direction for Abrysvo or Arexvy (RSV), that an exclusion criterion applied, that the
              vaccine was NOT administered, and that the patient was advised as recorded above.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Practitioner name</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">
                  {summary.pharmacistName || ''}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">GPhC number</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">
                  {summary.pharmacistGPhC || ''}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Pharmacy</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">
                  {summary.pharmacyName || ''}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Signature</p>
                <div className="border-b border-gray-300 min-h-[2rem]" />
              </div>
            </div>
          </>
        ) : (
          <PharmacistDeclaration
            pgdName="Abrysvo or Arexvy (RSV) vaccination"
            pharmacistName={summary.pharmacistName}
            pharmacistGPhC={summary.pharmacistGPhC}
            pharmacyName={summary.pharmacyName}
          />
        )}

        <ReportFooter pgdName="RSV Vaccination" />
      </div>
    </div>
  );
}
