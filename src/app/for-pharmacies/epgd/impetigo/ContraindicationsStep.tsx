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
        <h3 className="font-semibold text-gray-900 mb-3">Refer, do not supply (Impetigo PGD v009)</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          {[
            'Systemically unwell: fever, malaise, lymphadenopathy, or appearing unwell (same day)',
            'Signs of cellulitis: spreading redness, warmth, swelling or pain beyond the lesions (hospital)',
            'Immunocompromised (NICE: hospital referral where widespread)',
            'Bullous impetigo in a baby',
            'Recurrent impetigo: swab and consider decolonisation rather than treating again',
            'Around the eye or involving the eyelid margin',
            'Diagnostic uncertainty: herpes simplex, eczema herpeticum or fungal infection',
            'A course of antibiotic already supplied for this episode (one course per episode)',
            'Adult needing an oral antibiotic who is not penicillin-allergic: no adult flucloxacillin arm',
            'Fusidic acid resistance suspected (mupirocin is not authorised)',
            'Clarithromycin contraindications: simvastatin, lovastatin, colchicine, ergot alkaloids, ticagrelor, oral midazolam, lomitapide, ivabradine, ranolazine, domperidone, pimozide, QT prolongation, hypokalaemia or hypomagnesaemia',
            'Pregnant and penicillin-allergic where erythromycin is not suitable; a child who cannot be weighed today',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-red-500 font-bold">-</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
