'use client';

import React from 'react';
import { JapaneseEncephalitisConsultationState } from '../japanese-encephalitis-types';
import { calculateAge } from '../../shared/types';
import { calculateAgeInMonths, getDoseVolume, JE_PGD_VERSION } from '../japanese-encephalitis-clinical-logic';

const RISK_CATEGORY_LABELS: Record<string, string> = {
  'recommended-residence': 'Recommended: residence in an endemic or epidemic area',
  'recommended-long-stay': 'Recommended: stay of one month or longer in an endemic area during the transmission season',
  'recommended-frequent-travel': 'Recommended: frequent travel to endemic areas',
  'recommended-laboratory': 'Recommended: laboratory work with potential exposure',
  'consider-higher-risk-itinerary': 'Consider: shorter stay with a higher risk itinerary or activity',
  'consider-uncertain-itinerary': 'Consider: uncertain itinerary or duration within an endemic area',
  'not-recommended-urban-short-stay': 'Not recommended: short urban stay under one month, low risk itinerary (exclusion)',
};

const DOSE_NUMBER_LABELS: Record<string, string> = {
  '1st': '1st dose (primary course)',
  '2nd': '2nd dose (primary course)',
  booster: 'First booster',
  'second-booster': 'Second booster',
};

const REFERRAL_LABELS: Record<string, string> = {
  '': 'Not recorded',
  gp: 'GP informed or referred',
  'travel-clinic': 'Referred to a travel clinic',
  specialist: 'Referred to a specialist service',
  urgent: 'Urgent referral, urgency made explicit',
  declined: 'No referral needed or declined; advice given',
};

interface JapaneseEncephalitisSummaryReportProps {
  state: JapaneseEncephalitisConsultationState;
  onPrint: () => void;
  /** A stop exists: print "not supplied" and the exclusion outcome, no vaccine. */
  blocked?: boolean;
  nextDoseNote?: string;
}

