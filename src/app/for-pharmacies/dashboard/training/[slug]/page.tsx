import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getModuleBySlug } from "@/data/training-modules";
import { ModulePlayer } from "./ModulePlayer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const m = getModuleBySlug(slug);
  if (!m) return { title: "Training module not found" };
  return {
    title: `${m.title} — Training`,
    description: m.description,
  };
}

export default async function TrainingModulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const module = getModuleBySlug(slug);
  if (!module) notFound();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Link
          href="/for-pharmacies/dashboard/training"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy-900 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All training modules
        </Link>
        <ModulePlayer module={module} />
      </div>
    </div>
  );
}
