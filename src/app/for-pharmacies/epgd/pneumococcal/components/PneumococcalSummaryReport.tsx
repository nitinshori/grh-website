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
  PneumococcalPatientDetails,
  PneumococcalConsent,
  PneumococcalSummary,
} from '../pneumococcal-types';
import { CKD_CRITERION_LABELS, OTHER_ELIGIBILITY_LABELS } from '../pneumococcal-types';

interface PneumococcalSummaryReportProps {
  patientDetails: PneumococcalPatientDetails;
  consent: PneumococcalConsent;
  summary: PneumococcalSummary;
  riskAssessment: {
    confirmedRiskCategory?: boolean;
    reviewedVaccineHistory?: boolean;
    previousPCV13: boolean;
    previousPCV13Date: string;
    previousPCV20?: boolean;
    previousPCV20Date?: string;
    previousPPV23: boolean;
    previousPPV23Date: string;
    previousOtherPCV?: boolean;
    previousOtherPCVDate?: string;
    pcv20Under2RiskSchedule?: boolean;
  };
  medicalHistory: {
    anaphylaxisToVaccine: boolean;
    anaphylaxisToVaccineComponent: boolean;
    diphtheriaToxoidHypersensitivity?: boolean;
    severeFebrilleIllness: boolean;
    bleedingDisorder?: boolean;
    severeImmunocompromise?: boolean;
    currentOrRecentChemoRadiotherapy?: boolean;
    pregnant?: boolean;
    requiredProductNotHeld?: boolean;
    patientDeclined?: boolean;
  };
  clinicalAlerts: ClinicalAlert[];
  /** Advice given and decision reached where the patient was excluded (PGD records row). */
  exclusionAdvice?: string;
  postVaccineAdvice: {
    patientAdvised: boolean;
    counselledReactions: boolean;
    counselledBothVaccines: boolean;
    pilSupplied?: boolean;
    followUpAdviceGiven?: boolean;
    observationCompleted?: boolean;
  };
  /** Standalone use: back button and print footer. */
  onBack?: () => void;
  /** Rendered inside the summary step, where StepWrapper owns Save & Print. */
  embedded?: boolean;
}

const SITE_LABELS: Record<string, string> = {
  'left-deltoid': 'Left deltoid (IM)',
  'right-deltoid': 'Right deltoid (IM)',
  'left-arm-sc': 'Left upper arm (SC)',
  'right-arm-sc': 'Right upper arm (SC)',
};

const RISK_LABELS: Record<string, string> = {
  asplenia: 'Asplenia or splenic dysfunction',
  ckd: 'Chronic kidney disease (nephrotic syndrome, CKD stage 4 or 5, dialysis or kidney transplant)',
  'chronic-disease': 'Chronic disease',
  immunosuppressed: 'Immunosuppressed',
  cochlear: 'Cochlear implant',
  'csf-leak': 'Cerebrospinal fluid leak',
  'age-65-plus': 'Adult aged 65 years and over',
  'other-national-guidance': 'Other group eligible under national guidance',
  'not-eligible': 'Not in an eligible group (not authorised under this PGD)',
};

