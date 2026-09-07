-- 051: withdraw threadworms immediately. Four-fold dosing error, live.
--
-- Found 7 Sep 2026 on a close read of the PGD, document 8 of 80 in the estate
-- review. Nitin's instruction the same day: pull the service today, fix it,
-- restore it once Chris has signed the corrected version.
--
-- THE ERROR
--
-- The PGD states the medicine as "Mebendazole 100mg chewable tablets or oral
-- suspension (5mg/mL)" and the dose as "Single dose: 100mg (one tablet or
-- 20mL suspension)", supplying "2 tablets or 40mL suspension".
--
-- UK mebendazole oral suspension (Vermox, Ovex) is 100 mg per 5 mL, i.e.
-- 20 mg/mL, not 5 mg/mL. A 100 mg dose is 5 mL.
--
-- So a pharmacist measuring the stated 20 mL from the real bottle gives
-- 400 mg, four times the intended dose, and the 40 mL supplied is 800 mg.
-- Threadworms is predominantly a paediatric service, which is what makes a
-- volume error of this size matter.
--
-- The ePGD consultation tool carries the same figures on screen
-- ("100mg — 20mL", "(5mg/mL)"), so the error reaches the pharmacist through
-- both the written PGD and the tool. The tool is corrected in the same commit.
--
-- WHY not_approved RATHER THAN DELETING THE SLUG
--
-- Setting every assignment to 'not_approved' makes the tool unreachable
-- (hasPharmacyPgdAccess grants on 'approved' alone) and removes the document
-- from the dashboard, while leaving every row in place. Restoring the service
-- after Chris signs the corrected PGD is then a single UPDATE back to
-- 'approved', with no assignment history lost.
--
-- Consultation records are untouched. They are the clinical audit trail, and
-- if any consultation was recorded against this slug it needs to be findable,
-- not removed.
--
-- Idempotent: safe to re-run. Re-running does not re-approve anything.

UPDATE pharmacy_pgds
   SET status = 'not_approved'
 WHERE pgd_slug = 'threadworms'
   AND status = 'approved';
