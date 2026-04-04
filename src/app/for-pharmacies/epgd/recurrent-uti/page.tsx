import RecurrentUTIClient from "./RecurrentUTIClient";

export default function RecurrentUTIPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-navy-900 mb-2">
          Recurrent UTI Prevention
        </h1>
        <p className="text-gray-600">
          Patient Group Direction consultation tool for antibiotic prophylaxis in women with recurrent urinary tract infections.
        </p>
      </div>
      <RecurrentUTIClient />
    </div>
  );
}
