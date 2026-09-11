'use client';

import React from 'react';
import { RabiesConsultationState } from '../rabies-types';
import { calculateAge } from '../../shared/types';
import { getDoseVolume, getProductLabel, RABIES_PGD_VERSION } from '../rabies-clinical-logic';

const INDICATION_LABELS: Record<string, string> = {
  'travel-enzootic-area': 'Travel to a rabies enzootic area',
  'occupational-abroad': 'Occupational risk abroad',
  'occupational-uk': 'UK-based occupational risk',
};

const DOSE_NUMBER_LABELS: Record<string, string> = {
  '1st': '1st dose',
  '2nd': '2nd dose',
  '3rd': '3rd dose',
  'one-year-dose': 'Further dose at one year',
  booster: 'Booster',
};

interface RabiesSummaryReportProps {
  state: RabiesConsultationState;
  onPrint: () => void;
}

export default function RabiesSummaryReport({
  state,
  onPrint,
}: RabiesSummaryReportProps): React.ReactNode {
  const patientAge = calculateAge(state.patient.dateOfBirth);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Rabies Pre-exposure Vaccination Consultation Summary
          </h2>
          <button
            onClick={onPrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Print Report
          </button>
        </div>

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

        {/* Travel & Risk Assessment */}
        <section className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Travel & Risk Assessment
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Indication:</span>
              <span className="font-medium text-gray-900">
                {INDICATION_LABELS[state.screening.indication] ?? state.screening.indication}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Destination:</span>
              <span className="font-medium text-gray-900">
                {state.screening.destinationCountry}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Departure date:</span>
              <span className="font-medium text-gray-900">
                {new Date(state.screening.departureDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <p className="text-gray-600 mb-2">High-risk activities:</p>
              <ul className="list-disc list-inside space-y-1">
                {state.screening.highRiskActivities.length > 0 ? (
                  state.screening.highRiskActivities.map((activity) => (
                    <li key={activity} className="text-gray-900">
                      {activity}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-900">None selected</li>
                )}
              </ul>
            </div>
            {state.screening.otherActivities && (
              <div className="flex justify-between">
                <span className="text-gray-600">Other activities or occupational indication:</span>
                <span className="font-medium text-gray-900 text-right">
                  {state.screening.otherActivities}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Sufficient time to complete the chosen course:</span>
              <span className="font-medium text-gray-900">
                {state.screening.sufficientTimeBeforeTravel ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Exposure already occurred (post-exposure):</span>
              <span className="font-medium text-gray-900">
                {state.screening.priorExposure ? 'Yes, referred same day' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Access to post-exposure treatment at destination:</span>
              <span className="font-medium text-gray-900">
                {state.screening.accessToPEP ? 'Yes' : 'Limited/No'}
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
              <span className="text-gray-600">Acute severe febrile illness:</span>
              <span className="font-medium text-gray-900">
                {state.screening.acuteFebrileIllness ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Minor current illness:</span>
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
            {state.screening.pregnant && (
              <div className="flex justify-between">
                <span className="text-gray-600">Pregnancy risk assessment:</span>
                <span className="font-medium text-gray-900 text-right">
                  {state.screening.pregnancyRiskAssessment}
                </span>
              </div>
            )}
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
              <span className="text-gray-600">Anaphylaxis to rabies vaccine or a component:</span>
              <span className="font-medium text-gray-900">
                {state.screening.anaphylaxisToVaccineOrComponent ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Egg allergy:</span>
              <span className="font-medium text-gray-900">
                {state.screening.eggAllergy
                  ? `Yes (${state.screening.eggAllergySeverity})`
                  : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Polymyxin B, streptomycin or neomycin hypersensitivity:</span>
              <span className="font-medium text-gray-900">
                {state.screening.antibioticHypersensitivity ? 'Yes' : 'No'}
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

        {/* Administration Summary */}
        <section className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Vaccine Administration
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Product given:</span>
              <span className="font-medium text-gray-900 text-right">
                {getProductLabel(state.administration.product) || state.administration.vaccineName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dose volume:</span>
              <span className="font-medium text-gray-900">
                {getDoseVolume(state.administration.product)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Route:</span>
              <span className="font-medium text-gray-900">
                {state.administration.route === 'deep-subcutaneous' ? 'Deep subcutaneous' : 'Intramuscular'}
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
                {new Date(state.administration.expiryDate).toLocaleDateString()}
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
              <span className="font-medium text-gray-900 text-right">
                {state.administration.schedule === 'standard'
                  ? 'Conventional (day 0, 7 and 28; third dose may be brought forward to day 21)'
                  : 'Accelerated, off-label (day 0, 3 and 7, further dose at one year if travel to high risk areas continues)'}
              </span>
            </div>
            {state.administration.schedule === 'accelerated' && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reason conventional course not possible:</span>
                  <span className="font-medium text-gray-900 text-right">
                    {state.administration.scheduleReason}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Consent to off-label use (day 0, 3 and 7 schedule):</span>
                  <span className="font-medium text-gray-900">
                    {state.administration.offLabelConsent ? 'Given and recorded' : 'Not recorded'}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Next due dates:</span>
              <span className="font-medium text-gray-900">
                {state.administration.nextDueDates}
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

        {/* Post-Vaccine Observations */}
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
                  : '30 minutes'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">15 minute observation period completed:</span>
              <span className="font-medium text-gray-900">
                {state.postVaccineObs.observationCompleted ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Adrenaline 1 in 1,000, anaphylaxis protocol and telephone available:</span>
              <span className="font-medium text-gray-900">
                {state.postVaccineObs.anaphylaxisKitChecked ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Administered under PGD:</span>
              <span className="font-medium text-gray-900 text-right">
                Yes, {RABIES_PGD_VERSION}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Written record given to patient:</span>
              <span className="font-medium text-gray-900">
                {state.advice.writtenRecordGiven ? 'Yes' : 'No'}
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
          <p>Rabies Pre-exposure Vaccination ePGD | {RABIES_PGD_VERSION} | Confidential Patient Information</p>
          <p>Generated: {new Date().toLocaleString()}</p>
        </section>
      </div>
    </div>
  );
}
