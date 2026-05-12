// Wegovy (semaglutide) — weight management PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const wegovyModule: TrainingModule = {
  slug: "wegovy",
  title: "Wegovy (Semaglutide) — Weight Management PGD",
  description:
    "Eligibility, contraindications, dose titration and counselling for the supply of semaglutide 0.25–2.4 mg under PGD.",
  pgdSlugs: ["wegovy"],
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
      title: "Wegovy (Semaglutide) — Training",
      subtitle: "GLP-1 receptor agonist for chronic weight management",
      estimatedMinutes: 20,
      objectives: [
        "Identify which patients are eligible for Wegovy under the GRH PGD, and which must be referred.",
        "Recognise the absolute contraindications — particularly personal/family medullary thyroid cancer or MEN2, pancreatitis history, and pregnancy.",
        "Apply the correct dose-titration schedule (0.25 → 0.5 → 1 → 1.7 → 2.4 mg weekly).",
        "Deliver structured counselling on injection technique, GI side effects, red flags, and lifestyle expectations.",
        "Use the GRH ePGD consultation tool to produce a defensible clinical record and a safe-supply chain.",
      ],
    },

    {
      id: "background",
      type: "content",
      title: "Clinical background",
      body: [
        "Wegovy is semaglutide — a glucagon-like peptide-1 (GLP-1) receptor agonist — licensed in the UK for chronic weight management as an adjunct to a reduced-calorie diet and increased physical activity. It is supplied as a once-weekly subcutaneous injection in escalating-dose pens from 0.25 mg through 2.4 mg.",
        "Mechanistically, semaglutide mimics endogenous GLP-1, slowing gastric emptying, increasing satiety, and reducing appetite. Average weight loss in pivotal trials (STEP programme) was 12–15% of baseline at 68 weeks.",
        "Under the GRH PGD, semaglutide is supplied for weight management — not for type 2 diabetes (that's the Ozempic licence, prescription-only). The PGD covers private supply to patients meeting NICE eligibility criteria, with mandatory in-pharmacy assessment.",
      ],
      highlights: [
        "Wegovy = semaglutide for weight management. Ozempic = same molecule, different licensed indication (T2DM) — prescription-only, not PGD.",
        "Average expected weight loss is 12–15% of baseline body weight at 68 weeks of treatment.",
        "Wegovy is an adjunct to diet and exercise, not a replacement. Lifestyle counselling is mandatory.",
      ],
    },

    {
      id: "eligibility",
      type: "checklist",
      title: "Eligibility under the PGD",
      intro: "Supply is permitted only when ALL of the following are true:",
      items: [
        {
          label: "Aged 18–75",
          detail:
            "Outside this range refer to GP. Use in adolescents (12–17) is licensed but outside this PGD's scope.",
        },
        {
          label: "BMI ≥30 kg/m², OR BMI ≥27 kg/m² with at least one weight-related comorbidity",
          detail:
            "Qualifying comorbidities: hypertension, dyslipidaemia, prediabetes, type 2 diabetes (note: must already be GP-managed), obstructive sleep apnoea, or cardiovascular disease. BMI measured today, in the pharmacy.",
        },
        {
          label: "Resident in England or Wales",
          detail:
            "GRH PGDs are registered for CQC (England) and HIW (Wales).",
        },
        {
          label: "Has engaged with diet and lifestyle change",
          detail:
            "Wegovy is an adjunct, not a substitute. Document the patient's current diet/exercise pattern in the ePGD tool.",
        },
        {
          label: "No absolute contraindications",
          detail: "Reviewed in the next slide. The ePGD tool will halt supply if any are flagged.",
        },
        {
          label: "Has read and signed the patient declaration",
          detail:
            "Includes acknowledgement of common GI side effects, red flags, and commitment to follow-up consultations.",
        },
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
        "Pregnancy, or planning pregnancy within the next 2 months. Contraception advised throughout treatment.",
        "Breastfeeding.",
        "Type 1 diabetes (use is not licensed under the PGD; refer for specialist consideration).",
        "Type 2 diabetes that has not been formally diagnosed and managed by a GP — the patient needs a GP review first.",
        "Severe gastrointestinal disease, including gastroparesis or inflammatory bowel disease in flare.",
        "Severe hepatic impairment.",
        "End-stage renal disease (eGFR <15 mL/min/1.73 m² or on dialysis).",
        "Known hypersensitivity to semaglutide or excipients.",
        "Current use of another GLP-1 receptor agonist (e.g. liraglutide, dulaglutide, tirzepatide). Do not stack.",
      ],
    },

    {
      id: "cautions",
      type: "callout",
      title: "Cautions — proceed with consideration",
      tone: "warning",
      message:
        "Supply may still be appropriate but the patient must be counselled accordingly and follow-up arranged.",
      detail: [
        "Active gallbladder disease — semaglutide increases risk of gallstones; document discussion.",
        "Severe GORD — may worsen with delayed gastric emptying.",
        "History of diabetic retinopathy in patients with type 2 diabetes — rapid glycaemic improvement can transiently worsen retinopathy.",
        "Moderate renal impairment (eGFR 30–60) — close monitoring of fluid balance during titration.",
        "Older patients (≥65) — start lowest dose, monitor for dehydration from GI losses.",
        "Concurrent insulin or sulphonylureas (in diabetic patients) — hypoglycaemia risk; only with GP awareness.",
        "Patients with a history of disordered eating or bariatric surgery — refer for specialist assessment first.",
      ],
    },

    {
      id: "dosing",
      type: "comparison",
      title: "Dose titration schedule",
      intro:
        "Wegovy is titrated up over 16 weeks to the 2.4 mg maintenance dose. Slower titration is acceptable if the patient is struggling with side effects. The titration is non-negotiable — do not skip steps.",
      columns: [
        {
          label: "Standard 16-week titration",
          rows: [
            { heading: "Weeks 1–4", body: "0.25 mg once weekly" },
            { heading: "Weeks 5–8", body: "0.5 mg once weekly" },
            { heading: "Weeks 9–12", body: "1 mg once weekly" },
            { heading: "Weeks 13–16", body: "1.7 mg once weekly" },
            { heading: "Week 17 onward", body: "2.4 mg once weekly (maintenance)" },
          ],
        },
        {
          label: "Modified if not tolerated",
          rows: [
            { heading: "If GI side effects severe at step-up", body: "Hold at current dose for an additional 4 weeks before next escalation." },
            { heading: "If 2.4 mg not tolerated", body: "Maintain at 1.7 mg long-term." },
            { heading: "Missed dose <5 days", body: "Take as soon as remembered, then resume schedule." },
            { heading: "Missed dose ≥5 days", body: "Skip the missed dose; take the next scheduled dose. Inform patient to call if unsure." },
            { heading: "If treatment paused ≥2 weeks", body: "Re-titrate from 0.25 mg." },
          ],
        },
      ],
    },

    {
      id: "injection-counselling",
      type: "checklist",
      title: "Injection technique — counsel every patient",
      intro:
        "Wegovy is a once-weekly subcutaneous self-injection. The patient must demonstrate confidence with the pen before supply. Use the ePGD tool's injection-checklist screen to capture this.",
      items: [
        { label: "Choose a consistent day of the week", detail: "Same day every week; time of day flexible; with or without food." },
        { label: "Rotate injection sites", detail: "Abdomen (avoid 5 cm around umbilicus), front of thighs, or upper outer arms. Rotate weekly." },
        { label: "Pen handling", detail: "Single-use pre-filled pen; remove cap; press against skin; hold until click stops (~5–10 seconds); dispose in sharps bin." },
        { label: "Storage", detail: "Refrigerate 2–8°C. Out of fridge ≤30°C for up to 28 days before use. Do not freeze. Do not shake." },
        { label: "Sharps disposal", detail: "Provide a sharps bin or signpost to pharmacy disposal scheme. Never put used pens in household waste." },
      ],
    },

    {
      id: "side-effects-counselling",
      type: "checklist",
      title: "Side effects — counsel every patient",
      intro:
        "Up to 80% of patients experience GI side effects, especially during titration. These are usually mild and short-lived but the patient must know what to expect and what to do.",
      items: [
        { label: "Nausea", detail: "Most common (~45%). Usually mild, peaks in first 2 weeks of each new dose. Smaller meals, slow eating, avoid greasy/spicy food, stay upright after eating." },
        { label: "Vomiting and diarrhoea", detail: "Maintain hydration — risk of dehydration and AKI if severe. Pause dose if vomiting prevents fluid intake; contact pharmacy or GP." },
        { label: "Constipation", detail: "Increase fluid and fibre; OTC laxatives acceptable; signpost if persistent." },
        { label: "Reflux / dyspepsia", detail: "OTC antacids acceptable; alginates after meals; PPI signposting if persistent." },
        { label: "Injection-site reactions", detail: "Mild redness/itching. Rotate sites. If severe (induration, persistent pain, spreading erythema) — pause and refer." },
        { label: "Fatigue, headache, dizziness", detail: "Usually transient. Stay hydrated." },
        { label: "Hair loss", detail: "Occasional, typically diffuse and reversible after stopping. Counsel reassuringly; refer if scarring." },
      ],
    },

    {
      id: "red-flags",
      type: "callout",
      title: "Red flags — STOP treatment and refer",
      tone: "danger",
      message:
        "If any of these are reported, immediately stop the next dose and direct to appropriate urgent care.",
      detail: [
        "Severe persistent abdominal pain, especially radiating to the back — possible pancreatitis. A&E.",
        "Acute right-upper-quadrant pain with fever or jaundice — possible cholecystitis. A&E.",
        "Severe persistent vomiting preventing oral fluids — risk of dehydration and AKI. Urgent GP / 111.",
        "Neck swelling, persistent hoarseness, difficulty swallowing — possible thyroid pathology; refer urgently.",
        "Allergic reaction — facial swelling, breathing difficulty, widespread rash. 999 / A&E.",
        "New or worsening depressive symptoms, suicidal ideation. Refer to GP / 111 / crisis services.",
        "Visual changes in a diabetic patient — possible retinopathy worsening; refer to ophthalmology.",
        "Pregnancy confirmed or suspected — stop immediately; refer to GP.",
      ],
    },

    {
      id: "follow-up",
      type: "checklist",
      title: "Follow-up and ongoing supply",
      intro:
        "Wegovy is a long-term treatment. Each supply requires a structured follow-up assessment. The PGD does not authorise indefinite repeat supply without review.",
      items: [
        { label: "Weight at every visit", detail: "Document weight and BMI. Discontinuation criterion: <5% weight loss after 6 months at maintenance dose suggests inadequate response." },
        { label: "Tolerability review", detail: "Side-effect burden, hydration status, any pauses. Adjust titration if needed." },
        { label: "Lifestyle reinforcement", detail: "Diet and exercise progress. Wegovy without lifestyle change underperforms." },
        { label: "Contraception confirmation in women of childbearing age", detail: "Mandatory at every visit. Pregnancy is an absolute contraindication." },
        { label: "GP communication", detail: "Encourage the patient to inform their GP; offer a letter on request. Document GP-informed status." },
        { label: "Stop criteria", detail: "<5% loss at 6 months on maintenance, intolerable side effects, pregnancy intent, new contraindication." },
      ],
    },

    {
      id: "case-1",
      type: "case",
      title: "Case 1 — straightforward initiator",
      scenario:
        "Sarah, 38, BMI 34 kg/m², no other comorbidities. No prescription medication. Wants to start Wegovy. Family history negative for thyroid or pancreatic disease. Not pregnant; using LARC. Has been gym-active and dieting for 4 months with modest results.",
      question: "What is the correct supply?",
      answer:
        "Initiate semaglutide 0.25 mg once weekly for 4 weeks. Counsel on injection technique, GI side effects, contraception continuation, and red flags. Book follow-up at week 4 to titrate to 0.5 mg and review tolerability and weight.",
      rationale:
        "BMI ≥30 alone qualifies — no comorbidity needed. Start at the lowest titration step always; never skip. Existing lifestyle engagement is the strongest predictor of long-term success.",
    },

    {
      id: "case-2",
      type: "case",
      title: "Case 2 — the trap",
      scenario:
        "James, 52, BMI 29 kg/m² with hypertension (well-controlled on amlodipine). Mentions his mother had 'a thyroid lump removed' in her 50s — he doesn't know what type. He's keen to start Wegovy as a friend has had good results.",
      question: "Can he be supplied today?",
      answer:
        "Do NOT supply today. The family history of an unspecified thyroid tumour is a potential MEN2 / MTC family-history flag. Refer to GP for clarification of the maternal pathology before considering supply. If maternal disease is confirmed papillary or follicular (not medullary), Wegovy may be appropriate at a later visit.",
      rationale:
        "MTC and MEN2 family history is an absolute contraindication. 'Thyroid lump' is ambiguous — the safe action is to defer and clarify rather than supply on an unclear history. The ePGD tool's family-history questions will flag this; you interpret.",
    },

    {
      id: "summary",
      type: "summary",
      title: "Key points to remember",
      keyPoints: [
        "Eligibility: BMI ≥30, or ≥27 with a qualifying comorbidity. Age 18–75. England or Wales only.",
        "Absolute contraindications: personal/family MTC or MEN2, history of pancreatitis, pregnancy/breastfeeding, type 1 diabetes, concurrent GLP-1 RA use.",
        "Titration is fixed: 0.25 → 0.5 → 1 → 1.7 → 2.4 mg, four weeks per step. Slower if needed; never faster.",
        "If treatment paused ≥2 weeks, re-titrate from 0.25 mg.",
        "Red flags: severe abdominal pain, persistent vomiting, neck swelling, allergic reaction, suicidal ideation. STOP and refer.",
        "Discontinuation if <5% weight loss at 6 months on the 2.4 mg maintenance dose.",
        "Contraception at every visit for women of childbearing age. Pregnancy is an absolute contraindication.",
        "Document everything in the ePGD tool. It enforces the rules; the record is your defensibility.",
      ],
    },
  ],

  quiz: [
    {
      id: "q-mtc",
      type: "single-choice",
      critical: true,
      question:
        "A 45-year-old man with BMI 32 wants to start Wegovy. His brother was treated for medullary thyroid cancer at age 38. What is the correct action?",
      options: [
        { id: "a", label: "Supply at the standard starting dose — family history doesn't apply if the patient is well." },
        { id: "b", label: "Supply at a reduced starting dose with strict thyroid monitoring." },
        { id: "c", label: "Do not supply. Family history of medullary thyroid cancer is an absolute contraindication. Refer to GP." },
        { id: "d", label: "Supply only the 0.25 mg pen as a 'trial' to see if symptoms develop." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Personal or family history of MTC (or of MEN2 syndrome which includes MTC) is an absolute contraindication for semaglutide. The risk of triggering or accelerating C-cell tumours in genetically susceptible individuals is unacceptable. Refer to GP/endocrinology.",
    },
    {
      id: "q-pancreatitis",
      type: "single-choice",
      critical: true,
      question:
        "Which of the following is an absolute contraindication to Wegovy?",
      options: [
        { id: "a", label: "Well-controlled hypertension on amlodipine." },
        { id: "b", label: "A single past episode of acute pancreatitis 8 years ago." },
        { id: "c", label: "BMI 31 with no other comorbidities." },
        { id: "d", label: "Age 67 with no acute comorbidities." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Personal history of pancreatitis — any cause, any time — is an absolute contraindication. The other options are all acceptable: hypertension is a qualifying comorbidity, BMI 31 alone qualifies, age 67 with care.",
    },
    {
      id: "q-pregnancy",
      type: "single-choice",
      critical: true,
      question:
        "A 32-year-old woman has been on Wegovy 1 mg for 12 weeks and is doing well. She tells you she is planning to conceive in the next 2 months. What is the correct advice?",
      options: [
        { id: "a", label: "Continue Wegovy until pregnancy is confirmed, then stop." },
        { id: "b", label: "Reduce to the lowest dose during the preconception period." },
        { id: "c", label: "Stop Wegovy now. Semaglutide should be discontinued at least 2 months before planned conception." },
        { id: "d", label: "Switch to Mounjaro, which is safer in pregnancy." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Semaglutide has a long half-life and should be stopped at least 2 months before planned conception due to potential foetal risk. Pregnancy and preconception are absolute contraindications. None of the GLP-1 RAs are safe in pregnancy.",
    },
    {
      id: "q-titration",
      type: "single-choice",
      critical: true,
      question:
        "A patient on Wegovy 0.5 mg comes in for the week-9 titration to 1 mg. She has had moderate nausea throughout the past 4 weeks. What is the correct action?",
      options: [
        { id: "a", label: "Skip ahead to 1.7 mg to reach maintenance faster." },
        { id: "b", label: "Titrate to 1 mg as scheduled." },
        { id: "c", label: "Hold at 0.5 mg for another 4 weeks before titrating, given the side-effect burden." },
        { id: "d", label: "Stop treatment entirely." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Slower titration is acceptable when GI side effects are problematic. Holding at the current step for another 4 weeks is the right answer. Skipping titration steps is never allowed under the PGD. Stopping is over-reaction for moderate, tolerable nausea.",
    },
    {
      id: "q-paused-treatment",
      type: "single-choice",
      question:
        "A patient was on Wegovy 1.7 mg but paused treatment 3 weeks ago because she went on holiday and forgot the pen. She wants to restart at the 1.7 mg dose today.",
      options: [
        { id: "a", label: "Resume at 1.7 mg — she was tolerating it before." },
        { id: "b", label: "Reduce to 1 mg as a precaution but resume next-step titration in 4 weeks." },
        { id: "c", label: "Re-titrate from 0.25 mg. Pauses ≥2 weeks require full re-titration." },
        { id: "d", label: "Stop the PGD route and refer to GP." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Any pause of 2 weeks or longer requires re-titration from 0.25 mg, because the patient has lost tolerance. Restarting at the previous dose risks severe GI side effects and dehydration.",
    },
    {
      id: "q-priapism-er",
      type: "single-choice",
      question:
        "A patient on Wegovy 1 mg calls the pharmacy complaining of severe persistent epigastric pain radiating to her back, ongoing for the last 4 hours. She has vomited twice. What is the correct advice?",
      options: [
        { id: "a", label: "Take paracetamol and the next dose as scheduled tomorrow." },
        { id: "b", label: "Skip the next dose; she should call back if symptoms persist for another 24 hours." },
        { id: "c", label: "Stop Wegovy and go to A&E now — these symptoms are consistent with pancreatitis." },
        { id: "d", label: "Drink plenty of fluids and rest at home." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Severe persistent epigastric pain radiating to the back, with vomiting, is the classic presentation of acute pancreatitis. This is a medical emergency and Wegovy must be stopped immediately. Refer to A&E.",
    },
    {
      id: "q-injection-site",
      type: "single-choice",
      question:
        "A patient asks where she should inject her Wegovy.",
      options: [
        { id: "a", label: "Always in the same spot on the upper arm for consistency." },
        { id: "b", label: "Rotate sites between abdomen (avoiding 5 cm around the umbilicus), front of thighs, and upper outer arms." },
        { id: "c", label: "Intramuscularly into the gluteal muscle for slower absorption." },
        { id: "d", label: "Anywhere on the body, choosing whatever's most convenient." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Wegovy is a subcutaneous injection. Approved sites are abdomen (avoiding 5 cm around the umbilicus), front of thighs, and upper outer arms. Rotate weekly to reduce injection-site reactions. Never IM.",
    },
    {
      id: "q-stop-criterion",
      type: "single-choice",
      question:
        "A patient has been on Wegovy 2.4 mg maintenance for 6 months and has lost 3% of her baseline body weight. She wants to continue. What does the PGD specify?",
      options: [
        { id: "a", label: "Continue indefinitely — any weight loss is progress." },
        { id: "b", label: "Continue but increase the dose to 3 mg." },
        { id: "c", label: "Consider stopping. The PGD discontinuation criterion is <5% weight loss after 6 months at maintenance dose." },
        { id: "d", label: "Switch to Mounjaro automatically." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "If a patient has not achieved at least 5% weight loss after 6 months on the 2.4 mg maintenance dose, the response is considered inadequate and continuation is not appropriate under the PGD. Discuss alternatives (lifestyle, alternative agent, GP referral). 3 mg is not a Wegovy dose.",
    },
    {
      id: "q-mounjaro-overlap",
      type: "single-choice",
      question:
        "A patient asks whether she can take Wegovy and Mounjaro together for faster results, as she's seen recommendations online.",
      options: [
        { id: "a", label: "Yes, that's the standard stacking approach." },
        { id: "b", label: "Only if the doses are halved." },
        { id: "c", label: "No. Concurrent use of two GLP-1 receptor agonists is contraindicated." },
        { id: "d", label: "Yes, but only for the first 4 weeks." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Stacking GLP-1 RAs is not safe — duplicate mechanism, no efficacy benefit, severe risk of GI toxicity, pancreatitis, and dehydration. Patient must be on one only. If a switch is wanted, washout before changing.",
    },
    {
      id: "q-record",
      type: "single-choice",
      question:
        "What is required documentation for every Wegovy supply consultation under the GRH PGD?",
      options: [
        { id: "a", label: "Just the brand and dose on the medicine label." },
        { id: "b", label: "Today's weight, BMI, tolerability assessment, side-effect review, contraception confirmation (women of childbearing age), GP-informed status, and supply detail — all in the ePGD tool." },
        { id: "c", label: "A free-text note in the pharmacy's general patient logbook." },
        { id: "d", label: "An email to the patient's GP with the dose only." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Every Wegovy consultation is captured in the ePGD tool with the full structured data — weight/BMI today, tolerability, side effects, contraception, GP awareness, and the supply itself. This is your audit trail; paper notes or labels alone are not acceptable.",
    },
  ],
};
