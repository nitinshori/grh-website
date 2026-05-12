// Performance anxiety — propranolol PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const anxietyPropranololModule: TrainingModule = {
  slug: "anxiety-propranolol",
  title: "Performance Anxiety (Propranolol) — PGD",
  description: "Short-course propranolol for situational/performance anxiety in adults under PGD.",
  pgdSlugs: ["anxiety-propranolol"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Performance Anxiety — Training", subtitle: "Short-acting propranolol for situational/performance anxiety", estimatedMinutes: 10, objectives: [
      "Identify patients eligible for short-course propranolol for situational anxiety.",
      "Recognise the cardiovascular and respiratory contraindications.",
      "Differentiate situational performance anxiety from generalised anxiety disorder (which needs different management).",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Propranolol is a non-selective beta-blocker that blunts the autonomic features of anxiety (tachycardia, tremor, sweating) without affecting cognitive function. Useful for time-limited situational anxiety (public speaking, exam, performance, interview).",
      "Not appropriate for chronic generalised anxiety disorder (GAD), panic disorder, PTSD, social anxiety disorder, or depression-related anxiety — those need GP-led assessment and treatment (SSRI, CBT).",
      "Short-course oral 10–40 mg taken 1 hour before the event. Single doses generally well-tolerated in patients without contraindications.",
    ], highlights: ["Use: time-limited situational anxiety only.", "Contraindicated in asthma, severe cardiac disease.", "Chronic anxiety, panic, GAD = refer GP, not PGD."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Adult, 18–65", detail: "Outside this range refer." },
      { label: "Discrete, identifiable upcoming anxiety-provoking event", detail: "Exam, presentation, performance, interview, wedding speech. Not 'general anxiety'." },
      { label: "Predominantly physical anxiety symptoms", detail: "Tachycardia, tremor, sweating, dry mouth. Cognitive worry alone is less responsive." },
      { label: "Previous experience that drug would be helpful", detail: "If first event of its kind, behavioural strategies and breathing techniques are reasonable first." },
      { label: "BP today within range", detail: "≥100/60. Below = caution; above 160/95 = consider hypertensive workup." },
      { label: "Pulse ≥55 bpm", detail: "Below = bradycardia caution." },
      { label: "No absolute contraindications (next slide)", detail: "Long list — review carefully." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Absolute contraindications", tone: "danger", message: "Do not supply for any of these.", detail: [
      "Asthma or COPD — bronchospasm risk.",
      "Heart block (any degree) or sick sinus syndrome.",
      "Severe heart failure or cardiogenic shock.",
      "Severe bradycardia (HR <55).",
      "Severe hypotension.",
      "Phaeochromocytoma (unless on alpha-blocker first).",
      "Severe peripheral arterial disease.",
      "Pregnancy or breastfeeding — refer.",
      "Metabolic acidosis (incl. diabetic ketoacidosis history).",
      "Known hypersensitivity.",
      "Concurrent verapamil or diltiazem (heart-rate-lowering CCBs).",
      "Generalised anxiety disorder, panic disorder, PTSD, depression — not PGD scope.",
      "Recurrent / repeated request for propranolol — indicates chronic anxiety, refer.",
    ]},
    { id: "dosing", type: "checklist", title: "Dosing", intro: "Short-term situational use.", items: [
      { label: "Starting dose", detail: "Propranolol 10–20 mg, taken 30–60 minutes before the anxiety-provoking event." },
      { label: "Trial first", detail: "Recommend a trial dose at home before the actual event — to confirm tolerability and that it doesn't cause excessive sedation/bradycardia." },
      { label: "Higher dose if needed", detail: "If 20 mg ineffective and tolerated, can use 40 mg. Above 40 mg unusual." },
      { label: "Avoid abrupt discontinuation if used regularly", detail: "Although this PGD is for occasional use only — repeated use suggests need for GP review." },
      { label: "Max frequency", detail: "Occasional / event-based use only. Repeat use beyond a few events per year = refer GP." },
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Trial dose first", detail: "Take a trial at home before the actual event. Confirms tolerability." },
      { label: "Doesn't affect cognition", detail: "Doesn't sedate or impair thinking. Reduces physical symptoms only — heart rate, tremor, sweating." },
      { label: "Alcohol", detail: "Avoid alcohol with propranolol — additive hypotension and increased CNS effects." },
      { label: "Other side effects", detail: "Tiredness, cold hands/feet, vivid dreams, GI upset. Usually mild." },
      { label: "Adjunctive strategies", detail: "Breathing techniques, preparation, exposure / desensitisation are foundational. Drug is an aid, not a substitute." },
      { label: "When to seek help", detail: "Breathing difficulty / wheeze (rare allergic / bronchospasm), severe bradycardia symptoms (dizziness, faintness)." },
      { label: "Don't drive if affected", detail: "Test response first. Most patients drive fine on propranolol; some feel slowed." },
      { label: "If frequent need, refer", detail: "Repeated requests suggest chronic anxiety needing GP-led assessment." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Situational / event-based anxiety only — not GAD, panic, chronic anxiety.",
      "Propranolol 10–40 mg, 30–60 min before event. Trial dose at home first.",
      "Contraindicated: asthma, COPD, heart block, severe bradycardia, severe HF, pregnancy.",
      "Avoid alcohol; counsel adjunctive strategies (breathing, prep).",
      "Repeated requests = refer GP for chronic anxiety workup.",
    ]},
  ],
  quiz: [
    { id: "q-asthma", type: "single-choice", critical: true, question: "Patient with mild asthma (uses salbutamol PRN) wants propranolol for a presentation. Action?", options: [
      { id: "a", label: "Supply with caution." }, { id: "b", label: "Contraindicated. Beta-blockers including 'cardioselective' ones can precipitate bronchospasm in asthmatics. Refer for non-pharmacological strategies or specialist consideration." }, { id: "c", label: "Cardioselective beta-blocker." }, { id: "d", label: "Half dose." }
    ], correctOptionIds: ["b"], explanation: "Asthma is an absolute contraindication for non-selective beta-blockers like propranolol. Even cardioselective beta-blockers require caution. Non-pharmacological strategies first." },
    { id: "q-heart-block", type: "single-choice", critical: true, question: "Patient mentions he has '2nd degree heart block, controlled with a pacemaker'. Wants propranolol for an exam. Action?", options: [
      { id: "a", label: "Supply — pacemaker handles the block." }, { id: "b", label: "Refer. Heart block is a contraindication even with pacemaker. GP/cardiology should advise." }, { id: "c", label: "Half dose." }, { id: "d", label: "Supply 5 mg." }
    ], correctOptionIds: ["b"], explanation: "Heart block is a contraindication regardless of pacemaker. Refer for specialist guidance." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant patient wants propranolol for a wedding speech. Action?", options: [
      { id: "a", label: "Supply low dose." }, { id: "b", label: "Refer to GP/midwife. Propranolol can be used in pregnancy in specific clinical scenarios (e.g. hypertension) but isn't a PGD-supplied agent for performance anxiety in pregnancy." }, { id: "c", label: "Supply for one-off use." }, { id: "d", label: "Reassure and refuse." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy is outside the PGD scope. Refer for proper risk-benefit discussion." },
    { id: "q-gad", type: "single-choice", critical: true, question: "Patient describes chronic worry, sleep disturbance, hypervigilance for 8 months. Wants propranolol 'for daily anxiety'. Action?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Refer to GP — this picture suggests generalised anxiety disorder, which needs proper assessment and treatment (SSRI, CBT). Propranolol PRN is not appropriate for chronic GAD." }, { id: "c", label: "Supply at low dose daily." }, { id: "d", label: "Supply with diazepam." }
    ], correctOptionIds: ["b"], explanation: "Chronic anxiety needs proper diagnosis and management. PRN propranolol masks symptoms without treating the underlying disorder." },
    { id: "q-trial", type: "single-choice", question: "Patient has a job interview in 2 days. Wants propranolol. Action?", options: [
      { id: "a", label: "Supply for the day of interview only." }, { id: "b", label: "Supply with strong recommendation to take a trial dose at home BEFORE the interview day — to confirm tolerability. Counsel on adjunctive prep, breathing, and that drug doesn't affect thinking." }, { id: "c", label: "Supply daily." }, { id: "d", label: "Refer." }
    ], correctOptionIds: ["b"], explanation: "Trial dose at home is standard counselling — confirms no excessive sedation, bradycardia, or other intolerance before the real event." },
    { id: "q-alcohol", type: "single-choice", question: "Patient asks if she can have a glass of wine after taking propranolol.", options: [
      { id: "a", label: "Yes, no interaction." }, { id: "b", label: "Avoid alcohol with propranolol — additive hypotension and CNS effects, can cause significant dizziness." }, { id: "c", label: "Only beer." }, { id: "d", label: "Yes, but only after the event." }
    ], correctOptionIds: ["b"], explanation: "Alcohol + propranolol = additive hypotensive and CNS depression. Counsel to avoid." },
    { id: "q-repeat-request", type: "single-choice", question: "Patient comes back for propranolol monthly, for 'lots of presentations at work'. Action?", options: [
      { id: "a", label: "Continue supplying." }, { id: "b", label: "Refer to GP for proper assessment. Repeated requests suggest chronic work-related or generalised anxiety needing fuller management." }, { id: "c", label: "Larger one-off supply." }, { id: "d", label: "Stronger beta-blocker." }
    ], correctOptionIds: ["b"], explanation: "PGD is for occasional / event-based supply. Frequent need = chronic issue = GP territory." },
    { id: "q-cognition", type: "single-choice", question: "Patient worried that propranolol will 'dull her thinking' for the exam.", options: [
      { id: "a", label: "Agree and decline." }, { id: "b", label: "Reassure: propranolol doesn't affect cognition. It reduces the physical symptoms of anxiety (heart rate, tremor) without sedating or impairing thinking. Many performers rely on it for this reason." }, { id: "c", label: "Switch to diazepam." }, { id: "d", label: "Avoid drug." }
    ], correctOptionIds: ["b"], explanation: "Propranolol doesn't affect cognition — its appeal for performers is exactly this. Counsel reassuringly." },
    { id: "q-hr", type: "single-choice", question: "Patient's resting heart rate today is 48 bpm. Wants propranolol. Action?", options: [
      { id: "a", label: "Supply low dose." }, { id: "b", label: "Don't supply — bradycardia (HR <55) is a contraindication. Refer for cardiac assessment if this is unexpected, or accept that beta-blocker isn't appropriate." }, { id: "c", label: "Supply half dose." }, { id: "d", label: "Repeat measurement." }
    ], correctOptionIds: ["b"], explanation: "Pre-existing bradycardia is a contraindication. Could be athletic (benign) or pathological — beta-blocker not appropriate either way." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Anxiety context (specific event, not chronic), BP/pulse, contraindications excluded (especially asthma, cardiac), dose, trial-dose counselling, GP-aware status — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Documentation captures that this was time-limited situational anxiety with proper cardiac/respiratory screening." },
  ],
};
