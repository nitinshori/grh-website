import AcneClient from "./AcneClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: "Acne Treatment ePGD | GRH Pharmacy",
  description: "Patient Group Direction for mild to moderate acne vulgaris: benzoyl peroxide plus clindamycin gel or adapalene plus benzoyl peroxide gel. Version 004, issued 11 September 2026.",
};

export default function AcnePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PgdPageActions />
      </div>
      <AcneClient />
    </div>
  );
}
