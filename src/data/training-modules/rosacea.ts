// Rosacea — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const rosaceaModule: TrainingModule = {
  slug: "rosacea",
  title: "Rosacea — PGD",
  description: "Eligibility, agent choice and counselling for the supply of topical ivermectin, metronidazole, or oral doxycycline for rosacea under PGD.",
  pgdSlugs: ["rosacea"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Rosacea — Training", subtitle: "Topical and oral treatment for papulopustular rosacea", estimatedMinutes: 10, objectives: [
      "Differentiate rosacea subtypes (erythematotelangiectatic, papulopustular, phymatous, ocular).",
      "Identify candidates for topical or oral therapy under the PGD.",
      "Counsel on triggers, skincare, and persistence.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Rosacea is a chronic facial dermatosis affecting central face — cheeks, nose, chin, forehead. Four main subtypes: erythematotelangiectatic (flushing, persistent erythema), papulopustular (papules, pustules — most amenable to PGD), phymatous (skin thickening, e.g. rhinophyma — refer dermatology), and ocular (ocular irritation, lid disease — refer ophthalmology).",
      "Triggers include sun, heat, alcohol, spicy food, hot drinks, stress, certain skincare. Trigger management is a key part of treatment.",
    ], highlights: ["Papulopustular rosacea responds best to PGD-level treatment.", "Phymatous and ocular subtypes need specialist referral.", "Differentiate from acne (rosacea = no comedones; acne usually has them)."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Adult, 18–65", detail: "Paediatric rosacea is rare and needs dermatology." },
      { label: "Papulopustular subtype confirmed", detail: "Erythema + inflammatory papules/pustules without comedones. Phymatous, ocular, or erythematotelangiectatic alone — refer." },
      { label: "Not pregnant or breastfeeding", detail: "Doxycycline contraindicated; ivermectin avoided. Refer." },
      { label: "No suspicion of differential diagnosis", detail: "Lupus (malar rash, systemic features), seborrhoeic dermatitis, perioral dermatitis, drug rash — refer." },
      { label: "Eye involvement absent", detail: "Ocular rosacea (gritty eyes, blepharitis, recurrent styes) — refer ophthalmology." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Refer", tone: "danger", message: "Refer for any of these.", detail: [
      "Pregnancy or breastfeeding.",
      "Suspected lupus or other systemic disease.",
      "Eye symptoms — gritty eyes, blepharitis, photophobia, recurrent styes.",
      "Rhinophyma or other phymatous changes — dermatology.",
      "Pure flushing/telangiectasia without inflammatory lesions — limited PGD options; refer or signpost laser therapy.",
      "Concurrent isotretinoin.",
      "Severe disease unresponsive to topical — may need oral isotretinoin (specialist).",
      "Doxycycline-specific: known photosensitivity disorder, intracranial hypertension history.",
    ]},
    { id: "treatment", type: "comparison", title: "Treatment options", intro: "Choose based on severity. Combination often effective.", columns: [
      { label: "Topical ivermectin 1% cream", rows: [
        { heading: "Use", body: "Apply once daily to affected areas (avoid eyes, mouth). First-line for mild-moderate papulopustular rosacea." },
        { heading: "Time to effect", body: "~4 weeks for noticeable improvement; 12 weeks for maximum." },
        { heading: "Counselling", body: "Persistence essential. May worsen transiently first 2 weeks." },
      ]},
      { label: "Topical metronidazole 0.75% gel", rows: [
        { heading: "Use", body: "Apply BD to affected areas. Alternative or adjunct to ivermectin." },
        { heading: "Time to effect", body: "~6–8 weeks." },
        { heading: "Counselling", body: "Avoid sun (mild photosensitivity); SPF advised." },
      ]},
      { label: "Oral doxycycline 40 mg MR OD (low-dose anti-inflammatory)", rows: [
        { heading: "Use", body: "Moderate-severe papulopustular rosacea or topical failure. Sub-antimicrobial dose — anti-inflammatory effect." },
        { heading: "Duration", body: "Up to 16 weeks, then review and step down to topical maintenance." },
        { heading: "Counselling", body: "Take with water, not lying down. Photosensitivity — SPF mandatory. Pregnancy contraindicated." },
      ]},
    ]},
    { id: "trigger-management", type: "checklist", title: "Trigger management — key counselling", intro: "Trigger avoidance often as important as pharmacotherapy.", items: [
      { label: "Sun", detail: "Daily SPF 30+ broad spectrum, even in winter. Wide-brimmed hat in summer." },
      { label: "Heat", detail: "Hot drinks, saunas, hot baths can trigger flushing. Lukewarm alternatives." },
      { label: "Alcohol", detail: "Especially red wine. Reduce or avoid." },
      { label: "Spicy food", detail: "Common trigger. Identify and reduce." },
      { label: "Skincare", detail: "Gentle non-foaming cleanser BD. Avoid astringents, scrubs, alcohol-based toners, retinoids initially. Fragrance-free moisturiser." },
      { label: "Stress", detail: "Trigger for flushing. Lifestyle measures, mindfulness can help." },
      { label: "Diary", detail: "Suggest patient keeps a trigger diary for 4 weeks to identify personal patterns." },
    ]},
    { id: "red-flags", type: "callout", title: "Refer", tone: "danger", message: "These suggest something other than simple papulopustular rosacea.", detail: [
      "Eye irritation, gritty eyes, recurrent styes — ophthalmology.",
      "Rhinophyma / phymatous skin changes — dermatology.",
      "Systemic symptoms (joint pain, fatigue, photosensitivity) — possible lupus.",
      "Severe rapid progression with nodules and abscesses — dermatology.",
      "No improvement after 12 weeks of adequate therapy — dermatology.",
      "Concurrent skin lesion with cancer features (asymmetry, irregular border, colour variation, diameter, evolution).",
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Papulopustular rosacea = PGD-treatable. Phymatous/ocular = refer.",
      "First-line: topical ivermectin 1% OD. Alternative: metronidazole 0.75% BD.",
      "Moderate-severe: doxycycline 40 mg MR OD up to 16 weeks.",
      "Trigger management central — sun, heat, alcohol, spice, skincare.",
      "Pregnancy and ocular involvement = refer.",
    ]},
  ],
  quiz: [
    { id: "q-eye", type: "single-choice", critical: true, question: "Patient with facial rosacea also reports gritty eyes and recurrent styes. Action?", options: [
      { id: "a", label: "Supply topical ivermectin." }, { id: "b", label: "Refer to ophthalmology. Ocular rosacea needs specialist eye care; can threaten cornea." }, { id: "c", label: "Supply doxycycline." }, { id: "d", label: "Topical eye drops." }
    ], correctOptionIds: ["b"], explanation: "Ocular rosacea is sight-threatening if untreated. Always refer." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant woman with rosacea. Action?", options: [
      { id: "a", label: "Topical ivermectin." }, { id: "b", label: "Refer to GP. Both topical ivermectin and oral doxycycline are avoided in pregnancy. Topical metronidazole can be considered by GP for severe cases." }, { id: "c", label: "Doxycycline." }, { id: "d", label: "Oral antibiotic." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy is out of scope. Doxycycline contraindicated. GP can consider topical metronidazole if needed." },
    { id: "q-phyma", type: "single-choice", critical: true, question: "Patient has thickened bumpy nose skin (rhinophyma) alongside facial papules. Action?", options: [
      { id: "a", label: "Topical ivermectin alone." }, { id: "b", label: "Refer to dermatology. Phymatous rosacea may need specialist treatment including possible surgical/laser intervention." }, { id: "c", label: "Doxycycline alone." }, { id: "d", label: "Combination topical + oral." }
    ], correctOptionIds: ["b"], explanation: "Phymatous changes need dermatology assessment. Pharmacological treatment for papules can continue but the nose changes need specialist consideration." },
    { id: "q-time-effect", type: "single-choice", question: "Patient on topical ivermectin for 3 weeks reports no improvement. Action?", options: [
      { id: "a", label: "Switch to oral doxycycline immediately." }, { id: "b", label: "Persist with ivermectin. Effect takes ~4 weeks to become noticeable, 12 weeks for maximum. Counsel on persistence." }, { id: "c", label: "Stop treatment." }, { id: "d", label: "Add steroid cream." }
    ], correctOptionIds: ["b"], explanation: "Counsel persistence. Many patients quit too early. 4 weeks is the start of visible benefit." },
    { id: "q-comedones", type: "single-choice", question: "Patient has facial papules, pustules, AND comedones (blackheads). What's the likely diagnosis?", options: [
      { id: "a", label: "Rosacea." }, { id: "b", label: "Acne vulgaris — rosacea characteristically has NO comedones. Apply acne PGD instead." }, { id: "c", label: "Seborrhoeic dermatitis." }, { id: "d", label: "Perioral dermatitis." }
    ], correctOptionIds: ["b"], explanation: "Comedones (blackheads/whiteheads) distinguish acne from rosacea. Rosacea is non-comedonal." },
    { id: "q-skincare", type: "single-choice", question: "Patient asks for skincare recommendations.", options: [
      { id: "a", label: "Daily exfoliating scrub with alcohol toner." }, { id: "b", label: "Gentle non-foaming cleanser, fragrance-free moisturiser, daily SPF 30+. Avoid scrubs, alcohol-based products, fragranced products." }, { id: "c", label: "Oily moisturisers only." }, { id: "d", label: "Bar soap only." }
    ], correctOptionIds: ["b"], explanation: "Rosacea skin is sensitive; gentle, fragrance-free, sun-protected. Aggressive products worsen the condition." },
    { id: "q-doxycycline-pregnancy", type: "single-choice", question: "Why is oral doxycycline contraindicated in pregnancy?", options: [
      { id: "a", label: "It's ineffective in pregnancy." }, { id: "b", label: "Tetracyclines cause foetal tooth/bone effects, and risk of maternal hepatotoxicity in late pregnancy." }, { id: "c", label: "It causes GI upset." }, { id: "d", label: "It's too sedating." }
    ], correctOptionIds: ["b"], explanation: "All tetracyclines contraindicated in pregnancy due to foetal bone/tooth effects and maternal hepatotoxicity." },
    { id: "q-triggers", type: "single-choice", question: "Patient asks what triggers to avoid.", options: [
      { id: "a", label: "Avoid all sun exposure indoors and out." }, { id: "b", label: "Common triggers: sun, heat, hot drinks, alcohol (especially red wine), spicy food, stress, harsh skincare. Personal patterns vary — suggest a 4-week trigger diary." }, { id: "c", label: "Only avoid alcohol." }, { id: "d", label: "No triggers exist." }
    ], correctOptionIds: ["b"], explanation: "Triggers are individualised; the diary approach lets patient identify their own. Sun, heat, alcohol, spice are most common." },
    { id: "q-low-dose-doxy", type: "single-choice", question: "Why use doxycycline 40 mg MR rather than antibacterial 100 mg dose?", options: [
      { id: "a", label: "Patients can't tolerate higher doses." }, { id: "b", label: "40 mg MR is sub-antimicrobial — anti-inflammatory effect without antibiotic resistance pressure. The licensed dose for rosacea." }, { id: "c", label: "Easier to manufacture." }, { id: "d", label: "Cheaper." }
    ], correctOptionIds: ["b"], explanation: "40 mg modified-release is the sub-antimicrobial anti-inflammatory dose. Avoids driving antibiotic resistance and licensed specifically for rosacea." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Subtype, lesion distribution, alternative diagnoses considered, agent chosen, trigger discussion, counselling — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record documents that subtype was identified and other differentials considered." },
  ],
};
