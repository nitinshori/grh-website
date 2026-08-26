-- 048: evaluation pharmacy for Bachu's Pharmacy.
--
-- Nitin, 26 Aug 2026: Rakesh Patel asked to work through a consultation
-- himself before committing. He gets a login that stops at 8pm on 27 Aug
-- (migration 047), sees the whole PGD catalogue so he can judge the range
-- on offer, and can actually run UTI end to end. Everything else is listed
-- but inert.
--
-- Why a separate pharmacy rather than adding him to a real one: an
-- evaluation user must never be able to see another pharmacy's patients,
-- bookings or consultation records. A pharmacy of his own means there is
-- nothing to see even if a page forgets to scope its query. It also keeps
-- anything he creates while poking about out of a real audit trail.
--
-- Access itself is unchanged and still enforced per tool by PgdGate via
-- hasPharmacyPgdAccess, which only ever grants on status = 'approved'. So
-- 'uti' approved and the other 80 not_approved is the whole access story;
-- users.view_only only decides whether the other 80 are drawn on the index
-- as inert cards or hidden altogether.
--
-- What this migration deliberately does NOT do: create the user account.
-- That needs a password, which is not mine to choose, so Nitin creates the
-- login himself against this pharmacy id and sets access_expires_at.
--
-- Note for later: this pharmacy has no subscription, so it will surface in
-- the admin "active without PGDs"/billing views as an oddity. Expected.
-- Deactivate or delete it once the evaluation is over.
--
-- Idempotent: safe to re-run.

INSERT INTO pharmacies (id, name, slug, group_slug, is_active, auth_source)
VALUES (
  '0d1e6b3c-9a47-4f52-8c6d-2b7e5a1f4d90',
  'Bachu''s Pharmacy (evaluation)',
  'bachus-evaluation',
  'bachus-evaluation',
  TRUE,
  'direct'
)
ON CONFLICT (id) DO NOTHING;

-- UTI is the one live service: the tool opens and the written PGD is
-- downloadable, so he can compare the two.
INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT '0d1e6b3c-9a47-4f52-8c6d-2b7e5a1f4d90', 'uti', 'approved'
 WHERE NOT EXISTS (
   SELECT 1 FROM pharmacy_pgds
    WHERE pharmacy_id = '0d1e6b3c-9a47-4f52-8c6d-2b7e5a1f4d90' AND pgd_slug = 'uti'
 );

-- The rest of the catalogue, visible but not usable. Written out in full
-- rather than derived from existing rows so that a service no pharmacy
-- holds yet still appears.
INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT '0d1e6b3c-9a47-4f52-8c6d-2b7e5a1f4d90', s.slug, 'not_approved'
  FROM (VALUES
    ('acne'),
    ('alopecia-minoxidil'),
    ('altitude-sickness'),
    ('anti-malarials'),
    ('anxiety-propranolol'),
    ('asthma-rescue'),
    ('b12-injection'),
    ('bph'),
    ('bv'),
    ('cellulitis'),
    ('chest-service'),
    ('chickenpox'),
    ('cold-sores'),
    ('copd'),
    ('covid-booster'),
    ('dengue'),
    ('dental-bridging'),
    ('diabetes-monitoring'),
    ('ear-infection'),
    ('eczema'),
    ('ed'),
    ('emergency-contraception'),
    ('flu'),
    ('folic-acid'),
    ('foundayo'),
    ('fungal-infection'),
    ('genital-warts'),
    ('glp1-monitoring'),
    ('gonorrhoea-treatment'),
    ('hair-loss'),
    ('hayfever'),
    ('hep-ab-travel'),
    ('hep-b-occupational'),
    ('herpes-management'),
    ('hpv'),
    ('hrt'),
    ('hypertension'),
    ('impetigo'),
    ('japanese-encephalitis'),
    ('junior-travel'),
    ('meningitis-acwy-travel'),
    ('meningitis-b'),
    ('mmr'),
    ('mounjaro'),
    ('mysimba'),
    ('orlistat'),
    ('paediatric-uti'),
    ('period-delay'),
    ('period-pain'),
    ('pneumococcal'),
    ('postnatal-contraception'),
    ('premature-ejaculation'),
    ('prep'),
    ('psoriasis'),
    ('rabies'),
    ('recurrent-uti'),
    ('rosacea'),
    ('rsv'),
    ('saxenda'),
    ('shingles-treatment'),
    ('shingles-vaccine'),
    ('skin-infection'),
    ('sleep-melatonin'),
    ('smoking-nrt'),
    ('smoking-varenicline'),
    ('sore-throat'),
    ('statins'),
    ('sti-testing'),
    ('testosterone-women'),
    ('tetanus'),
    ('threadworms'),
    ('thrush'),
    ('travel-core'),
    ('travellers-diarrhoea'),
    ('trt'),
    ('typhoid'),
    ('wegovy'),
    ('wegovy-oral'),
    ('wound-care'),
    ('yellow-fever')
  ) AS s(slug)
 WHERE NOT EXISTS (
   SELECT 1 FROM pharmacy_pgds x
    WHERE x.pharmacy_id = '0d1e6b3c-9a47-4f52-8c6d-2b7e5a1f4d90'
      AND x.pgd_slug = s.slug
 );
