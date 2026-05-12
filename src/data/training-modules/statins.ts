// Statins (CVD prevention) — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const statinsModule: TrainingModule = {
  slug: "statins",
  title: "Statins (CVD Primary Prevention) — PGD",
  description: "Initiation of atorvastatin for primary CVD prevention in eligible patients under PGD.",
  pgdSlugs: ["statins"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 12,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Statins — Training", subtitle: "Atorvastatin for primary CVD prevention", estimatedMinutes: 12, objectives: [
      "Identify candidates for statin initiation under the PGD using QRISK and clinical context.",
      "Recognise drug interactions and contraindications.",
      "Counsel on adherence, muscle symptoms, and monitoring.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Statins reduce cardiovascular events by ~25% per mmol/L LDL reduction. NICE NG181 recommends atorvastatin 20 mg for primary prevention when QRISK3 ≥10% (10-year cardiovascular risk).",
      "Primary prevention = no established CVD. Secondary prevention = established CVD (post-MI, post-stroke, peripheral arterial disease) — uses higher-dose statin (80 mg). This PGD covers primary only.",
      "Lifestyle measures (diet, exercise, smoking cessation) should be discussed before/alongside statin. Counsel that statin is decade-long preventative treatment.",
    ], highlights: ["Atorvastatin 20 mg for primary prevention when QRISK ≥10%.", "Secondary prevention (post-MI, post-stroke, PAD) = 80 mg — not in this PGD.", "Lifestyle measures alongside, not replaced by, statin."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Aged 40–84", detail: "Outside this range refer. <40 with very high risk or familial hyperlipidaemia — refer." },
      { label: "QRISK3 ≥10% (10-year CVD risk)", detail: "Calculate using current QRISK3 tool. Document the score." },
      { label: "No established CVD", detail: "Post-MI, post-stroke, PAD = secondary prevention; refer for high-intensity statin." },
      { label: "No type 1 diabetes", detail: "T1DM has separate guidance and higher thresholds; refer." },
      { label: "Not pregnant or planning pregnancy", detail: "Statins teratogenic — contraindicated." },
      { label: "Pre-treatment bloods available (within 12 months)", detail: "Lipid profile, LFTs, U&E, HbA1c, TFTs (rule out hypothyroidism), creatine kinase if myopathy risk." },
      { label: "No absolute contraindications (next slide)", detail: "Active liver disease, certain drug interactions." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Absolute contraindications", tone: "danger", message: "If any apply, refer.", detail: [
      "Pregnancy, breastfeeding, planning pregnancy within 6 weeks.",
      "Active liver disease or persistent ALT > 3× upper limit of normal.",
      "History of statin-induced myopathy or rhabdomyolysis.",
      "Hypersensitivity to statins.",
      "Concurrent strong CYP3A4 inhibitors with atorvastatin (clarithromycin, itraconazole, ritonavir, ciclosporin) — interaction risk.",
      "Established CVD — needs secondary prevention regimen (80 mg).",
      "Suspected familial hypercholesterolaemia (total cholesterol >7.5, family history premature CVD) — specialist lipid clinic.",
    ]},
    { id: "interactions", type: "callout", title: "Important drug interactions", tone: "warning", message: "Check medication list carefully.", detail: [
      "Macrolides (clarithromycin, erythromycin) — markedly increase atorvastatin levels. Pause statin during antibiotic course.",
      "Azole antifungals (itraconazole, ketoconazole, fluconazole high-dose).",
      "Ciclosporin, tacrolimus — contraindicated or close monitoring.",
      "Protease inhibitors (some HIV drugs).",
      "Diltiazem, verapamil — dose adjustment.",
      "Amlodipine — usually OK but max atorvastatin 20 mg with amlodipine 10 mg.",
      "Grapefruit juice — counsel to avoid (CYP3A4 inhibitor).",
      "Warfarin — INR may rise; monitor more closely on initiation/dose change.",
    ]},
    { id: "dosing", type: "checklist", title: "Dosing and monitoring", intro: "Standard primary-prevention regimen.", items: [
      { label: "Atorvastatin 20 mg once daily", detail: "Any time of day. Adherence > timing — choose a time the patient will remember." },
      { label: "3-month review", detail: "Repeat lipid profile. Aim ≥40% reduction in non-HDL cholesterol. Adjust if needed (up to 80 mg if tolerated and indicated — though this often moves into GP territory)." },
      { label: "LFTs", detail: "Check at baseline, 3 months, 12 months. Persistent ALT >3× ULN → stop and refer." },
      { label: "Annual review thereafter", detail: "Lipid profile, LFTs, BP, lifestyle review. GP-coordinated." },
      { label: "Creatine kinase", detail: "Only if muscle symptoms reported. Routine CK monitoring not needed." },
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Long-term commitment", detail: "Statins are taken indefinitely in most cases. Benefit cumulative — don't stop just because feeling well." },
      { label: "Muscle symptoms", detail: "Mild myalgia common, usually settles. Significant muscle pain, weakness, dark urine — STOP and seek urgent help (rhabdomyolysis is rare but emergency)." },
      { label: "Liver", detail: "Mild ALT rise common; usually settles. Yellow skin/eyes, abdominal pain — stop and seek help." },
      { label: "Grapefruit juice", detail: "Avoid grapefruit (large volumes especially)." },
      { label: "Pregnancy avoidance", detail: "Effective contraception. If planning pregnancy, stop statin 6 weeks before conception." },
      { label: "Lifestyle continues to matter", detail: "Diet, exercise, smoking cessation, weight management all alongside the statin." },
      { label: "Other side effects", detail: "Headache, GI upset, sleep disturbance (rare). Usually mild and transient." },
      { label: "New diabetes risk", detail: "Small increased risk of T2DM with statin (~0.1% per year extra). Cardiovascular benefit outweighs for most. Counsel honestly." },
    ]},
    { id: "red-flags", type: "callout", title: "Stop and refer", tone: "danger", message: "Reasons to discontinue / refer.", detail: [
      "Severe muscle pain, weakness, or dark urine — possible rhabdomyolysis. A&E.",
      "Significant LFT rise (ALT >3× ULN persistent).",
      "Suspected hypersensitivity reaction.",
      "Concurrent prescription of contraindicated drug.",
      "Pregnancy.",
      "No meaningful response despite adherence at 3-month review — consider FH workup (GP/lipid clinic).",
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Atorvastatin 20 mg OD for primary prevention when QRISK ≥10%.",
      "Secondary prevention (post-MI, post-stroke, PAD) = 80 mg — not this PGD.",
      "Bloods: lipids, LFTs, HbA1c, TFTs baseline. Repeat lipids and LFTs at 3 months.",
      "Pause statin during clarithromycin courses; avoid grapefruit.",
      "Stop for severe muscle symptoms — rhabdomyolysis is the rare emergency.",
      "Pregnancy contraindicated — stop 6 weeks before conception.",
    ]},
  ],
  quiz: [
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Patient wants to start atorvastatin for primary prevention; she's planning pregnancy in 3 months. Action?", options: [
      { id: "a", label: "Start statin until conception." }, { id: "b", label: "Do not start. Statins are contraindicated in pregnancy. Defer until after she has completed family planning, or earlier if not pursuing pregnancy. Refer GP for discussion." }, { id: "c", label: "Start at low dose." }, { id: "d", label: "Switch to bezafibrate." }
    ], correctOptionIds: ["b"], explanation: "Statins teratogenic. Don't initiate where pregnancy is planned. Stop 6 weeks pre-conception if already on therapy." },
    { id: "q-cv-disease", type: "single-choice", critical: true, question: "Patient had MI 6 months ago. He wants atorvastatin started. Action?", options: [
      { id: "a", label: "Start atorvastatin 20 mg per PGD." }, { id: "b", label: "Refer to GP — secondary prevention regimen is atorvastatin 80 mg, outside this PGD. The patient should already be on it from his cardiac care." }, { id: "c", label: "Start atorvastatin 80 mg per PGD." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Established CVD = secondary prevention = high-intensity statin (atorvastatin 80 mg or rosuvastatin 20–40 mg). This PGD covers primary prevention only. Check why he isn't already on a statin." },
    { id: "q-clarithromycin", type: "single-choice", critical: true, question: "Patient on atorvastatin needs clarithromycin for an infection. Action?", options: [
      { id: "a", label: "Continue both." }, { id: "b", label: "Pause atorvastatin during the clarithromycin course (and 1–2 days after) — interaction markedly increases atorvastatin levels and rhabdomyolysis risk." }, { id: "c", label: "Half the statin dose." }, { id: "d", label: "Switch antibiotic class." }
    ], correctOptionIds: ["b"], explanation: "Macrolide-statin interaction is significant. Standard practice is to pause the statin. Alternative would be to switch to a non-interacting antibiotic if clinically appropriate." },
    { id: "q-muscle", type: "single-choice", critical: true, question: "Patient on atorvastatin 4 weeks reports severe widespread muscle pain, weakness, and dark cola-coloured urine. Action?", options: [
      { id: "a", label: "Continue and observe." }, { id: "b", label: "STOP atorvastatin immediately and refer to A&E. Triad suggests rhabdomyolysis — medical emergency with risk of AKI." }, { id: "c", label: "Halve the dose." }, { id: "d", label: "Add paracetamol." }
    ], correctOptionIds: ["b"], explanation: "Severe muscle symptoms + dark urine = rhabdomyolysis until proven otherwise. AKI risk requires urgent assessment with CK and renal function." },
    { id: "q-qrisk", type: "single-choice", question: "45-year-old smoker with QRISK 12%, no family history of premature CVD, BMI 28. First-line PGD action?", options: [
      { id: "a", label: "Reassure — too young for statin." }, { id: "b", label: "Discuss lifestyle and offer atorvastatin 20 mg if patient agrees. QRISK ≥10% meets primary prevention threshold. Smoking cessation also key." }, { id: "c", label: "Start atorvastatin 80 mg." }, { id: "d", label: "Refer GP." }
    ], correctOptionIds: ["b"], explanation: "QRISK ≥10% meets threshold for primary prevention. Statin offer, alongside lifestyle (especially smoking). Don't undertreat based on age." },
    { id: "q-FH", type: "single-choice", question: "32-year-old with total cholesterol 8.5, brother had MI age 38. Action?", options: [
      { id: "a", label: "Start atorvastatin 20 mg." }, { id: "b", label: "Refer to lipid clinic — total cholesterol >7.5 with premature family CVD strongly suggests familial hypercholesterolaemia, needing specialist workup and likely higher-intensity therapy." }, { id: "c", label: "Reassure." }, { id: "d", label: "Start 80 mg." }
    ], correctOptionIds: ["b"], explanation: "Familial hypercholesterolaemia is suggested by this picture. Refer to lipid clinic for confirmation (Simon Broome / DLCN criteria) and appropriate management. Outside PGD." },
    { id: "q-grapefruit", type: "single-choice", question: "Patient asks about grapefruit and atorvastatin.", options: [
      { id: "a", label: "Eat as normal." }, { id: "b", label: "Avoid grapefruit and large volumes of grapefruit juice — inhibits CYP3A4, increases atorvastatin levels and side-effect risk." }, { id: "c", label: "Take with grapefruit for better absorption." }, { id: "d", label: "Only avoid on the dose day." }
    ], correctOptionIds: ["b"], explanation: "Grapefruit is a CYP3A4 inhibitor. Significant increase in atorvastatin levels with regular grapefruit consumption. Counsel to avoid." },
    { id: "q-bloods", type: "single-choice", question: "What bloods should be checked before starting a statin?", options: [
      { id: "a", label: "None needed." }, { id: "b", label: "Lipid profile, LFTs, U&E, HbA1c, TFTs (rule out hypothyroidism as a secondary cause of dyslipidaemia), creatine kinase only if myopathy risk." }, { id: "c", label: "ECG only." }, { id: "d", label: "Cholesterol only." }
    ], correctOptionIds: ["b"], explanation: "Baseline panel covers safety (LFTs, CK if indicated), secondary cause exclusion (TFTs), and metabolic context (HbA1c). Repeat lipids and LFTs at 3 months." },
    { id: "q-new-diabetes", type: "single-choice", question: "Patient worried about media reports of statins causing diabetes.", options: [
      { id: "a", label: "Avoid statin." }, { id: "b", label: "Counsel honestly: small increased risk of new T2DM (~0.1%/year extra in low-risk; higher in those already at risk). Cardiovascular benefit outweighs this for nearly everyone with QRISK ≥10%. Quantify rather than dismiss." }, { id: "c", label: "Hide the risk." }, { id: "d", label: "Recommend supplements." }
    ], correctOptionIds: ["b"], explanation: "The diabetes association is real but quantitatively small relative to CV benefit. Honest, quantified counselling preserves trust and supports adherence." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "QRISK3 score, baseline bloods (lipids, LFTs, HbA1c, TFTs), medication list checked for interactions, lifestyle counselling, pregnancy status, GP-informed — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record demonstrates QRISK threshold met, contraindications excluded, and proper baseline assessment. Audit essentials." },
  ],
};
