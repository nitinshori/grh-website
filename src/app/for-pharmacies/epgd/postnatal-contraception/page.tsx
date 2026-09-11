import PostnatalContraceptionClient from "./PostnatalContraceptionClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export default function PostnatalContraceptionPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
        <PgdPageActions />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-navy-900 mb-2">
          Postnatal Contraception
        </h1>
        <p className="text-gray-600">
          Patient Group Direction consultation tool for desogestrel 75 microgram tablets (women 16 and over) or Depo-Provera 150 mg injection (women 18 and over) for postnatal women. PGD version 006, issued 11 September 2026.
        </p>
      </div>
      <PostnatalContraceptionClient />
    </div>
  );
}
