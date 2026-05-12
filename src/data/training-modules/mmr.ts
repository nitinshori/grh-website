// MMR vaccination — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const mmrModule: TrainingModule = {
  slug: "mmr",
  title: "MMR Vaccination — PGD",
  description: "MMR catch-up vaccination for adults under PGD.",
  pgdSlugs: ["mmr"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "MMR — Training", subtitle: "Live attenuated triple vaccine: measles, mumps, rubella", estimatedMinutes: 10, objectives: [
      "Identify adults eligible for MMR catch-up vaccination.",
      "Recognise live-vaccine contraindications (pregnancy, immunosuppression).",
      "Apply correct 2-dose schedule.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "MMR is a LIVE ATTENUATED vaccine providing protection against measles, mumps, and rubella. Two doses ≥1 month apart give >95% lifetime protection.",
      "UK measles outbreaks continue, especially among under-vaccinated adults. PGD covers adult catch-up: anyone without documented two doses, those uncertain of their history, immigrants from countries without routine MMR, women planning pregnancy needing rubella protection.",
      "Live vaccine — significant contraindications.",
    ], highlights: ["LIVE vaccine — pregnancy and immunosuppression are contraindications.", "Two doses ≥1 month apart for lifetime protection.", "Outbreaks ongoing — adult catch-up matters."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Adult, 18+", detail: "Children — refer GP for paediatric schedule." },
      { label: "Documented incomplete MMR history (0 or 1 dose) OR uncertain", detail: "Uncertain history is treated as un-immunised. No serological testing needed before vaccinating." },
      { label: "Not pregnant", detail: "Live vaccine — contraindicated in pregnancy. Pregnancy test if any doubt; avoid conception for 1 month after vaccination." },
      { label: "Not immunocompromised", detail: "Live vaccine — contraindicated in significant immunosuppression. Specialist input." },
      { label: "Not had a live vaccine within last 4 weeks", detail: "Live vaccines either same day or ≥4 weeks apart." },
      { label: "No anaphylaxis history to MMR component", detail: "Refer." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Absolute contraindications", tone: "danger", message: "Do not vaccinate.", detail: [
      "Pregnancy.",
      "Plans for pregnancy within 1 month.",
      "Significant immunosuppression: HIV with low CD4, chemotherapy, high-dose steroids, biologics, transplant, congenital immunodeficiency.",
      "Previous anaphylaxis to MMR or component (neomycin, gelatin, kanamycin).",
      "Severe acute febrile illness today.",
      "Recent (≤4 weeks) live vaccine.",
      "Recent (≤3 months) blood products or immunoglobulins — may inactivate vaccine; defer.",
    ]},
    { id: "schedule", type: "checklist", title: "Schedule", intro: "2 doses for catch-up.", items: [
      { label: "Dose 1", detail: "Today (if no previous dose) OR re-dose if uncertain." },
      { label: "Dose 2", detail: "≥1 month after dose 1. Often 4 weeks scheduled." },
      { label: "Single previous dose", detail: "Just need second dose, ≥1 month after first." },
      { label: "Site / needle", detail: "Deltoid IM or deep subcut. 23G 25mm." },
      { label: "Co-administration", detail: "Can be given with other inactivated vaccines same day. Other LIVE vaccines: same day or ≥4 weeks apart." },
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Live vaccine", detail: "Can cause mild self-limiting illness 5–12 days post-vaccination (low-grade fever, rash). NOT contagious to others." },
      { label: "Pregnancy avoidance", detail: "Avoid conception for 1 month post-vaccination." },
      { label: "Side effects", detail: "Local soreness, mild fever, occasional rash, mild parotid swelling rare. All transient." },
      { label: "Severe rare reactions", detail: "Thrombocytopenia rare. Anaphylaxis rare. Severe encephalitis very rare. Counsel honestly while emphasising rarity." },
      { label: "Egg allergy", detail: "Not a contraindication for current MMR formulations (chicken cell, very low egg protein) — safe even with mild egg allergy. Severe egg anaphylaxis — refer for specialist administration." },
      { label: "Travel to outbreak areas", detail: "Especially relevant for measles outbreaks in Europe and elsewhere. Encourage catch-up before travel." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "LIVE vaccine: pregnancy, immunosuppression, recent blood products = contraindications.",
      "2 doses ≥1 month apart for full protection.",
      "Egg allergy generally not a contraindication.",
      "Side effects mild and transient; counsel pre-emptively.",
      "Document batch and upload to NIMS.",
    ]},
  ],
  quiz: [
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant woman wants MMR. Action?", options: [
      { id: "a", label: "Vaccinate at half dose." }, { id: "b", label: "Contraindicated — live vaccine. Defer until postpartum and avoid conception for 1 month after vaccination." }, { id: "c", label: "Vaccinate first trimester only." }, { id: "d", label: "Inactivated formulation." }
    ], correctOptionIds: ["b"], explanation: "Live vaccine in pregnancy is contraindicated due to theoretical foetal risk. Defer." },
    { id: "q-immunocompromised", type: "single-choice", critical: true, question: "Patient on rituximab wants MMR. Action?", options: [
      { id: "a", label: "Vaccinate." }, { id: "b", label: "Refer specialist. Significant immunosuppression contraindicates live vaccine — could cause disseminated infection. Specialist may identify a window of immune recovery or recommend not at all." }, { id: "c", label: "Half dose." }, { id: "d", label: "Subcut." }
    ], correctOptionIds: ["b"], explanation: "Live vaccine + significant immunosuppression = contraindicated. Specialist judgment." },
    { id: "q-recent-blood", type: "single-choice", critical: true, question: "Patient had immunoglobulin therapy 2 months ago. Wants MMR. Action?", options: [
      { id: "a", label: "Vaccinate now." }, { id: "b", label: "Defer — recent blood products / immunoglobulins (within 3 months) may neutralise live vaccine. Refer to GP for timing advice." }, { id: "c", label: "Half dose." }, { id: "d", label: "Subcut." }
    ], correctOptionIds: ["b"], explanation: "Passive antibody from blood products can inactivate live attenuated vaccines. 3-month wait minimum typically." },
    { id: "q-egg-mild", type: "single-choice", question: "Patient with mild egg allergy (rash with eggs). Action?", options: [
      { id: "a", label: "Refuse MMR." }, { id: "b", label: "Vaccinate as normal. MMR uses chick embryo cells — egg protein content is minimal. Mild egg allergy is NOT a contraindication to current UK MMR vaccines." }, { id: "c", label: "Cell-grown alternative." }, { id: "d", label: "Pre-medicate." }
    ], correctOptionIds: ["b"], explanation: "MMR is safe in mild egg allergy. Severe egg anaphylaxis — refer for specialist administration. The historical concern about egg + MMR is outdated for current vaccines." },
    { id: "q-uncertain", type: "single-choice", question: "Patient unsure if she had MMR as a child. Action?", options: [
      { id: "a", label: "Serology test first." }, { id: "b", label: "Vaccinate — uncertain history is treated as un-immunised. Extra MMR doses are safe in already-immune people. No serology testing needed." }, { id: "c", label: "Refuse." }, { id: "d", label: "Skip dose 1, go straight to dose 2." }
    ], correctOptionIds: ["b"], explanation: "Treat uncertain history as un-immunised. Vaccinate. Extra doses in already-immune are safe and effective." },
    { id: "q-co-admin-live", type: "single-choice", question: "Patient had yellow fever vaccine 2 weeks ago. Wants MMR. Action?", options: [
      { id: "a", label: "Vaccinate today." }, { id: "b", label: "Defer 4 weeks from yellow fever — live vaccines either same day or ≥4 weeks apart. Vaccinate at week 4 from yellow fever date." }, { id: "c", label: "Half dose." }, { id: "d", label: "Inactivated MMR." }
    ], correctOptionIds: ["b"], explanation: "Live vaccines need same-day or 4-week separation. Closer than 4 weeks can impair response to second vaccine." },
    { id: "q-conception", type: "single-choice", question: "Counselling for women on MMR + conception?", options: [
      { id: "a", label: "No restriction." }, { id: "b", label: "Avoid conception for 1 month after vaccination. Pregnancy is contraindication to live vaccine." }, { id: "c", label: "Avoid for 6 months." }, { id: "d", label: "Don't conceive ever." }
    ], correctOptionIds: ["b"], explanation: "1-month conception delay post-MMR. Brief but important counselling for women of childbearing potential." },
    { id: "q-schedule", type: "single-choice", question: "Patient has had one MMR dose at age 7. Schedule for catch-up?", options: [
      { id: "a", label: "Two more doses." }, { id: "b", label: "Single dose now (second of the 2-dose course). No need to restart series." }, { id: "c", label: "Three doses." }, { id: "d", label: "Boosters every 5 years." }
    ], correctOptionIds: ["b"], explanation: "Doses count cumulatively. One previous dose = needs one more for the standard 2-dose course." },
    { id: "q-side-effects", type: "single-choice", question: "Patient develops mild fever and rash 8 days after MMR. Action?", options: [
      { id: "a", label: "A&E." }, { id: "b", label: "Reassure — common expected reaction occurring 5–12 days post-MMR. Not contagious. Settles in days. Symptomatic relief if needed." }, { id: "c", label: "Antibiotic." }, { id: "d", label: "Stop further doses." }
    ], correctOptionIds: ["b"], explanation: "Delayed mild reaction is common with MMR (live vaccine replicating). Self-limiting; not contagious; counsel pre-emptively." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Dose number (1 or 2), prior history, contraindications excluded (pregnancy, immunosuppression, recent live vaccine, recent blood products), batch, site, consent — in ePGD tool. NIMS upload." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Live-vaccine PGD documentation captures the longer list of contraindications excluded plus dose number for catch-up tracking." },
  ],
};
