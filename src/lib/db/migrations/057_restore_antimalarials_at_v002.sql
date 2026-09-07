-- 057: restore anti-malarials at v002.
--
-- Migration 052 withdrew this PGD on 7 Sep 2026 because the atovaquone/
-- proguanil arm named only the adult 250/100mg tablet and authorised it from
-- 11kg, giving four times the intended dose to the smallest patients in scope.
--
-- v002 fixes it. The paediatric strength is named, and Appendix 1 gives the
-- weight bands: 11-20kg one paediatric 62.5/25mg tablet, 21-30kg two,
-- 31-40kg three, one adult tablet only above 40kg. Appendix 2 gives worked
-- quantity examples including the post-travel tail, which the old quantity
-- ranges could not deliver. Authorised by Nitin Shori and Chris Pilkington,
-- 7 September 2026.
--
-- THE TOOL IS NOT FULLY FIXED, AND THAT IS DELIBERATE.
--
-- The ePGD consultation tool still captures no body weight at any step, so it
-- cannot band. Rather than leave it giving a flat adult recommendation, it now
-- raises a hard stop for anyone under 18 and directs the pharmacist to the
-- weight bands in the PGD. A pharmacist can still serve a child by working
-- from the document; what they cannot do is have the tool tell them the dose.
-- Remove that stop only once the tool captures weight and implements the bands.
--
-- CAVEAT ON THIS RE-APPROVAL. Migration 052 set every 'approved' row to
-- 'not_approved'. This migration reverses that for the same slug. It cannot
-- distinguish a row that 052 changed from one that was already 'not_approved'
-- for an unrelated reason, so a pharmacy that had this PGD deliberately
-- withheld before 7 Sep would be re-approved here. Check the assignment list
-- in the admin matrix after this runs; removing an assignment there is a
-- one-click change.
--
-- Idempotent: safe to re-run.

UPDATE pharmacy_pgds
   SET status = 'approved'
 WHERE pgd_slug = 'anti-malarials'
   AND status = 'not_approved';
