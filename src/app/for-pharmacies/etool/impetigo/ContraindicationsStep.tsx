'use client';

import { ClinicalAlert, AlertSeverity } from '../shared/types';
import { AlertBanner } from '../shared/components/AlertBanner';

interface ContraindicationsStepProps {
  alerts: ClinicalAlert[];
  referralReasons: string[];
}

export function ContraindicationsStep({ alerts, referralReasons }: ContraindicationsStepProps) {
  const criticalAlerts = alerts.filter((a) => a.severity === 'stop');
  const warningAlerts = alerts.filter((a) => a.severity === 'caution');
  const infoAlerts = alerts.filter((a) => a.severity === 'red-flag');

  return (
    <div className="space-y-6">
      {referralReasons.length > 0 && (
        <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
          <h3 className="text-lg font-semibold text-red-900 mb-3">Referral Criteria Met</h3>
          <div className="space-y-2">
            {referralReasons.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="text-red-500 font-bold text-lg leading-none mt-0.5">!</div>
                <p className="text-red-800 text-sm">{reason}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-red-700 mt-4 font-medium">
            This patient should be referred to their GP for further assessment and management.
          </p>
        </div>
      )}

      {criticalAlerts.length > 0 && (
        <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
          <h3 className="text-lg font-semibold text-red-900 mb-3">Critical Alerts</h3>
          <AlertBanner alerts={criticalAlerts} />
        </div>
      )}

      {warningAlerts.length > 0 && (
        <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded">
          <h3 className="text-lg font-semibold text-amber-900 mb-3">Cautions to Consider</h3>
          <AlertBanner alerts={warningAlerts} />
        </div>
      )}

      {infoAlerts.length > 0 && (
        <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Additional Information</h3>
          <AlertBanner alerts={infoAlerts} />
        </div>
      )}

      {referralReasons.length === 0 && alerts.length === 0 && (
        <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
          <p className="text-green-800 font-medium">
            No contraindications or cautions identified. Patient may be suitable for pharmacy-led treatment.
          </p>
        </div>
      )}

      {/* Information Panel */}
      <div className="bg-gray-50 border border-gray-200 rounded p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Referral Considerations</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-red-500 font-bold">•</span>
            <span>Age less than 1 year</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 font-bold">•</span>
            <span>Bullous impetigo (requires systemic treatment)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 font-bold">•</span>
            <span>Lesions near or around the eyes (ocular involvement risk)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 font-bold">•</span>
            <span>Immunosuppressed patients</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 font-bold">•</span>
            <span>MRSA suspected</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 font-bold">•</span>
            <span>Widespread bullous impetigo</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
