// Orlistat — weight management PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const orlistatModule: TrainingModule = {
  slug: "orlistat",
  title: "Orlistat — Weight Management PGD",
  description:
    "Eligibility, contraindications and counselling for orlistat 120 mg three times daily under PGD.",
  pgdSlugs: ["orlistat"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 12,
  passMark: 0.8,
  slides: [
    {
      id: "intro",
      type: "intro",
      title: "Orlistat — Training",
      subtitle: "Lipase inhibitor for adjunctive weight management",
      estimatedMinutes: 12,
      objectives: [
        "Identify patients eligible for orlistat under the PGD.",
        "Recognise contraindications and significant drug interactions.",
        "Counsel on GI side effects, dietary requirements, and fat-soluble vitamin supplementation.",
        "Use the ePGD tool to record the consultation.",
      ],
    },
    {
      id: "background",
      type: "content",
      title: "Clinical background",
      body: [
        "Orlistat is a gastric and pancreatic lipase inhibitor that reduces dietary fat absorption by ~30%. It is the oldest weight-management drug still in widespread use. Average weight loss is modest (3–5% over 6 months when combined with a hypocaloric diet).",
        "Orlistat 60 mg (Alli) is available OTC; the PGD covers the 120 mg three-times-daily prescription strength for patients meeting eligibility.",
      ],
      highlights: [
        "Mechanism: reduces dietary fat absorption.",
        "Modest weight loss (3–5%) — adjunct to diet only.",
        "GI side effects (oily stools, urgency) are common and depend on dietary fat intake.",
      ],
    },
    {
      id: "eligibility",
      type: "checklist",
      title: "Eligibility under the PGD",
      intro: "Supply is permitted only when ALL apply:",
      items: [
        { label: "Adult, 18–75", detail: "Outside this range refer." },
        { label: "BMI ≥30, OR BMI ≥28 with a comorbidity", detail: "Comorbidity: diabetes, dyslipidaemia, hypertension." },
        { label: "Has engaged with hypocaloric diet", detail: "Orlistat without dietary fat reduction causes severe steatorrhoea and limited weight loss." },
        { label: "No absolute contraindications", detail: "Reviewed next." },
        { label: "Resident in England or Wales", detail: "CQC / HIW only." },
      ],
    },
    {
      id: "absolute-contraindications",
      type: "callout",
      title: "Absolute contraindications",
      tone: "danger",
      message: "If any apply, do not supply.",
      detail: [
        "Chronic malabsorption syndrome.",
        "Cholestasis or significant biliary disease.",
        "Pregnancy or breastfeeding.",
        "Concurrent ciclosporin — orlistat reduces ciclosporin absorption (transplant patients).",
        "Known hypersensitivity to orlistat.",
        "Severe hepatic impairment.",
      ],
    },
    {
      id: "interactions",
      type: "callout",
      title: "Important drug interactions",
      tone: "warning",
      message: "Orlistat affects absorption of fat-soluble drugs and vitamins.",
      detail: [
        "Ciclosporin — absorption significantly reduced. Contraindicated.",
        "Levothyroxine — separate doses by at least 4 hours.",
        "Antiepileptic drugs — can reduce levels; monitor.",
        "Oral contraceptives — severe diarrhoea may reduce absorption; backup contraception during episodes.",
        "Warfarin — INR may be affected; monitor more closely on initiation.",
        "Amiodarone — reduced absorption; specialist advice if relevant.",
        "Fat-soluble vitamins (A, D, E, K) — recommend multivitamin at bedtime (>2 hours from orlistat dose).",
      ],
    },
    {
      id: "dosing-counselling",
      type: "checklist",
      title: "Dosing and counselling",
      items: [
        { label: "Dose", detail: "120 mg with each main meal (breakfast, lunch, dinner). Omit dose if a meal is missed or contains no fat." },
        { label: "Dietary requirement", detail: "Distribute fat intake evenly across meals; aim for <30% of calories from fat. High-fat meals cause severe steatorrhoea." },
        { label: "Multivitamin", detail: "Recommend daily multivitamin containing fat-soluble vitamins A, D, E, K, taken at bedtime (≥2 hours from last orlistat dose)." },
        { label: "GI side effects", detail: "Oily spotting, fatty/oily stools, urgency, flatulence with discharge. Worsen with high-fat meals. Reassure these are predictable, not infections." },
        { label: "Stopping criterion", detail: "If <5% weight loss at 12 weeks, discontinue — adequate response considered <5%." },
        { label: "Long-term safety", detail: "Acceptable for long-term use; rare reports of hepatic dysfunction — report jaundice or RUQ pain." },
      ],
    },
    {
      id: "red-flags",
      type: "callout",
      title: "Red flags — STOP and refer",
      tone: "danger",
      message: "Refer to GP if any of these occur.",
      detail: [
        "Severe RUQ pain, jaundice, dark urine — possible hepatic toxicity.",
        "Severe abdominal pain — exclude pancreatitis or other cause.",
        "Heavy GI losses preventing oral intake — dehydration.",
        "Rectal bleeding — exclude other pathology.",
        "Suspected oxalate kidney stones — orlistat increases oxalate absorption.",
      ],
    },
    {
      id: "case-1",
      type: "case",
      title: "Case 1 — straightforward",
      scenario:
        "Karen, 50, BMI 33, type 2 diabetes on metformin (GP-managed). Has been on a calorie-restricted diet for 3 months with 2 kg loss. No other medications. No contraindications. Wants help to progress.",
      question: "What's the correct supply?",
      answer: "Orlistat 120 mg three times daily with main meals. Counsel on dietary fat distribution, expected GI side effects, multivitamin at bedtime, and 12-week review for weight response.",
      rationale: "Meets BMI ≥28 with diabetes comorbidity. Engaged with diet. No contraindications. Orlistat is a reasonable adjunct.",
    },
    {
      id: "summary",
      type: "summary",
      title: "Key points",
      keyPoints: [
        "BMI ≥30, or ≥28 with diabetes/dyslipidaemia/hypertension.",
        "120 mg with each main meal containing fat.",
        "Counsel on fat distribution, GI side effects, and multivitamin (bedtime, separate from orlistat).",
        "Avoid concurrent ciclosporin (contraindicated); space levothyroxine, monitor warfarin INR.",
        "Stop if <5% weight loss at 12 weeks.",
      ],
    },
  ],
  quiz: [
    { id: "q-ciclosporin", type: "single-choice", critical: true, question: "A liver-transplant patient on ciclosporin wants orlistat. Action?", options: [
      { id: "a", label: "Supply with caution." },
      { id: "b", label: "Contraindicated — orlistat reduces ciclosporin absorption, risking graft rejection. Refer." },
      { id: "c", label: "Supply but space doses by 4 hours." },
      { id: "d", label: "Supply at half dose." },
    ], correctOptionIds: ["b"], explanation: "Ciclosporin is an absolute contraindication for orlistat — reduced absorption risks transplant rejection. Always check medication list." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Orlistat in pregnancy?", options: [
      { id: "a", label: "Acceptable." },
      { id: "b", label: "Contraindicated." },
      { id: "c", label: "First trimester only." },
      { id: "d", label: "Only with folic acid." },
    ], correctOptionIds: ["b"], explanation: "Orlistat is contraindicated in pregnancy and breastfeeding." },
    { id: "q-malabsorption", type: "single-choice", critical: true, question: "A patient with coeliac disease (well-controlled on gluten-free diet) wants orlistat. Action?", options: [
      { id: "a", label: "Supply normally." },
      { id: "b", label: "Refer to GP first — chronic malabsorption is a contraindication; well-controlled coeliac may still be inappropriate without GP assessment." },
      { id: "c", label: "Supply at higher dose." },
      { id: "d", label: "Supply without multivitamin." },
    ], correctOptionIds: ["b"], explanation: "Chronic malabsorption syndromes are listed as contraindications. Well-controlled coeliac is debated — GP review is prudent." },
    { id: "q-multivitamin", type: "single-choice", critical: true, question: "Why is a multivitamin recommended?", options: [
      { id: "a", label: "To enhance weight loss." },
      { id: "b", label: "Orlistat reduces absorption of fat-soluble vitamins A, D, E, K. Take at bedtime, ≥2 hours after last orlistat dose." },
      { id: "c", label: "To prevent GI side effects." },
      { id: "d", label: "Required by law." },
    ], correctOptionIds: ["b"], explanation: "Reduced fat absorption means reduced fat-soluble vitamin absorption. Multivitamin (containing ADEK) at bedtime, away from orlistat dose, mitigates deficiency risk." },
    { id: "q-levothyroxine", type: "single-choice", question: "A patient on levothyroxine 100 mcg daily wants orlistat. Action?", options: [
      { id: "a", label: "Supply orlistat; no interaction." },
      { id: "b", label: "Supply orlistat; space levothyroxine dose by at least 4 hours from any orlistat dose; consider repeat TFT in 6–8 weeks." },
      { id: "c", label: "Contraindicated." },
      { id: "d", label: "Supply and double the levothyroxine." },
    ], correctOptionIds: ["b"], explanation: "Orlistat can reduce levothyroxine absorption. Separation in time mitigates this; monitor TFTs after a few weeks." },
    { id: "q-fat-meal", type: "single-choice", question: "Patient asks whether to take orlistat if she's having a fat-free meal.", options: [
      { id: "a", label: "Take orlistat anyway for consistency." },
      { id: "b", label: "Omit the dose. Orlistat works on dietary fat; without fat, no benefit and no point." },
      { id: "c", label: "Double the dose." },
      { id: "d", label: "Take it 2 hours after the meal." },
    ], correctOptionIds: ["b"], explanation: "Orlistat blocks lipase. If there's no dietary fat to block, the dose provides no benefit and serves no purpose. Omit." },
    { id: "q-ocp", type: "single-choice", question: "A patient on the combined oral contraceptive pill experiences severe orlistat-induced diarrhoea. What's the correct advice?", options: [
      { id: "a", label: "Reassure — pill is still fully effective." },
      { id: "b", label: "Severe diarrhoea can reduce OCP absorption; use additional barrier contraception until 7 days after diarrhoea stops, per missed-pill rules." },
      { id: "c", label: "Take double pill dose." },
      { id: "d", label: "Stop the OCP." },
    ], correctOptionIds: ["b"], explanation: "Severe diarrhoea is treated as missed-pill scenario per FSRH guidance. Barrier method for 7 days after symptoms stop. This is a real practical interaction." },
    { id: "q-stop-criterion", type: "single-choice", question: "Stop criterion?", options: [
      { id: "a", label: "Continue indefinitely regardless of response." },
      { id: "b", label: "Discontinue if <5% weight loss at 12 weeks." },
      { id: "c", label: "Discontinue if any weight loss at all." },
      { id: "d", label: "Stop at 6 weeks if no loss." },
    ], correctOptionIds: ["b"], explanation: "<5% loss at 12 weeks indicates inadequate response and orlistat should be discontinued." },
    { id: "q-jaundice", type: "single-choice", question: "Patient on orlistat 6 weeks develops jaundice and RUQ pain. Correct action?", options: [
      { id: "a", label: "Continue and observe." },
      { id: "b", label: "Stop orlistat and refer to GP / A&E — possible hepatic toxicity (rare but reported)." },
      { id: "c", label: "Switch to Wegovy." },
      { id: "d", label: "Reduce dose." },
    ], correctOptionIds: ["b"], explanation: "Rare reports of severe hepatic toxicity. Jaundice or RUQ pain is a red flag — stop and refer." },
    { id: "q-record", type: "single-choice", question: "Required documentation?", options: [
      { id: "a", label: "Medicine label only." },
      { id: "b", label: "BMI, dietary engagement, medication list (checked for interactions), counselling delivered, supply detail — in the ePGD tool." },
      { id: "c", label: "GP email only." },
      { id: "d", label: "Free-text note." },
    ], correctOptionIds: ["b"], explanation: "Full structured record in the ePGD tool — particularly the medication-list check for ciclosporin and other interactions." },
  ],
};
