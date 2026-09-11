import { redirect } from "next/navigation";

// The signed Vaginal Thrush PGD v003 authorises two products only:
// fluconazole 150 mg capsule and clotrimazole 500 mg pessary. It contains no
// clotrimazole 1% cream, so a "duo pack" cannot be supplied under it. This
// page now sends the pharmacist to the thrush tool, which offers the capsule.
export const metadata = {
  title: "Vaginal Thrush ePGD Consultation",
  description: "Redirects to the Vaginal Thrush consultation tool",
};

export default function ThrushDuoPage() {
  redirect("/for-pharmacies/epgd/thrush");
}
