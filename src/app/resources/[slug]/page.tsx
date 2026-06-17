import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles, getArticleBySlug } from "@/data/articles";

// Build all article pages statically
export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
    keywords: [article.primaryKeyword, "PGD", "pharmacy", "UK"],
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      publishedTime: article.publishDate,
    },
  };
}

const categoryColors: Record<string, string> = {
  "PGD Fundamentals": "bg-blue-100 text-blue-700",
  "Revenue & Growth": "bg-emerald-100 text-emerald-700",
  "Clinical Services": "bg-purple-100 text-purple-700",
  Compliance: "bg-amber-100 text-amber-700",
  Industry: "bg-gray-100 text-gray-700",
};

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  // Split content into paragraphs for rendering
  const paragraphs = article.content
    .split("\n\n")
    .filter((p) => p.trim().length > 0);

  // Get related articles (same category, exclude current, max 3)
  const related = articles
    .filter((a) => a.slug !== article.slug)
    .filter((a) => a.category === article.category)
    .slice(0, 2);

  // Fill remaining slots from other categories
  const otherRelated = articles
    .filter((a) => a.slug !== article.slug && a.category !== article.category)
    .slice(0, 3 - related.length);

  const allRelated = [...related, ...otherRelated];

  // Article JSON-LD — cited by Google AI Overviews, ChatGPT Search, etc.
  // Gives AI engines structured authorship, publish date, and topic.
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishDate,
    dateModified: article.publishDate,
    author: {
      "@type": "Organization",
      name: "Get Real Health",
      url: "https://getrealhealthpgd.co.uk",
    },
    publisher: {
      "@type": "Organization",
      name: "Get Real Health",
      url: "https://getrealhealthpgd.co.uk",
      logo: {
        "@type": "ImageObject",
        url: "https://getrealhealthpgd.co.uk/og-image.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://getrealhealthpgd.co.uk/resources/${article.slug}`,
    },
    keywords: [article.primaryKeyword, "PGD", "UK pharmacy", article.category],
    articleSection: article.category,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      {/* Article header */}
      <article>
        <header className="bg-navy-950 text-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
            <Link
              href="/resources"
              className="inline-flex items-center gap-1 text-sm text-blue-300 hover:text-white mb-5 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              All articles
            </Link>
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[article.category] || "bg-gray-100 text-gray-700"} mb-4`}
            >
              {article.category}
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 leading-tight">
              {article.title}
            </h1>
            <p className="text-blue-200 text-lg">{article.description}</p>
            <div className="flex items-center gap-4 mt-5 text-sm text-blue-300">
              <span>{article.readTime}</span>
              <span>•</span>
              <time dateTime={article.publishDate}>
                {new Date(article.publishDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </div>
          </div>
        </header>

        {/* Article body */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="prose prose-gray max-w-none">
            {paragraphs.map((paragraph, i) => {
              // Check if paragraph looks like a heading (short, no period at end)
              const isHeading =
                paragraph.length < 80 &&
                !paragraph.endsWith(".") &&
                !paragraph.endsWith(")") &&
                paragraph.includes(":");

              if (isHeading) {
                return (
                  <h2
                    key={i}
                    className="text-xl font-bold text-navy-900 mt-8 mb-3"
                  >
                    {paragraph}
                  </h2>
                );
              }

              return (
                <p
                  key={i}
                  className="text-gray-700 leading-relaxed mb-4"
                >
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* CTA within article */}
          <div className="mt-12 bg-teal-50 border border-teal-200 rounded-xl p-6 sm:p-8">
            <h3 className="font-bold text-navy-900 mb-2">
              Want to offer these services?
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Get Real Health provides 60+ PGDs, built-in training, and a
              consultation platform — all for one flat £100/month fee per
              pharmacy. No per-consult charges.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/for-pharmacies/pgd-catalogue"
                className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg transition-colors text-center"
              >
                Browse PGDs
              </Link>
              <Link
                href="/demo"
                className="px-6 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-navy-900 text-sm font-semibold rounded-lg transition-colors text-center"
              >
                See a demo
              </Link>
            </div>
          </div>
        </div>
      </article>

      {/* Related articles */}
      {allRelated.length > 0 && (
        <section className="bg-gray-50 border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-lg font-bold text-navy-900 mb-6">
              Related reading
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {allRelated.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/resources/${rel.slug}`}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow group"
                >
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[rel.category] || "bg-gray-100 text-gray-700"} mb-2`}
                  >
                    {rel.category}
                  </span>
                  <h3 className="font-semibold text-navy-900 text-sm group-hover:text-teal-700 transition-colors leading-snug">
                    {rel.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
