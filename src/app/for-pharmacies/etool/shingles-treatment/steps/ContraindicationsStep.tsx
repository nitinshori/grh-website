'use client';

import React from 'react';
import { AlertBanner } from '../../shared/components/AlertBanner';
import { StepWrapper } from '../../shared/components/StepWrapper';
import { ClinicalAlert } from '../../shared/types';

interface ContraindicationsStepProps {
  alerts: ClinicalAlert[];
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  isBlocked: boolean;
}

export const ContraindicationsStep: React.FC<ContraindicationsStepProps> = ({
  alerts,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  isBlocked,
}) => {
  const blockingAlerts = alerts.filter((a) => a.severity === 'stop');
  const warningAlerts = alerts.filter((a) => a.severity === 'caution');
  const highAlerts = alerts.filter((a) => a.severity === 'red-flag');

  return (
    <StepWrapper
      title="Contraindications Review"
      description="Review clinical alerts and contraindications"
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={onNext}
      onPrev={onPrev}
      canProceed={!isBlocked}
      isBlocked={isBlocked}
      validationError={isBlocked ? 'Patient has blocking contraindications - cannot proceed with PGD' : null}
    >
      <div className="space-y-6">
        {/* Blocking Alerts */}
        {blockingAlerts.length > 0 && (
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">⛔</span> BLOCKING CONTRAINDICATIONS
            </h3>
            <div className="space-y-3">
              {blockingAlerts.map((alert) => (
                <div key={alert.code} className="bg-white border-l-4 border-red-500 p-3 rounded">
                  <p className="text-red-800 font-semibold">{alert.message}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-red-100 rounded text-sm text-red-800">
              <strong>ACTION REQUIRED:</strong> Patient must be referred to GP or appropriate specialist. Pharmacy PGD cannot be used.
            </div>
          </div>
        )}

        {/* High Severity Alerts */}
        {highAlerts.length > 0 && (
          <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
            <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">⚠️</span> RED FLAGS
            </h3>
            <div className="space-y-3">
              {highAlerts.map((alert) => (
                <div key={alert.code} className="bg-white border-l-4 border-orange-500 p-3 rounded">
                  <p className="text-orange-800">{alert.message}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-orange-100 rounded text-sm text-orange-800">
              <strong>ACTION REQUIRED:</strong> Enhanced patient counselling and monitoring needed. Consider GP liaison.
            </div>
          </div>
        )}

        {/* Warning Alerts */}
        {warningAlerts.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">ℹ️</span> CAUTIONS & DOSE ADJUSTMENTS
            </h3>
            <div className="space-y-3">
              {warningAlerts.map((alert) => (
                <div key={alert.code} className="bg-white border-l-4 border-yellow-500 p-3 rounded">
                  <p className="text-yellow-800">{alert.message}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-yellow-100 rounded text-sm text-yellow-800">
              <strong>ACTION REQUIRED:</strong> Apply recommendations in medicine selection and counselling steps.
            </div>
          </div>
        )}

        {/* No Alerts */}
        {alerts.length === 0 && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-4">
            <p className="text-green-800 font-semibold">✓ No contraindications identified</p>
            <p className="text-sm text-green-700 mt-2">
              Patient is suitable for PGD-based antiviral treatment. Proceed to medicine selection.
            </p>
          </div>
        )}

        {/* Summary Table */}
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Alert Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-red-600">{blockingAlerts.length}</p>
              <p className="text-sm text-gray-700">Blocking</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{highAlerts.length}</p>
              <p className="text-sm text-gray-700">Red Flags</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{warningAlerts.length}</p>
              <p className="text-sm text-gray-700">Cautions</p>
            </div>
          </div>
        </div>

        {/* Clinical Decision Support */}
        {blockingAlerts.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">When to Refer to GP:</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Any ophthalmic involvement (V1 dermatome) - URGENT ophthalmology</li>
              <li>Immunosuppressed patients</li>
              <li>Pregnant or breastfeeding (may need specialist advice)</li>
              <li>Severe hepatic impairment</li>
              <li>Symptoms beyond typical dermatomal distribution</li>
              <li>Signs of systemic involvement (fever, widespread vesicles)</li>
              <li>Inability to tolerate oral antivirals</li>
            </ul>
          </div>
        )}
      </div>
    </StepWrapper>
  );
};
