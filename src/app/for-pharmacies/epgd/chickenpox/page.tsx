import ChickenpoxClient from "./ChickenpoxClient";

export default function ChickenpoxPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-navy-900 mb-2">
          Varicella (Chickenpox) Vaccination
        </h1>
        <p className="text-gray-600">
          Patient Group Direction consultation tool for varicella vaccination in eligible adults and children.
        </p>
      </div>
      <ChickenpoxClient />
    </div>
  );
}
