// Period delay (norethisterone) — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const periodDelayModule: TrainingModule = {
  slug: "period-delay",
  title: "Period Delay (Norethisterone) — PGD",
  description: "Eligibility and supply of norethisterone for short-term menstrual postponement under PGD.",
  pgdSlugs: ["period-delay"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Period Delay — Training", subtitle: "Norethisterone 5 mg three times daily for short-term menstrual postponement", estimatedMinutes: 10, objectives: [
      "Identify women eligible for short-term period delay under the PGD.",
      "Recognise the VTE risk and absolute contraindications.",
      "Counsel on timing, expected withdrawal bleed, and not a contraceptive.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Norethisterone is a synthetic progestogen that maintains the endometrium when taken in late luteal phase, postponing menstruation until the drug is stopped (after which a withdrawal bleed occurs within 2–3 days).",
      "Standard dose: 5 mg three times daily, started 3 days before the expected period start, continued for up to 14 days (a maximum of 17 days total in some protocols). Used for specific events (holiday, wedding, exam, athletic event).",
      "Important: norethisterone for period delay is NOT a contraceptive at this dose. Patients on hormonal contraception generally don't need period delay (extended COCP regimens are simpler).",
    ], highlights: ["Start 3 days before expected period. Continue up to ~14 days.", "Not a contraceptive at this dose — barrier methods required if needed.", "Withdrawal bleed begins 2–3 days after stopping."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Female, aged 18–50", detail: "Outside this range refer. Pregnancy is contraindicated; postmenopausal not relevant." },
      { label: "Regular menstrual cycle", detail: "Knows when period is due (timing critical for efficacy)." },
      { label: "Not currently pregnant or breastfeeding", detail: "Refer." },
      { label: "Wants short-term delay (≤14 days)", detail: "Longer-term cycle manipulation needs GP/specialist." },
      { label: "No absolute contraindications (next slide)", detail: "Reviewed at every supply." },
      { label: "BMI ≤35", detail: "Higher BMI increases VTE risk; refer above 35." },
      { label: "Not a smoker aged ≥35", detail: "VTE risk profile changes; refer." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Absolute contraindications", tone: "danger", message: "Refer if any apply.", detail: [
      "Personal history of VTE (DVT, PE) or known thrombophilia.",
      "Active arterial thrombotic disease (recent MI, stroke, TIA).",
      "Current or past hormone-sensitive breast cancer.",
      "Severe liver disease, active or past.",
      "Undiagnosed vaginal bleeding.",
      "Pregnancy.",
      "Severe diabetes with vascular complications.",
      "Migraine with aura — relative; consider refer.",
      "Concurrent enzyme-inducing drugs (reduce efficacy) — consider refer.",
      "Sickle cell disease.",
      "Endometriosis with breakthrough bleeding history — refer.",
    ]},
    { id: "dosing", type: "checklist", title: "Dosing and timing", intro: "Precision is critical for efficacy.", items: [
      { label: "Dose", detail: "Norethisterone 5 mg three times daily (e.g. 8am, 2pm, 8pm)." },
      { label: "Start", detail: "3 days before the expected period start date. If the patient can't predict her cycle, period delay may not work — confirm timing." },
      { label: "Duration", detail: "Continue until the day she wants to allow menstruation. Maximum 14 days of continuous use." },
      { label: "Withdrawal", detail: "Period typically starts 2–3 days after the last tablet." },
      { label: "Missed dose", detail: "Take as soon as remembered if within a few hours; otherwise skip and take next as scheduled. Breakthrough bleeding more likely if doses missed." },
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Not a contraceptive", detail: "Period delay dose does NOT prevent pregnancy. Continue current contraception OR use barrier method if relying on this for menstrual control." },
      { label: "Side effects", detail: "Breast tenderness, mood changes, nausea, breakthrough spotting, headache. Usually mild and resolve after stopping." },
      { label: "VTE awareness", detail: "Small increased VTE risk. Recognise signs: leg pain/swelling (DVT), breathlessness/chest pain (PE). Seek urgent care." },
      { label: "Expected withdrawal bleed", detail: "Within 2–3 days of last dose. May be slightly heavier than normal period." },
      { label: "Limit on use", detail: "Max 14 days continuous. For more frequent need, GP can discuss extended hormonal contraception regimens or other strategies." },
      { label: "If period starts during therapy", detail: "Breakthrough bleeding — may continue treatment if event hasn't happened, or stop. Reassure that next period will arrive after stopping." },
    ]},
    { id: "red-flags", type: "callout", title: "Refer", tone: "danger", message: "Stop / refer for any of these.", detail: [
      "Suspected VTE — leg swelling/pain, breathlessness, chest pain. 999 / A&E.",
      "Severe headache with visual or neurological symptoms.",
      "Jaundice.",
      "Severe abdominal pain.",
      "Suspected pregnancy.",
      "Heavy unscheduled bleeding.",
      "Repeated requests within short timeframe — indicates underlying issue better addressed by contraception planning.",
    ]},
    { id: "case-1", type: "case", title: "Case 1 — straightforward", scenario: "Charlotte, 28, has a wedding in 10 days and her period is due to start the day before. BMI 24, non-smoker, no medical history, on no medication. Last VTE check: never had any.",
      question: "Supply?", answer: "Norethisterone 5 mg three times daily, starting 3 days before the expected period. Continue until the morning after the wedding (about 8 days total). Withdrawal bleed will start 2–3 days later. Counsel that this is not contraception and on VTE awareness.",
      rationale: "Classic short-term use, no contraindications. Standard dosing." },
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "5 mg TDS starting 3 days before expected period, max 14 days.",
      "Withdrawal bleed within 2–3 days of stopping.",
      "Not a contraceptive at this dose.",
      "Refer: VTE history, thrombophilia, breast cancer, severe liver disease, age ≥35 smoker, BMI >35, pregnancy.",
      "Counsel on VTE signs.",
    ]},
  ],
  quiz: [
    { id: "q-vte", type: "single-choice", critical: true, question: "Patient had a DVT 4 years ago, no current anticoagulation. Wants period delay. Action?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Refer. Personal history of VTE is an absolute contraindication." }, { id: "c", label: "Supply half dose." }, { id: "d", label: "Supply with aspirin." }
    ], correctOptionIds: ["b"], explanation: "Personal VTE history is absolute contraindication. Refer." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Norethisterone in pregnancy?", options: [
      { id: "a", label: "Acceptable." }, { id: "b", label: "Contraindicated. Refer for proper care." }, { id: "c", label: "First trimester only." }, { id: "d", label: "Third trimester only." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy is a contraindication. If period is delayed and pregnancy possible, exclude pregnancy first." },
    { id: "q-bmi-smoker", type: "single-choice", critical: true, question: "37-year-old, BMI 36, smokes 10/day. Wants period delay for an event. Action?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Refer. BMI >35 plus smoker aged ≥35 — VTE risk too high for PGD; needs GP review." }, { id: "c", label: "Supply at half dose." }, { id: "d", label: "Supply with reduced duration." }
    ], correctOptionIds: ["b"], explanation: "Higher VTE risk profile is outside the PGD's safety envelope. GP can assess and decide." },
    { id: "q-contraceptive", type: "single-choice", critical: true, question: "Patient asks if she can rely on norethisterone for contraception during her holiday.", options: [
      { id: "a", label: "Yes, it's contraceptive at this dose." }, { id: "b", label: "No. Period delay dose is NOT a contraceptive. She must continue existing contraception or use a barrier method." }, { id: "c", label: "Yes, if she takes it with the morning-after pill." }, { id: "d", label: "Yes, for 14 days only." }
    ], correctOptionIds: ["b"], explanation: "Period-delay dose (5 mg TDS for short course) is not contraceptive. This is a key counselling point — easy to assume otherwise." },
    { id: "q-timing", type: "single-choice", question: "Patient's period due Friday. When should she start norethisterone?", options: [
      { id: "a", label: "Friday morning." }, { id: "b", label: "Tuesday — 3 days before expected period." }, { id: "c", label: "Two weeks ahead." }, { id: "d", label: "Day of event." }
    ], correctOptionIds: ["b"], explanation: "Start 3 days before expected period start. Late initiation reduces efficacy." },
    { id: "q-withdrawal", type: "single-choice", question: "When does the period typically start after stopping norethisterone?", options: [
      { id: "a", label: "Immediately." }, { id: "b", label: "2–3 days after last dose." }, { id: "c", label: "1 week later." }, { id: "d", label: "Next month." }
    ], correctOptionIds: ["b"], explanation: "Withdrawal bleed begins 2–3 days after stopping. Plan duration accordingly." },
    { id: "q-max-duration", type: "single-choice", question: "Maximum continuous duration of period-delay norethisterone under the PGD?", options: [
      { id: "a", label: "5 days." }, { id: "b", label: "14 days." }, { id: "c", label: "3 months." }, { id: "d", label: "1 year." }
    ], correctOptionIds: ["b"], explanation: "Max 14 days continuous. Longer requires GP/specialist review for proper cycle manipulation strategy." },
    { id: "q-breast-cancer", type: "single-choice", question: "Personal history of breast cancer 5 years ago, now in remission. Period delay?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Contraindicated. Hormone-sensitive cancer history is an absolute contraindication. Refer to GP / oncology for advice." }, { id: "c", label: "Supply at half dose." }, { id: "d", label: "Supply only if patient signs waiver." }
    ], correctOptionIds: ["b"], explanation: "Hormone-sensitive cancer history is absolute contraindication for hormonal preparations. Refer." },
    { id: "q-frequent", type: "single-choice", question: "Patient requests period delay for the 4th time this year. Action?", options: [
      { id: "a", label: "Supply as before." }, { id: "b", label: "Refer to GP — frequent requests suggest she'd be better served by extended hormonal contraception regimens (continuous COCP, etc.) which allow long-term cycle planning." }, { id: "c", label: "Supply double duration." }, { id: "d", label: "Refuse outright." }
    ], correctOptionIds: ["b"], explanation: "Frequent requests = there's a better strategy. GP can offer extended COCP, IUS, or other cycle-control approach more suited to long-term need." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label only." }, { id: "b", label: "Cycle pattern, contraindications excluded (especially VTE), counselling on non-contraceptive nature and VTE awareness, supply duration — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text note." }
    ], correctOptionIds: ["b"], explanation: "Documentation captures the VTE-risk exclusion and the non-contraceptive counselling — both audit-critical for this PGD." },
  ],
};
