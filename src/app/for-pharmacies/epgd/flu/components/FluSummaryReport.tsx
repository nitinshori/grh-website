'use client';

import React from 'react';
import { FluConsultationState, FLU_VACCINES, FLU_SEASON } from '../lib/flu-types';
import { calculateAge } from '../../shared/types';
import { hasHardStopContraindications } from '../lib/flu-clinical-logic';

interface FluSummaryReportProps {
  state: FluConsultationState;
  onPrint: () => void;
}

export default function FluSummaryReport({
  state,
  onPrint,
}: FluSummaryReportProps): React.ReactNode {
  const patientAge = calculateAge(state.patient.dateOfBirth);
  const hasStop = hasHardStopContraindications(state.contraindications);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Flu Vaccination Consultation Summary, {FLU_SEASON} season
        </h2>
        <p className="text-xs text-gray-500 mb-6">
          Administered via the Patient Group Direction for seasonal influenza vaccines (IIVc, aIIV, IIVr and IIVe), version 005, issued 11 September 2026.
        </p>

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
                {state.patient.dateOfBirth ? new Date(state.patient.dateOfBirth).toLocaleDateString() : 'Not recorded'} (Age:{' '}
                {patientAge !== null ? patientAge : 'unknown'})
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Phone</p>
              <p className="text-gray-900">{state.patient.phone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Registered GP practice</p>
              <p className="text-gray-900">{state.patient.gpPractice || 'Not recorded'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Consent</p>
              <p className="text-gray-900">
                {state.consent.informedConsentGiven ? 'Informed consent given' : 'Not recorded'}
                {patientAge !== null && patientAge < 16 &&
                  (state.childConsent.basis === 'parental'
                    ? `, by person with parental responsibility: ${state.childConsent.parentName} (${state.childConsent.parentRelationship})`
                    : state.childConsent.basis === 'gillick'
                      ? `, by the young person (Gillick competent: ${state.childConsent.gillickBasis})`
                      : ', basis for under 16 not recorded')}
              </p>
            </div>
          </div>
        </section>

        {/* Screening Summary */}
        <section className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Pre-vaccination Screening
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Previous flu vaccine:</span>
              <span className="font-medium text-gray-900">
                {state.screening.previousFluVaccine ? 'Yes' : 'No'}
              </span>
            </div>
            {state.screening.previousReaction && (
              <div className="flex justify-between">
                <span className="text-gray-600">Previous reaction:</span>
                <span className="font-medium text-gray-900">
                  {state.screening.previousReactionType === 'anaphylaxis' ? 'Confirmed anaphylaxis: ' : ''}
                  {state.screening.reactionDetails}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Already vaccinated this season:</span>
              <span className="font-medium text-gray-900">
                {state.screening.receivedThisSeason ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">NHS entitlement:</span>
              <span className="font-medium text-gray-900">
                {state.screening.nhsStatus === 'not-eligible'
                  ? 'Does not qualify for NHS vaccination'
                  : state.screening.nhsStatus === 'eligible-prefers-private'
                    ? 'Qualifies for NHS vaccination, told, prefers private'
                    : 'Not recorded'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hypersensitivity to active substance or excipient:</span>
              <span className="font-medium text-gray-900">
                {state.screening.hypersensitivityToComponent ? 'Yes' : 'No'}
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
              <span className="text-gray-600">Temperature (°C):</span>
              <span className="font-medium text-gray-900">
                {state.screening.temperature ?? 'Not recorded'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Currently unwell:</span>
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
            <div className="flex justify-between">
              <span className="text-gray-600">Bleeding disorder:</span>
              <span className="font-medium text-gray-900">
                {state.screening.bleedingDisorder
                  ? state.screening.bleedingDisorderAssessedSafe === true
                    ? 'Yes, IM assessed as safe by a clinician'
                    : state.screening.bleedingDisorderAssessedSafe === false
                      ? 'Yes, not assessed'
                      : 'Yes, assessment not recorded'
                  : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Anticoagulation:</span>
              <span className="font-medium text-gray-900">
                {state.screening.anticoagulated ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Previous GBS:</span>
              <span className="font-medium text-gray-900">
                {state.screening.previousGBS ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </section>

        {/* Contraindications Check */}
        <section className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Contraindications Assessment
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Anaphylaxis to previous dose:</span>
              <span className="font-medium text-gray-900">
                {state.contraindications.anaphylaxisToPreviousDose
                  ? 'CONTRAINDICATED'
                  : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Egg allergy (egg-free vaccine required):</span>
              <span className="font-medium text-gray-900">
                {state.screening.eggAllergy ? 'Yes, IIVc or IIVr only' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hypersensitivity to component:</span>
              <span className="font-medium text-gray-900">
                {state.contraindications.hypersensitivityToComponent ? 'CONTRAINDICATED' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Already vaccinated this season:</span>
              <span className="font-medium text-gray-900">
                {state.contraindications.alreadyVaccinatedThisSeason ? 'CONTRAINDICATED' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bleeding disorder unassessed:</span>
              <span className="font-medium text-gray-900">
                {state.contraindications.bleedingDisorderUnassessed ? 'CONTRAINDICATED' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Acute febrile illness:</span>
              <span className="font-medium text-gray-900">
                {state.contraindications.acuteFebrileIllness
                  ? 'CONTRAINDICATED'
                  : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Aged 2 years or over:</span>
              <span className="font-medium text-gray-900">
                {state.contraindications.ageAppropriate ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </section>

        {/* Vaccine Administration */}
        <section className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Vaccine Administration Details
          </h3>
          {hasStop ? (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Outcome:</span>
              <span className="font-medium text-red-700">NOT SUPPLIED: exclusion criteria met (see clinical alerts)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Advice given:</span>
              <span className="font-medium text-gray-900">
                {state.summary.clinicalNotes || 'Advised on alternative options and how to access them; informed or referred to the GP as appropriate'}
              </span>
            </div>
          </div>
          ) : (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Vaccine type:</span>
              <span className="font-medium text-gray-900">
                {state.administration.vaccineName
                  ? `${state.administration.vaccineName.toUpperCase().replace('IIVC', 'IIVc').replace('AIIV', 'aIIV').replace('IIVR', 'IIVr').replace('IIVE', 'IIVe')}: ${FLU_VACCINES[state.administration.vaccineName].label}`
                  : 'Not recorded'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Brand (as on pack):</span>
              <span className="font-medium text-gray-900">
                {state.administration.brandName || 'Not recorded'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Season:</span>
              <span className="font-medium text-gray-900">{FLU_SEASON}</span>
            </div>
            {state.administration.doseNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">Dose (child under 9, first course):</span>
                <span className="font-medium text-gray-900">
                  {state.administration.doseNumber} of 2
                  {state.administration.doseNumber === '1' && state.administration.nextDoseDue
                    ? `, second dose due ${state.administration.nextDoseDue}`
                    : ''}
                  {state.administration.doseNumber === '2' && state.administration.previousDoseDate
                    ? `, dose 1 given ${state.administration.previousDoseDate}`
                    : ''}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Date administered:</span>
              <span className="font-medium text-gray-900">{state.summary.consultationDate}</span>
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
                {state.administration.expiryDate}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Injection site:</span>
              <span className="font-medium text-gray-900">
                {state.administration.injectionSite.replace(/-/g, ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Route:</span>
              <span className="font-medium text-gray-900">
                {state.administration.route}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dose volume:</span>
              <span className="font-medium text-gray-900">
                {state.administration.doseVolume}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Administered by:</span>
              <span className="font-medium text-gray-900">
                {state.administration.administeredBy}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time administered:</span>
              <span className="font-medium text-gray-900">
                {state.administration.timeAdministered}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Adrenaline 1 in 1,000 available:</span>
              <span className="font-medium text-gray-900">
                {state.administration.adrenalineAvailable ? 'Yes' : 'No'}
              </span>
            </div>
            {state.administration.coAdministeredVaccine && (
              <div className="flex justify-between">
                <span className="text-gray-600">Other vaccine given at this visit:</span>
                <span className="font-medium text-gray-900">
                  {state.administration.coAdministeredVaccine}
                </span>
              </div>
            )}
          </div>
          )}
        </section>

        {/* Advice given */}
        <section className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Advice Given
          </h3>
          <div className="space-y-2 text-sm">
            {[
              ['Side effects and their management', state.advice.commonReactions],
              ['Serious reactions, seek medical advice, Yellow Card reporting', state.advice.seriousReactions],
              ['Pain relief advice', state.advice.paracetamolAdvice],
              ['When to seek help', state.advice.returnIfConcerned],
              ['Protection over 10 to 14 days, lasts the season, annual revaccination', state.advice.annualRevaccination],
              ['Cannot cause influenza; no protection against other infections; not 100%', state.advice.cannotCauseFlu],
              ['PIL and written record of vaccine given', state.advice.pilAndRecordGiven],
              ...(state.administration.doseNumber === '1'
                ? [['Written confirmation of second dose date', state.advice.secondDoseDateGiven] as [string, boolean]]
                : []),
            ].map(([label, done]) => (
              <div key={String(label)} className="flex justify-between">
                <span className="text-gray-600">{label}:</span>
                <span className="font-medium text-gray-900">{done ? 'Yes' : 'No'}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Post-vaccination Observations */}
        <section className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Post-vaccination Observations
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Observation period:</span>
              <span className="font-medium text-gray-900">
                {state.postVaccineObs.observationPeriod}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Observation period completed, patient seated:</span>
              <span className="font-medium text-gray-900">
                {state.postVaccineObs.observationCompleted ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Patient well:</span>
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
            <div className="flex justify-between">
              <span className="text-gray-600">Anaphylaxis kit checked:</span>
              <span className="font-medium text-gray-900">
                {state.postVaccineObs.anaphylaxisKitChecked ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </section>

        {/* Clinical Alerts */}
        {state.alerts.length > 0 && (
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Clinical Notes
            </h3>
            <div className="space-y-4">
              {state.alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    alert.severity === 'stop'
                      ? 'bg-red-50 border border-red-200'
                      : alert.severity === 'caution'
                        ? 'bg-yellow-50 border border-yellow-200'
                        : 'bg-orange-50 border border-orange-200'
                  }`}
                >
                  <p
                    className={`font-semibold ${
                      alert.severity === 'stop'
                        ? 'text-red-900'
                        : alert.severity === 'caution'
                          ? 'text-yellow-900'
                          : 'text-orange-900'
                    }`}
                  >
                    {alert.message}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">{alert.detail}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Immuniser declaration (PGD records row: name and registration number of the healthcare professional administering) */}
        <section className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Immuniser Declaration
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            {hasStop
              ? `I confirm that this consultation was conducted in accordance with the Patient Group Direction for seasonal influenza vaccines (${FLU_SEASON}), version 005, that an exclusion criterion applied, that no vaccine was administered, and that the patient was advised as recorded above.`
              : `I confirm that this vaccine was administered in accordance with the Patient Group Direction for seasonal influenza vaccines (${FLU_SEASON}), version 005, that the patient met the inclusion criteria and that no exclusion criterion applied.`}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Name of immuniser</p>
              <p className="text-gray-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{state.summary.pharmacistName || ''}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">GPhC number</p>
              <p className="text-gray-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{state.summary.pharmacistGPhC || ''}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Signature and date</p>
              <div className="border-b border-gray-300 min-h-[2rem]" />
            </div>
          </div>
          {state.summary.clinicalNotes && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-600">Clinical notes</p>
              <p className="text-gray-900 whitespace-pre-wrap">{state.summary.clinicalNotes}</p>
            </div>
          )}
        </section>

        {/* Print Button */}
        <div className="flex justify-end gap-4 pt-6">
          <button
            onClick={onPrint}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {hasStop ? 'Save as not supplied' : 'Save & Print Record'}
          </button>
        </div>
      </div>
    </div>
  );
}
