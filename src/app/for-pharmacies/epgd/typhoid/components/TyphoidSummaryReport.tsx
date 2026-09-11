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
    adverseReaction: boolean;
    adverseReactionDetails: string;
  };
  /** A stop exists: print "not supplied", no vaccine, and a declaration that
   *  does not say "no exclusion criteria applied". */
  isBlocked: boolean;
  exclusionOutcome: {
    adviceGiven: string;
    foodWaterAdviceGiven: boolean;
    referral: string;
  };
}

const REFERRAL_LABEL: Record<string, string> = {
  '': 'Not recorded',
  gp: 'Referred to GP',
  'travel-clinic': 'Referred to a travel clinic',
  'urgent-same-day': 'Urgent same-day assessment (fever after travel)',
  declined: 'Patient declined referral; advice given',
};

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
  isBlocked,
  exclusionOutcome,
}: TyphoidSummaryReportProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 print:border-0">
      {/* Header with print styles */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 print:bg-white print:border-0 print:pb-4">
        <h2 className="text-lg font-bold text-navy-900">Consultation Record</h2>
        <p className="text-sm text-gray-500 mt-1">Typhoid ePGD. Typhoid (Vi Polysaccharide Vaccine) PGD v006, issued 11 September 2026</p>
        {isBlocked && (
          <p className="mt-2 text-sm font-semibold text-red-700">NOT SUPPLIED: exclusion criteria met. No vaccine was administered under this PGD.</p>
        )}
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

        {/* Exclusion outcome, or vaccine administration */}
        {isBlocked ? (
        <div>
          <SectionHeader>Exclusion Outcome</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Reason" value={clinicalAlerts.filter((a) => a.severity === 'stop').map((a) => a.message).join('; ')} />
            <Row label="Food and water hygiene advice given" value={exclusionOutcome.foodWaterAdviceGiven ? 'Yes' : 'No'} />
            <Row label="Advice given and decision" value={exclusionOutcome.adviceGiven || 'Not recorded'} />
            <Row label="Referral" value={REFERRAL_LABEL[exclusionOutcome.referral] ?? exclusionOutcome.referral} />
            <Row label="Vaccine" value="Not supplied" />
          </div>
        </div>
        ) : (
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
            <Row label="Adverse reaction" value={postVaccineAdvice.adverseReaction ? postVaccineAdvice.adverseReactionDetails || 'Yes, details not recorded' : 'None observed'} />
            <Row label="Administered via PGD" value="Yes" />
          </div>
        </div>
        )}

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
        {isBlocked ? (
          <div>
            <SectionHeader>Pharmacist Declaration</SectionHeader>
            <p className="text-xs text-gray-600 mb-4">
              I confirm that this patient was assessed under the Patient Group Direction for Typhoid, that exclusion criteria applied, that no vaccine was administered under the PGD, and that the advice given and the decision reached are recorded above.
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
        ) : (
          <PharmacistDeclaration
            pgdName="Typhoid"
            pharmacistName={summary.pharmacistName}
            pharmacistGPhC={summary.pharmacistGPhC}
            pharmacyName={summary.pharmacyName}
          />
        )}

        <ReportFooter pgdName="Typhoid" />
      </div>
    </div>
  );
}
