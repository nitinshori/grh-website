import MMRClient from "./MMRClient";

export default function MMRPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-navy-900 mb-2">
          MMR Top-up Vaccination
        </h1>
        <p className="text-gray-600">
          Patient Group Direction consultation tool for measles, mumps, and rubella catch-up vaccination.
        </p>
      </div>
      <MMRClient />
    </div>
  );
}
