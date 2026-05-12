// Shingles (herpes zoster) treatment — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const shinglesTreatmentModule: TrainingModule = {
  slug: "shingles-treatment",
  title: "Shingles (Herpes Zoster) Treatment — PGD",
  description: "Oral antiviral therapy for adult shingles within 72 hours of onset under PGD.",
  pgdSlugs: ["shingles-treatment"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Shingles Treatment — Training", subtitle: "Oral aciclovir/valaciclovir for acute zoster", estimatedMinutes: 10, objectives: [
      "Recognise classic shingles presentation.",
      "Apply 72-hour treatment window.",
      "Recognise complicated zoster needing referral (ophthalmic, Ramsay-Hunt, disseminated).",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Shingles is VZV reactivation in dorsal root ganglion. Pain/burning prodrome 1–3 days, then unilateral dermatomal vesicular rash (any dermatome — most often thoracic).",
      "Early antiviral (within 72 hours of rash onset) reduces acute pain, accelerates healing, and reduces post-herpetic neuralgia (PHN) risk. Beyond 72 hours, benefit reduces — but treat if new lesions still appearing or ophthalmic/severe.",
      "Complications: PHN (older patients), ophthalmic zoster (sight-threatening), Ramsay-Hunt (facial palsy + ear vesicles), disseminated zoster (immunocompromised), motor zoster.",
    ], highlights: ["Antiviral within 72 hours of rash onset.", "Ophthalmic, Ramsay-Hunt, disseminated = urgent specialist.", "Older patients benefit most due to PHN reduction."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Adult, 50+", detail: "Younger adults can have shingles but less PHN risk; 50+ benefit most. Younger — refer GP." },
      { label: "Classic shingles presentation", detail: "Unilateral dermatomal rash, painful, vesicular, within 72 hours of onset (or new lesions still appearing)." },
      { label: "No complicated features", detail: "Eye involvement, facial palsy + ear vesicles, severe systemic illness, immunocompromised — refer." },
      { label: "Not pregnant or breastfeeding", detail: "Refer GP/midwife." },
      { label: "Not immunocompromised", detail: "Refer." },
      { label: "Not severe renal impairment", detail: "eGFR <30 — dose adjustment needed; refer." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Refer urgently", tone: "danger", message: "Complicated zoster.", detail: [
      "Ophthalmic zoster (V1 — forehead, eyelid, eye, nose tip = Hutchinson's sign). Urgent ophthalmology.",
      "Ramsay-Hunt syndrome: facial palsy + ear vesicles ± hearing loss. Urgent ENT/GP.",
      "Disseminated zoster (>20 lesions outside primary dermatome, multiple dermatomes, systemic illness) — usually immunocompromised, urgent assessment.",
      "Motor zoster — limb weakness with shingles — neurology.",
      "Severe pain not controlled by simple analgesia.",
      "Immunocompromised host (HIV, chemo, biologics).",
      "Pregnancy or breastfeeding.",
      "Children — refer.",
      "Severe renal impairment.",
    ]},
    { id: "treatment", type: "checklist", title: "Treatment regimens", intro: "Oral antiviral, 7-day course.", items: [
      { label: "Aciclovir 800 mg 5 times daily for 7 days", detail: "First-line, cheap. Frequent dosing can be adherence challenge." },
      { label: "Valaciclovir 1 g 3 times daily for 7 days", detail: "Alternative — better adherence with TDS dosing. Preferred in older patients." },
      { label: "Famciclovir 500 mg TDS for 7 days", detail: "Alternative — similar to valaciclovir." },
      { label: "Pain management", detail: "Paracetamol + ibuprofen first. Consider opioid for severe pain. Amitriptyline / gabapentin / pregabalin for PHN — usually GP-initiated." },
      { label: "Topical", detail: "Calamine for symptomatic relief. Don't apply topical antibiotics or steroids to lesions." },
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Timing", detail: "Within 72 hours of rash gives best benefit. Beyond 72h, still treat if new lesions appearing." },
      { label: "Contagion", detail: "Vesicle fluid contains live VZV. Can cause chickenpox in non-immune contacts (especially pregnant women, immunocompromised, neonates) but not shingles. Cover lesions, hand hygiene." },
      { label: "Hygiene", detail: "Don't share towels. Avoid scratching. Wash hands after touching." },
      { label: "Pain awareness", detail: "Acute pain can be severe — adequate analgesia. Persistent pain beyond rash healing = PHN (post-herpetic neuralgia); GP referral for specific neuropathic-pain agents." },
      { label: "Vaccination after recovery", detail: "Shingrix vaccination after current episode resolves (lesions crusted) prevents future episodes. Refer to shingles-vaccine PGD." },
      { label: "Red flags to return for", detail: "Eye involvement, ear vesicles + facial weakness, severe pain, lesions spreading widely, systemic illness, immunocompromised contact developing chickenpox." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Adult 50+ with classic dermatomal rash within 72 hours.",
      "Aciclovir 800 mg 5x/day OR valaciclovir 1 g TDS for 7 days.",
      "Refer: ophthalmic, Ramsay-Hunt, disseminated, immunocompromised, pregnancy, severe pain, motor zoster.",
      "Vesicles contagious — counsel hygiene around vulnerable contacts.",
      "Encourage Shingrix vaccination after recovery to prevent recurrence.",
    ]},
  ],
  quiz: [
    { id: "q-eye", type: "single-choice", critical: true, question: "Patient with shingles rash on forehead, eyelid, and nose tip. Action?", options: [
      { id: "a", label: "Aciclovir as standard." }, { id: "b", label: "Urgent ophthalmology — V1 ophthalmic zoster with Hutchinson's sign (nose tip) is sight-threatening. Needs slit-lamp exam and possibly IV antiviral." }, { id: "c", label: "Topical aciclovir." }, { id: "d", label: "Eye drops." }
    ], correctOptionIds: ["b"], explanation: "Ophthalmic zoster (V1 distribution, especially nose-tip Hutchinson's sign) requires ophthalmology — can scar cornea, cause uveitis, glaucoma." },
    { id: "q-ramsay-hunt", type: "single-choice", critical: true, question: "Patient has shingles vesicles in ear and facial weakness on the same side. Action?", options: [
      { id: "a", label: "Aciclovir." }, { id: "b", label: "Urgent ENT / GP — Ramsay-Hunt syndrome (facial nerve zoster). Needs high-dose antiviral + steroids for best chance of facial nerve recovery." }, { id: "c", label: "Painkiller." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Ramsay-Hunt = sight-threatening facial palsy. Time-critical for combined antiviral + steroid therapy. Specialist territory." },
    { id: "q-72-hours", type: "single-choice", critical: true, question: "Patient presents with shingles rash that started 4 days ago, lesions are crusting. Action?", options: [
      { id: "a", label: "Treat as standard 7-day course." }, { id: "b", label: "Beyond 72-hour window with lesions crusting (no new lesions) — limited antiviral benefit. Focus on analgesia, hygiene, vaccination after recovery. If still new lesions appearing, treat. If unsure, refer GP." }, { id: "c", label: "Higher-dose antiviral." }, { id: "d", label: "Topical." }
    ], correctOptionIds: ["b"], explanation: "Antiviral benefit reduces beyond 72 hours, especially once new lesions stop. Counsel on PHN risk and analgesia. Vaccine post-recovery." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant woman with new shingles rash. Action?", options: [
      { id: "a", label: "Standard antiviral." }, { id: "b", label: "Refer GP/midwife. Aciclovir is generally considered safe in pregnancy but pregnancy management of shingles needs proper care including potential VZIG for non-immune contacts." }, { id: "c", label: "Topical only." }, { id: "d", label: "Defer treatment." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy outside PGD. Aciclovir generally OK but pregnancy management is GP/midwife-led." },
    { id: "q-immunocompromised", type: "single-choice", critical: true, question: "Patient on chemotherapy has dermatomal vesicular rash. Action?", options: [
      { id: "a", label: "Standard oral aciclovir." }, { id: "b", label: "Refer urgently. Immunocompromised shingles risks dissemination and severe complications; may need higher-dose / IV antiviral, hospital observation." }, { id: "c", label: "Topical." }, { id: "d", label: "Defer." }
    ], correctOptionIds: ["b"], explanation: "Immunocompromised shingles is specialist territory. Risk of disseminated zoster, motor zoster, visceral involvement. IV antivirals often needed." },
    { id: "q-regimen", type: "single-choice", question: "First-line oral aciclovir dose?", options: [
      { id: "a", label: "200 mg 5x/day." }, { id: "b", label: "800 mg 5x/day for 7 days." }, { id: "c", label: "400 mg TDS." }, { id: "d", label: "Single 800 mg." }
    ], correctOptionIds: ["b"], explanation: "Acute shingles requires high dose: 800 mg 5x/day. Distinct from cold-sore HSV regimen (200 mg 5x/day)." },
    { id: "q-contagion", type: "single-choice", question: "Patient asks if she can visit her pregnant friend.", options: [
      { id: "a", label: "Yes, no risk." }, { id: "b", label: "No — vesicle fluid contains VZV. Pregnant non-immune contacts can develop chickenpox (and foetal varicella risk). Cover lesions, avoid contact until lesions crusted." }, { id: "c", label: "Yes if wearing mask." }, { id: "d", label: "Yes after antiviral started." }
    ], correctOptionIds: ["b"], explanation: "Shingles transmission to non-immune contacts (pregnant, immunocompromised) is a real risk. Avoid contact until crusted." },
    { id: "q-vaccine-after", type: "single-choice", question: "Patient asks about vaccine to prevent recurrence after current episode.", options: [
      { id: "a", label: "Vaccine doesn't prevent recurrence." }, { id: "b", label: "Shingrix recombinant zoster vaccine reduces recurrence risk. Vaccinate after current episode resolves (lesions crusted). Refer to shingles-vaccine PGD per age/cohort eligibility." }, { id: "c", label: "Daily aciclovir." }, { id: "d", label: "No prevention possible." }
    ], correctOptionIds: ["b"], explanation: "Shingrix post-recovery reduces recurrence. Don't vaccinate during active episode — defer to crusting." },
    { id: "q-pain", type: "single-choice", question: "Patient has severe burning pain despite paracetamol + ibuprofen 4 weeks after rash resolved. Action?", options: [
      { id: "a", label: "Reassure." }, { id: "b", label: "Refer GP — post-herpetic neuralgia (PHN). Needs neuropathic-pain agents (amitriptyline, gabapentin, pregabalin) and possibly specialist input. NICE NG46." }, { id: "c", label: "More antiviral." }, { id: "d", label: "Topical lidocaine alone." }
    ], correctOptionIds: ["b"], explanation: "PHN is post-zoster nerve pain. Standard analgesia insufficient; neuropathic-pain agents needed. GP-led." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Rash distribution (dermatome), time of onset, complicating features assessed and excluded, agent chosen, contagion counselling — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record demonstrates that ophthalmic, Ramsay-Hunt, disseminated were considered." },
  ],
};
