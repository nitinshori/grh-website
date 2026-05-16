// Vaginal thrush — Combi (clotrimazole pessary + cream) PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const thrushCombiModule: TrainingModule = {
  slug: "thrush-combi",
  title: "Vaginal Thrush — Combi (Pessary + Cream) PGD",
  description: "Clotrimazole 500mg pessary + clotrimazole 1% external cream — generic combo supply for vaginal candidiasis.",
  pgdSlugs: ["thrush-combi"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-13",
  estimatedMinutes: 8,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Vaginal Thrush Combi — Training", subtitle: "Clotrimazole pessary + external cream — single integrated supply", estimatedMinutes: 8, objectives: [
      "Confirm symptoms consistent with uncomplicated vaginal candidiasis.",
      "Apply eligibility and exclusion criteria for the combi pack.",
      "Counsel on correct pessary insertion and cream application.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Vaginal candidiasis ('thrush') is a yeast infection of the vagina/vulva, most commonly Candida albicans. ~75% of women experience at least one episode in their lifetime.",
      "Typical presentation: itching, soreness, white curd-like discharge, vulval erythema/fissuring. Often dyspareunia and dysuria.",
      "The combi pack pairs an internal pessary (clears the vaginal infection) with an external cream (treats the vulval skin). Many patients prefer this 'one-stop' supply over the oral tablet because it's local-only and avoids any systemic effect.",
      "This PGD covers GENERIC clotrimazole products — either the branded combi or any generic equivalent containing clotrimazole 500mg pessary + 1% external cream.",
    ], highlights: ["For uncomplicated, symptomatic, immunocompetent patients aged 16–60.", "External cream alone treats vulval symptoms; pessary alone misses them.", "Pregnancy: pessary preferred over oral fluconazole.", "Can be used with condom — but warn that latex/rubber may be weakened."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Female aged 16–60 years", detail: "Outside this range refer GP for assessment (different presentation considerations)." },
      { label: "Symptoms consistent with vaginal thrush", detail: "Itching, white discharge, vulval soreness ± dysuria. Not bleeding, not unusual offensive odour (suspect BV / STI)." },
      { label: "First episode OR previous episode confidently identified as thrush", detail: "If first episode of unclear cause refer GP for swab confirmation." },
      { label: "Not currently pregnant OR pregnancy confirmed and pessary used carefully (manual insertion, no applicator)", detail: "Pregnancy is fine for clotrimazole topical/pessary but use manual insertion to reduce mechanical risk." },
      { label: "Not breastfeeding restriction (compatible)", detail: "Topical clotrimazole compatible with breastfeeding." },
      { label: "Informed consent", detail: "Including off-label aspects in pregnancy and counselling on prescription differences from PFE." },
    ]},
    { id: "exclusions", type: "callout", title: "Exclusions / red flags — refer", tone: "danger", message: "Do not supply; refer GP / sexual health clinic.", detail: [
      "Recurrent thrush (≥4 episodes in 12 months) — needs longer-course or maintenance regimen.",
      "Immunocompromise: poorly controlled diabetes, HIV, chemotherapy, biologics, transplant.",
      "Postmenopausal first episode — atrophic vaginitis is a common mimic.",
      "Pre-pubertal patients.",
      "Significant abdominal/pelvic pain, fever, foul-smelling discharge, abnormal bleeding — possible PID or STI.",
      "Confirmed allergy to clotrimazole or imidazoles.",
      "Suspected partner STI exposure or other STI symptoms — refer for full screen.",
      "Recent (last 7–14 days) treatment that has failed.",
    ]},
    { id: "administration", type: "checklist", title: "Administration & supply", items: [
      { label: "Supply", detail: "1× clotrimazole 500mg pessary + 1× clotrimazole 1% external cream (20g)." },
      { label: "Pessary insertion", detail: "Insert at bedtime, lying down with knees bent. Use applicator (or finger if pregnant). Push pessary as far back into vagina as comfortable. Wash hands before and after." },
      { label: "Cream application", detail: "Apply thin layer to vulval area twice a day until symptoms resolve, typically 3–7 days. Continue even if pessary symptoms have settled — vulval skin clears more slowly." },
      { label: "Repeat dose", detail: "If symptoms not resolved within 7 days, second pessary may be considered (off-PGD — refer for clinical review or repeat consultation)." },
      { label: "Latex barrier method warning", detail: "Clotrimazole damages latex condoms and diaphragms. Use alternative contraception during treatment and for at least 5 days afterwards." },
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Avoid douches, scented soaps, shower gels, fragranced washes", detail: "Wash with plain water or emollient soap substitute. Cotton underwear. Avoid tight-fitting trousers." },
      { label: "Sexual activity", detail: "Avoid until symptoms resolved (comfort + transmission). Partner usually doesn't need treatment unless symptomatic." },
      { label: "Recurrence", detail: "If thrush returns within 8 weeks, refer GP for confirmation and longer-course treatment." },
      { label: "When to seek urgent help", detail: "No improvement at 7 days, worsening, fever, abdominal pain, abnormal bleeding, or unusual discharge." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Generic clotrimazole pessary + cream covers internal AND external symptoms.",
      "Eligibility 16–60, symptoms consistent with thrush, not recurrent or immunocompromised.",
      "Pessary inserted at bedtime; cream BD to vulva for 3–7 days.",
      "Avoid latex condoms during and 5 days after treatment.",
      "Refer if recurrent, postmenopausal first episode, immunocompromised, abnormal bleeding, or no improvement at 7 days.",
    ]},
  ],
  quiz: [
    { id: "q-eligibility", type: "single-choice", critical: true, question: "32-year-old woman, classic thrush symptoms, no recurrence, no significant medical history. Action?", options: [
      { id: "a", label: "Refuse — needs GP." }, { id: "b", label: "Supply combi (pessary + external cream); counsel on use, latex warning, return if no improvement at 7 days." }, { id: "c", label: "Supply oral fluconazole only." }, { id: "d", label: "Refer pelvic exam." }
    ], correctOptionIds: ["b"], explanation: "Standard PGD supply path. Combi treats both internal and external symptoms." },
    { id: "q-recurrent", type: "single-choice", critical: true, question: "Patient reports 5 thrush episodes in past year. Action?", options: [
      { id: "a", label: "Supply combi." }, { id: "b", label: "Recurrent thrush (≥4/year) — refer GP for swab confirmation and longer-course / maintenance regimen. Outside this PGD." }, { id: "c", label: "Double dose." }, { id: "d", label: "Combi + oral." }
    ], correctOptionIds: ["b"], explanation: "Recurrent thrush is excluded — needs specialist assessment for underlying cause and prolonged regimen." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "12-week pregnant patient with classic thrush symptoms. Action?", options: [
      { id: "a", label: "Refuse — pregnancy excluded." }, { id: "b", label: "Supply pessary (insert manually, not via applicator) + external cream. Avoid oral fluconazole in pregnancy. Counsel on safety." }, { id: "c", label: "Oral fluconazole." }, { id: "d", label: "GP only." }
    ], correctOptionIds: ["b"], explanation: "Topical clotrimazole is preferred in pregnancy. Insert pessary manually (no applicator) to reduce mechanical risk. Oral fluconazole is contraindicated." },
    { id: "q-postmenopausal", type: "single-choice", critical: true, question: "62-year-old postmenopausal woman, first episode of vaginal itching/discharge. Action?", options: [
      { id: "a", label: "Supply combi — typical thrush." }, { id: "b", label: "Refer GP — atrophic vaginitis is a common mimic in postmenopausal women and would not respond to clotrimazole. Needs assessment." }, { id: "c", label: "Cream only." }, { id: "d", label: "Oral fluconazole." }
    ], correctOptionIds: ["b"], explanation: "Postmenopausal first episode = exclusion. Atrophic vaginitis is more likely than thrush in this age group." },
    { id: "q-latex", type: "single-choice", critical: true, question: "Patient asks if she can have sex while using the pessary. Counselling?", options: [
      { id: "a", label: "Yes, no restrictions." }, { id: "b", label: "Avoid sex until symptoms resolve. Clotrimazole damages latex — use non-latex contraception during and for 5 days after treatment if needed." }, { id: "c", label: "Use latex condom anyway." }, { id: "d", label: "Switch to oral." }
    ], correctOptionIds: ["b"], explanation: "Latex barrier methods (condoms, diaphragms) can be weakened by clotrimazole. Counsel on alternatives." },
    { id: "q-application", type: "single-choice", question: "Best time and method for pessary insertion?", options: [
      { id: "a", label: "Morning, standing." }, { id: "b", label: "At bedtime, lying down with knees bent, push pessary as far back as comfortable using applicator (or finger if pregnant). Wash hands before and after." }, { id: "c", label: "Anytime, sitting." }, { id: "d", label: "After shower, lying flat." }
    ], correctOptionIds: ["b"], explanation: "Bedtime + lying position prevents the pessary leaking out. Standard insertion technique." },
    { id: "q-cream-duration", type: "single-choice", question: "How long should the patient apply the external cream?", options: [
      { id: "a", label: "Just once after the pessary." }, { id: "b", label: "Twice a day to vulva for 3–7 days, continuing even after the pessary symptoms resolve, until vulval irritation has cleared." }, { id: "c", label: "1 week regardless of symptoms." }, { id: "d", label: "Until cream finishes." }
    ], correctOptionIds: ["b"], explanation: "Vulval skin recovery is slower than vaginal. Continue cream BD until skin symptoms resolve." },
    { id: "q-followup", type: "single-choice", question: "When should the patient return / seek further help?", options: [
      { id: "a", label: "Only if cream finishes." }, { id: "b", label: "If no improvement at 7 days, worsening symptoms, fever, abdominal pain, abnormal bleeding, or unusual discharge — refer GP / sexual health." }, { id: "c", label: "Never." }, { id: "d", label: "Annual check." }
    ], correctOptionIds: ["b"], explanation: "Standard safety-net advice with clear red flags for return / referral." },
    { id: "q-record", type: "single-choice", question: "Documentation requirements?", options: [
      { id: "a", label: "Label only." }, { id: "b", label: "Eligibility check, exclusion screen, products supplied (pessary brand + cream brand, batch + expiry), counselling given, latex warning, follow-up advice — in the ePGD tool." }, { id: "c", label: "Free-text only." }, { id: "d", label: "GP letter." }
    ], correctOptionIds: ["b"], explanation: "Standard PGD record requirements. Audit-critical." },
  ],
};
