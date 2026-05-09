#!/bin/bash
cd "$(dirname "$0")"
# Remove stale lock if present
rm -f .git/index.lock
# Stage only the ePGD client files I wired up
xargs git add < /tmp/wired_files.txt
git commit -m "Wire 49 ePGDs to patient record system

Adds getConsultationData and onNewConsultation callbacks to ePGD client
components so completed consultations are saved to the database.

Wired in this batch:
- Multi-StepWrapper pattern (20): acne, alcohol-reduction, altitude-sickness,
  anti-malarials, anxiety-propranolol, bv, chickenpox, cold-sores, eczema,
  emergency-contraception, hrt, meningitis-b, mmr, period-delay,
  postnatal-contraception, recurrent-uti, smoking-nrt, thrush,
  travellers-diarrhoea, wegovy

- Single-StepWrapper pattern (18): alopecia-minoxidil, bph, covid-booster,
  dental-bridging, ear-infection, eye-infections, hair-loss,
  hep-b-occupational, hpv, impetigo, paediatric-uti, premature-ejaculation,
  prep, rosacea, shingles-vaccine, sore-throat, sti-testing, threadworms,
  wound-care

- Early-return summary pattern (10): adhd-monitoring, asthma-rescue, copd,
  diabetes-monitoring, hayfever, hypertension, sleep-melatonin, statins,
  testosterone-women, travel-core

Plus the pre-existing references: uti, mounjaro, orlistat (52 total).

Pending (need individual handling — different state shape or custom step
components): dengue, ed, flu, japanese-encephalitis, meningitis-acwy-travel,
needlestick-pep, pneumococcal, rabies, rsv, smoking-varenicline,
shingles-treatment.
"
