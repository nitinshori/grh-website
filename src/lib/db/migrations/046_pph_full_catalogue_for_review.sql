-- 046: give Pharmacy Plus Health sight of the whole catalogue, for review.
--
-- Janey, 25 Aug 2026: "so I can potentially look at reviewing some of the
-- PGDs we don't currently have would you be able to give me a second login
-- to access the HubRx portal where all your available PGDs are as I will be
-- looking at progressing our travel service in September".
--
-- She asked for a HubRx login. This does the same job without one:
--
--   * PPH was deliberately moved OFF the HubRx portal a fortnight ago at
--     Janey's own request (migrations 040 and 044). A HubRx account would
--     partly undo that separation.
--   * It avoids a second set of credentials when her existing login works.
--   * The clinical sign-off register already has exactly the layout this
--     needs, built at her request: "Approved PGDs" that she and Sarah can
--     sign, and "Non approved PGDs" visible for review only which, in her
--     words, "likely get amended and signed off over time".
--
-- So every catalogue PGD is assigned to PPH as 'not_approved'. Janey sees
-- the full catalogue in the review section of her existing dashboard,
-- nothing new goes live for supply, and each moves up to the approved
-- section as she and Sarah sign it off.
--
-- The slug list is the catalogue as at 25 Aug 2026, taken from ALL_PGDS in
-- src/lib/pgd-access.ts, 81 entries. It is written out in full rather
-- than derived from existing rows, because deriving it would silently miss
-- any service no pharmacy holds yet, which is precisely the travel and
-- newer material Janey wants to look at.
--
-- Anything PPH already holds keeps its status: the NOT EXISTS guard means an
-- approved PGD is never demoted by this.
--
-- Idempotent: safe to re-run.

INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT '3be2791e-d356-415b-99f0-c4ba0e1829f3', s.slug, 'not_approved'
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
    ('uti'),
    ('wegovy'),
    ('wegovy-oral'),
    ('wound-care'),
    ('yellow-fever')
  ) AS s(slug)
 WHERE NOT EXISTS (
   SELECT 1 FROM pharmacy_pgds x
    WHERE x.pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
      AND x.pgd_slug = s.slug
 );
