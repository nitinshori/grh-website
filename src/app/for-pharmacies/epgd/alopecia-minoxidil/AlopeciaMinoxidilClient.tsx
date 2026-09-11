"use client";

// The 'alopecia-minoxidil' catalogue entry is served by the Finasteride
// (Androgenetic Alopecia) PGD, version 002, issued 11 September 2026: one
// document serves both the 'alopecia-minoxidil' and 'hair-loss' catalogue
// entries (see the document's version record). There is no minoxidil arm in
// that document, so this entry shares the hair-loss consultation client so
// that both tools enforce the same gates, dose, quantity and counselling.
// Consultation records are still saved under this route's own slug
// (StepWrapper derives the slug from the URL).
export { default } from "../hair-loss/HLClient";
