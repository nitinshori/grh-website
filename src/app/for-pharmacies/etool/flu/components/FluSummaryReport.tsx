'use client';

import React from 'react';
import { FluConsultationState } from '../lib/flu-types';

// Inline date utility function
const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

interface FluSummaryReportProps {
  state: FluConsultationState;
  onPrint: () => void;
}

export default function FluSummaryReport({
  state,
  onPrint,
}: FluSummaryReportProps): React.ReactNode {
  const patientAge = calculateAge(state.patient.dateOfBirth);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Flu Vaccination Consultation Summary
        </h2>

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
                  {state.screening.reactionDetails}
                </span>
              </div>
            )}
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
                {state.screening.bleedingDisorder ? 'Yes' : 'No'}
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
              <span className="text-gray-600">Severe egg allergy:</span>
              <span className="font-medium text-gray-900">
                {state.contraindications.severeEggAllergy
                  ? 'CONTRAINDICATED'
                  : 'No'}
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
              <span className="text-gray-600">Age appropriate:</span>
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

        {/* Print Button */}
        <div className="flex justify-end gap-4 pt-6">
          <button
            onClick={onPrint}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <span>🖨️</span>
            Print Summary
          </button>
        </div>
      </div>
    </div>
  );
}
