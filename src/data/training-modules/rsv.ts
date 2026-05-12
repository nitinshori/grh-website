// RSV vaccination — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const rsvModule: TrainingModule = {
  slug: "rsv",
  title: "RSV Vaccination (Abrysvo) — PGD",
  description: "RSV vaccination of older adults and pregnant women under PGD.",
  pgdSlugs: ["rsv"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "RSV Vaccination — Training", subtitle: "Abrysvo (bivalent RSVpreF) for older adults and pregnancy", estimatedMinutes: 10, objectives: [
      "Identify eligible cohorts (older adults 75–79 with catch-up to 80, pregnant women 28+ weeks).",
      "Administer single dose correctly.",
      "Counsel on side effects and the rationale for the pregnancy maternal-immunisation strategy.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Respiratory syncytial virus (RSV) causes significant respiratory illness in infants and older adults. Hospitalisation rates rise sharply in older adults and infants in their first 6 months.",
      "UK RSV programme (launched 2024): single Abrysvo dose for adults aged 75 (with catch-up to age 79 / 80 depending on cohort year), and for pregnant women from 28 weeks (provides passive immunity to neonate). Single lifetime dose; not repeated annually.",
      "Abrysvo is a protein-subunit bivalent vaccine targeting RSV subtypes A and B.",
    ], highlights: ["Single lifetime dose; not annual.", "Routine offer at 75 (with catch-up rules).", "Pregnant women: from 28 weeks for neonatal protection."] },
    { id: "eligibility", type: "checklist", title: "Eligibility (UK 2024+ programme)", intro: "Check current Green Book chapter 27a.", items: [
      { label: "Age 75 (routine)", detail: "Single Abrysvo dose offered around 75th birthday." },
      { label: "Catch-up: 76–79 (cohort-dependent)", detail: "Older adults up to age 79–80 per cohort year. Time-limited; check current rules." },
      { label: "Pregnant women from 28 weeks", detail: "Single dose at 28+ weeks gestation. Maternal antibody crosses placenta and protects infant in first ~6 months." },
      { label: "Not already vaccinated previously", detail: "Single lifetime dose currently — re-doses not on programme." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Contraindications", tone: "danger", message: "Do not vaccinate.", detail: [
      "Previous anaphylaxis to Abrysvo or component.",
      "Severe acute febrile illness today — postpone.",
      "Pregnancy <28 weeks — defer to 28 weeks. (Not contraindicated absolutely but not yet indicated.)",
      "Pregnancy with complication preventing maternal vaccination — refer obstetric.",
      "Children — not in scope for Abrysvo (different products are used for paediatric — nirsevimab monoclonal antibody, not vaccine).",
    ]},
    { id: "administration-counselling", type: "checklist", title: "Administration and counselling", items: [
      { label: "Dose", detail: "0.5 mL IM, deltoid. 23G 25mm needle. Single dose only." },
      { label: "Side effects", detail: "Local pain, fatigue, headache, muscle ache — typically mild, 24–48 hours." },
      { label: "Co-administration", detail: "Acceptable with flu, COVID, shingles, pneumococcal. Different deltoids." },
      { label: "Pregnancy rationale", detail: "Maternal antibody crosses placenta giving baby protection during the first months when RSV bronchiolitis is most dangerous. Vaccination not for the mother's protection primarily." },
      { label: "Older adult rationale", detail: "Direct protection — significant reduction in severe RSV illness and hospitalisation in older adults." },
      { label: "Document", detail: "Single-dose record, batch, NIMS upload." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Single lifetime Abrysvo dose.",
      "Routine: age 75 with catch-up to 79.",
      "Pregnancy: from 28 weeks for neonatal protection.",
      "Co-administer with flu / COVID / shingles / pneumococcal as needed.",
      "Counsel on the maternal-passive-immunity strategy for pregnant patients.",
    ]},
  ],
  quiz: [
    { id: "q-anaphylaxis", type: "single-choice", critical: true, question: "Patient had anaphylaxis to a previous Abrysvo dose. Action?", options: [
      { id: "a", label: "Re-vaccinate." }, { id: "b", label: "Refer to allergy clinic / GP. Anaphylaxis is absolute contraindication." }, { id: "c", label: "Half dose." }, { id: "d", label: "Pre-medicate." }
    ], correctOptionIds: ["b"], explanation: "Anaphylaxis = absolute contraindication. Specialist assessment." },
    { id: "q-pregnancy-early", type: "single-choice", critical: true, question: "14-week pregnant patient wants RSV vaccine. Action?", options: [
      { id: "a", label: "Vaccinate now." }, { id: "b", label: "Defer until 28 weeks. Earlier vaccination doesn't optimise neonatal antibody transfer; programme guidance specifies from 28 weeks." }, { id: "c", label: "Half dose." }, { id: "d", label: "Refer." }
    ], correctOptionIds: ["b"], explanation: "Programme guidance: from 28 weeks. Earlier doesn't optimise antibody transfer timing." },
    { id: "q-children", type: "single-choice", critical: true, question: "Parent asks about RSV vaccine for their 6-month-old. Action?", options: [
      { id: "a", label: "Vaccinate with half dose." }, { id: "b", label: "Refer — paediatric RSV protection uses nirsevimab (monoclonal antibody), not Abrysvo vaccine. Different product / programme." }, { id: "c", label: "Vaccinate." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Abrysvo is not for children. Nirsevimab is the paediatric RSV product. Different pathway." },
    { id: "q-acute-illness", type: "single-choice", critical: true, question: "75-year-old with severe acute febrile illness today. Action?", options: [
      { id: "a", label: "Vaccinate." }, { id: "b", label: "Postpone until recovered." }, { id: "c", label: "Half dose." }, { id: "d", label: "Subcut." }
    ], correctOptionIds: ["b"], explanation: "Acute febrile illness = postpone. Standard for all vaccines." },
    { id: "q-rationale-pregnancy", type: "single-choice", question: "Why is RSV vaccine given to pregnant women?", options: [
      { id: "a", label: "Maternal protection from RSV." }, { id: "b", label: "Maternal antibodies cross the placenta and protect the infant during the first ~6 months when severe RSV bronchiolitis is most dangerous. Maternal benefit is secondary." }, { id: "c", label: "Reduces preterm labour." }, { id: "d", label: "Improves fertility." }
    ], correctOptionIds: ["b"], explanation: "Maternal immunisation strategy: passive antibody transfer protects neonate. Important counselling point — mothers may not realise the indication is for the baby." },
    { id: "q-frequency", type: "single-choice", question: "How often should RSV vaccine be repeated?", options: [
      { id: "a", label: "Annually." }, { id: "b", label: "Single lifetime dose currently — programme does not include annual re-vaccination." }, { id: "c", label: "Every 2 years." }, { id: "d", label: "Every pregnancy." }
    ], correctOptionIds: ["b"], explanation: "Current programme is single lifetime dose. Future guidance may change but currently no re-dose." },
    { id: "q-route", type: "single-choice", question: "Site and route?", options: [
      { id: "a", label: "Subcut." }, { id: "b", label: "Deltoid IM, 23G 25mm needle. 0.5 mL." }, { id: "c", label: "Oral." }, { id: "d", label: "Intradermal." }
    ], correctOptionIds: ["b"], explanation: "Standard adult IM. Same as flu/COVID/shingles." },
    { id: "q-co-admin", type: "single-choice", question: "Can RSV be given with flu and shingles same day?", options: [
      { id: "a", label: "No." }, { id: "b", label: "Yes — co-administration with flu, COVID, shingles, pneumococcal acceptable. Different deltoids." }, { id: "c", label: "Only flu." }, { id: "d", label: "Only one inactivated per visit." }
    ], correctOptionIds: ["b"], explanation: "Co-administration of inactivated vaccines is standard practice." },
    { id: "q-second-pregnancy", type: "single-choice", question: "Patient had RSV vaccine in last pregnancy. Now pregnant again at 30 weeks. Re-dose?", options: [
      { id: "a", label: "Yes, every pregnancy." }, { id: "b", label: "Per current programme, single lifetime dose only. Refer for current guidance — this may change as data accumulates." }, { id: "c", label: "Half dose." }, { id: "d", label: "Wait until after delivery." }
    ], correctOptionIds: ["b"], explanation: "Current UK programme is single lifetime dose. Pregnant patients vaccinated in a previous pregnancy don't currently receive a re-dose. Guidance may evolve." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Cohort (age or pregnancy stage), batch, expiry, site, contraindications excluded, consent — in the ePGD tool. NIMS upload." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Standard structured vaccination record, NIMS upload." },
  ],
};
