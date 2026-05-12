// Mounjaro (tirzepatide) — weight management PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const mounjaroModule: TrainingModule = {
  slug: "mounjaro",
  title: "Mounjaro (Tirzepatide) — Weight Management PGD",
  description:
    "Eligibility, contraindications, dose titration and counselling for the supply of tirzepatide 2.5–15 mg under PGD.",
  pgdSlugs: ["mounjaro"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 20,
  passMark: 0.8,

  slides: [
    {
      id: "intro",
      type: "intro",
      title: "Mounjaro (Tirzepatide) — Training",
      subtitle: "Dual GLP-1 / GIP receptor agonist for chronic weight management",
      estimatedMinutes: 20,
      objectives: [
        "Identify which patients are eligible for Mounjaro under the GRH PGD.",
        "Recognise the absolute contraindications (shared with the wider GLP-1 class, plus tirzepatide specifics).",
        "Apply the correct dose-titration schedule (2.5 → 5 → 7.5 → 10 → 12.5 → 15 mg weekly).",
        "Counsel patients on injection technique, GI side effects, red flags and the contraception interaction with oral contraceptive pills.",
        "Use the GRH ePGD tool to produce a defensible record and a safe-supply chain.",
      ],
    },

    {
      id: "background",
      type: "content",
      title: "Clinical background",
      body: [
        "Mounjaro is tirzepatide — a dual glucagon-like peptide-1 (GLP-1) and glucose-dependent insulinotropic polypeptide (GIP) receptor agonist — licensed in the UK for chronic weight management as an adjunct to a reduced-calorie diet and increased physical activity.",
        "It is supplied as a once-weekly subcutaneous injection in pre-filled pens across six strengths (2.5, 5, 7.5, 10, 12.5, 15 mg). Pivotal trials (SURMOUNT programme) showed average weight loss of 15–22% at 72 weeks — higher than semaglutide head-to-head.",
        "Under the GRH PGD, tirzepatide is supplied for weight management. The same molecule is also licensed under the Mounjaro brand for type 2 diabetes — that licence is prescription-only and not part of this PGD.",
      ],
      highlights: [
        "Dual GIP + GLP-1 agonism — higher efficacy than pure GLP-1 RAs.",
        "Average weight loss 15–22% at 72 weeks (SURMOUNT-1).",
        "Six titration steps. Slower if not tolerated; never faster.",
      ],
    },

    {
      id: "eligibility",
      type: "checklist",
      title: "Eligibility under the PGD",
      intro: "Supply is permitted only when ALL of the following are true:",
      items: [
        { label: "Aged 18–75", detail: "Outside this range refer to GP." },
        { label: "BMI ≥30 kg/m², OR BMI ≥27 kg/m² with at least one weight-related comorbidity", detail: "Hypertension, dyslipidaemia, prediabetes, type 2 diabetes (GP-managed), OSA, or established cardiovascular disease. BMI measured today, in the pharmacy." },
        { label: "Resident in England or Wales", detail: "CQC / HIW coverage only." },
        { label: "Engaged with diet and lifestyle change", detail: "Mounjaro is an adjunct. Document current diet/exercise pattern in the ePGD tool." },
        { label: "No absolute contraindications", detail: "Reviewed on the next slide." },
        { label: "Has read and signed the patient declaration", detail: "Includes acknowledgement of GI side effects, red flags, and the oral contraceptive interaction." },
      ],
    },

    {
      id: "absolute-contraindications",
      type: "callout",
      title: "Absolute contraindications — NEVER supply",
      tone: "danger",
      message:
        "If ANY of the following apply, the PGD cannot be used. The ePGD tool will block supply. Refer to GP.",
      detail: [
        "Personal or family history of medullary thyroid carcinoma (MTC).",
        "Personal or family history of Multiple Endocrine Neoplasia syndrome type 2 (MEN2).",
        "Personal history of pancreatitis (any cause).",
        "Pregnancy, or planning pregnancy within the next 2 months. Effective non-oral contraception required throughout treatment.",
        "Breastfeeding.",
        "Type 1 diabetes.",
        "Type 2 diabetes that has not been formally GP-diagnosed and managed.",
        "Severe gastrointestinal disease, including gastroparesis or IBD in flare.",
        "Severe hepatic impairment.",
        "End-stage renal disease (eGFR <15 or on dialysis).",
        "Known hypersensitivity to tirzepatide or excipients.",
        "Current use of another GLP-1 receptor agonist (semaglutide, liraglutide, dulaglutide).",
      ],
    },

    {
      id: "ocp-interaction",
      type: "callout",
      title: "Critical drug interaction — oral contraceptives",
      tone: "warning",
      message:
        "Tirzepatide reduces the effectiveness of oral hormonal contraceptives. This is a counselling-critical point specific to Mounjaro.",
      detail: [
        "Delayed gastric emptying reduces absorption of combined oral contraceptive pills (COCP) and progestogen-only pills (POP), particularly around dose initiation and each escalation step.",
        "Patients on the COCP or POP must switch to a non-oral method (e.g. condoms, IUD, IUS, implant, depot injection) for the duration of Mounjaro use and for 4 weeks after each dose escalation.",
        "Alternative: continue COCP/POP but add a barrier method consistently for that same period.",
        "Document the contraception plan in the ePGD tool. Confirm at every supply visit.",
      ],
    },

    {
      id: "cautions",
      type: "callout",
      title: "Cautions — proceed with consideration",
      tone: "warning",
      message:
        "Supply may still be appropriate but the patient must be counselled and followed up.",
      detail: [
        "Active gallbladder disease — increased gallstone risk.",
        "Severe GORD — may worsen with delayed gastric emptying.",
        "Diabetic retinopathy in type 2 diabetes — rapid glycaemic change can transiently worsen retinopathy.",
        "Moderate renal impairment (eGFR 30–60) — monitor for dehydration.",
        "Older patients (≥65) — start at 2.5 mg, monitor closely.",
        "Concurrent insulin or sulphonylureas — hypoglycaemia risk; only with GP awareness.",
        "History of disordered eating or bariatric surgery — specialist assessment first.",
      ],
    },

    {
      id: "dosing",
      type: "comparison",
      title: "Dose titration schedule",
      intro:
        "Mounjaro is titrated up over 20 weeks. Slower titration is acceptable if the patient is struggling. The titration is non-negotiable — do not skip steps.",
      columns: [
        {
          label: "Standard 20-week titration",
          rows: [
            { heading: "Weeks 1–4", body: "2.5 mg once weekly" },
            { heading: "Weeks 5–8", body: "5 mg once weekly" },
            { heading: "Weeks 9–12", body: "7.5 mg once weekly" },
            { heading: "Weeks 13–16", body: "10 mg once weekly" },
            { heading: "Weeks 17–20", body: "12.5 mg once weekly" },
            { heading: "Week 21 onward", body: "15 mg once weekly (maximum maintenance)" },
          ],
        },
        {
          label: "Maintenance options",
          rows: [
            { heading: "Standard maintenance", body: "15 mg weekly. Highest efficacy." },
            { heading: "Step-down maintenance", body: "If 15 mg not tolerated, maintain at 10 mg or 12.5 mg long-term." },
            { heading: "If GI side effects severe at step-up", body: "Hold at current dose for an additional 4 weeks." },
            { heading: "Missed dose <4 days", body: "Take as soon as remembered, resume schedule." },
            { heading: "Missed dose 4–6 days", body: "Skip; take next scheduled dose." },
            { heading: "Treatment paused ≥4 weeks", body: "Re-titrate from 2.5 mg." },
          ],
        },
      ],
    },

    {
      id: "injection-counselling",
      type: "checklist",
      title: "Injection technique",
      intro:
        "Once-weekly subcutaneous self-injection. Confirm the patient can demonstrate competence before supply.",
      items: [
        { label: "Same day every week", detail: "Time of day flexible; with or without food." },
        { label: "Rotate sites", detail: "Abdomen (avoid 5 cm around umbilicus), front of thighs, or upper outer arms." },
        { label: "Pen handling", detail: "Single-use pre-filled pen; remove base cap; press firmly against skin; hold ~5–10 seconds until both clicks heard. Dispose in sharps." },
        { label: "Storage", detail: "Refrigerate 2–8°C. Out of fridge ≤30°C for up to 21 days before use. Do not freeze. Protect from light." },
        { label: "Sharps disposal", detail: "Sharps bin provided or signposted." },
      ],
    },

    {
      id: "side-effects-counselling",
      type: "checklist",
      title: "Side effects — counsel every patient",
      intro:
        "GI side effects are common (~50%+), especially during titration. Patients must know what to expect and what triggers a call.",
      items: [
        { label: "Nausea", detail: "Most common. Smaller meals, slow eating, avoid greasy/spicy food, stay upright after eating." },
        { label: "Vomiting and diarrhoea", detail: "Maintain hydration — AKI risk if severe. Pause dose if oral intake impossible; contact pharmacy or GP." },
        { label: "Constipation", detail: "Fluid, fibre, OTC laxatives acceptable; signpost if persistent." },
        { label: "Reflux / dyspepsia", detail: "OTC antacids; PPI signposting if persistent." },
        { label: "Injection-site reactions", detail: "Rotate sites. Refer if severe, spreading, or persistent." },
        { label: "Fatigue, headache, dizziness", detail: "Usually transient; hydration." },
        { label: "Hair loss", detail: "Reversible diffuse shedding occasionally seen." },
        { label: "Hypoglycaemia (in diabetic patients)", detail: "Especially if on insulin/sulphonylureas. Monitor blood glucose; GP coordination required." },
      ],
    },

    {
      id: "red-flags",
      type: "callout",
      title: "Red flags — STOP and refer",
      tone: "danger",
      message:
        "If any of these are reported, immediately stop the next dose and direct to appropriate urgent care.",
      detail: [
        "Severe persistent abdominal pain, especially radiating to the back — possible pancreatitis. A&E.",
        "Acute right-upper-quadrant pain with fever or jaundice — possible cholecystitis. A&E.",
        "Severe persistent vomiting preventing oral fluids — AKI risk. Urgent GP / 111.",
        "Neck swelling, persistent hoarseness, difficulty swallowing — possible thyroid pathology. Refer urgently.",
        "Allergic reaction — facial swelling, breathing difficulty, widespread rash. 999 / A&E.",
        "Severe hypoglycaemia in diabetic patients — emergency.",
        "New or worsening depressive symptoms, suicidal ideation. Refer to GP / 111 / crisis services.",
        "Pregnancy confirmed or suspected — stop immediately; refer.",
      ],
    },

    {
      id: "follow-up",
      type: "checklist",
      title: "Follow-up and ongoing supply",
      intro:
        "Mounjaro is a long-term treatment. Each supply requires a structured follow-up assessment.",
      items: [
        { label: "Weight and BMI at every visit", detail: "Discontinuation criterion: <5% weight loss after 6 months at the dose tolerated suggests inadequate response." },
        { label: "Tolerability review", detail: "Side-effect burden, hydration, any pauses." },
        { label: "Lifestyle reinforcement", detail: "Diet and exercise progress." },
        { label: "Contraception confirmation in women of childbearing age", detail: "Mandatory at every visit. Non-oral or barrier method, given the OCP interaction." },
        { label: "GP communication", detail: "Encourage patient to inform GP; offer a letter on request." },
        { label: "Stop criteria", detail: "<5% loss at 6 months, intolerable side effects, pregnancy intent, new contraindication." },
      ],
    },

    {
      id: "case-1",
      type: "case",
      title: "Case 1 — switching from Wegovy",
      scenario:
        "Helen, 41, BMI 31 kg/m². Has been on Wegovy 2.4 mg for 9 months but plateaued at 6% weight loss. She wants to switch to Mounjaro for better efficacy. No relevant family history. Uses copper IUD.",
      question: "What is the correct approach?",
      answer:
        "Acceptable to switch. Stop Wegovy. Wait one week (one full Wegovy half-life cycle). Initiate Mounjaro at 2.5 mg with the full standard titration schedule. Do NOT start Mounjaro at a higher dose to 'match' her Wegovy exposure — the molecules are not interchangeable on a dose-for-dose basis. Copper IUD remains effective; no contraception change needed.",
      rationale:
        "Switching between GLP-1 RAs requires a washout (one week is conventional for semaglutide) and full re-titration on the new agent. Tolerance to one molecule does not confer tolerance to the other. Cross-over stacking is contraindicated.",
    },

    {
      id: "case-2",
      type: "case",
      title: "Case 2 — the contraception trap",
      scenario:
        "Aisha, 28, BMI 33 kg/m². No comorbidities. Reliable user of the combined oral contraceptive pill for 6 years. Wants to start Mounjaro.",
      question: "What contraception counselling is mandatory?",
      answer:
        "Mounjaro reduces oral contraceptive efficacy due to delayed gastric emptying, especially around dose initiation and each escalation. Counsel her to either (a) switch to a non-oral method (IUD, IUS, implant, depot, sterilisation) for the duration, or (b) continue the COCP but add a barrier method consistently during Mounjaro use and for 4 weeks after each dose increase. Document the plan in the ePGD tool. Confirm at every supply.",
      rationale:
        "This is Mounjaro-specific and easy to miss. Pregnancy is an absolute contraindication; relying on a less-effective method during a 20-week titration is unsafe. The patient must understand this before starting.",
    },

    {
      id: "summary",
      type: "summary",
      title: "Key points to remember",
      keyPoints: [
        "Eligibility: BMI ≥30, or ≥27 with a qualifying comorbidity. Age 18–75. England or Wales only.",
        "Absolute contraindications: MTC / MEN2 personal or family history, pancreatitis history, pregnancy/breastfeeding, type 1 diabetes, concurrent GLP-1 RA use.",
        "Six-step titration: 2.5 → 5 → 7.5 → 10 → 12.5 → 15 mg, four weeks per step. Slower if needed; never faster.",
        "If treatment paused ≥4 weeks, re-titrate from 2.5 mg.",
        "Oral contraceptive interaction — Mounjaro-specific. Counsel and document a backup method.",
        "Red flags: severe abdominal pain, persistent vomiting, neck swelling, allergic reaction, severe hypoglycaemia, suicidal ideation.",
        "Discontinuation: <5% weight loss at 6 months on the tolerated maintenance dose.",
        "Document everything in the ePGD tool.",
      ],
    },
  ],

  quiz: [
    {
      id: "q-mtc",
      type: "single-choice",
      critical: true,
      question:
        "Which of the following is an absolute contraindication to Mounjaro?",
      options: [
        { id: "a", label: "Well-controlled type 2 diabetes managed by GP." },
        { id: "b", label: "Family history of papillary thyroid cancer." },
        { id: "c", label: "Personal history of pancreatitis 3 years ago." },
        { id: "d", label: "BMI 28 with hypertension." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Personal history of pancreatitis (any cause, any time) is an absolute contraindication. Family history of papillary (not medullary) thyroid cancer is NOT a contraindication — only MTC and MEN2 are. Well-managed T2DM and BMI 28 with comorbidity are both acceptable.",
    },
    {
      id: "q-pregnancy",
      type: "single-choice",
      critical: true,
      question:
        "A 30-year-old on Mounjaro 10 mg tells you she is trying to conceive within the next month. What is the correct action?",
      options: [
        { id: "a", label: "Continue at 10 mg until pregnancy is confirmed." },
        { id: "b", label: "Reduce to 2.5 mg as a preconception precaution." },
        { id: "c", label: "Stop Mounjaro now. Tirzepatide should be discontinued at least 1 month before planned conception." },
        { id: "d", label: "Switch to Wegovy, which is safer in pregnancy." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Tirzepatide must be stopped before conception. The SmPC advises stopping at least 1 month before. Pregnancy and active conception attempts are absolute contraindications. No GLP-1 RA is safe in pregnancy.",
    },
    {
      id: "q-ocp",
      type: "single-choice",
      critical: true,
      question:
        "A 26-year-old who takes the combined oral contraceptive pill is starting Mounjaro. What is the correct contraception advice?",
      options: [
        { id: "a", label: "The COCP is fine; no additional contraception is needed." },
        { id: "b", label: "Stop the COCP — Mounjaro acts as a contraceptive." },
        { id: "c", label: "Either switch to a non-oral method (IUD, IUS, implant, depot) or continue COCP plus add a barrier method during Mounjaro use and for 4 weeks after each dose escalation." },
        { id: "d", label: "The COCP is fine after the first month of treatment." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Tirzepatide delays gastric emptying and reduces oral contraceptive efficacy, especially around initiation and dose escalation. This is Mounjaro-specific and a documented PGD counselling point. Non-oral methods bypass the issue entirely; if the patient stays on COCP, she must add a barrier method.",
    },
    {
      id: "q-stacking",
      type: "single-choice",
      critical: true,
      question:
        "A patient on Wegovy 2.4 mg asks about adding Mounjaro for better results.",
      options: [
        { id: "a", label: "Allow her to take both at the lowest doses for additive effect." },
        { id: "b", label: "Switch from Wegovy to Mounjaro with no washout to maintain continuous treatment." },
        { id: "c", label: "Do not allow concurrent use. To switch, stop Wegovy and after a one-week washout initiate Mounjaro at 2.5 mg with full titration." },
        { id: "d", label: "Recommend she alternate weekly between the two." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Concurrent use of two GLP-1 receptor agonists is an absolute contraindication. Switching requires washout and full re-titration on the new agent. Starting Mounjaro at any dose higher than 2.5 mg, even after switching from Wegovy, risks severe GI toxicity.",
    },
    {
      id: "q-titration",
      type: "single-choice",
      question:
        "A patient on Mounjaro 7.5 mg comes in at week 12 and is doing well. She wants to skip ahead to 12.5 mg because she's heard higher doses lose more weight. What is the correct action?",
      options: [
        { id: "a", label: "Skip to 12.5 mg — patient autonomy applies." },
        { id: "b", label: "Titrate to 10 mg as scheduled. Skipping steps is not allowed under the PGD." },
        { id: "c", label: "Maintain at 7.5 mg indefinitely." },
        { id: "d", label: "Reduce to 5 mg as a precaution." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "The titration is fixed at one step per 4 weeks. Skipping steps is never permitted — risk of severe GI side effects, dehydration, and pancreatitis. Counsel the patient on the rationale: tolerance develops gradually, and trial data is based on the step-wise titration.",
    },
    {
      id: "q-pause",
      type: "single-choice",
      question:
        "A patient was on Mounjaro 10 mg but stopped 5 weeks ago due to travel. She wants to restart at 10 mg.",
      options: [
        { id: "a", label: "Restart at 10 mg — she was tolerating it before." },
        { id: "b", label: "Restart at 7.5 mg, the previous step." },
        { id: "c", label: "Re-titrate from 2.5 mg. Pauses of 4 weeks or more require full re-titration." },
        { id: "d", label: "Refer to GP." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Pauses of 4 weeks or more on Mounjaro require re-titration from 2.5 mg, because tolerance is lost. Restarting at the previous dose risks severe GI side effects.",
    },
    {
      id: "q-storage",
      type: "single-choice",
      question:
        "A patient asks how to store her Mounjaro pen.",
      options: [
        { id: "a", label: "Freeze for long-term storage; thaw before use." },
        { id: "b", label: "Refrigerate at 2–8°C. May be at room temperature ≤30°C for up to 21 days before use. Do not freeze. Protect from light." },
        { id: "c", label: "Room temperature only, never refrigerate." },
        { id: "d", label: "In direct sunlight to keep the solution active." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Mounjaro should be refrigerated at 2–8°C. It can be kept at room temperature ≤30°C for up to 21 days. Do not freeze (irreversibly damages the protein). Protect from light. (Wegovy is similar but allows 28 days at room temperature — don't confuse the two.)",
    },
    {
      id: "q-pancreatitis-er",
      type: "single-choice",
      question:
        "A patient on Mounjaro 10 mg calls reporting severe epigastric pain radiating to her back for 3 hours, with vomiting. What is the correct advice?",
      options: [
        { id: "a", label: "Take paracetamol and a small meal." },
        { id: "b", label: "Skip the next scheduled dose; reassess in 24 hours." },
        { id: "c", label: "Stop Mounjaro and go to A&E now — these symptoms suggest pancreatitis." },
        { id: "d", label: "Drink fluids and lie down." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Severe epigastric pain radiating to the back with vomiting is the classic presentation of acute pancreatitis — a medical emergency. Mounjaro must be stopped and the patient referred to A&E immediately. Future supply is then contraindicated regardless of outcome.",
    },
    {
      id: "q-stop-criterion",
      type: "single-choice",
      question:
        "A patient has been on Mounjaro 15 mg maintenance for 6 months and has lost 4% of baseline body weight. She wants to continue. What does the PGD specify?",
      options: [
        { id: "a", label: "Continue — every kilogram counts." },
        { id: "b", label: "Increase to 17.5 mg." },
        { id: "c", label: "Consider discontinuation. The PGD criterion is <5% weight loss at 6 months on the maintenance dose tolerated." },
        { id: "d", label: "Add Wegovy alongside." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "The discontinuation criterion (less than 5% weight loss at 6 months on the dose tolerated) reflects what the licensed clinical evidence supports. There is no 17.5 mg dose. Stacking with another GLP-1 RA is contraindicated. Discuss alternatives (lifestyle, alternative agent, GP referral).",
    },
    {
      id: "q-record",
      type: "single-choice",
      question:
        "What is required documentation for every Mounjaro supply under the GRH PGD?",
      options: [
        { id: "a", label: "Just the dose on the medicine label." },
        { id: "b", label: "Today's weight, BMI, tolerability, side-effect review, contraception plan (with OCP interaction noted if relevant), GP-informed status, and supply detail — all in the ePGD tool." },
        { id: "c", label: "Email summary to the patient's GP only." },
        { id: "d", label: "A free-text note in the pharmacy logbook." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Every Mounjaro consultation is captured in the ePGD tool with the structured data above. The contraception plan is a specific PGD requirement for Mounjaro because of the OCP interaction. Paper notes or labels alone are not acceptable for audit.",
    },
  ],
};