export default function PneumococcalSummaryReport({
  patientDetails,
  consent,
  summary,
  riskAssessment,
  medicalHistory,
  clinicalAlerts,
  exclusionAdvice,
  postVaccineAdvice,
  onBack,
  embedded = false,
}: PneumococcalSummaryReportProps) {
  const stopped = clinicalAlerts.some((a) => a.severity === 'stop');
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header with print styles */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 print:bg-white print:border-0 print:pb-4">
        <h2 className="text-lg font-bold text-navy-900">Consultation Summary Report</h2>
        <p className="text-sm text-gray-500 mt-1">Pneumococcal Vaccination ePGD</p>
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
          </div>
        </div>

        {/* Risk Assessment */}
        <div>
          <SectionHeader>Risk Assessment</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Eligibility group" value={RISK_LABELS[patientDetails.riskCategory] || 'Not specified'} />
            {patientDetails.riskCategory === 'ckd' && (
              <Row
                label="CKD criterion (Green Book Table 2)"
                value={
                  patientDetails.ckdCriterion
                    ? CKD_CRITERION_LABELS[patientDetails.ckdCriterion]
                    : 'Not recorded'
                }
              />
            )}
            {patientDetails.chronicDiseaseType && (
              <Row label="Chronic disease type" value={patientDetails.chronicDiseaseType} />
            )}
            {patientDetails.immunosuppressedReason && (
              <Row label="Immunosuppression reason" value={patientDetails.immunosuppressedReason} />
            )}
            {patientDetails.riskCategory === 'other-national-guidance' && (
              <Row
                label="National guidance group"
                value={
                  patientDetails.otherEligibilityReason
                    ? OTHER_ELIGIBILITY_LABELS[patientDetails.otherEligibilityReason]
                    : 'Not recorded'
                }
              />
            )}
            <Row label="Risk category confirmed as documented" value={riskAssessment.confirmedRiskCategory ? 'Yes' : 'No'} />
            <Row
              label="Previous PCV13 (Prevenar 13), history only"
              value={
                riskAssessment.previousPCV13
                  ? `Yes (${riskAssessment.previousPCV13Date})`
                  : 'No'
              }
            />
            <Row
              label="Previous PCV20 (Prevenar 20) at 2 years or older"
              value={
                riskAssessment.previousPCV20
                  ? `Yes (${riskAssessment.previousPCV20Date})`
                  : 'No'
              }
            />
            <Row
              label="Prevenar 20 under 2 years on the risk-group schedule"
              value={riskAssessment.pcv20Under2RiskSchedule ? 'Yes: referred to the GP to complete Green Book Table 3' : 'No'}
            />
            <Row
              label="Previous PPV23 (Pneumovax 23)"
              value={
                riskAssessment.previousPPV23
                  ? `Yes (${riskAssessment.previousPPV23Date})`
                  : 'No'
              }
            />
            <Row
              label="Vaxneuvance (PCV15) or Capvaxive (PCV21) at 2 years or older"
              value={
                riskAssessment.previousOtherPCV
                  ? `Yes (${riskAssessment.previousOtherPCVDate || 'date not recorded'})`
                  : 'No'
              }
            />
            <Row label="Vaccine history reviewed" value={riskAssessment.reviewedVaccineHistory ? 'Yes' : 'No'} />
          </div>
        </div>

        {/* Consent basis, under 16 */}
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
              ['Severe allergic reaction to a previous pneumococcal vaccine', medicalHistory.anaphylaxisToVaccine],
              ['Hypersensitivity to the vaccine or any component', medicalHistory.anaphylaxisToVaccineComponent],
              ['Hypersensitivity to diphtheria toxoid (CRM197)', Boolean(medicalHistory.diphtheriaToxoidHypersensitivity)],
              ['Acute illness with fever', medicalHistory.severeFebrilleIllness],
              ['Severe immunocompromise (BMT, leukaemia, myeloma, genetic immune disorder): referred', Boolean(medicalHistory.severeImmunocompromise)],
              ['Current or recent chemotherapy or radiotherapy: not given, referred to the treating team', Boolean(medicalHistory.currentOrRecentChemoRadiotherapy)],
              ['Pregnant (caution in both arms, not an exclusion; SmPC has no data, patient told)', Boolean(medicalHistory.pregnant)],
              ['Bleeding disorder, thrombocytopenia or anticoagulation (caution)', Boolean(medicalHistory.bleedingDisorder)],
              ['Only product the patient can have under the PGD not held today', Boolean(medicalHistory.requiredProductNotHeld)],
              ['Patient declined vaccination', Boolean(medicalHistory.patientDeclined)],
            ]}
          />
        </div>

        {/* Clinical Alerts */}
        <div>
          <SectionHeader>Clinical Alerts</SectionHeader>
          <AlertSummary alerts={clinicalAlerts} />
        </div>

        {/* Advice given where excluded (PGD records row) */}
        {exclusionAdvice && (
          <div>
            <SectionHeader>Advice Given and Decision Reached</SectionHeader>
            <p className="text-xs text-gray-600 whitespace-pre-wrap">{exclusionAdvice}</p>
          </div>
        )}

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
            <Row
              label="Vaccine type"
              value={summary.vaccineType === 'pcv20' ? 'Prevenar 20 (PCV20)' : summary.vaccineType === 'ppv23' ? 'Pneumovax 23 (PPV23)' : 'Not recorded'}
            />
            <Row label="Dose and route" value={`0.5 mL ${summary.administrationSite.endsWith('-sc') ? 'subcutaneous' : 'intramuscular'}`} />
            <Row
              label="Dose in sequence"
              value={
                summary.doseNumber === '1'
                  ? 'First pneumococcal dose under this PGD'
                  : summary.doseNumber === '2'
                    ? `5-yearly revaccination (asplenia, splenic dysfunction or chronic kidney disease)${summary.vaccineType === 'pcv20' ? ': Prevenar 20 given once, later cycles Pneumovax 23' : ''}`
                    : 'Not recorded'
              }
            />
            <Row label="Batch number" value={summary.batchNumber} />
            <Row label="Expiry date" value={summary.expiryDate} />
            <Row
              label="Administration site"
              value={SITE_LABELS[summary.administrationSite] || 'Not recorded'}
            />
            <Row label="Administration time" value={summary.administrationTime} />
            <Row label="15 minute observation completed" value={postVaccineAdvice.observationCompleted ? 'Yes' : 'No'} />
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
              ['Understands why vaccination needed', consent.understandsVaccineNeed],
              ['Understands vaccination schedule', consent.understandsSchedule],
              ['Aware of possible side effects', consent.understandsSideEffects],
              ['Informed of side effects and when to seek help', postVaccineAdvice.counselledReactions],
              ['Follow-up advice given (seek medical advice for a severe or persistent injection site reaction, a fever not settling within 48 hours, or any sign of allergic reaction; 999 for difficulty breathing, face or throat swelling, or collapse; revaccination only for asplenia, splenic dysfunction and CKD every 5 years with Pneumovax 23 or via the GP)', Boolean(postVaccineAdvice.followUpAdviceGiven)],
              ['Patient information leaflet supplied', Boolean(postVaccineAdvice.pilSupplied)],
              ['Understands whether revaccination is due', postVaccineAdvice.counselledBothVaccines],
            ]}
          />
        </div>

        <p className="text-[10px] text-gray-500">
          Patient Group Direction for Pneumovax 23 or Prevenar 20 (pneumococcal disease), version 008, issued 24 September 2026.
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

        {/* Pharmacist Declaration */}
        <PharmacistDeclaration
          pgdName="Pneumococcal Vaccination"
          pharmacistName={summary.pharmacistName}
          pharmacistGPhC={summary.pharmacistGPhC}
          pharmacyName={summary.pharmacyName}
        />

        <ReportFooter pgdName="Pneumococcal Vaccination" />
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
