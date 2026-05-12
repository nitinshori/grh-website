// Acne vulgaris — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const acneModule: TrainingModule = {
  slug: "acne",
  title: "Acne Vulgaris — PGD",
  description: "Eligibility, severity-led therapy and counselling for the supply of topical and oral acne treatments under PGD.",
  pgdSlugs: ["acne"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 12,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Acne — Training", subtitle: "Severity-led treatment for acne vulgaris under PGD", estimatedMinutes: 12, objectives: [
      "Grade acne severity and choose appropriate therapy.",
      "Identify candidates needing specialist referral (severe nodulocystic, scarring).",
      "Counsel on time course, pregnancy avoidance with oral isotretinoin (NOT in PGD) and tetracyclines, and skincare.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Acne vulgaris results from increased sebum production, follicular hyperkeratinisation, Cutibacterium acnes proliferation, and inflammation. Affects ~80% of adolescents and many adults, especially women.",
      "Severity grading: mild = comedones with limited inflammatory papules/pustules. Moderate = more inflammatory lesions, some nodules. Severe = nodulocystic, scarring.",
      "The PGD covers topical regimens (retinoid, benzoyl peroxide, topical antibiotic) and oral tetracyclines (lymecycline first-line). Oral isotretinoin is consultant-only — NOT in PGD. Severe nodulocystic / scarring acne — refer to dermatology.",
    ], highlights: ["Topical therapy is first-line for mild-moderate.", "Oral lymecycline + topical retinoid for moderate.", "Severe / scarring / treatment-failure: refer to dermatology for isotretinoin."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Aged 12–35", detail: "Outside this range refer." },
      { label: "Mild to moderate acne", detail: "Severe nodulocystic acne or scarring — refer." },
      { label: "Not pregnant or breastfeeding", detail: "Tetracyclines contraindicated. Topical retinoids avoid in pregnancy. Refer." },
      { label: "Not on isotretinoin currently or in last month", detail: "Different management regime." },
      { label: "No relevant absolute contraindications (next slide)", detail: "Particularly drug interactions for oral tetracyclines." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Refer", tone: "danger", message: "If any apply, do not supply under PGD.", detail: [
      "Pregnancy or breastfeeding.",
      "Severe nodulocystic acne with risk of scarring — dermatology referral for isotretinoin consideration.",
      "Acne fulminans (rare severe form with systemic symptoms) — urgent dermatology.",
      "Suspected acne-mimic (rosacea, perioral dermatitis, folliculitis, drug-induced acneiform) — proper diagnosis needed.",
      "Concurrent isotretinoin or recent course.",
      "Known hypersensitivity to chosen agents.",
      "Lymecycline-specific: known photosensitivity disorder, intracranial hypertension history, severe liver/renal impairment.",
    ]},
    { id: "treatment", type: "comparison", title: "Severity-led treatment", intro: "Match treatment intensity to severity.", columns: [
      { label: "Mild — topical only", rows: [
        { heading: "First-line", body: "Adapalene 0.1% gel + benzoyl peroxide 2.5% (separate or combined as Epiduo). Apply once daily at night." },
        { heading: "Alternative", body: "Azelaic acid 20% cream BD. Salicylic acid OTC. Topical clindamycin + benzoyl peroxide (Duac) — avoid topical antibiotic monotherapy." },
        { heading: "Time to effect", body: "8–12 weeks for noticeable improvement. Counsel on persistence." },
      ]},
      { label: "Moderate — topical + oral antibiotic", rows: [
        { heading: "First-line oral", body: "Lymecycline 408 mg once daily for up to 3 months." },
        { heading: "Continue topical", body: "Adapalene + benzoyl peroxide alongside. Don't use oral antibiotic alone — increases resistance." },
        { heading: "Alternative oral", body: "Doxycycline 100 mg OD if lymecycline not tolerated." },
        { heading: "Duration", body: "Up to 3 months oral antibiotic, then review and step down to topical maintenance." },
      ]},
      { label: "Severe / failed step-up — refer", rows: [
        { heading: "Refer dermatology if", body: "Nodulocystic acne, scarring, treatment failure after 3 months adequate therapy, significant psychological impact." },
        { heading: "Reason", body: "Isotretinoin is consultant-led, with pregnancy prevention programme. Cannot be supplied under PGD." },
      ]},
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Time to effect", detail: "8–12 weeks before noticeable improvement. Maximum benefit at 6 months. Counsel on persistence — most patients quit too early." },
      { label: "Initial worsening", detail: "Acne can transiently worsen in first 2–4 weeks of treatment. Persist." },
      { label: "Topical retinoid technique", detail: "Pea-sized amount to entire face at night, on clean dry skin. Start every other night first 2 weeks to build tolerance. Always moisturise. SPF 30+ daily — increases photosensitivity." },
      { label: "Tetracycline counselling", detail: "Take with water; not lying down (oesophageal irritation). Avoid dairy/iron/calcium within 2 hours (chelation reduces absorption). Photosensitivity — wear SPF." },
      { label: "Pregnancy", detail: "Tetracyclines absolutely contraindicated in pregnancy. Effective contraception throughout treatment. Confirm not pregnant before initiating." },
      { label: "Skincare", detail: "Gentle non-comedogenic cleanser BD. Avoid scrubbing/picking (worsens scarring). Daily SPF 30+." },
      { label: "Stop antibiotic if no improvement at 3 months", detail: "Continued oral antibiotic drives resistance without clinical benefit." },
      { label: "Mental health awareness", detail: "Acne can significantly affect mood. Ask. Refer to GP if depression or suicidal thoughts." },
    ]},
    { id: "red-flags", type: "callout", title: "Refer dermatology / GP", tone: "danger", message: "Refer if any apply.", detail: [
      "Severe nodulocystic acne.",
      "Scarring (atrophic, hypertrophic, keloidal).",
      "Treatment failure after 3 months of adequate therapy.",
      "Acne fulminans (sudden severe with systemic symptoms — fever, joint pain) — urgent.",
      "Significant psychological impact, body dysmorphia.",
      "Suspicion of underlying endocrine cause (sudden onset adult acne, hirsutism, irregular periods — possible PCOS).",
      "Pregnancy or planning pregnancy.",
    ]},
    { id: "case-1", type: "case", title: "Case 1 — moderate acne", scenario: "Ben, 17, has facial acne — papules and pustules across cheeks and forehead, no scarring. Has tried OTC benzoyl peroxide alone for 2 months with limited benefit. No medication.",
      question: "Supply?", answer: "Step up to combination: adapalene + benzoyl peroxide gel (Epiduo) once nightly, PLUS lymecycline 408 mg once daily for 3 months. Counsel on persistence (8–12 weeks for clear benefit), tetracycline timing (with water, not lying down, away from dairy), photosensitivity / SPF, and review at 3 months.",
      rationale: "Moderate inflammatory acne not controlled on topical alone — step up to combination topical + oral antibiotic is standard. Lymecycline first-line oral. Stop antibiotic at 3 months and maintain on topical." },
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Severity-led: topical-only for mild; + oral antibiotic for moderate; refer for severe.",
      "Adapalene + benzoyl peroxide = first-line topical combination.",
      "Lymecycline 408 mg OD = first-line oral, max 3 months.",
      "8–12 weeks before noticeable improvement — counsel persistence.",
      "Refer: nodulocystic, scarring, treatment failure, significant psychological impact, pregnancy.",
      "Tetracyclines contraindicated in pregnancy and under 12 years.",
    ]},
  ],
  quiz: [
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant woman with moderate acne. Action?", options: [
      { id: "a", label: "Lymecycline + adapalene." }, { id: "b", label: "Refer to GP/midwife. Tetracyclines and topical retinoids both contraindicated in pregnancy. Azelaic acid is pregnancy-safe — GP can assess." }, { id: "c", label: "Adapalene only." }, { id: "d", label: "Doxycycline only." }
    ], correctOptionIds: ["b"], explanation: "Tetracyclines are contraindicated in pregnancy (foetal tooth/bone effects). Topical retinoids are also contraindicated. Pregnancy management of acne needs GP/midwife. Azelaic acid is the usual pregnancy-safe option." },
    { id: "q-severe", type: "single-choice", critical: true, question: "Patient has deep painful nodules on jawline and chest, with early scarring. Action?", options: [
      { id: "a", label: "Lymecycline." }, { id: "b", label: "Refer to dermatology. Nodulocystic acne with scarring needs isotretinoin (consultant-led), not PGD treatment." }, { id: "c", label: "Doxycycline at higher dose." }, { id: "d", label: "Topical combination." }
    ], correctOptionIds: ["b"], explanation: "Severe nodulocystic acne with scarring needs specialist input for isotretinoin. PGD treatment will be inadequate and time will be lost during which more scarring develops." },
    { id: "q-isotretinoin", type: "single-choice", critical: true, question: "Patient on isotretinoin started by dermatology 2 weeks ago wants additional acne treatment. Action?", options: [
      { id: "a", label: "Add adapalene." }, { id: "b", label: "Refer back to dermatology. Patients on isotretinoin are managed under a specific dermatology programme; concurrent PGD treatment can cause issues." }, { id: "c", label: "Add lymecycline." }, { id: "d", label: "Add benzoyl peroxide only." }
    ], correctOptionIds: ["b"], explanation: "Patients on isotretinoin are within a managed dermatology programme with strict monitoring and contraception requirements. Don't add to their regimen via PGD." },
    { id: "q-antibiotic-monotherapy", type: "single-choice", critical: true, question: "Why is oral antibiotic monotherapy avoided in acne?", options: [
      { id: "a", label: "It's ineffective." }, { id: "b", label: "It drives antibiotic resistance. Always combine with topical retinoid or benzoyl peroxide to reduce resistance pressure and improve outcomes." }, { id: "c", label: "It causes hair loss." }, { id: "d", label: "It's too expensive." }
    ], correctOptionIds: ["b"], explanation: "Antimicrobial stewardship is central to modern acne management. Combining with topical reduces resistance development and improves clinical response." },
    { id: "q-time-to-effect", type: "single-choice", question: "Patient on 4 weeks of treatment says no benefit yet — wants to stop.", options: [
      { id: "a", label: "Agree and try something else." }, { id: "b", label: "Counsel persistence. Acne treatment takes 8–12 weeks for noticeable benefit. May worsen transiently first. Reassess at 12 weeks." }, { id: "c", label: "Double the dose." }, { id: "d", label: "Switch to oral isotretinoin." }
    ], correctOptionIds: ["b"], explanation: "Most patients stop too early. Counselling on the 8–12-week timescale is the single most important intervention to prevent treatment failure." },
    { id: "q-doxycycline-pregnancy", type: "single-choice", question: "20-year-old woman uses combined OCP for contraception. Lymecycline interaction?", options: [
      { id: "a", label: "Major interaction — switch contraception." }, { id: "b", label: "Modern evidence suggests no clinically significant interaction between tetracyclines and combined OCP. Continue OCP as normal. Some guidelines still suggest additional precautions in the first 3 weeks — reasonable to mention but not mandatory." }, { id: "c", label: "Stop OCP." }, { id: "d", label: "Switch to doxycycline." }
    ], correctOptionIds: ["b"], explanation: "Older guidance about tetracycline-OCP interaction has been revised; modern evidence shows no clinically significant interaction. Counsel as per current FSRH/NICE guidance." },
    { id: "q-topical-technique", type: "single-choice", question: "Patient newly on adapalene reports skin redness and peeling after a week. Action?", options: [
      { id: "a", label: "Stop adapalene." }, { id: "b", label: "Counsel: this is expected early irritation. Reduce frequency to every other night for 2 weeks to build tolerance, always moisturise, daily SPF, then gradually back to nightly. Most settle by 4 weeks." }, { id: "c", label: "Switch to lymecycline only." }, { id: "d", label: "Combine with hydrocortisone." }
    ], correctOptionIds: ["b"], explanation: "Retinoid dermatitis is common at initiation. Reducing frequency to build tolerance, moisturising, and SPF resolves most cases. Don't abandon — re-counsel." },
    { id: "q-3-months", type: "single-choice", question: "Patient has been on lymecycline + adapalene/BPO for 3 months with good response. Action?", options: [
      { id: "a", label: "Continue both indefinitely." }, { id: "b", label: "Stop lymecycline (maximum 3-month course to limit resistance). Continue topical adapalene/BPO as long-term maintenance." }, { id: "c", label: "Continue lymecycline at half dose." }, { id: "d", label: "Stop everything." }
    ], correctOptionIds: ["b"], explanation: "Oral antibiotic is for the acute moderate phase, max ~3 months. Maintenance is topical (adapalene + BPO). Continued oral antibiotic drives resistance without added benefit." },
    { id: "q-pcos", type: "single-choice", question: "20-year-old woman with sudden-onset adult acne, irregular periods, increased facial hair. Action?", options: [
      { id: "a", label: "Supply lymecycline for acne." }, { id: "b", label: "Refer to GP — possible PCOS. The combination of acne, oligomenorrhoea, and hirsutism in an adult woman warrants endocrine workup." }, { id: "c", label: "Topical only." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Acne in this context is a sign of an underlying endocrine issue. Treating the skin without identifying PCOS misses an important diagnosis." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label only." }, { id: "b", label: "Severity grade, lesion distribution, prior treatment tried, agent(s) chosen, pregnancy status confirmed, counselling delivered (especially time-to-effect, contraception if relevant) — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text note." }
    ], correctOptionIds: ["b"], explanation: "Structured record documents the clinical reasoning (severity grade, treatments tried) which justifies step-up." },
  ],
};
