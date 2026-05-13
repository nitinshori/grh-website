// Oral minoxidil for alopecia — PGD training (OFF-LABEL)
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const alopeciaMinoxidilModule: TrainingModule = {
  slug: "alopecia-minoxidil",
  title: "Alopecia — Oral Minoxidil (Off-label) PGD",
  description: "Low-dose oral minoxidil for androgenetic alopecia and other non-scarring alopecias — off-label use, informed consent essential.",
  pgdSlugs: ["alopecia-minoxidil"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 12,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Oral Minoxidil — Training", subtitle: "Off-label use for alopecia: informed consent is mandatory", estimatedMinutes: 12, objectives: [
      "Understand off-label status and document informed consent.",
      "Apply eligibility criteria and cardiovascular contraindications.",
      "Manage common side effects (hypertrichosis, oedema, tachycardia).",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Minoxidil is licensed in the UK only as an oral antihypertensive (e.g. Loniten 2.5–10 mg). For severe resistant hypertension. Topical minoxidil is licensed for androgenetic alopecia. ORAL minoxidil at low doses (0.25–5 mg) for alopecia is OFF-LABEL but supported by growing evidence (Sinclair 2018, multiple subsequent RCTs and reviews).",
      "Mechanism for hair growth not fully understood — likely prolongs anagen phase via potassium channel opening, ATP-sensitive vasodilation, and direct effects on hair follicle stem cells.",
      "Doses for alopecia are MUCH lower than antihypertensive doses (typically 0.25–2.5 mg/day for women, 1.25–5 mg/day for men).",
      "GMC and MHRA position: off-label prescribing is legal under PGD only where evidence supports it and where there is no licensed alternative — the PGD must be explicit about off-label status and consent.",
    ], highlights: ["OFF-LABEL — informed consent in writing.", "Low-dose: 0.25–5 mg/day, much lower than antihypertensive dose.", "Cardiovascular contraindications still apply.", "Hypertrichosis (unwanted body hair) is dose-related and reversible."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Adult ≥18", detail: "Not used in under-18s under PGD." },
      { label: "Androgenetic alopecia or other non-scarring alopecia (e.g. telogen effluvium, traction)", detail: "Confirmed clinical pattern. Refer dermatologist if scarring alopecia, sudden severe hair loss, or scalp inflammation." },
      { label: "Topical treatments tried/considered first OR contraindicated/not tolerated", detail: "Topical minoxidil 5% solution/foam is licensed first-line for AGA. Oral is for non-responders or those who can't tolerate topical." },
      { label: "Informed consent re: off-label status documented", detail: "Patient must understand: not licensed for hair loss, dose chosen based on published evidence, side effect profile, alternatives (topical, finasteride, supportive)." },
      { label: "Cardiovascular status acceptable", detail: "Resting BP normal, no significant cardiac history, no fluid retention, not on multiple antihypertensives, no recent MI or angina." },
      { label: "Not pregnant, not planning pregnancy, not breastfeeding", detail: "Avoided in pregnancy — limited data. Effective contraception required if relevant." },
    ]},
    { id: "contraindications", type: "callout", title: "Contraindications", tone: "danger", message: "Do not prescribe — refer GP or specialist.", detail: [
      "Hypotension or unstable BP.",
      "Pheochromocytoma.",
      "Heart failure or recent MI (within 6 months).",
      "Pericardial effusion or tamponade history.",
      "Significant renal impairment (eGFR <30).",
      "Pregnancy, breastfeeding, planning pregnancy.",
      "Hypersensitivity to minoxidil.",
      "Concurrent use of guanethidine (risk of severe hypotension).",
    ]},
    { id: "dosing", type: "comparison", title: "Dose options", intro: "Start low, titrate slowly, monitor BP / HR at each step.", columns: [
      { label: "Women, AGA or telogen effluvium", rows: [
        { heading: "Starting dose", body: "0.25–0.625 mg once daily." },
        { heading: "Titration", body: "Review at 12 weeks; increase by 0.625 mg if needed and tolerated." },
        { heading: "Max under PGD", body: "2.5 mg daily." },
      ]},
      { label: "Men, AGA", rows: [
        { heading: "Starting dose", body: "1.25 mg once daily." },
        { heading: "Titration", body: "Review at 12 weeks; increase by 1.25 mg if needed and tolerated." },
        { heading: "Max under PGD", body: "5 mg daily." },
      ]},
      { label: "Older patients (>60)", rows: [
        { heading: "Starting dose", body: "0.25 mg once daily." },
        { heading: "Titration", body: "Cautious titration; lower maximum dose." },
        { heading: "Max under PGD", body: "1.25 mg daily." },
      ]},
    ]},
    { id: "monitoring", type: "checklist", title: "Monitoring", items: [
      { label: "Baseline BP, HR, weight, ankle oedema check", detail: "Document. Photograph scalp if possible (with consent) for objective response tracking." },
      { label: "12-week review", detail: "BP, HR, weight, oedema, hypertrichosis, response. Photo comparison." },
      { label: "Annual review thereafter", detail: "Ongoing CV assessment; response review; consider stopping if no benefit at 6–12 months." },
      { label: "Stop if", detail: "Persistent tachycardia >100, BP drop >20mmHg systolic with symptoms, oedema, significant hypertrichosis intolerable to patient, palpitations." },
    ]},
    { id: "side-effects", type: "callout", title: "Side effects to counsel", tone: "info", message: "Most are dose-related and reversible.", detail: [
      "Hypertrichosis (unwanted hair growth, especially face/arms) — common, dose-related, reversible on stopping. Counsel honestly — biggest reason women discontinue.",
      "Postural hypotension, dizziness — counsel re standing slowly especially first 2 weeks.",
      "Mild ankle oedema — common, usually mild; consider stopping if marked.",
      "Palpitations / sinus tachycardia — usually self-limiting; review if persistent.",
      "Headache — common at start.",
      "Rare: pericardial effusion (very rare at these doses), allergic dermatitis.",
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Oral minoxidil for alopecia is OFF-LABEL — documented informed consent essential.",
      "Doses much lower than antihypertensive (0.25–5 mg).",
      "Try topical first or document why bypassed.",
      "CV contraindications: hypotension, HF, recent MI, pregnancy.",
      "Hypertrichosis is the main tolerability issue.",
      "12-week review of BP, HR, oedema, response.",
    ]},
  ],
  quiz: [
    { id: "q-offlabel", type: "single-choice", critical: true, question: "Patient asks why minoxidil tablets aren't on the NHS for hair loss. Correct response?", options: [
      { id: "a", label: "Tell them it is licensed." }, { id: "b", label: "Explain it's OFF-LABEL — licensed only for resistant hypertension. Evidence supports low-dose use for alopecia but not via standard licensing. Document informed consent in writing." }, { id: "c", label: "Refuse to discuss." }, { id: "d", label: "Suggest finasteride only." }
    ], correctOptionIds: ["b"], explanation: "Off-label status MUST be disclosed and informed consent documented. Patients have the right to know." },
    { id: "q-bp-low", type: "single-choice", critical: true, question: "Patient with BP 102/64 on no medications asks for oral minoxidil. Action?", options: [
      { id: "a", label: "Prescribe." }, { id: "b", label: "Borderline low BP — minoxidil lowers BP further. Discuss CV risk, consider deferring or refer for evaluation. Do not start under PGD." }, { id: "c", label: "Half dose." }, { id: "d", label: "Topical only." }
    ], correctOptionIds: ["b", "d"], explanation: "Low/borderline BP is a relative contraindication. Topical minoxidil is safer in this case." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "30-year-old woman with AGA wants oral minoxidil. Trying for baby. Action?", options: [
      { id: "a", label: "Prescribe." }, { id: "b", label: "Contraindicated when trying to conceive — limited safety data in pregnancy. Discuss alternatives (topical, supportive measures, treat after family complete)." }, { id: "c", label: "Half dose." }, { id: "d", label: "After first trimester." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy and trying-to-conceive are contraindications due to limited safety data." },
    { id: "q-cardiac", type: "single-choice", critical: true, question: "65-year-old man with heart failure (NYHA II) and AGA asks for oral minoxidil. Action?", options: [
      { id: "a", label: "Prescribe." }, { id: "b", label: "Contraindicated — heart failure with fluid retention risk; minoxidil can worsen. Refer GP/cardiologist for review and consider topical only." }, { id: "c", label: "Half dose." }, { id: "d", label: "5 mg." }
    ], correctOptionIds: ["b"], explanation: "Heart failure = contraindication. Fluid retention and tachycardia risk." },
    { id: "q-female-dose", type: "single-choice", critical: true, question: "Female patient, healthy, BP 118/74, no contraindications. Starting dose?", options: [
      { id: "a", label: "5 mg daily." }, { id: "b", label: "0.25–0.625 mg once daily; review at 12 weeks; titrate cautiously up to 2.5 mg max." }, { id: "c", label: "10 mg daily." }, { id: "d", label: "2.5 mg three times daily." }
    ], correctOptionIds: ["b"], explanation: "Start low, especially in women; max 2.5 mg under this PGD." },
    { id: "q-hypertrichosis", type: "single-choice", question: "Patient reports unwanted facial hair growth after 3 months on minoxidil 1.25 mg. Action?", options: [
      { id: "a", label: "Ignore." }, { id: "b", label: "Acknowledge dose-related and reversible. Options: reduce dose, hair removal, or stop. Patient autonomy guides decision." }, { id: "c", label: "Stop immediately for everyone." }, { id: "d", label: "Increase dose." }
    ], correctOptionIds: ["b"], explanation: "Hypertrichosis is common, dose-related, reversible. Tailor management." },
    { id: "q-monitoring", type: "single-choice", question: "First review timing?", options: [
      { id: "a", label: "1 week." }, { id: "b", label: "12 weeks — BP, HR, weight, oedema, hypertrichosis, response review with photographs." }, { id: "c", label: "6 months." }, { id: "d", label: "1 year." }
    ], correctOptionIds: ["b"], explanation: "12 weeks is the standard alopecia treatment review timepoint and aligns with CV side-effect emergence." },
    { id: "q-topical-first", type: "single-choice", question: "Topical minoxidil status?", options: [
      { id: "a", label: "Same product." }, { id: "b", label: "Licensed first-line for AGA. Try topical first, OR document why bypassed (e.g. scalp irritation, poor adherence, prior failure)." }, { id: "c", label: "Combine routinely." }, { id: "d", label: "Inferior." }
    ], correctOptionIds: ["b"], explanation: "Topical minoxidil is licensed — try first or document reason for skipping." },
    { id: "q-tachycardia", type: "single-choice", question: "12-week review: HR 98 (was 72), no symptoms. Action?", options: [
      { id: "a", label: "Stop now." }, { id: "b", label: "Recheck on different day, ECG if persistent. Mild rise in HR is common; if persistent >100 or symptoms, reduce dose or stop." }, { id: "c", label: "Increase dose." }, { id: "d", label: "Ignore." }
    ], correctOptionIds: ["b"], explanation: "Mild HR rise is common; investigate and titrate per symptoms and persistence." },
    { id: "q-record", type: "single-choice", question: "Documentation must include?", options: [
      { id: "a", label: "Label only." }, { id: "b", label: "Eligibility, OFF-LABEL informed consent (written), baseline BP/HR/weight, topical history, dose chosen, counselling on hypertrichosis and CV risks, review plan — in the ePGD tool." }, { id: "c", label: "GP letter only." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Off-label prescribing demands robust consent documentation. Audit-critical." },
  ],
};
