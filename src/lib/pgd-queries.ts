import "server-only";
import { db } from "@/lib/db";
import { pharmacyPgds, pharmacies } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { ALL_PGDS } from "@/lib/pgd-access";

/**
 * Partner tenants whose pharmacies get the whole catalogue automatically.
 *
 * Per Jane Wilkins (HubRx, Aug 2026): the HubRx portal should be "exactly
 * the same as your own portal offering so our HubRx third-party pharmacies
 * have access to all your PGDs and e-forms, and they can choose which ones
 * they want to access and use".
 *
 * Matching on auth_source means a third party that SSOs in for the first
 * time next month gets the full catalogue with no admin step, and any PGD
 * added later appears for them automatically.
 */
const FULL_CATALOGUE_AUTH_SOURCES = new Set(["hubrx"]);

async function hasFullCatalogue(pharmacyId: string): Promise<boolean> {
  const [row] = await db
    .select({ authSource: pharmacies.authSource })
    .from(pharmacies)
    .where(eq(pharmacies.id, pharmacyId))
    .limit(1);
  return !!row && FULL_CATALOGUE_AUTH_SOURCES.has(row.authSource);
}

/**
 * Server-only PGD-access queries.
 *
 * The constants (ALL_PGDS, PGD_CATEGORIES, COMING_SOON_SLUGS) live in
 * `pgd-access.ts` and are safe to import from client components. Anything
 * here uses the DB and must NEVER be imported into a "use client" file.
 *
 * The `import "server-only"` guard above will throw at build time if a
 * client component accidentally pulls this in.
 */

export async function hasPharmacyPgdAccess(
  pharmacyId: string,
  pgdSlug: string,
): Promise<boolean> {
  if (await hasFullCatalogue(pharmacyId)) {
    return ALL_PGDS.some((p) => p.slug === pgdSlug);
  }

  const [assignment] = await db
    .select()
    .from(pharmacyPgds)
    .where(
      and(
        eq(pharmacyPgds.pharmacyId, pharmacyId),
        eq(pharmacyPgds.pgdSlug, pgdSlug),
        // Non-approved assignments exist only for the "Non approved PGDs"
        // listing — they never grant tool/document access.
        eq(pharmacyPgds.status, 'approved'),
      ),
    )
    .limit(1);

  return !!assignment;
}

export async function getPharmacyPgdSlugs(pharmacyId: string): Promise<string[]> {
  if (await hasFullCatalogue(pharmacyId)) {
    return ALL_PGDS.map((p) => p.slug);
  }

  const assignments = await db
    .select({ pgdSlug: pharmacyPgds.pgdSlug })
    .from(pharmacyPgds)
    .where(
      and(
        eq(pharmacyPgds.pharmacyId, pharmacyId),
        eq(pharmacyPgds.status, 'approved'),
      ),
    );

  return assignments.map((a) => a.pgdSlug);
}

/** Slugs assigned to the pharmacy but NOT approved by its clinical lead —
 *  shown on the dashboard's "Non approved PGDs" page only. */
export async function getPharmacyNonApprovedSlugs(
  pharmacyId: string,
): Promise<string[]> {
  // Full-catalogue pharmacies have nothing withheld, so there is no
  // "non approved" list to show them.
  if (await hasFullCatalogue(pharmacyId)) return [];

  const assignments = await db
    .select({ pgdSlug: pharmacyPgds.pgdSlug })
    .from(pharmacyPgds)
    .where(
      and(
        eq(pharmacyPgds.pharmacyId, pharmacyId),
        eq(pharmacyPgds.status, 'not_approved'),
      ),
    );

  return assignments.map((a) => a.pgdSlug);
}

export async function setPharmacyPgds(
  pharmacyId: string,
  slugs: string[],
): Promise<void> {
  await db.delete(pharmacyPgds).where(eq(pharmacyPgds.pharmacyId, pharmacyId));

  if (slugs.length > 0) {
    await db.insert(pharmacyPgds).values(
      slugs.map((slug) => ({
        pharmacyId,
        pgdSlug: slug,
      })),
    );
  }
}
