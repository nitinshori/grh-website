import { HepatitisAClient } from './HepatitisAClient';
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: 'Hepatitis A Vaccination ePGD | Pharmacy PGD',
  description:
    'UK Pharmacy Patient Group Direction (PGD) consultation tool for hepatitis A vaccination with Havrix Monodose, Havrix Junior Monodose, Avaxim or Avaxim Junior, in line with the Hepatitis A Vaccination PGD v001, issued 20 September 2026',
};

export default function HepatitisAPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />

        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <p className="text-xs font-semibold text-[color:var(--tenant-primary)] uppercase tracking-wider mb-2">
              For registered pharmacy professionals only
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Hepatitis A Vaccination ePGD</h1>
            <p className="text-gray-600 mb-4">PGD Consultation for UK Pharmacies</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                This ePGD guides pharmacists and pharmacy technicians in the administration of inactivated hepatitis A vaccine (Havrix Monodose or Avaxim at 16 years and over; Havrix Junior Monodose or Avaxim Junior from 1 year to 15 years inclusive) to individuals aged 1 year and over at increased risk through travel, lifestyle, a medical condition or occupation, in line with the Hepatitis A Vaccination PGD v001, issued 20 September 2026. It does not cover hepatitis B, the combined hepatitis A and B vaccine (Twinrix), the combined hepatitis A and typhoid vaccine (ViATIM), post-exposure use, or serology.
              </p>
            </div>
          </div>
        </div>
        <HepatitisAClient />
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD, Hepatitis A Vaccination | Confidential Patient Information</p>
        </div>
      </div>
    </div>
  );
}
