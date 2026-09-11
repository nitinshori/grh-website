'use client';

import React from 'react';
import { DengueConsultationState } from '../dengue-types';
import { calculateAge, type ClinicalAlert } from '../../shared/types';
import { DENGUE_PGD_VERSION } from '../dengue-clinical-logic';
import { CounsellingGrid } from '../../shared/components/SummaryReportShell';

interface DengueSummaryReportProps {
  state: DengueConsultationState;
  /** Live alerts from the client; a stop means the record prints as NOT VACCINATED. */
  alerts: ClinicalAlert[];
  onPrint: () => void;
}

const fmtDate = (d: string): string => (d ? new Date(d).toLocaleDateString('en-GB') : 'Not recorded');

export default function DengueSummaryReport({
  state,
  alerts,
  onPrint,
}: DengueSummaryReportProps): React.ReactNode {
  const patientAge = calculateAge(state.patient.dateOfBirth);
  const hasStops = alerts.some((a) => a.severity === 'stop');

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Dengue Vaccination Consultation Summary
            </h2>
            <p className="text-xs text-gray-500 mt-1">{DENGUE_PGD_VERSION}</p>
          </div>
          <button
            onClick={onPrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition print:hidden"
          >
            Save &amp; Print Record
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
                {fmtDate(state.patient.dateOfBirth)} (Age:{' '}
                {patientAge ?? '?'})
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Phone</p>
              <p className="text-gray-900">{state.patient.phone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Address</p>
              <p className="text-gray-900">{state.patient.address || 'Not recorded'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">GP</p>
              <p className="text-gray-900">
                {state.patient.gpPractice || state.patient.gpName || 'Not recorded'}
                {state.patient.gpPractice && state.patient.gpName ? ` (${state.patient.gpName})` : ''}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Consent</p>
              <p className="text-gray-900">
                {state.consent.informedConsentGiven
                  ? 'Valid informed consent given by the patient (adult, 18 years and over)'
                  : 'Not recorded'}
                {state.consent.idVerified ? '; identity verified' : ''}
              </p>
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
              <span className="text-gray-600">Endemic dengue area:</span>
              <span className="font-medium text-gray-900">
                {state.screening.endemicArea ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Departure date:</span>
              <span className="font-medium text-gray-900">
                {fmtDate(state.screening.departureDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Travel duration:</span>
              <span className="font-medium text-gray-900">
                {state.screening.travelDuration}
              </span>
            </div>
            {state.screening.previousDengueInfection && (
              <div className="flex justify-between">
                <span className="text-gray-600">Previous dengue infection:</span>
                <span className="font-medium text-gray-900">
                  {state.screening.dengueInfectionDetails}
                </span>
              </div>
            )}
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
          </div>
        </section>

        {/* Administration Summary */}
        <section className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {hasStops ? 'Outcome' : 'Vaccine Administration'}
          </h3>
          {hasStops ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Outcome:</span>
                <span className="font-medium text-red-700">NOT VACCINATED: exclusion criteria met</span>
              </div>
              {alerts.filter((a) => a.severity === 'stop').map((a) => (
                <div key={a.code} className="flex justify-between">
                  <span className="text-gray-600">Exclusion:</span>
                  <span className="font-medium text-gray-900">{a.message}</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span className="text-gray-600">Action:</span>
                <span className="font-medium text-gray-900">Advised and referred to the GP as appropriate; advice given recorded below</span>
              </div>
            </div>
          ) : (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Given under:</span>
              <span className="font-medium text-gray-900">{DENGUE_PGD_VERSION}</span>
            </div>
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
                {fmtDate(state.administration.expiryDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dose and route:</span>
              <span className="font-medium text-gray-900">0.5 mL subcutaneous injection</span>
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
                {state.administration.doseNumber}
              </span>
            </div>
            {state.administration.doseNumber === '1st' && (
              <div className="flex justify-between">
                <span className="text-gray-600">Next dose due:</span>
                <span className="font-medium text-gray-900">
                  {fmtDate(state.administration.nextDueDate)}
                </span>
              </div>
            )}
            {state.administration.doseNumber === '2nd' && (
              <div className="flex justify-between">
                <span className="text-gray-600">First dose given on:</span>
                <span className="font-medium text-gray-900">
                  {fmtDate(state.administration.firstDoseDate)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Adrenaline confirmed before vaccination:</span>
              <span className="font-medium text-gray-900">
                {state.administration.adrenalineConfirmed ? 'Yes' : 'No'}
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
          )}
        </section>

        {/* Post-Vaccine Observations */}
        {!hasStops && (
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
              <span className="text-gray-600">Observation period completed (seated):</span>
              <span className="font-medium text-gray-900">
                {state.postVaccineObs.observationCompleted ? 'Yes' : 'No'}
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

        {/* Advice given (PGD records list: advice given, including if excluded) */}
        <section className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Advice Given</h3>
          {hasStops ? (
            <p className="text-sm text-gray-900">
              Patient advised that vaccination is contraindicated under this PGD and why, advised on alternative
              protection (mosquito bite prevention: repellent, protective clothing, screened or air-conditioned
              accommodation), and referred to the GP or a travel clinic as appropriate.
            </p>
          ) : (
            <CounsellingGrid
              items={[
                ['Two-dose schedule explained; second dose in 3 months; PIL supplied', state.advice.twoDozeSchedule],
                ['Common side effects; seek advice if fever persists beyond 7 days', state.advice.commonReactions],
                ['Serious side effects: rash, breathing difficulty, anaphylaxis; Yellow Card', state.advice.seriousReactions],
                ['Continue mosquito bite prevention after vaccination', state.advice.mosquitoPrevention],
                ['Dengue warning signs while travelling: seek medical attention', state.advice.dengueSymptomsWarning],
                ['No other live vaccines within 4 weeks', state.advice.noOtherLiveVaccines],
                ['When to seek help (pharmacy, GP, NHS 111)', state.advice.returnIfConcerned],
                ['Avoid pregnancy for at least 4 weeks after each dose', state.advice.avoidPregnancy4Weeks],
                ['Keep a record of vaccination dates; bring documentation when travelling', state.advice.keepVaccinationRecord],
              ]}
            />
          )}
        </section>

        {/* Pharmacist Declaration */}
        <section className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Pharmacist Declaration
          </h3>
          <p className="text-sm text-gray-700 mb-3">
            {hasStops
              ? 'I confirm that this consultation was conducted in accordance with the Patient Group Direction for Qdenga (TAK-003) dengue vaccination, that the patient met an exclusion criterion, that NO vaccine was administered, and that the advice recorded above was given.'
              : 'I confirm that this vaccine was administered under the Patient Group Direction for Qdenga (TAK-003) dengue vaccination, that the patient met the inclusion criteria and no exclusion criteria applied, that adrenaline was available before vaccination, and that the advice recorded above was given.'}
          </p>
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
                {fmtDate(state.summary.consultationDate)}
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
          <p>Dengue Vaccination ePGD | Confidential Patient Information</p>
          <p>Generated: {new Date().toLocaleString()}</p>
        </section>
      </div>
    </div>
  );
}
