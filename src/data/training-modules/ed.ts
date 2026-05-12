// Erectile Dysfunction (PDE5 inhibitor) — training module
//
// SCOPE: prepares a pharmacist to deliver private ED consultations under
// the GRH PDE5 inhibitor PGD. Aligned with the clinical logic enforced by
// the ePGD tool at /for-pharmacies/epgd/ed/ — every contraindication,
// caution, and dose rule taught here is also enforced by the tool.
//
// CLINICAL REVIEW STATUS: draft for review by Dr Nitin Shori (named
// clinician). Do not enable for production pharmacists until signed off.

import type { TrainingModule } from "./types";

export const edModule: TrainingModule = {
  slug: "ed",
  title: "Erectile Dysfunction — PDE5 inhibitor PGD",
  description:
    "Eligibility, contraindications, dosing, and counselling for the supply of sildenafil and tadalafil under PGD.",
  pgdSlugs: ["ed"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "Dr Nitin Shori, Medical Director",
  version: "1.0.0",
  materialClinicalChange: true, // initial publication
  publishedAt: "2026-05-11",
  estimatedMinutes: 18,
  passMark: 0.8,

  slides: [
    {
      id: "intro",
      type: "intro",
      title: "Erectile Dysfunction PGD — Training",
      subtitle: "Sildenafil and Tadalafil under Patient Group Direction",
      estimatedMinutes: 18,
      objectives: [
        "Identify which patients are eligible to be supplied under the ED PGD, and which must be referred.",
        "Recognise the absolute contraindications — particularly nitrates, riociguat, and recent cardiovascular events.",
        "Apply correct starting doses, including dose adjustments for alpha-blockers, CYP3A4 inhibitors, and age ≥65.",
        "Deliver structured counselling on onset, duration, side effects, and red flags (NAION, priapism, sudden hearing loss).",
        "Use the GRH ePGD consultation tool to produce a defensible clinical record.",
      ],
    },

    {
      id: "background",
      type: "content",
      title: "Clinical background",
      body: [
        "Erectile dysfunction is the persistent inability to attain or maintain an erection sufficient for satisfactory sexual performance. UK prevalence rises with age: an estimated 1 in 5 men over 40 and approaching half of men over 70 are affected.",
        "Phosphodiesterase type 5 (PDE5) inhibitors — sildenafil, tadalafil, vardenafil, and avanafil — are first-line pharmacological therapy. They potentiate the nitric-oxide pathway that produces erectile response to sexual stimulation. They do not initiate erection in the absence of stimulation.",
        "Sildenafil 50 mg has been licensed as a Pharmacy (P) medicine in the UK since 2018, allowing supply without a prescription where strict criteria are met. The GRH PGD extends this to other strengths and to tadalafil, under named-clinician oversight, with mandatory clinical assessment.",
      ],
      highlights: [
        "ED has a strong link to cardiovascular disease — assessment is an opportunity, not a barrier.",
        "PDE5 inhibitors work only in response to sexual stimulation. Counsel patients to expect this.",
        "Underlying causes (cardiovascular, endocrine, psychogenic, iatrogenic) should be considered and signposted.",
      ],
    },

    {
      id: "eligibility",
      type: "checklist",
      title: "Eligibility under the PGD",
      intro: "Supply is permitted only when ALL of the following are true:",
      items: [
        {
          label: "Male, aged 18–75",
          detail:
            "Outside this range, refer to GP. Men over 75 may still be appropriate candidates but require GP assessment before initiating.",
        },
        {
          label: "Resident in England or Wales",
          detail:
            "GRH PGDs are registered for CQC (England) and HIW (Wales). Scotland and Northern Ireland are not covered.",
        },
        {
          label: "Reports erectile dysfunction symptoms for ≥3 months",
          detail:
            "Brief episodes do not meet the PGD threshold — these patients should be reassured and counselled, with referral if persistent.",
        },
        {
          label: "Blood pressure measured today, within acceptable limits",
          detail:
            "BP must be ≥90/50 and ≤170/100 mmHg, measured in the pharmacy on the day of supply. See the BP slide for detail.",
        },
        {
          label: "No absolute contraindications",
          detail:
            "Reviewed in the next two slides. The ePGD tool will halt the consultation if any are flagged.",
        },
        {
          label: "Has read and signed the patient declaration",
          detail:
            "Captured electronically in the ePGD tool. Includes consent for the consultation and confirmation that the patient understands red flags.",
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
        "Nitrates in any form — GTN spray/tablets, isosorbide mononitrate or dinitrate, amyl nitrite ('poppers'). Concurrent use risks severe, potentially fatal hypotension.",
        "Riociguat (guanylate cyclase stimulator) — same vasodilatory risk as nitrates.",
        "Myocardial infarction or stroke within the previous 6 months.",
        "Unstable angina, severe (NYHA IV) heart failure, or uncontrolled arrhythmias — sexual activity itself is inadvisable.",
        "Previous non-arteritic anterior ischaemic optic neuropathy (NAION).",
        "Hereditary degenerative retinal disorders (e.g. retinitis pigmentosa).",
        "Severe hepatic impairment.",
        "Resting blood pressure outside the range 90/50–170/100 mmHg (measured in the pharmacy today).",
      ],
    },

    {
      id: "cautions",
      type: "callout",
      title: "Cautions — dose adjustment required",
      tone: "warning",
      message:
        "Supply may still be appropriate but the starting dose must be reduced and the patient counselled accordingly.",
      detail: [
        "Alpha-blockers (e.g. tamsulosin, doxazosin): patient must be stable on the alpha-blocker first. Start sildenafil at 25 mg. Warn about postural hypotension.",
        "CYP3A4 inhibitors (e.g. erythromycin, clarithromycin, ketoconazole, itraconazole, ritonavir): start sildenafil at 25 mg; tadalafil on-demand maximum 10 mg in any 72-hour period.",
        "Age ≥65: consider a starting dose of sildenafil 25 mg due to altered pharmacokinetics.",
        "Mild-to-moderate hepatic impairment: start sildenafil at 25 mg.",
        "Bleeding disorders or active peptic ulceration: caution; consider GP referral.",
      ],
    },

    {
      id: "bp-rules",
      type: "content",
      title: "Blood pressure — non-negotiable",
      body: [
        "Every ED consultation under the PGD requires a blood pressure reading taken in the pharmacy on the day of supply. A historic reading — even one from yesterday — is not acceptable.",
        "If the patient's BP is below 90/50 or above 170/100 mmHg, the PGD cannot be used. Below 90/50 indicates hypotension and risk of severe drop with PDE5 inhibitor. Above 170/100 indicates uncontrolled hypertension and unassessed cardiovascular risk.",
        "If the reading is borderline, retake after the patient has been seated for at least five minutes. If still outside range, refer to GP. Do not retry the reading repeatedly to try to get a 'passing' value.",
      ],
      highlights: [
        "BP must be taken today, in the pharmacy.",
        "Acceptable range: 90/50 to 170/100 mmHg.",
        "If outside range, refer — do not supply.",
      ],
    },

    {
      id: "agents",
      type: "comparison",
      title: "Sildenafil vs Tadalafil",
      intro:
        "The two agents available under the PGD have different pharmacokinetic profiles. Patient preference, lifestyle, and concomitant medication guide the choice.",
      columns: [
        {
          label: "Sildenafil",
          rows: [
            { heading: "Onset", body: "~30–60 minutes" },
            { heading: "Duration", body: "~4–6 hours" },
            { heading: "Standard starting dose", body: "50 mg as needed, 1 hour before activity" },
            { heading: "Lower starting dose if…", body: "Age ≥65, CYP3A4 inhibitor, mild-moderate hepatic impairment, alpha-blocker (must be stable): 25 mg" },
            { heading: "Food effect", body: "High-fat meals delay absorption — take on empty stomach for fastest onset" },
            { heading: "Max frequency", body: "Once in 24 hours" },
          ],
        },
        {
          label: "Tadalafil",
          rows: [
            { heading: "Onset", body: "~30 minutes" },
            { heading: "Duration", body: "Up to 36 hours" },
            { heading: "Standard starting dose", body: "10 mg as needed, increased to 20 mg if 10 mg insufficient" },
            { heading: "Lower starting dose if…", body: "CYP3A4 inhibitor: maximum 10 mg in any 72 hours" },
            { heading: "Food effect", body: "Negligible — can be taken with food" },
            { heading: "Max frequency", body: "Once daily for on-demand use; daily 5 mg available separately" },
          ],
        },
      ],
    },

    {
      id: "counselling",
      type: "checklist",
      title: "Counselling points — every patient, every supply",
      intro:
        "These points must be covered verbally with the patient and ticked off in the ePGD tool. The summary report includes them for the patient's record.",
      items: [
        {
          label: "How and when to take",
          detail:
            "Sildenafil: 1 hour before activity, on empty stomach. Tadalafil: 30 minutes before, food doesn't matter. Both require sexual stimulation to work.",
        },
        {
          label: "What to expect from onset and duration",
          detail:
            "Sildenafil works for 4–6 hours; tadalafil for up to 36 hours. The medicine is not an aphrodisiac and won't cause spontaneous erection.",
        },
        {
          label: "Common side effects",
          detail:
            "Headache (most common), facial flushing, nasal congestion, dyspepsia, visual disturbance (blue tinge), back/muscle pain (tadalafil more common). Usually mild and short-lived.",
        },
        {
          label: "Red-flag symptoms requiring urgent care",
          detail:
            "Chest pain during or after sex — STOP and seek urgent medical attention. Sudden loss of vision (possible NAION) — A&E. Sudden hearing loss or tinnitus — A&E. Erection lasting >4 hours (priapism) — A&E.",
        },
        {
          label: "Alcohol",
          detail:
            "Moderate alcohol is acceptable; excessive alcohol both reduces efficacy and increases hypotensive risk.",
        },
        {
          label: "When to seek further help",
          detail:
            "If three to four doses at the optimised strength are ineffective, see GP — underlying causes (endocrine, cardiovascular, psychogenic) should be reviewed.",
        },
        {
          label: "Underlying-cause referral",
          detail:
            "ED can be a marker of cardiovascular disease, diabetes, or depression. Encourage patients to discuss with their GP irrespective of treatment success.",
        },
      ],
    },

    {
      id: "red-flags",
      type: "callout",
      title: "Red flags — refer urgently or to A&E",
      tone: "danger",
      message:
        "If any of the following are reported during the consultation, do not supply — direct to urgent care.",
      detail: [
        "Chest pain at rest, on minimal exertion, or with any previous sexual activity — possible unstable angina, refer urgently.",
        "Sudden onset visual loss or blurring — possible NAION, A&E.",
        "Sudden onset hearing loss — A&E.",
        "Pre-existing priapism or previous episode lasting >4 hours.",
        "Patient appears confused, in pain, or otherwise acutely unwell — refer.",
        "Recent unexplained syncope or near-syncope.",
      ],
    },

    {
      id: "documentation",
      type: "checklist",
      title: "Documentation — what the ePGD tool captures",
      intro:
        "Every consultation produces an auditable record in the ePGD tool. You don't write notes separately — the tool's summary IS the record. Items captured automatically:",
      items: [
        { label: "Patient demographics and consent", detail: "Name, DOB, contact details, signed PGD declaration." },
        { label: "Today's BP reading", detail: "Systolic, diastolic, recorded as in-pharmacy on consultation date." },
        { label: "Medication and medical history declared", detail: "Including nitrate use, alpha-blockers, CYP3A4 inhibitors, cardiovascular history, ophthalmic history." },
        { label: "Clinical alerts triggered", detail: "Any contraindications or cautions identified by the tool — and your response (refer / dose-adjust / proceed)." },
        { label: "Product, strength, and quantity supplied", detail: "Plus any dose adjustment rationale." },
        { label: "Counselling points covered", detail: "Each checklist item is recorded as confirmed before supply can complete." },
        { label: "Pharmacist name and GPhC number", detail: "Auto-attached from your login. Do not share logins." },
      ],
    },

    {
      id: "case-1",
      type: "case",
      title: "Case 1 — straightforward",
      scenario:
        "Mark, 42, otherwise healthy, comes in describing reduced erectile response over the past six months. He takes no regular medication. BP measured today is 128/82. Has never used PDE5 inhibitors before. Asks for 'the strongest one'.",
      question:
        "What is the correct supply decision?",
      answer:
        "Supply sildenafil 50 mg, the standard starting dose for a healthy patient under 65. Tadalafil 10 mg is also acceptable — let patient preference guide. Counsel on onset, food effects, side effects, and red flags. Do NOT start at 100 mg even if requested.",
      rationale:
        "Standard starting dose first. Dose can be titrated up at subsequent supplies if 50 mg is inadequate after 4 attempts at the right timing. Starting at 100 mg without titration is outside the PGD.",
    },

    {
      id: "case-2",
      type: "case",
      title: "Case 2 — the trap",
      scenario:
        "David, 61, presents with ED. Mentions he takes 'a tablet for his prostate' — on questioning he confirms it's tamsulosin 400 mcg once daily, started 3 weeks ago. BP today is 138/86.",
      question:
        "Can he be supplied today? At what dose?",
      answer:
        "Caution but not contraindication. Tamsulosin is an alpha-blocker; the patient must be stable on it before adding a PDE5 inhibitor. Three weeks may not be 'stable' — ask about postural symptoms, dizziness, syncope since starting. If stable: sildenafil 25 mg starting dose (not 50 mg), with strong counselling on postural hypotension. If unstable or unsure: defer and refer back to GP to review.",
      rationale:
        "The alpha-blocker rule is one of the most commonly missed. The ePGD tool will prompt the question, but you need to interpret 'stable' clinically. Two weeks is rarely stable; six weeks usually is.",
    },

    {
      id: "summary",
      type: "summary",
      title: "Key points to remember",
      keyPoints: [
        "Take BP today, in the pharmacy. Range 90/50–170/100. No exceptions.",
        "Nitrates and riociguat are absolute contraindications. So is recent MI/stroke (≤6 months), unstable angina, severe HF, NAION, and severe hepatic impairment.",
        "Alpha-blocker users get sildenafil 25 mg if stable. If not stable, refer.",
        "CYP3A4 inhibitor users get sildenafil 25 mg or tadalafil ≤10 mg in 72 hours.",
        "Patients ≥65 should usually start at sildenafil 25 mg.",
        "Counsel every patient on onset, duration, side effects, alcohol, and red flags (chest pain, sudden vision/hearing loss, priapism >4 hours).",
        "The ePGD tool enforces the rules and produces the record. Use it for every consultation.",
        "Encourage GP review for underlying causes (cardiovascular, endocrine, mental health) regardless of supply.",
      ],
    },
  ],

  quiz: [
    {
      id: "q-nitrate",
      type: "single-choice",
      critical: true,
      question:
        "A 58-year-old man asks for sildenafil. He uses a GTN spray as needed for occasional chest tightness on exertion. What is the correct action?",
      options: [
        { id: "a", label: "Supply sildenafil 25 mg with strong counselling on postural hypotension." },
        { id: "b", label: "Supply tadalafil 10 mg as the half-life is shorter." },
        { id: "c", label: "Do not supply. Refer to GP — concurrent nitrate use is an absolute contraindication." },
        { id: "d", label: "Supply only if patient agrees not to use GTN within 24 hours of the dose." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Nitrates in any form are an absolute contraindication for PDE5 inhibitors due to risk of severe, potentially fatal hypotension. There is no safe dose or time-separation. Refer for cardiovascular assessment.",
    },

    {
      id: "q-recent-mi",
      type: "single-choice",
      critical: true,
      question:
        "Which of the following is an absolute contraindication to PDE5 inhibitor supply under the GRH PGD?",
      options: [
        { id: "a", label: "Type 2 diabetes on metformin." },
        { id: "b", label: "Hypertension well-controlled on amlodipine, BP 134/82 today." },
        { id: "c", label: "Myocardial infarction four months ago." },
        { id: "d", label: "Age 68 with no other comorbidities." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "MI or stroke within the past 6 months is an absolute contraindication — refer to GP/cardiology. Well-controlled diabetes, controlled BP in range, and age 68 with no comorbidities can all be supplied (the last with a lower starting dose).",
    },

    {
      id: "q-bp-range",
      type: "single-choice",
      critical: true,
      question:
        "What is the acceptable blood-pressure range for supply under the ED PGD, measured in the pharmacy today?",
      options: [
        { id: "a", label: "Between 100/60 and 160/95 mmHg." },
        { id: "b", label: "Between 90/50 and 170/100 mmHg." },
        { id: "c", label: "Below 140/90 mmHg only." },
        { id: "d", label: "Whatever the patient's home reading was this morning is acceptable." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Acceptable range is 90/50 to 170/100 mmHg, measured in the pharmacy on the day of supply. Historic or home readings are not acceptable. Out-of-range readings require referral, not retesting until a 'passing' value appears.",
    },

    {
      id: "q-alpha-blocker-dose",
      type: "single-choice",
      critical: true,
      question:
        "A 60-year-old stable on tamsulosin 400 mcg for 8 months wants sildenafil. BP today is 128/78. What is the correct starting dose?",
      options: [
        { id: "a", label: "100 mg — he is healthy and needs the maximum dose." },
        { id: "b", label: "50 mg — standard starting dose." },
        { id: "c", label: "25 mg — alpha-blocker concurrent use requires a lower start." },
        { id: "d", label: "Do not supply — alpha-blockers are an absolute contraindication." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Alpha-blockers are a caution, not a contraindication. The patient must be stable on the alpha-blocker (8 months qualifies), and sildenafil must start at 25 mg with counselling on postural hypotension.",
    },

    {
      id: "q-onset-food",
      type: "single-choice",
      question:
        "A patient asks how long before activity he should take sildenafil 50 mg, and whether food matters.",
      options: [
        { id: "a", label: "15 minutes before activity, regardless of food." },
        { id: "b", label: "Approximately 1 hour before activity, on an empty stomach for fastest onset." },
        { id: "c", label: "Take with a large meal to slow absorption and prolong effect." },
        { id: "d", label: "Take 30 minutes before activity; food has no effect on sildenafil." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Sildenafil has an onset of ~30–60 minutes; taking ~1 hour before is conventional. High-fat meals delay absorption, so empty-stomach administration gives fastest onset. Food has minimal effect on tadalafil — that's a key differentiator.",
    },

    {
      id: "q-max-frequency",
      type: "single-choice",
      question:
        "What is the maximum frequency of sildenafil dosing under the PGD?",
      options: [
        { id: "a", label: "Every 8 hours, up to 3 times daily." },
        { id: "b", label: "Once in 24 hours." },
        { id: "c", label: "Twice in 24 hours if the first dose was ineffective." },
        { id: "d", label: "Whenever needed, no maximum." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Sildenafil is dosed once in 24 hours. If 50 mg is ineffective at correct timing, titrate at the next supply rather than redosing within the day. Repeated dosing within 24 hours risks hypotension and side-effect accumulation.",
    },

    {
      id: "q-priapism",
      type: "single-choice",
      critical: true,
      question:
        "A patient calls the pharmacy to say his erection has lasted 4.5 hours after a sildenafil dose. What is the correct advice?",
      options: [
        { id: "a", label: "Wait another two hours; if still present, take paracetamol and call back." },
        { id: "b", label: "Try a cold shower; this usually resolves the problem." },
        { id: "c", label: "Go to A&E immediately — this is priapism and is a medical emergency." },
        { id: "d", label: "Drink plenty of water and rest in a cool room." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "An erection lasting more than 4 hours is priapism — a medical emergency. Delay risks permanent erectile tissue damage. Refer to A&E without delay; this is a counselling point that must be covered with every patient at supply.",
    },

    {
      id: "q-naion",
      type: "single-choice",
      question:
        "A patient mentions he had a 'mini stroke in his eye' five years ago — sudden loss of vision in one eye, lasting permanently, no recovery. He is on no regular medication for it. Which action is correct?",
      options: [
        { id: "a", label: "Supply if BP is in range — vision loss is not contraindicated." },
        { id: "b", label: "Do not supply — this is likely NAION and is an absolute contraindication." },
        { id: "c", label: "Supply only tadalafil — sildenafil is contraindicated but tadalafil is not." },
        { id: "d", label: "Supply 25 mg sildenafil as the lower dose." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "A history of sudden permanent monocular vision loss is highly suspicious for non-arteritic anterior ischaemic optic neuropathy (NAION). NAION is an absolute contraindication for all PDE5 inhibitors. Refer to GP / ophthalmology to confirm before any future supply consideration.",
    },

    {
      id: "q-cyp3a4",
      type: "single-choice",
      question:
        "Which of the following concurrent medications would require a lower starting dose under the PGD?",
      options: [
        { id: "a", label: "Atorvastatin 40 mg daily." },
        { id: "b", label: "Clarithromycin 500 mg twice daily for a chest infection." },
        { id: "c", label: "Amlodipine 5 mg daily." },
        { id: "d", label: "Lansoprazole 30 mg daily." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Clarithromycin is a potent CYP3A4 inhibitor; sildenafil should start at 25 mg, tadalafil maximum 10 mg in 72 hours. The other options do not require dose adjustment. (If the antibiotic course has finished and a reasonable washout has elapsed, standard dosing resumes.)",
    },

    {
      id: "q-record",
      type: "single-choice",
      question:
        "How is the consultation record documented under the GRH PGD?",
      options: [
        { id: "a", label: "Handwritten in a paper logbook kept in the dispensary." },
        { id: "b", label: "Emailed to the patient's GP as a free-text summary." },
        { id: "c", label: "Captured in the GRH ePGD tool, which produces an auditable summary record automatically." },
        { id: "d", label: "Only the medicine label is required — no separate record needed." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Every consultation must be recorded in the GRH ePGD tool. The tool captures demographics, BP, history, alerts triggered, counselling covered, and supply details into a single record. Paper notes are not acceptable for audit; GP notification is patient-directed (we encourage but do not mandate it).",
    },
  ],
};