export default function JapaneseEncephalitisSummaryReport({
  state,
  onPrint,
  blocked = false,
  nextDoseNote = '',
}: JapaneseEncephalitisSummaryReportProps): React.ReactNode {
  const patientAge = calculateAge(state.patient.dateOfBirth);
  const patientAgeMonths = calculateAgeInMonths(state.patient.dateOfBirth);
  const doseVolume = getDoseVolume(patientAgeMonths);
  const stopMessages = state.alerts.filter((a) => a.severity === 'stop').map((a) => a.message);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Japanese Encephalitis Vaccination Consultation Record
          </h2>
          <button
            onClick={onPrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition print:hidden"
          >
            {blocked ? 'Print Exclusion Record' : 'Save & Print Record'}
          </button>
        </div>
        {blocked && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg">
            <p className="text-sm font-semibold text-red-800">NOT SUPPLIED: exclusion criteria met. No vaccine was administered under this PGD.</p>
            <div className="mt-2 space-y-1 text-sm text-red-900">
              <p><span className="text-gray-600">Reason: </span>{stopMessages.join('; ') || 'Not recorded'}</p>
              <p><span className="text-gray-600">Advice given and decision reached: </span>{state.screening.exclusionAdvice || 'Not recorded'}</p>
              <p><span className="text-gray-600">GP informed or referral: </span>{REFERRAL_LABELS[state.screening.exclusionReferral] ?? state.screening.exclusionReferral}</p>
            </div>
          </div>
        )}

        {/* Patient Details Section */}
        <section className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Patient Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Name</p>
              <p className="text-gray-900">
                {state.patient.firstName} {state.patient.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">NHS Number</p>
              <p className="text-gray-900">{state.patient.nhsNumber}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Date of Birth</p>
              <p className="text-gray-900">
                {new Date(state.patient.dateOfBirth).toLocaleDateString()} (Age:{' '}
                {patientAge})
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Phone</p>
              <p className="text-gray-900">{state.patient.phone}</p>
            </div>
          </div>
        </section>

        {/* Travel Assessment Summary */}
        <section className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Travel Assessment
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Destination:</span>
              <span className="font-medium text-gray-900">
                {state.screening.destinationCountry}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Risk area:</span>
              <span className="font-medium text-gray-900">
                {state.screening.riskArea}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Green Book risk category:</span>
              <span className="font-medium text-gray-900 text-right">
                {RISK_CATEGORY_LABELS[state.screening.riskCategory] ?? state.screening.riskCategory}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sufficient time to complete primary course before travel:</span>
              <span className="font-medium text-gray-900">
                {state.screening.sufficientTimeBeforeTravel ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Season of travel:</span>
              <span className="font-medium text-gray-900">
                {state.screening.seasonOfTravel}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Departure date:</span>
              <span className="font-medium text-gray-900">
                {new Date(state.screening.departureDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Travel duration:</span>
              <span className="font-medium text-gray-900">
                {state.screening.travelDuration}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Outdoor activities:</span>
              <span className="font-medium text-gray-900">
                {state.screening.outdoorActivities ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Continued exposure risk:</span>
              <span className="font-medium text-gray-900">
                {state.screening.continuedRisk ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </section>

        {/* Medical History Summary */}
        <section className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Medical History
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Temperature (°C):</span>
              <span className="font-medium text-gray-900">
                {state.screening.temperature ?? 'Not recorded'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Severe febrile illness:</span>
              <span className="font-medium text-gray-900">
                {state.screening.severeFebrileIllness ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current illness:</span>
              <span className="font-medium text-gray-900">
                {state.screening.currentIllness ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Immunosuppressed:</span>
              <span className="font-medium text-gray-900">
                {state.screening.immunosuppressed ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pregnant:</span>
              <span className="font-medium text-gray-900">
                {state.screening.pregnant ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Breastfeeding:</span>
              <span className="font-medium text-gray-900">
                {state.screening.breastfeeding ? 'Yes' : 'No'}
              </span>
            </div>
            {state.screening.breastfeeding && (
              <div className="flex justify-between">
                <span className="text-gray-600">Breastfeeding risk assessment:</span>
                <span className="font-medium text-gray-900 text-right">
                  {state.screening.breastfeedingRiskAssessment}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Anaphylaxis to Ixiaro or a component:</span>
              <span className="font-medium text-gray-900">
                {state.screening.anaphylaxisToVaccineOrComponent ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hypersensitivity after first dose:</span>
              <span className="font-medium text-gray-900">
                {state.screening.hypersensitivityAfterFirstDose ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bleeding disorder, thrombocytopenia or anticoagulation:</span>
              <span className="font-medium text-gray-900">
                {state.screening.bleedingDisorder ? 'Yes (deep subcutaneous route)' : 'No'}
              </span>
            </div>
            {patientAge !== null && patientAge < 16 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Under 16 consent basis:</span>
                <span className="font-medium text-gray-900 text-right">
                  {state.screening.consentBasis === 'gillick'
                    ? `Gillick competent: ${state.screening.consentGiverDetails}`
                    : `Parental responsibility: ${state.screening.consentGiverDetails}`}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Administration Summary (not printed when the patient was excluded) */}
        {!blocked && (
        <section className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Vaccine Administration
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Vaccine:</span>
              <span className="font-medium text-gray-900">
                {state.administration.vaccineName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Batch number:</span>
              <span className="font-medium text-gray-900">
                {state.administration.batchNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Expiry date:</span>
              <span className="font-medium text-gray-900">
                {state.administration.expiryDate ? new Date(state.administration.expiryDate).toLocaleDateString() : 'Not recorded'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dose:</span>
              <span className="font-medium text-gray-900">
                {doseVolume}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Route:</span>
              <span className="font-medium text-gray-900">
                {state.administration.route === 'deep-subcutaneous' ? 'Deep subcutaneous' : 'Intramuscular'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Injection site:</span>
              <span className="font-medium text-gray-900">
                {state.administration.injectionSite.replace('-', ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dose number:</span>
              <span className="font-medium text-gray-900">
                {DOSE_NUMBER_LABELS[state.administration.doseNumber] ?? state.administration.doseNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Schedule:</span>
              <span className="font-medium text-gray-900">
                {state.administration.schedule === 'standard'
                  ? 'Conventional (day 0 and day 28)'
                  : 'Rapid (day 0 and day 7)'}
              </span>
            </div>
            {state.administration.offLabelRapidConsent && (
              <div className="flex justify-between">
                <span className="text-gray-600">Off-label rapid schedule:</span>
                <span className="font-medium text-gray-900">
                  Explained and explicit consent documented
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Next dose due:</span>
              <span className="font-medium text-gray-900 text-right">
                {state.administration.nextDueDate ? new Date(state.administration.nextDueDate).toLocaleDateString() : 'No further dose scheduled'}
                {nextDoseNote ? <span className="block text-xs font-normal text-gray-600">{nextDoseNote}</span> : null}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Adrenaline 1:1000 and anaphylaxis protocol confirmed before administration:</span>
              <span className="font-medium text-gray-900">
                {state.administration.anaphylaxisKitChecked ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time administered:</span>
              <span className="font-medium text-gray-900">
                {state.administration.timeAdministered}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Administered by:</span>
              <span className="font-medium text-gray-900">
                {state.administration.administeredBy}
              </span>
            </div>
          </div>
        </section>
        )}

        {/* Post-Vaccine Observations */}
        {!blocked && (
        <section className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Post-Vaccine Observations
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Observation period:</span>
              <span className="font-medium text-gray-900">
                {state.postVaccineObs.observationPeriod === '15-min'
                  ? '15 minutes'
                  : state.postVaccineObs.observationPeriod === '30-min'
                  ? '30 minutes'
                  : 'Not recorded'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Observation period completed, seated:</span>
              <span className="font-medium text-gray-900">
                {state.postVaccineObs.observationCompleted ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Administered via PGD:</span>
              <span className="font-medium text-gray-900">
                Yes, {JE_PGD_VERSION}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">GP to be informed:</span>
              <span className="font-medium text-gray-900">
                {state.consent.notifyGp ? 'Yes, copy of consultation to GP' : 'Inform GP as appropriate'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Patient well post-vaccination:</span>
              <span className="font-medium text-gray-900">
                {state.postVaccineObs.patientWell ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Adverse reaction:</span>
              <span className="font-medium text-gray-900">
                {state.postVaccineObs.adverseReaction ? 'Yes' : 'No'}
              </span>
            </div>
            {state.postVaccineObs.adverseReaction && (
              <div className="flex justify-between">
                <span className="text-gray-600">Reaction details:</span>
                <span className="font-medium text-gray-900">
                  {state.postVaccineObs.reactionDetails}
                </span>
              </div>
            )}
          </div>
        </section>
        )}

        {/* Pharmacist Declaration */}
        <section className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Pharmacist Declaration
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Pharmacist name:</span>
              <span className="font-medium text-gray-900">
                {state.summary.pharmacistName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">GPhC number:</span>
              <span className="font-medium text-gray-900">
                {state.summary.pharmacistGPhC}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pharmacy:</span>
              <span className="font-medium text-gray-900">
                {state.summary.pharmacyName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium text-gray-900">
                {new Date(state.summary.consultationDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time:</span>
              <span className="font-medium text-gray-900">
                {state.summary.consultationTime}
              </span>
            </div>
          </div>
        </section>

        {state.summary.clinicalNotes && (
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Clinical Notes
            </h3>
            <p className="text-gray-900 whitespace-pre-wrap">
              {state.summary.clinicalNotes}
            </p>
          </section>
        )}

        <section className="text-center text-xs text-gray-500 py-4 border-t border-gray-200">
          <p>Japanese Encephalitis Vaccination ePGD | {JE_PGD_VERSION} | Confidential Patient Information</p>
          <p>Generated: {new Date().toLocaleString()}</p>
        </section>
      </div>
    </div>
  );
}
