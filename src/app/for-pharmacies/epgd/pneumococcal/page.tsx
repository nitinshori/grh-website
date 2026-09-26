import { PneumococcalClient } from './PneumococcalClient';
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: 'Pneumococcal Vaccination ePGD | Pharmacy PGD',
  description:
    'UK Pharmacy Group Protocol Direction (PGD) consultation tool for pneumococcal vaccination in at-risk patients',
};

export default function PneumococcalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pneumococcal Vaccination ePGD</h1>
            <p className="text-gray-600 mb-4">PGD Consultation for UK Pharmacies</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                This ePGD guides pharmacists in the administration of Prevenar 20 (PCV20) or Pneumovax 23 (PPV23) under the Patient Group Direction (version 008, issued 24 September 2026) to individuals aged 2 years and over eligible under Green Book chapter 25. Where Prevenar 20 is held it is given in preference (single lifetime dose, intramuscular only); Pneumovax 23 is given where Prevenar 20 is not held, where the subcutaneous route is needed, or for later 5-yearly revaccination cycles of asplenia, splenic dysfunction or chronic kidney disease (nephrotic syndrome, CKD stage 4 or 5, dialysis or kidney transplant) after Prevenar 20 has been given once. Single 0.5 mL dose.
              </p>
            </div>
          </div>
        </div>
        <PneumococcalClient />
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD: Pneumococcal Vaccination | Confidential Patient Information</p>
        </div>
      </div>
    </div>
  );
}
