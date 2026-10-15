/**
 * Vaccination PGD slugs. Kept in a plain module (no "use client", no React)
 * so server code, such as the consultation-records API route, can import it
 * through late-entry.ts. VaccineSafetyChecks re-exports it.
 */
export const VACCINE_SLUGS = new Set([
  "covid-booster",
  "flu",
  "hpv",
  "mmr",
  "pneumococcal",
  "rsv",
  "shingles-vaccine",
  "chickenpox",
  "dengue",
  "hep-ab-travel",
  "hepatitis-a",
  "hep-b-occupational",
  "japanese-encephalitis",
  "junior-travel",
  "meningitis-acwy-travel",
  "meningitis-b",
  "rabies",
  "tetanus",
  "travel-core",
  "typhoid",
  "yellow-fever",
]);

