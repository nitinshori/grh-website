// TRT (Testosterone Replacement Therapy) — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const trtModule: TrainingModule = {
  slug: "trt",
  title: "TRT (Testosterone Replacement Therapy) — PGD",
  description:
    "Eligibility, contraindications, biochemical thresholds, and ongoing monitoring for the supply of testosterone replacement under PGD.",
  pgdSlugs: ["trt"],
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
      title: "TRT — Training",
      subtitle: "Testosterone replacement therapy in adult men with confirmed hypogonadism",
      estimatedMinutes: 20,
      objectives: [
        "Identify men eligible for TRT under the GRH PGD — including the biochemical and symptomatic criteria.",
        "Recognise the absolute contraindications — prostate and breast cancer, severe LUTS, polycythaemia, untreated OSA, decompensated heart failure.",
        "Apply the correct initiation, monitoring, and dose-adjustment schedule.",
        "Counsel patients on fertility implications, red flags, and the long-term commitment involved.",
        "Use the ePGD tool to capture a defensible clinical record and a coordinated GP-aware supply chain.",
      ],
    },

    {
      id: "background",
      type: "content",
      title: "Clinical background",
      body: [
        "Male hypogonadism is the failure of the testes to produce adequate testosterone, with associated symptoms. Causes are typically primary (testicular: e.g. Klinefelter's, post-orchidectomy, post-chemotherapy) or secondary (hypothalamic-pituitary: e.g. pituitary tumour, opioid use, obesity-related).",
        "Symptoms include reduced libido, erectile dysfunction, fatigue, loss of muscle mass, mood disturbance, loss of body hair, gynaecomastia, infertility and reduced bone density. Many symptoms are non-specific — biochemistry is required for diagnosis.",
        "Under the GRH PGD, testosterone is supplied to men with confirmed biochemical hypogonadism (two morning total testosterone levels below threshold) PLUS symptomatic complaints PLUS no exclusion criteria. The PGD covers ongoing supply and dose adjustment of testosterone gel (e.g. Testogel, Tostran) or short-acting injection (Sustanon, Nebido) initiation when GP-prescribed; long-acting depot injection is typically nurse-administered.",
      ],
      highlights: [
        "Diagnosis = symptoms + two morning total testosterone results below threshold.",
        "Treatment is long-term and not reversible without sustained monitoring.",
        "Fertility implication is a hard counselling point — TRT suppresses spermatogenesis.",
      ],
    },

    {
      id: "eligibility",
      type: "checklist",
      title: "Eligibility under the PGD",
      intro: "Supply is permitted only when ALL of the following are true:",
      items: [
        { label: "Adult male, aged 18–75", detail: "Outside this range refer to GP / endocrinology." },
        { label: "Resident in England or Wales", detail: "CQC / HIW coverage only." },
        { label: "Biochemically confirmed hypogonadism", detail: "Two separate morning (08:00–11:00) total testosterone results below 8 nmol/L, OR total testosterone 8–12 nmol/L with low calculated free testosterone (<0.225 nmol/L) AND raised LH. Results must be from within the last 12 months." },
        { label: "Symptomatic", detail: "At least three symptoms attributable to hypogonadism (e.g. reduced libido, ED, fatigue, reduced muscle mass, mood disturbance). Symptoms alone without biochemistry don't qualify." },
        { label: "PSA baseline available and acceptable", detail: "Age-adjusted PSA from within last 6 months. Threshold: PSA <3.0 ng/mL if age 50+ (or <2.5 ng/mL if age 40–49 with family history of prostate cancer). Anything higher requires urology review before TRT." },
        { label: "Haematocrit baseline available and <0.54", detail: "From within last 6 months. Polycythaemia (Hct ≥0.54) is an absolute contraindication." },
        { label: "DRE (digital rectal exam) by GP or urologist within last 12 months", detail: "Document who performed it and the date. Abnormal DRE = refer." },
        { label: "Patient has read and signed the declaration", detail: "Includes acknowledgement of fertility implications, monitoring commitment, and red flags." },
      ],
    },

    {
      id: "absolute-contraindications",
      type: "callout",
      title: "Absolute contraindications — NEVER supply",
      tone: "danger",
      message:
        "If ANY of the following apply, the PGD cannot be used. Refer to GP / urology / endocrinology.",
      detail: [
        "Known or suspected prostate cancer (any history).",
        "Known or suspected male breast cancer (any history).",
        "PSA >3.0 ng/mL (age 50+) or >2.5 ng/mL (age 40–49 with family history of prostate cancer) — requires urology workup before TRT.",
        "Haematocrit ≥0.54 (polycythaemia) — risk of thrombosis.",
        "Severe lower urinary tract symptoms (LUTS) — IPSS ≥20 or acute retention.",
        "Untreated severe obstructive sleep apnoea — TRT worsens OSA.",
        "Severe (decompensated) heart failure (NYHA III–IV).",
        "Active desire to conceive — TRT suppresses spermatogenesis. Refer for hCG / clomiphene consideration.",
        "Acute coronary syndrome or stroke within the last 6 months.",
        "Liver tumour (current or past).",
        "Known hypersensitivity to testosterone preparation.",
      ],
    },

    {
      id: "cautions",
      type: "callout",
      title: "Cautions — careful consideration required",
      tone: "warning",
      message:
        "Supply may be appropriate but requires individual assessment, closer monitoring, and GP awareness.",
      detail: [
        "Moderate LUTS (IPSS 8–19) — monitor symptoms; refer if worsening.",
        "Treated OSA on CPAP — confirm compliance and treatment efficacy.",
        "Type 2 diabetes — TRT can affect insulin sensitivity; coordinate with GP.",
        "Active venous thromboembolism risk factors — discuss with GP first.",
        "Family history of prostate cancer in first-degree relative — lower PSA threshold (see eligibility).",
        "Existing erythrocytosis with Hct 0.50–0.53 — closer monitoring.",
        "On anticoagulants — interaction monitoring required (warfarin INR rises).",
        "Older age (≥65) — discuss benefit-risk balance; lower initial dose.",
      ],
    },

    {
      id: "preparations",
      type: "comparison",
      title: "Available preparations",
      intro:
        "Testosterone is available as gel, short-acting injection, and long-acting injection. The PGD covers gel initiation, with short-acting injection (Sustanon 250 mg every 2–3 weeks) where the patient is already established and stable. Long-acting depot (Nebido) requires GP/specialist initiation; the PGD only covers ongoing administration if scheduled.",
      columns: [
        {
          label: "Transdermal gel (Testogel 50 mg, Tostran 2%)",
          rows: [
            { heading: "Typical dose", body: "Testogel 50 mg once daily applied to clean dry skin (shoulders, upper arms). Tostran 2% — 3 g (60 mg) daily, increasing by 1 g per 2 weeks based on levels." },
            { heading: "Onset of effect", body: "2–4 weeks for symptomatic improvement." },
            { heading: "Pros", body: "Patient-controlled; reversible quickly; allows dose titration." },
            { heading: "Cons", body: "Skin transfer risk to women and children; daily adherence; skin irritation." },
            { heading: "Monitoring level timing", body: "Trough — any morning before that day's application." },
          ],
        },
        {
          label: "Short-acting injection (Sustanon 250 mg)",
          rows: [
            { heading: "Typical dose", body: "Sustanon 250 mg IM every 2–3 weeks." },
            { heading: "Onset of effect", body: "Faster than gel; first cycle within 1–2 weeks." },
            { heading: "Pros", body: "Reliable adherence; no transfer risk." },
            { heading: "Cons", body: "Peaks and troughs in level; mood/libido fluctuation; injection burden." },
            { heading: "Monitoring level timing", body: "Mid-cycle — measure halfway between two injections." },
          ],
        },
      ],
    },

    {
      id: "monitoring",
      type: "checklist",
      title: "Monitoring schedule — non-negotiable",
      intro:
        "TRT requires structured monitoring. The PGD does not authorise ongoing supply without these checks at the scheduled intervals.",
      items: [
        { label: "Pre-initiation baseline", detail: "Two morning total testosterone, PSA, haematocrit (FBC), LFTs, lipids, HbA1c (if T2DM risk), DRE." },
        { label: "Week 4–6 review", detail: "Symptom response and tolerability. Trough testosterone if on gel. Adjust dose if levels are sub- or supra-therapeutic." },
        { label: "3-month review", detail: "Testosterone level on therapy, PSA, haematocrit. Confirm symptom response." },
        { label: "6-month review", detail: "Testosterone, PSA, haematocrit. LFTs if indicated." },
        { label: "12-month review and annually thereafter", detail: "Testosterone, PSA, haematocrit, LFTs, lipids, HbA1c. DRE annually." },
        { label: "Target testosterone level", detail: "Mid-normal adult male range: total testosterone 15–25 nmol/L. Avoid supra-physiological levels." },
        { label: "GP coordination", detail: "GP must be informed of TRT initiation. Provide a copy of monitoring results at each visit." },
      ],
    },

    {
      id: "counselling",
      type: "checklist",
      title: "Counselling points — every patient, every supply",
      items: [
        { label: "Fertility", detail: "TRT suppresses spermatogenesis and reduces fertility while on treatment. Reversible in many men after discontinuation but not guaranteed. If conception is wanted in future, discuss now — alternatives (hCG, clomiphene) exist." },
        { label: "Long-term commitment", detail: "TRT is typically lifelong. Stopping abruptly causes a rebound of symptoms within 2–4 weeks." },
        { label: "Application technique (gel)", detail: "Clean dry skin to shoulders/upper arms. Wash hands after. Wait at least 4 hours before swimming/showering. Cover application site with clothing during contact with women/children to avoid transfer." },
        { label: "Skin transfer (gel)", detail: "Testosterone transfer to female partner can cause virilisation; to children can cause precocious puberty. Cover and wash hands; do not share gel." },
        { label: "Mood and libido", detail: "Improvements typically over 3–6 weeks. If no improvement at 12 weeks at adequate levels, reconsider diagnosis." },
        { label: "Cardiovascular signs", detail: "New chest pain, leg swelling, breathlessness — stop and seek urgent assessment." },
        { label: "Sleep apnoea", detail: "Worsening snoring or daytime sleepiness — refer for sleep study." },
        { label: "Prostate symptoms", detail: "New or worsening urinary symptoms — refer for assessment." },
      ],
    },

    {
      id: "red-flags",
      type: "callout",
      title: "Red flags — STOP and refer",
      tone: "danger",
      message: "If any of these are reported, immediately stop the next dose and direct to appropriate care.",
      detail: [
        "New chest pain or pressure — A&E.",
        "Acute calf pain, leg swelling, breathlessness — possible VTE or PE. A&E.",
        "Acute urinary retention — A&E.",
        "Significant rise in PSA (>1.0 ng/mL over 12 months, or any reading >4.0) — urology referral.",
        "Haematocrit >0.54 on therapy — stop dose, refer GP for venesection consideration.",
        "New severe headache or visual disturbance — possible pituitary issue.",
        "Major mood changes, aggressive behaviour, suicidal thoughts — refer.",
        "Suspected breast lump in male — urgent referral.",
      ],
    },

    {
      id: "documentation",
      type: "checklist",
      title: "Documentation requirements",
      intro: "Every TRT consultation produces an auditable record in the ePGD tool.",
      items: [
        { label: "Patient demographics and consent", detail: "Including signed declaration covering fertility implications." },
        { label: "Symptoms and IPSS score", detail: "Reviewed at every visit to track LUTS." },
        { label: "Current testosterone, PSA, haematocrit results", detail: "With dates — must be within validity window." },
        { label: "DRE status and date", detail: "Annual minimum." },
        { label: "Dose, preparation, supply quantity", detail: "Plus any dose adjustment rationale." },
        { label: "Counselling covered", detail: "Each checklist item recorded." },
        { label: "GP-informed status", detail: "Mandatory; document GP name and date of last communication." },
      ],
    },

    {
      id: "case-1",
      type: "case",
      title: "Case 1 — straightforward initiator",
      scenario:
        "Marcus, 48, has had two morning total testosterone results of 6.1 and 6.4 nmol/L. Symptoms: low libido, fatigue, low mood for 18 months. PSA 1.2 ng/mL. Haematocrit 0.45. DRE normal (GP, 4 months ago). Not seeking fertility. IPSS 4. BMI 28. No cardiovascular history. Wants Testogel.",
      question: "Can he be supplied today? What's the starting dose?",
      answer:
        "Yes. Initiate Testogel 50 mg once daily, applied to shoulders/upper arms. Schedule a 4–6 week review with repeat testosterone, plus a 3-month review with full panel. Counsel on application technique, skin transfer to family members, and fertility implications.",
      rationale:
        "All eligibility criteria met. The dose is the standard starting dose. The 4–6 week review captures early symptom and biochemistry response. The 3-month review is the first formal milestone.",
    },

    {
      id: "case-2",
      type: "case",
      title: "Case 2 — the trap",
      scenario:
        "Robert, 62, two morning testosterones of 5.8 and 5.5 nmol/L. Symptoms: fatigue, ED, low libido. PSA 3.4 ng/mL. Haematocrit 0.49. DRE described by his GP as 'mildly enlarged but smooth, no nodules' 5 months ago. IPSS 12 (moderate LUTS). Wants Sustanon injections.",
      question: "Can he be supplied today?",
      answer:
        "Do NOT supply. PSA 3.4 ng/mL exceeds the 3.0 threshold for a 50+ patient and requires urology review before TRT initiation. The mildly enlarged prostate and IPSS 12 (moderate LUTS) add caution but are not the deciding factor — PSA is. Refer to GP for urology referral; reconsider after urological workup is complete and PSA is below threshold OR malignancy excluded.",
      rationale:
        "PSA is the hardest of the TRT initiation criteria to get wrong. Above-threshold PSA requires malignancy workup BEFORE TRT, because testosterone can accelerate occult prostate cancer. The biochemistry confirms hypogonadism but doesn't override the prostate-cancer screening requirement.",
    },

    {
      id: "summary",
      type: "summary",
      title: "Key points to remember",
      keyPoints: [
        "Diagnosis requires biochemistry (two morning tests) PLUS symptoms PLUS no exclusion criteria. Not symptoms alone.",
        "Absolute contraindications: prostate or breast cancer (any history), PSA above threshold, polycythaemia (Hct ≥0.54), severe LUTS, untreated severe OSA, decompensated HF, active conception intent.",
        "Baseline workup: two morning testosterones, PSA, haematocrit, DRE within 12 months.",
        "Monitoring at week 4–6, 3 months, 6 months, then annually. Testosterone, PSA, haematocrit minimum.",
        "Target level: total testosterone 15–25 nmol/L. Avoid supra-physiological.",
        "Fertility suppression — counsel and document. Offer alternatives if conception wanted.",
        "Red flags: chest pain, VTE, urinary retention, rising PSA, polycythaemia on therapy.",
        "GP coordination is mandatory, not optional.",
      ],
    },
  ],

  quiz: [
    {
      id: "q-prostate-cancer",
      type: "single-choice",
      critical: true,
      question:
        "A 55-year-old man with symptomatic hypogonadism (testosterone 6.2 nmol/L on two morning tests) had a prostatectomy for low-grade prostate cancer 4 years ago. He is in remission on no other treatment. Can he receive TRT under the PGD?",
      options: [
        { id: "a", label: "Yes, since he's been in remission for over 3 years." },
        { id: "b", label: "Yes, at half the standard dose." },
        { id: "c", label: "No. Any history of prostate cancer is an absolute contraindication under the PGD. Refer to urology / oncology for specialist consideration." },
        { id: "d", label: "Yes, but only Testogel, not Sustanon." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Any personal history of prostate cancer — including treated and in remission — is an absolute contraindication under this PGD. Some specialist clinics may consider TRT post-prostatectomy on a case-by-case basis, but that's specialist territory, not community pharmacy PGD. Refer.",
    },
    {
      id: "q-psa",
      type: "single-choice",
      critical: true,
      question:
        "A 52-year-old man requests TRT initiation. Two testosterone levels confirm hypogonadism. PSA is 3.6 ng/mL. He has no family history of prostate cancer. What is the correct action?",
      options: [
        { id: "a", label: "Initiate TRT; PSA monitoring will catch any issue later." },
        { id: "b", label: "Do not initiate. PSA above 3.0 ng/mL in a 50+ patient requires urology workup before TRT." },
        { id: "c", label: "Initiate at a reduced dose and recheck PSA in 1 month." },
        { id: "d", label: "Initiate Sustanon instead of gel, as injections suppress PSA." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "PSA above the age-adjusted threshold (3.0 for age 50+, 2.5 for 40–49 with family history) requires urology workup before TRT initiation. Testosterone can accelerate occult prostate cancer; the workup must rule that out first. Injections do not suppress PSA.",
    },
    {
      id: "q-polycythaemia",
      type: "single-choice",
      critical: true,
      question:
        "A patient on TRT for 6 months returns for monitoring. His haematocrit has risen to 0.55. What is the correct action?",
      options: [
        { id: "a", label: "Continue the dose; haematocrit fluctuates." },
        { id: "b", label: "Stop the next dose; refer to GP for assessment, likely venesection. Polycythaemia (Hct ≥0.54) is a contraindication." },
        { id: "c", label: "Increase dose to push past the side effect." },
        { id: "d", label: "Switch from gel to injection." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Haematocrit ≥0.54 is polycythaemia and is an absolute contraindication for ongoing TRT — risk of thrombosis. Stop and refer for venesection consideration. TRT can be resumed at a lower dose once haematocrit returns to safe range.",
    },
    {
      id: "q-fertility",
      type: "single-choice",
      critical: true,
      question:
        "A 35-year-old with confirmed hypogonadism wants to start TRT. He and his wife are planning to start a family within the next year. What is the correct counselling?",
      options: [
        { id: "a", label: "TRT does not affect fertility — proceed normally." },
        { id: "b", label: "TRT will suppress sperm production. Active conception intent is an absolute contraindication. Refer to fertility specialist; alternatives (hCG, clomiphene) preserve fertility while raising testosterone." },
        { id: "c", label: "Start TRT and stop 3 months before trying to conceive." },
        { id: "d", label: "Continue TRT throughout; fertility issues are uncommon." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Exogenous testosterone suppresses LH/FSH and therefore spermatogenesis. In a man actively trying to conceive, TRT under PGD is contraindicated. hCG (which stimulates Leydig cells) and clomiphene (which raises endogenous gonadotrophins) are alternatives that raise testosterone while preserving fertility — but these are specialist-initiated.",
    },
    {
      id: "q-diagnosis",
      type: "single-choice",
      question:
        "A 47-year-old man has symptoms of fatigue, low libido and erectile dysfunction. One morning testosterone is 7.8 nmol/L. He is keen to start TRT today.",
      options: [
        { id: "a", label: "Initiate Testogel — one result and symptoms is enough." },
        { id: "b", label: "Repeat a second morning testosterone before considering TRT. Diagnosis requires two confirmatory results." },
        { id: "c", label: "Initiate Sustanon as a trial of therapy." },
        { id: "d", label: "Send him for an MRI of the pituitary first." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Diagnosis of hypogonadism requires TWO separate morning (8–11am) testosterone levels below the threshold, plus symptoms. A single result — especially at 7.8 nmol/L (which is in the equivocal zone) — is not sufficient. Repeat first.",
    },
    {
      id: "q-target-level",
      type: "single-choice",
      question:
        "A patient on TRT 4 months in has a total testosterone of 32 nmol/L. He feels great. What is the correct action?",
      options: [
        { id: "a", label: "Maintain the current dose since symptoms are resolved." },
        { id: "b", label: "Reduce the dose. Target is mid-normal range (15–25 nmol/L); supra-physiological levels increase cardiovascular and erythrocytosis risk." },
        { id: "c", label: "Increase the dose for maximum benefit." },
        { id: "d", label: "Stop entirely; he's cured." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "The target on TRT is mid-normal adult male range (15–25 nmol/L). Supra-physiological levels increase cardiovascular risk, polycythaemia, and prostate issues without additional symptomatic benefit. Reduce the dose and re-check at 6 weeks.",
    },
    {
      id: "q-skin-transfer",
      type: "single-choice",
      question:
        "A patient on Testogel asks what precautions he needs to take regarding his partner and young child.",
      options: [
        { id: "a", label: "None — Testogel is safe for household contact." },
        { id: "b", label: "Wash hands after application, cover the application site with clothing during skin-to-skin contact, allow gel to dry for at least 2 hours, and wait 4 hours before swimming/showering." },
        { id: "c", label: "Only avoid contact for 30 minutes after application." },
        { id: "d", label: "Apply to the patient's child instead — paediatric dosing is safer." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Testosterone gel transfer to women causes virilisation (acne, hirsutism, voice changes) and to children causes precocious puberty. Hands washed; application site covered during contact; 2-hour dry time minimum; 4 hours before water exposure. This is non-negotiable counselling.",
    },
    {
      id: "q-osa",
      type: "single-choice",
      question:
        "A 56-year-old man with hypogonadism also has untreated severe obstructive sleep apnoea (Epworth 18, no CPAP). What is the correct action?",
      options: [
        { id: "a", label: "Initiate TRT — OSA isn't related to testosterone." },
        { id: "b", label: "Do not initiate TRT. Untreated severe OSA is an absolute contraindication. Refer for CPAP titration; reconsider TRT once OSA is well-controlled." },
        { id: "c", label: "Initiate at half dose to reduce OSA worsening." },
        { id: "d", label: "Initiate and refer to sleep medicine in parallel." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Untreated severe OSA is an absolute contraindication. TRT can worsen OSA, increasing cardiovascular risk in an already at-risk patient. Refer for sleep study and CPAP; revisit TRT once compliance and control are confirmed.",
    },
    {
      id: "q-monitoring-interval",
      type: "single-choice",
      question:
        "What is the schedule of biochemical monitoring required under the PGD?",
      options: [
        { id: "a", label: "Once a year is sufficient." },
        { id: "b", label: "Week 4–6, 3 months, 6 months, then annually — testosterone, PSA, haematocrit minimum." },
        { id: "c", label: "Only when symptoms change." },
        { id: "d", label: "Every visit for the first 5 years." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "The monitoring schedule is fixed: 4–6 week tolerability check, 3-month formal review, 6-month review, then annually. Each visit includes testosterone, PSA and haematocrit as a minimum. DRE annually.",
    },
    {
      id: "q-record",
      type: "single-choice",
      question:
        "What documentation is required for every TRT supply consultation under the GRH PGD?",
      options: [
        { id: "a", label: "Just the dose on the medicine label." },
        { id: "b", label: "Symptoms / IPSS, latest testosterone / PSA / haematocrit (with dates), DRE status, dose, counselling covered, and GP-informed status — in the ePGD tool." },
        { id: "c", label: "Free-text note in the pharmacy logbook." },
        { id: "d", label: "Email to GP; no record needed at pharmacy." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Every TRT consultation captures symptoms (including IPSS), current biochemistry within validity window, DRE status, supply detail, counselling covered, and GP-informed status. This is your audit trail and clinical-governance record.",
    },
  ],
};
