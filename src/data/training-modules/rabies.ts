// Rabies pre-exposure vaccination — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const rabiesModule: TrainingModule = {
  slug: "rabies",
  title: "Rabies Pre-Exposure Vaccination — PGD",
  description: "Pre-travel rabies vaccination for at-risk travellers and occupational exposure under PGD.",
  pgdSlugs: ["rabies"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Rabies — Training", subtitle: "Pre-exposure vaccination + post-exposure pathway awareness", estimatedMinutes: 10, objectives: [
      "Identify candidates for pre-exposure rabies vaccination.",
      "Apply correct schedule (2- or 3-dose).",
      "Counsel on post-exposure protocol — most important counselling point.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Rabies is a fatal viral encephalitis transmitted via animal bites (most commonly dogs in endemic areas). Symptomatic rabies is 100% fatal. Post-exposure prophylaxis (PEP) is highly effective if given promptly.",
      "Pre-exposure vaccination simplifies and improves post-exposure management — pre-vaccinated travellers need only 2 booster doses post-exposure (no rabies immunoglobulin), versus 4–5 doses + immunoglobulin for unvaccinated.",
      "Inactivated rabies vaccine (HDCV, PVRV). 2- or 3-dose pre-exposure schedule.",
    ], highlights: ["Symptomatic rabies is 100% fatal — prevention is everything.", "Pre-vaccination simplifies post-exposure management.", "Post-exposure: wash wound + medical assessment within 24 hours."] },
    { id: "eligibility", type: "checklist", title: "Eligibility (typical cohorts)", intro: "Per Green Book chapter 27 and NaTHNaC.", items: [
      { label: "Long-stay (>1 month) in endemic country with animal exposure risk", detail: "Especially rural / remote areas." },
      { label: "Trekking, cycling, working with animals in endemic areas", detail: "Higher bite exposure." },
      { label: "Occupational risk", detail: "Animal handlers, vets, abattoir workers, lab workers handling rabies virus." },
      { label: "Travel to areas with limited post-exposure care", detail: "Remote regions without rapid access to immunoglobulin and vaccine." },
      { label: "Children to endemic areas", detail: "Lower threshold — more likely to be bitten and less likely to report." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Contraindications and post-exposure refer", tone: "danger", message: "These need different pathways.", detail: [
      "Previous anaphylaxis to rabies vaccine or component.",
      "Severe acute febrile illness — postpone.",
      "Pregnancy: not absolute contraindication; defer routine pre-exposure if possible, but vaccinate if high exposure risk (rabies is fatal — benefit clear).",
      "POST-EXPOSURE (animal bite from possibly rabid animal): refer urgently to A&E / specialist — different pathway with immunoglobulin and accelerated vaccine schedule. NOT pre-exposure PGD.",
      "Immunocompromised: specialist input — may need 5-dose schedule with antibody titre check.",
    ]},
    { id: "schedule", type: "comparison", title: "Pre-exposure schedule", intro: "Choose based on time before travel.", columns: [
      { label: "Standard 3-dose (days 0, 7, 21–28)", rows: [
        { heading: "Use", body: "Most pre-travel scenarios with adequate lead time." },
        { heading: "Site", body: "Deltoid IM. 0.5–1 mL depending on product." },
        { heading: "Protection", body: "Achieved after 3rd dose." },
        { heading: "Booster", body: "Per occupational risk; routine boosters not generally needed for travellers." },
      ]},
      { label: "Accelerated 2-dose (days 0, 7)", rows: [
        { heading: "Use", body: "When 3-dose course can't be completed before travel. Approved per WHO 2018+ shorter schedule guidance, increasingly used in UK." },
        { heading: "Same product", body: "Same vaccine and route, just shorter regimen." },
        { heading: "Booster", body: "Consider a third dose at a later date for prolonged protection if ongoing exposure." },
      ]},
    ]},
    { id: "post-exposure-counselling", type: "callout", title: "Post-exposure protocol — counsel every patient", tone: "danger", message: "Bite or potential exposure abroad.", detail: [
      "Wash wound vigorously with soap and clean water for ≥15 minutes immediately. This is the single most important first step.",
      "Apply povidone-iodine or 70% alcohol if available.",
      "Seek medical care within 24 hours — local rabies clinic abroad, or A&E on return to UK if not available locally.",
      "Pre-exposure vaccinated travellers: need 2 booster doses (days 0 and 3 post-exposure). No immunoglobulin needed.",
      "Unvaccinated travellers: need full post-exposure course PLUS rabies immunoglobulin (RIG). RIG is sometimes hard to source abroad — this is the case for pre-exposure vaccination.",
      "Travel insurance should cover rabies post-exposure care.",
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Pre-exposure simplifies post-exposure management dramatically.",
      "3-dose (0, 7, 21–28) or 2-dose accelerated (0, 7) schedule.",
      "Post-exposure: wash 15 min + medical care within 24h. Pre-vaccinated = 2 boosters; unvaccinated = full course + RIG.",
      "Always refer post-exposure scenarios — not PGD pre-exposure pathway.",
      "Pregnancy + high exposure risk: vaccinate (fatal disease).",
    ]},
  ],
  quiz: [
    { id: "q-post-exposure", type: "single-choice", critical: true, question: "Patient was bitten by a dog in India 12 hours ago. Wants rabies vaccine. Action?", options: [
      { id: "a", label: "Standard pre-exposure schedule." }, { id: "b", label: "Refer urgently — this is POST-exposure. Different pathway: accelerated vaccine schedule + rabies immunoglobulin (RIG) for unvaccinated patients. Wash wound 15 min if not done. A&E / specialist." }, { id: "c", label: "Single dose." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Post-exposure is a different pathway entirely. Time-critical. Needs RIG plus vaccine course. Don't try to manage in routine pharmacy PGD." },
    { id: "q-wound-care", type: "single-choice", critical: true, question: "Pre-travel counselling — single most important first step after potential rabies exposure?", options: [
      { id: "a", label: "Take antibiotic." }, { id: "b", label: "Wash the wound vigorously with soap and clean water for at least 15 minutes. Reduces viral load at wound site, single most effective first step before medical care." }, { id: "c", label: "Cover and ignore." }, { id: "d", label: "Apply pressure to stop bleeding only." }
    ], correctOptionIds: ["b"], explanation: "Soap and water vigorously for ≥15 minutes is the single most important first-aid step. Counsel pre-travel." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant woman planning long stay in rural India. Wants rabies pre-exposure. Action?", options: [
      { id: "a", label: "Defer until postpartum." }, { id: "b", label: "Refer specialist travel clinic — rabies is fatal so vaccination is generally given if exposure risk is high, despite pregnancy. Decision needs specialist context." }, { id: "c", label: "Half dose." }, { id: "d", label: "Refuse." }
    ], correctOptionIds: ["b"], explanation: "Rabies = fatal, so vaccination indicated even in pregnancy if exposure risk is real. Specialist input for individualised decision." },
    { id: "q-immunocompromised", type: "single-choice", critical: true, question: "Patient on rituximab planning trekking in Nepal. Action?", options: [
      { id: "a", label: "Standard 3-dose." }, { id: "b", label: "Refer specialist travel clinic — immunocompromised patients have suboptimal vaccine response. Often need 5-dose schedule with antibody titre check. Specialist territory." }, { id: "c", label: "Half dose." }, { id: "d", label: "Skip vaccination." }
    ], correctOptionIds: ["b"], explanation: "Immunocompromise complicates rabies vaccination — extended schedule and antibody check needed. Specialist." },
    { id: "q-schedule-standard", type: "single-choice", question: "Standard pre-exposure schedule?", options: [
      { id: "a", label: "Single dose." }, { id: "b", label: "3 doses: days 0, 7, and 21–28." }, { id: "c", label: "2 doses 6 months apart." }, { id: "d", label: "Annual." }
    ], correctOptionIds: ["b"], explanation: "3-dose course 0, 7, 21–28. Or 2-dose accelerated (0, 7) if time-pressured." },
    { id: "q-pre-vaccinated-bite", type: "single-choice", question: "Pre-exposure-vaccinated patient bitten by dog abroad. Action?", options: [
      { id: "a", label: "No further vaccine needed." }, { id: "b", label: "Wash wound, seek medical care. Pre-vaccinated travellers need 2 boosters (days 0 and 3 post-exposure). No RIG needed — that's the benefit of pre-vaccination." }, { id: "c", label: "Full 5-dose course + RIG." }, { id: "d", label: "Antibiotic only." }
    ], correctOptionIds: ["b"], explanation: "Pre-vaccinated = simplified post-exposure (2 boosters, no RIG). That's the main benefit of pre-exposure vaccination — RIG is often hard to obtain abroad." },
    { id: "q-route", type: "single-choice", question: "Site and route?", options: [
      { id: "a", label: "Gluteal IM." }, { id: "b", label: "Deltoid IM. NOT gluteal — reduced immunogenicity." }, { id: "c", label: "Subcut." }, { id: "d", label: "Intradermal — only in specialist settings." }
    ], correctOptionIds: ["b"], explanation: "Deltoid IM. Gluteal not acceptable. Intradermal regimens exist but are specialist-administered." },
    { id: "q-source", type: "single-choice", question: "Authoritative UK source for country-specific rabies risk?", options: [
      { id: "a", label: "Lonely Planet." }, { id: "b", label: "NaTHNaC TravelHealthPro / Fit for Travel — country-specific recommendations." }, { id: "c", label: "BNF." }, { id: "d", label: "BBC News." }
    ], correctOptionIds: ["b"], explanation: "TravelHealthPro is the source for destination-specific rabies risk and recommendations." },
    { id: "q-when-vaccinate", type: "single-choice", question: "Patient asks how far in advance she needs to start pre-exposure rabies course.", options: [
      { id: "a", label: "Single dose just before travel." }, { id: "b", label: "Ideally ≥3 weeks before travel to complete 3-dose schedule (0, 7, 21–28). Accelerated 2-dose (0, 7) acceptable if shorter window." }, { id: "c", label: "Immediately on departure." }, { id: "d", label: "6 months ahead." }
    ], correctOptionIds: ["b"], explanation: "Standard 3-dose needs ≥3 weeks. Accelerated 2-dose minimum 1 week." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Destination, exposure-risk activities, dose number, batch, contraindications excluded, post-exposure counselling delivered — in the ePGD tool. NIMS upload." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record especially captures the post-exposure counselling — load-bearing for travel safety." },
  ],
};
