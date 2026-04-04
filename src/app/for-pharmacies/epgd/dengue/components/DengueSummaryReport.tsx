'use client';

import React from 'react';
import { DengueConsultationState } from '../dengue-types';
import { calculateAge } from '../../shared/types';

interface DengueSummaryReportProps {
  state: DengueConsultationState;
  onPrint: () => void;
}

export default function DengueSummaryReport({
  state,
  onPrint,
}: DengueSummaryReportProps): React.ReactNode {
  const patientAge = calculateAge(state.patient.dateOfBirth);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Dengue Vaccination Consultation Summary
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
                {new Date(state.screening.departureDate).toLocaleDateString()}
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
                {state.administration.doseNumber}
              </span>
            </div>
            {state.administration.doseNumber === '1st' && (
              <div className="flex justify-between">
                <span className="text-gray-600">Next dose due:</span>
                <span className="font-medium text-gray-900">
                  {new Date(state.administration.nextDueDate).toLocaleDateString()}
                </span>
              </div>
            )}
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
              <span className="text-gray-600">Anaphylaxis kit checked:</span>
              <span className="font-medium text-gray-900">
                {state.postVaccineObs.anaphylaxisKitChecked ? 'Yes' : 'No'}
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
          <p>Dengue Vaccination ePGD | Confidential Patient Information</p>
          <p>Generated: {new Date().toLocaleString()}</p>
        </section>
      </div>
    </div>
  );
}
