import "server-only";
import { db } from "@/lib/db";
import { pharmacyPgds } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

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
