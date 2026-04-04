import PostnatalContraceptionClient from "./PostnatalContraceptionClient";

export default function PostnatalContraceptionPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-navy-900 mb-2">
          Postnatal Contraception (POP)
        </h1>
        <p className="text-gray-600">
          Patient Group Direction consultation tool for progesterone-only pill supply to postnatal women.
        </p>
      </div>
      <PostnatalContraceptionClient />
    </div>
  );
}
