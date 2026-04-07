import type { ReactNode } from "react";
import { legal } from "@/lib/legal";

interface LegalPageLayoutProps {
  title: string;
  intro?: string;
  children: ReactNode;
}

export function LegalPageLayout({ title, intro, children }: LegalPageLayoutProps) {
  return (
    <>
      <section className="bg-navy-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">{title}</h1>
          {intro && (
            <p className="text-lg text-blue-200 max-w-2xl">{intro}</p>
          )}
          <p className="text-sm text-blue-300 mt-4">
            Last updated: {legal.policiesLastUpdated}
          </p>
        </div>
      </section>

      <article className="legal-content max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {children}
      </article>
    </>
  );
}
