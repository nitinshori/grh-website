// HRT (Hormone Replacement Therapy) — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const hrtModule: TrainingModule = {
  slug: "hrt",
  title: "HRT (Hormone Replacement Therapy) — PGD",
  description:
    "Eligibility, contraindications, regimen selection and ongoing monitoring for the supply of HRT under PGD.",
  pgdSlugs: ["hrt"],
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
      title: "HRT — Training",
      subtitle: "Hormone replacement therapy for perimenopausal and menopausal women",
      estimatedMinutes: 20,
      objectives: [
        "Identify women eligible for HRT under the GRH PGD.",
        "Recognise the absolute contraindications — current/historic breast cancer, undiagnosed bleeding, active VTE, severe liver disease.",
        "Select an appropriate regimen — oestrogen-only vs combined; sequential vs continuous; oral vs transdermal.",
        "Counsel women on benefits, risks, side effects and red flags.",
        "Use the ePGD tool to capture a defensible clinical record and coordinate with the GP.",
      ],
    },

    {
      id: "background",
      type: "content",
      title: "Clinical background",
      body: [
        "Menopause is the cessation of menstruation due to loss of ovarian follicular activity. The perimenopause is the transition period beforehand. Average age of menopause in the UK is 51, but it can occur any time from the 40s onward (or earlier in premature ovarian insufficiency, POI).",
        "Symptoms include vasomotor (hot flushes, night sweats), urogenital (vaginal dryness, dyspareunia, recurrent UTI), psychological (low mood, anxiety, brain fog), musculoskeletal (joint pain), and sleep disturbance. Symptoms can last for years and significantly affect quality of life and work.",
        "HRT replaces oestrogen (the primary deficiency) and, in women with a uterus, progestogen (to protect the endometrium from oestrogen-induced hyperplasia). The PGD covers initiation and ongoing supply of standard HRT regimens — body-identical oestrogen + body-identical or synthetic progestogen — in women with typical menopausal symptoms and no contraindications. POI, very early menopause (<40), and complex regimens require GP/specialist input.",
      ],
      highlights: [
        "Oestrogen alone for women without a uterus. Oestrogen PLUS progestogen for women with a uterus.",
        "Transdermal oestrogen has lower VTE risk than oral — first-line in higher-risk patients.",
        "Body-identical regimens (oestradiol + micronised progesterone) are first-line in 2026 NICE/BMS guidance.",
      ],
    },

    {
      id: "eligibility",
      type: "checklist",
      title: "Eligibility under the PGD",
      intro: "Supply is permitted only when ALL of the following are true:",
      items: [
        { label: "Female, aged 40–60", detail: "Outside this range refer to GP. POI (<40) requires GP-led initiation. Women >60 wanting to START HRT need GP review for cardiovascular risk assessment; ongoing supply may be appropriate." },
        { label: "Resident in England or Wales", detail: "CQC / HIW coverage only." },
        { label: "Menopausal symptoms causing significant impact", detail: "Vasomotor, urogenital, psychological, sleep — any combination. Document specifics in the ePGD tool." },
        { label: "12 months of amenorrhoea OR clinical diagnosis of perimenopause", detail: "Perimenopause can be diagnosed clinically in women aged 45+ with typical symptoms; no FSH needed. Women <45 need biochemical confirmation (FSH x2 in early follicular phase if still cycling)." },
        { label: "No absolute contraindications", detail: "Reviewed on the next slide." },
        { label: "BP measured today, within acceptable range", detail: "Acceptable: 90/50–160/100. Outside this range — refer." },
        { label: "Uterus status confirmed", detail: "Determines whether progestogen is needed alongside oestrogen." },
        { label: "Has read and signed the patient declaration", detail: "Includes acknowledgement of bleeding risk in the first 6 months and red flags." },
      ],
    },

    {
      id: "absolute-contraindications",
      type: "callout",
      title: "Absolute contraindications — NEVER supply",
      tone: "danger",
      message:
        "If ANY of the following apply, the PGD cannot be used. Refer to GP / menopause specialist.",
      detail: [
        "Current or past hormone-dependent breast cancer.",
        "Current or past endometrial cancer.",
        "Current or past ovarian cancer.",
        "Undiagnosed abnormal vaginal bleeding (peri- or post-menopausal) — requires GP assessment first.",
        "Active venous thromboembolism (VTE) — current DVT or PE.",
        "History of unprovoked VTE or known thrombophilia (e.g. Factor V Leiden, antiphospholipid syndrome) — transdermal MAY be considered by specialist; not PGD.",
        "Recent arterial thrombotic event (MI, stroke, TIA within 12 months).",
        "Severe (active) liver disease with abnormal LFTs.",
        "Known hypersensitivity to active substances or excipients.",
        "Pregnancy.",
      ],
    },

    {
      id: "cautions",
      type: "callout",
      title: "Cautions — careful consideration required",
      tone: "warning",
      message:
        "Supply may be appropriate but transdermal route may be preferred, and closer monitoring required.",
      detail: [
        "BMI >30 — VTE risk increased with oral oestrogen; prefer transdermal.",
        "Smoker, especially >35 years old — VTE and CV risk; prefer transdermal.",
        "Migraine with aura — prefer transdermal oestrogen (oral can worsen).",
        "Hypertension (controlled, BP <160/100) — acceptable but monitor.",
        "Gallbladder disease or history of cholelithiasis — oral oestrogen increases gallstone risk.",
        "Family history of breast cancer in first-degree relative — discuss risk, document; consider GP review first.",
        "Personal history of endometriosis — continuous combined regimen preferred to suppress disease.",
        "Diabetes — coordinate with GP for glycaemic monitoring; transdermal generally preferred.",
        "Severe LUTS or recurrent UTI — consider vaginal oestrogen as primary or adjunct.",
      ],
    },

    {
      id: "regimen-selection",
      type: "comparison",
      title: "Regimen selection",
      intro:
        "Choice depends on uterus status, time since last menstrual period (LMP), and individual risk factors. Body-identical preparations (oestradiol gel/patch/spray + micronised progesterone capsule) are first-line in 2026.",
      columns: [
        {
          label: "No uterus (post-hysterectomy)",
          rows: [
            { heading: "Regimen", body: "Oestrogen-only HRT. No progestogen needed." },
            { heading: "Standard start", body: "Oestradiol gel (e.g. Oestrogel 1.5 mg/day) or patch (Estraderm 50 mcg twice weekly) or oral oestradiol 1 mg daily." },
            { heading: "Endometrial protection", body: "Not required. Exception: known residual endometriosis post-hysterectomy — add progestogen." },
          ],
        },
        {
          label: "With uterus, LMP <12 months ago",
          rows: [
            { heading: "Regimen", body: "Sequential (cyclical) combined HRT — oestrogen daily + 10–14 days of progestogen per month to give a monthly bleed." },
            { heading: "Standard start", body: "Oestradiol gel/patch/oral + micronised progesterone 200 mg orally on days 15–26 of cycle (or first 14 days of each calendar month)." },
            { heading: "Why sequential", body: "Continuous combined causes erratic breakthrough bleeding when ovarian function is still partially intact." },
          ],
        },
        {
          label: "With uterus, LMP >12 months ago (or age ≥54)",
          rows: [
            { heading: "Regimen", body: "Continuous combined HRT — oestrogen daily + progestogen daily, period-free." },
            { heading: "Standard start", body: "Oestradiol gel/patch/oral + micronised progesterone 100 mg orally daily." },
            { heading: "What to expect", body: "Light irregular bleeding common in first 3–6 months. Should settle to no bleeding. Persistent bleeding beyond 6 months — refer for investigation." },
          ],
        },
      ],
    },

    {
      id: "counselling-benefits",
      type: "checklist",
      title: "Counselling — benefits to set expectations",
      items: [
        { label: "Vasomotor symptoms", detail: "Typically improve within 2–4 weeks. 80–90% response in flush frequency and severity." },
        { label: "Urogenital symptoms", detail: "Systemic HRT helps but vaginal oestrogen is the most effective for atrophy. Vaginal can be added alongside systemic." },
        { label: "Sleep and mood", detail: "Improve secondary to vasomotor relief. Improvements usually clear by 3 months." },
        { label: "Bone health", detail: "HRT reduces fracture risk in menopausal women — established benefit." },
        { label: "Cardiovascular", detail: "If started before age 60 or within 10 years of menopause, may have a small CV benefit. Started later, less clear." },
      ],
    },

    {
      id: "counselling-risks",
      type: "checklist",
      title: "Counselling — risks the patient must understand",
      items: [
        { label: "Breast cancer", detail: "Combined HRT is associated with a small additional risk that increases with duration of use (especially beyond 5 years). Oestrogen-only HRT has minimal additional risk. Compare to lifestyle risks — alcohol, obesity, inactivity carry similar magnitudes." },
        { label: "VTE", detail: "Oral oestrogen increases VTE risk roughly 2-fold. Transdermal oestrogen does NOT increase VTE risk and is preferred in higher-risk patients." },
        { label: "Stroke", detail: "Small increased risk with oral HRT, particularly in older women. Transdermal lower risk." },
        { label: "Endometrial cancer", detail: "Unopposed oestrogen in women with a uterus increases endometrial cancer risk substantially. Adequate progestogen virtually eliminates that risk." },
        { label: "Initial bleeding", detail: "Sequential regimens cause a planned monthly bleed. Continuous combined may cause irregular bleeding in first 3–6 months; if persistent beyond that, investigate." },
        { label: "Common side effects", detail: "Breast tenderness, fluid retention, mood changes, headaches in first few weeks. Usually settle by 3 months." },
      ],
    },

    {
      id: "red-flags",
      type: "callout",
      title: "Red flags — STOP and refer",
      tone: "danger",
      message: "If any of these are reported, immediately stop HRT and direct to appropriate care.",
      detail: [
        "Unexpected vaginal bleeding (continuous combined regimen) persisting beyond 6 months, or any new bleeding after a period of amenorrhoea — refer for endometrial investigation.",
        "Suspected VTE — calf pain, leg swelling, breathlessness, chest pain. A&E.",
        "New severe headache, especially with neurological symptoms — possible stroke or migraine with aura.",
        "Sudden visual disturbance — refer urgently.",
        "Suspected breast lump or breast skin changes — urgent two-week-wait referral.",
        "Jaundice or right-upper-quadrant pain — possible hepatic dysfunction or cholestasis.",
        "Severe mood disturbance — refer for mental health support and HRT review.",
        "New BP >160/100 on therapy — review.",
      ],
    },

    {
      id: "monitoring",
      type: "checklist",
      title: "Monitoring schedule",
      intro:
        "HRT requires structured follow-up. Each supply requires a brief review; formal annual review is mandatory.",
      items: [
        { label: "3-month review", detail: "Symptom response, side effects, bleeding pattern. Adjust regimen if needed." },
        { label: "Annual review thereafter", detail: "Symptoms, BP, weight, bleeding pattern, breast awareness, any new contraindications. Confirm continued benefit-risk balance." },
        { label: "Breast awareness counselling", detail: "Mandatory at each visit. Patient should be familiar with her normal breast tissue and report any change." },
        { label: "Cervical screening", detail: "Confirm up-to-date with NHS cervical screening — independent of HRT but related primary care." },
        { label: "Mammography", detail: "NHS Breast Screening Programme (50–70) continues independent of HRT." },
        { label: "GP coordination", detail: "GP must be informed of HRT initiation and any regimen changes." },
      ],
    },

    {
      id: "case-1",
      type: "case",
      title: "Case 1 — straightforward initiator",
      scenario:
        "Anne, 52, presents with significant hot flushes, night sweats, sleep disruption and brain fog for the past 8 months. Last period 14 months ago. BMI 26. BP today 128/82. Has a uterus. No personal or family history of breast cancer, VTE, or stroke. Not a smoker. Wants HRT.",
      question: "What's the appropriate starting regimen?",
      answer:
        "Continuous combined HRT — body-identical: oestradiol 1.5 mg/day via gel (Oestrogel) plus micronised progesterone 100 mg orally at night. Counsel on expected irregular bleeding in first 3–6 months, breast awareness, and red flags. Schedule 3-month review.",
      rationale:
        "She is >12 months post-LMP and >54 isn't required for continuous combined when LMP exceeds 12 months. Body-identical is first-line per 2026 NICE/BMS guidance. Oral progesterone for endometrial protection. Transdermal oestrogen is the lower-VTE option even in low-risk patients.",
    },

    {
      id: "case-2",
      type: "case",
      title: "Case 2 — the trap",
      scenario:
        "Helen, 49, requests HRT for vasomotor symptoms ongoing for 18 months. BMI 32. Smoker, 15/day. Has a uterus, still has irregular periods. Sister had unprovoked DVT at age 38. BP today 138/86. Mother had breast cancer at age 68. No personal history of cancer or VTE.",
      question: "What's the safest approach?",
      answer:
        "She has multiple cautions: BMI >30, smoker, family history of unprovoked VTE in first-degree relative, and family history of breast cancer. Refer to GP for risk-benefit discussion before initiating. If GP agrees, transdermal oestrogen (patch or gel, not oral) is mandatory due to VTE risk. Sequential combined regimen given irregular periods (LMP <12 months). Stronger emphasis on breast awareness counselling and brief reduction or cessation considered if breast cancer risk increases.",
      rationale:
        "None of these individually is an absolute contraindication but the combination warrants GP risk discussion. The choice of route (transdermal) becomes mandatory rather than preferred. Smokers ≥35 with vasomotor symptoms benefit from HRT but the route matters. Don't refuse — but don't initiate without GP coordination.",
    },

    {
      id: "summary",
      type: "summary",
      title: "Key points to remember",
      keyPoints: [
        "Eligibility: female 40–60 with symptoms; LMP ≥12 months (continuous combined) or sequential if perimenopausal.",
        "Absolute contraindications: hormone-sensitive cancer history, undiagnosed bleeding, active or unprovoked VTE history, recent MI/stroke, severe liver disease, pregnancy.",
        "Uterus = needs progestogen. No uterus = oestrogen-only.",
        "Body-identical (oestradiol + micronised progesterone) is first-line in 2026.",
        "Transdermal oestrogen has lower VTE risk; prefer it in BMI >30, smokers, migraine with aura, age >60.",
        "Bleeding on continuous combined for >6 months — refer for endometrial investigation.",
        "Annual review mandatory. Breast awareness counselling at every visit.",
        "GP coordination is mandatory.",
      ],
    },
  ],

  quiz: [
    {
      id: "q-breast-cancer",
      type: "single-choice",
      critical: true,
      question:
        "A 54-year-old woman with significant vasomotor symptoms had ER-positive breast cancer treated 4 years ago and is now disease-free. Can she be supplied HRT under the PGD?",
      options: [
        { id: "a", label: "Yes, since she has been disease-free for over 3 years." },
        { id: "b", label: "Yes, but only oestrogen-only patches." },
        { id: "c", label: "No. Personal history of hormone-sensitive breast cancer is an absolute contraindication. Refer to GP / breast specialist for consideration of non-hormonal alternatives." },
        { id: "d", label: "Yes, alongside ongoing tamoxifen." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Personal history of hormone-sensitive breast cancer is an absolute contraindication for HRT under the PGD. Non-hormonal alternatives (SSRIs, gabapentin, clonidine, CBT) exist for vasomotor symptoms; refer to GP or oncology for selection. Some specialists may consider vaginal oestrogen for urogenital symptoms case-by-case — but that's specialist territory.",
    },
    {
      id: "q-undiagnosed-bleeding",
      type: "single-choice",
      critical: true,
      question:
        "A 56-year-old woman requests HRT for hot flushes. She mentions she had two episodes of light vaginal bleeding 8 months and 3 months ago, having been period-free for 4 years prior. What is the correct action?",
      options: [
        { id: "a", label: "Initiate continuous combined HRT and ask her to report any further bleeding." },
        { id: "b", label: "Do not initiate. Postmenopausal bleeding requires urgent GP assessment to exclude endometrial cancer BEFORE any HRT." },
        { id: "c", label: "Initiate oestrogen-only since she's postmenopausal." },
        { id: "d", label: "Initiate sequential HRT to provide a controlled bleed." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Postmenopausal bleeding (any vaginal bleeding after 12 months of amenorrhoea) requires urgent two-week-wait gynaecology referral to exclude endometrial cancer BEFORE HRT initiation. Starting HRT first would mask the cause and delay diagnosis.",
    },
    {
      id: "q-vte",
      type: "single-choice",
      critical: true,
      question:
        "A 51-year-old woman requests HRT. She had an unprovoked deep vein thrombosis 5 years ago, fully treated and resolved. She has no other risk factors.",
      options: [
        { id: "a", label: "Initiate oral HRT — DVT was years ago." },
        { id: "b", label: "Initiate transdermal HRT — safer route." },
        { id: "c", label: "Do not initiate under this PGD. Personal history of unprovoked VTE is an absolute contraindication; specialist menopause clinic may consider transdermal with thrombophilia screen first." },
        { id: "d", label: "Initiate with concurrent aspirin." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Personal history of unprovoked VTE is an absolute contraindication under this PGD. Specialist menopause clinic may consider transdermal HRT after thrombophilia workup, but that's not PGD territory. Refer.",
    },
    {
      id: "q-uterus",
      type: "single-choice",
      critical: true,
      question:
        "A 53-year-old woman with hysterectomy (3 years ago) and persistent vasomotor symptoms requests HRT. What is the appropriate regimen?",
      options: [
        { id: "a", label: "Sequential combined HRT to give a planned monthly bleed." },
        { id: "b", label: "Continuous combined HRT — oestrogen plus progestogen daily." },
        { id: "c", label: "Oestrogen-only HRT — progestogen is not needed when there is no uterus." },
        { id: "d", label: "Progestogen-only therapy." },
      ],
      correctOptionIds: ["c"],
      explanation:
        "Progestogen is required only to protect the endometrium. Post-hysterectomy women without endometriosis don't need progestogen — oestrogen-only is the appropriate regimen. Adding unnecessary progestogen increases breast cancer risk slightly. Exception: known residual endometriosis post-hysterectomy.",
    },
    {
      id: "q-route",
      type: "single-choice",
      question:
        "A 55-year-old woman, BMI 33, smoker, wants HRT for menopausal symptoms. What route of oestrogen is preferred?",
      options: [
        { id: "a", label: "Oral — convenient and effective." },
        { id: "b", label: "Transdermal (gel or patch) — does not increase VTE risk, preferred in BMI >30 and smokers." },
        { id: "c", label: "Vaginal — sufficient for systemic symptoms." },
        { id: "d", label: "Sublingual." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Transdermal oestrogen bypasses first-pass hepatic metabolism and does not increase VTE risk (unlike oral, which roughly doubles risk). In patients with BMI >30, smokers, or migraine-with-aura history, transdermal is the preferred route. Vaginal oestrogen treats local urogenital symptoms but does not provide systemic relief.",
    },
    {
      id: "q-sequential-vs-continuous",
      type: "single-choice",
      question:
        "A 48-year-old woman with a uterus has irregular periods (last in past 3 months). Significant vasomotor symptoms. What regimen?",
      options: [
        { id: "a", label: "Continuous combined HRT (period-free)." },
        { id: "b", label: "Sequential (cyclical) combined HRT with monthly bleeds." },
        { id: "c", label: "Oestrogen-only HRT." },
        { id: "d", label: "No HRT — too young to consider." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Women within 12 months of their last menstrual period (i.e. perimenopausal) need sequential (cyclical) combined HRT. Continuous combined causes erratic breakthrough bleeding when ovarian function is still partially intact. Switch to continuous combined when she's been 12 months period-free, or at age 54 (whichever is sooner).",
    },
    {
      id: "q-breast-awareness",
      type: "single-choice",
      question:
        "A patient on HRT for 18 months attends for a routine annual review. What's one of the mandatory counselling items at every visit?",
      options: [
        { id: "a", label: "Daily aspirin." },
        { id: "b", label: "Breast awareness — patient should be familiar with normal breast tissue and report changes." },
        { id: "c", label: "Vitamin D supplementation." },
        { id: "d", label: "Calcium intake." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Breast awareness counselling is mandatory at every HRT visit. The patient should know her normal breast tissue and report any change (lump, skin change, nipple discharge). NHS Breast Screening continues independently. The other items are general health recommendations but not mandatory HRT counselling.",
    },
    {
      id: "q-continuous-bleeding",
      type: "single-choice",
      question:
        "A patient is 7 months into continuous combined HRT and still has irregular light bleeding. What is the correct action?",
      options: [
        { id: "a", label: "Continue — bleeding is normal in the first year." },
        { id: "b", label: "Refer for endometrial investigation — bleeding beyond 6 months on continuous combined HRT requires assessment." },
        { id: "c", label: "Stop HRT entirely." },
        { id: "d", label: "Switch to oestrogen-only." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Bleeding in the first 3–6 months of continuous combined HRT is common and typically settles. Bleeding persisting beyond 6 months (or new bleeding after a settled period) requires endometrial investigation — transvaginal ultrasound and/or biopsy — to exclude endometrial pathology.",
    },
    {
      id: "q-body-identical",
      type: "single-choice",
      question:
        "What constitutes 'body-identical' HRT, per current 2026 guidance?",
      options: [
        { id: "a", label: "Oral conjugated equine oestrogen + medroxyprogesterone acetate." },
        { id: "b", label: "Transdermal oestradiol (gel/patch/spray) + micronised progesterone (oral or vaginal)." },
        { id: "c", label: "Combined oral contraceptive pill." },
        { id: "d", label: "Tibolone." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Body-identical HRT uses molecules biologically identical to those the human body produces: 17-β-oestradiol (gel/patch/spray, transdermal preferred) and micronised progesterone (oral or vaginal). This is first-line per 2026 NICE/BMS guidance. Conjugated equine oestrogen and synthetic progestogens (e.g. MPA) are older alternatives with different risk profiles.",
    },
    {
      id: "q-record",
      type: "single-choice",
      question:
        "What's required documentation for every HRT supply consultation?",
      options: [
        { id: "a", label: "Just the dose on the medicine label." },
        { id: "b", label: "Symptoms, current BP, bleeding pattern, breast awareness counselling, regimen, GP-informed status — all in the ePGD tool." },
        { id: "c", label: "Free-text note in the pharmacy logbook." },
        { id: "d", label: "Email to GP only." },
      ],
      correctOptionIds: ["b"],
      explanation:
        "Every HRT consultation captures symptoms, BP today, bleeding pattern (so we can flag concerning changes), breast awareness counselling, regimen, and GP-informed status — in the ePGD tool. Paper notes or labels alone are not acceptable for audit.",
    },
  ],
};
