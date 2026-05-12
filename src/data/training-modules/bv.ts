// Bacterial Vaginosis (BV) — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const bvModule: TrainingModule = {
  slug: "bv",
  title: "Bacterial Vaginosis (BV) — PGD",
  description: "Eligibility, agent choice and counselling for metronidazole or clindamycin for BV under PGD.",
  pgdSlugs: ["bv"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 12,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "BV — Training", subtitle: "Bacterial vaginosis in adult non-pregnant women", estimatedMinutes: 12, objectives: [
      "Recognise the clinical features of BV and differentiate from thrush, trichomoniasis, and other STIs.",
      "Identify women eligible for BV antibiotic supply under the PGD.",
      "Choose between oral metronidazole, topical metronidazole, and topical clindamycin.",
      "Counsel on the alcohol interaction and recurrence prevention.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Bacterial vaginosis is a polymicrobial overgrowth (Gardnerella vaginalis and others) replacing the normal lactobacilli-dominant vaginal flora. Common (~10–30% of women at any time) and often recurrent.",
      "Classic features: thin grey-white homogeneous discharge with a fishy/musty odour, especially after sex; little or no itching or irritation; vaginal pH >4.5. Symptoms may be intermittent.",
      "Not an STI but associated with sexual activity (frequency, new partners). Treatment is for symptomatic women; asymptomatic carriage doesn't require treatment outside pregnancy.",
    ], highlights: ["Thin grey discharge + fishy odour, minimal itch = classic BV.", "Itching + thick white curdy discharge = thrush, not BV.", "Profuse frothy yellow-green discharge = trichomoniasis — refer for STI workup."] },
    { id: "eligibility", type: "checklist", title: "Eligibility under the PGD", intro: "Supply is permitted only when ALL apply:", items: [
      { label: "Female, aged 16–55", detail: "Outside this range refer." },
      { label: "Symptoms typical of BV", detail: "Thin grey-white discharge + characteristic odour, minimal itch/irritation." },
      { label: "Not pregnant, not breastfeeding", detail: "Pregnancy needs GP/midwife management (BV in pregnancy may be associated with preterm birth)." },
      { label: "No symptoms of upper-tract or STI involvement", detail: "Pelvic pain, fever, dysuria, post-coital bleeding, abnormal cervical bleeding — refer." },
      { label: "Not had ≥3 episodes in past 12 months", detail: "Recurrent BV needs sexual health clinic / GP review for strategy." },
      { label: "No recent unprotected sex with new or untreated partner", detail: "STI risk should be assessed via sexual health services." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "When NOT to supply — refer", tone: "danger", message: "Refer to GP / GUM clinic if any apply.", detail: [
      "Pregnancy.",
      "Pelvic pain, fever, abnormal bleeding, dyspareunia, vaginal bleeding.",
      "Recurrent (≥3 in 12 months) or persistent BV.",
      "Suspected STI (frothy yellow-green discharge, recent new partner with no protection, partner with symptoms).",
      "Severe hepatic impairment (metronidazole considerations).",
      "Known hypersensitivity to chosen agent.",
      "Currently on disulfiram or recently stopped — metronidazole reaction.",
    ]},
    { id: "agents", type: "comparison", title: "Treatment options", intro: "Three commonly-used regimens under the PGD.", columns: [
      { label: "Metronidazole 400 mg oral BD x 7 days (first-line)", rows: [
        { heading: "Pros", body: "Oral, well-evidenced, low cost." },
        { heading: "Cons", body: "Strict alcohol avoidance during and 48h after. GI side effects." },
        { heading: "Counselling", body: "Complete the course. NO alcohol during and 48h after. Take with food." },
      ]},
      { label: "Metronidazole gel 0.75% vaginal (5g) once daily x 5 days", rows: [
        { heading: "Pros", body: "Topical, lower systemic side effects, oral-route avoidance." },
        { heading: "Cons", body: "Insertion required; may affect latex condom integrity." },
        { heading: "Counselling", body: "Insert at bedtime. Avoid latex condoms during use and for 24h after last dose." },
      ]},
      { label: "Clindamycin 2% cream vaginal (5g) once daily x 7 days", rows: [
        { heading: "Pros", body: "Alternative for metronidazole-intolerant patients." },
        { heading: "Cons", body: "Reduces latex condom and diaphragm efficacy for ≥5 days after course." },
        { heading: "Counselling", body: "Use non-latex barrier or abstain during and 5 days after course. Watch for diarrhoea (rare C. difficile risk)." },
      ]},
    ]},
    { id: "counselling", type: "checklist", title: "Counselling — every patient", items: [
      { label: "Alcohol with metronidazole", detail: "Strict avoidance during course AND 48 hours after. Disulfiram-like reaction: nausea, vomiting, flushing, tachycardia." },
      { label: "Complete the course", detail: "Even if symptoms resolve early." },
      { label: "Condom interaction", detail: "Clindamycin cream and metronidazole gel can weaken latex condoms — non-latex barrier or abstain during and 5–7 days after." },
      { label: "Recurrence prevention", detail: "Avoid douching, scented hygiene products, vaginal washes. Use plain water externally only. Cotton underwear. Avoid bubble baths." },
      { label: "Partner treatment", detail: "Not routinely required for BV (unlike thrush in some cases). Heterosexual partners do not need treatment. Same-sex female partners may benefit — refer if symptomatic." },
      { label: "Recurrence pattern", detail: "Up to half of women have a recurrence within 6 months. If ≥3 episodes in 12 months, refer to GUM clinic for longer-term strategy (e.g. suppressive regimens)." },
    ]},
    { id: "red-flags", type: "callout", title: "Red flags — refer", tone: "danger", message: "Any of these warrant referral to GP / GUM clinic, not BV supply.", detail: [
      "Pelvic pain or fever.",
      "Abnormal vaginal bleeding (post-coital, intermenstrual, post-menopausal).",
      "Frothy yellow-green discharge (suggests trichomoniasis).",
      "Recurrent BV (≥3 in 12 months).",
      "Symptoms not improving 7 days after starting treatment.",
      "Pregnancy.",
    ]},
    { id: "case-1", type: "case", title: "Case 1 — straightforward", scenario: "Maria, 31, presents with 5 days of grey-white discharge with strong fishy smell, especially after sex. No itch, no pain. Not pregnant (LARC). No new sexual partners. First episode.",
      question: "What's the supply?", answer: "Metronidazole 400 mg orally BD for 7 days, first-line. Counsel on strict alcohol avoidance during course and 48 hours after. Complete the course. Hygiene advice on avoiding douching and scented products. Return if no improvement at 7 days or recurrence.",
      rationale: "Classic uncomplicated BV. Oral metronidazole is first-line and most evidence-based." },
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Thin grey discharge + fishy odour, minimal itch — classic BV. Itch + curdy discharge = thrush.",
      "Refer if pregnant, recurrent, suspected STI, pelvic pain, or abnormal bleeding.",
      "Oral metronidazole first-line. Topical alternatives for metronidazole intolerance.",
      "Metronidazole + alcohol = disulfiram-like reaction. Strict avoidance.",
      "Topical regimens weaken latex condoms — non-latex barrier during and after.",
      "Recurrence common; ≥3/year = GUM clinic.",
    ]},
  ],
  quiz: [
    { id: "q-alcohol", type: "single-choice", critical: true, question: "Patient takes metronidazole at lunchtime then has wine with dinner. What can happen?", options: [
      { id: "a", label: "Nothing — they don't interact." }, { id: "b", label: "Disulfiram-like reaction: nausea, vomiting, flushing, headache, tachycardia. Strict alcohol avoidance during course and 48h after." }, { id: "c", label: "Reduced antibiotic effect only." }, { id: "d", label: "Severe allergic reaction." }
    ], correctOptionIds: ["b"], explanation: "The metronidazole-alcohol interaction is a recognised disulfiram-like reaction. Counsel pre-emptively; many patients underestimate the severity." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant woman with BV symptoms. Action?", options: [
      { id: "a", label: "Supply oral metronidazole." }, { id: "b", label: "Do not supply — refer to GP/midwife. BV in pregnancy is associated with preterm birth and needs different management." }, { id: "c", label: "Supply topical metronidazole." }, { id: "d", label: "Reassure — pregnancy resolves BV." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy is outside the PGD scope. BV in pregnancy raises preterm-birth risk; needs midwife/GP-led care." },
    { id: "q-differential", type: "single-choice", critical: true, question: "Patient describes profuse frothy yellow-green discharge with strong odour, vulval irritation, and dysuria. Action?", options: [
      { id: "a", label: "Supply oral metronidazole for BV." }, { id: "b", label: "Refer to GUM clinic — frothy yellow-green discharge suggests trichomoniasis, which is an STI requiring partner notification and full STI screen." }, { id: "c", label: "Supply topical clindamycin." }, { id: "d", label: "Supply thrush cream." }
    ], correctOptionIds: ["b"], explanation: "Yellow-green frothy discharge points to trichomoniasis (an STI), not BV. Requires GUM workup and partner contact tracing." },
    { id: "q-recurrent", type: "single-choice", critical: true, question: "Patient has had 4 episodes of BV in the last 8 months. Action?", options: [
      { id: "a", label: "Supply metronidazole as usual." }, { id: "b", label: "Refer to GUM clinic — recurrent BV (≥3/year) needs different strategy (e.g. suppressive twice-weekly metronidazole gel)." }, { id: "c", label: "Supply double dose." }, { id: "d", label: "Supply both oral and topical." }
    ], correctOptionIds: ["b"], explanation: "Recurrent BV needs structured longer-term management, often by GUM clinic. PGD treats episodic cases." },
    { id: "q-clindamycin-condom", type: "single-choice", question: "Patient is supplied clindamycin 2% cream. What barrier-method advice?", options: [
      { id: "a", label: "Latex condoms remain effective." }, { id: "b", label: "Clindamycin cream weakens latex condoms and diaphragms for at least 5 days after the course. Use non-latex (polyurethane) condoms or abstain during and 5 days after." }, { id: "c", label: "Use spermicide alongside." }, { id: "d", label: "No barrier method needed during treatment." }
    ], correctOptionIds: ["b"], explanation: "Clindamycin cream's oil base weakens latex. Non-latex condoms or abstinence during and 5 days post-course." },
    { id: "q-partner", type: "single-choice", question: "Patient asks if her male partner needs treating.", options: [
      { id: "a", label: "Yes, both partners should be treated." }, { id: "b", label: "No — heterosexual male partners do not need treatment. BV isn't an STI." }, { id: "c", label: "Only if he has symptoms." }, { id: "d", label: "Only with a different antibiotic." }
    ], correctOptionIds: ["b"], explanation: "BV partner treatment is not routine. Heterosexual male partners don't need treatment. Same-sex female partners can benefit from concurrent treatment if symptomatic." },
    { id: "q-hygiene", type: "single-choice", question: "Recurrence-prevention advice?", options: [
      { id: "a", label: "Daily douching." }, { id: "b", label: "Avoid douching, scented products, vaginal washes, bubble baths. Plain water externally. Cotton underwear." }, { id: "c", label: "Antibacterial soaps daily." }, { id: "d", label: "Hot baths." }
    ], correctOptionIds: ["b"], explanation: "Douching disrupts the vaginal microbiome and increases BV risk. Avoid all internal washes/products. External plain water only." },
    { id: "q-disulfiram", type: "single-choice", question: "Patient takes disulfiram for alcohol use disorder. Metronidazole?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Contraindicated — additive disulfiram-like reaction risk, including psychosis. Refer to GP/specialist for alternative (topical agents may be considered)." }, { id: "c", label: "Supply at half dose." }, { id: "d", label: "Supply with extended counselling." }
    ], correctOptionIds: ["b"], explanation: "Disulfiram + metronidazole is contraindicated — additive interaction can include psychosis. Refer." },
    { id: "q-no-improvement", type: "single-choice", question: "Patient calls 7 days after starting metronidazole, no improvement. Action?", options: [
      { id: "a", label: "Continue for another 7 days." }, { id: "b", label: "Refer to GP / GUM clinic — possible alternative diagnosis or resistant infection." }, { id: "c", label: "Supply clindamycin alongside." }, { id: "d", label: "Reassure and wait." }
    ], correctOptionIds: ["b"], explanation: "No improvement after a full course suggests alternative diagnosis or resistance. Refer." },
    { id: "q-record", type: "single-choice", question: "Documentation requirements?", options: [
      { id: "a", label: "Label only." }, { id: "b", label: "Symptoms, differential exclusion, agent chosen with rationale, alcohol/condom counselling, supply — in the ePGD tool." }, { id: "c", label: "GP email only." }, { id: "d", label: "Free-text note." }
    ], correctOptionIds: ["b"], explanation: "Full structured record in the ePGD tool, especially documenting that the differential (thrush, trichomoniasis, STI) was considered and excluded." },
  ],
};
