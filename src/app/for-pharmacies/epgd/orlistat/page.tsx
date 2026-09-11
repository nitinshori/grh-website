import OrlistatClient from './OrlistatClient';
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: 'Orlistat ePGD Consultation',
  description: 'Orlistat Patient Group Direction consultation tool',
};

export default function OrlistatPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />

        <div className="mb-6">
          <p className="text-xs font-semibold text-[color:var(--tenant-primary)] uppercase tracking-wider mb-2">
            For registered pharmacy professionals only
          </p>
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Orlistat Consultation</h1>
          <p className="text-gray-600">Lipase inhibitor for weight management</p>
          <p className="text-sm text-gray-500 mt-2">
            This ePGD guides pharmacists through supply of Orlistat 120mg capsules under the Patient Group Direction (version 003, issued 11 September 2026) as an adjunct to a reduced-calorie diet and lifestyle changes for adults aged 18 years and over and under 75 years with BMI 30 kg/m² or more, or BMI 28 kg/m² or more with an obesity-related comorbidity. Up to 84 capsules (28-day supply); review at 12 weeks.
          </p>
        </div>
        <OrlistatClient />
      </div>
    </div>
  );
}
