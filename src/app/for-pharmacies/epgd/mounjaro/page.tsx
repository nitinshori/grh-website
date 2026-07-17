import MounjaroClient from './MounjaroClient';
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: 'Tirzepatide ePGD Consultation',
  description:
    'Tirzepatide Patient Group Direction consultation tool. For use by registered pharmacy professionals only.',
  robots: { index: false, follow: false },
};

export default function MounjaroPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />

        <div className="mb-6">
          <p className="text-xs font-semibold text-[color:var(--tenant-primary)] uppercase tracking-wider mb-2">
            For registered pharmacy professionals only
          </p>
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Tirzepatide Consultation</h1>
          <p className="text-gray-600">Dual GIP/GLP-1 receptor agonist for weight management</p>
        </div>
        <MounjaroClient />
      </div>
    </div>
  );
}
