// Hayfever (allergic rhinitis) — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const hayfeverModule: TrainingModule = {
  slug: "hayfever",
  title: "Hayfever (Allergic Rhinitis) — PGD",
  description: "Eligibility and step-wise supply of intranasal steroids and second-generation antihistamines for moderate-severe allergic rhinitis under PGD.",
  pgdSlugs: ["hayfever"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Hayfever — Training", subtitle: "Allergic rhinitis: step-wise treatment under PGD", estimatedMinutes: 10, objectives: [
      "Differentiate allergic rhinitis from other causes of rhinitis.",
      "Apply a step-wise approach (OTC → INS + antihistamine → combination products → refer).",
      "Counsel on technique for intranasal steroid use and avoidance measures.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Allergic rhinitis is IgE-mediated inflammation of the nasal mucosa in response to allergens (pollen — seasonal; dust mites / pet dander — perennial). Symptoms: sneezing, rhinorrhoea, nasal itch, congestion, post-nasal drip; eye involvement common (itching, watering, redness).",
      "Affects ~20% of UK population. Major impact on sleep, school/work performance, asthma control. PGD step-up is for moderate-severe symptoms inadequately controlled by OTC medication.",
    ], highlights: ["Step 1: OTC oral antihistamine (loratadine, cetirizine, fexofenadine).", "Step 2: + intranasal corticosteroid (INS) e.g. mometasone, fluticasone.", "Step 3: combination product (azelastine/fluticasone) or short oral steroid (refer)."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Aged 18–65 (or 6+ for some agents — check SPC)", detail: "Younger children refer." },
      { label: "Diagnosed allergic rhinitis OR classic seasonal symptoms", detail: "Sudden severe nasal symptoms with fever or facial pain suggest sinusitis — refer." },
      { label: "Inadequate response to OTC oral antihistamine alone", detail: "Step up only if first-line tried adequately." },
      { label: "Not pregnant or breastfeeding", detail: "Refer to GP for safe regimen." },
      { label: "No nasal polyps or chronic sinusitis", detail: "Refer GP / ENT." },
      { label: "Concurrent asthma is well-controlled", detail: "If asthma poorly controlled, refer — asthma management changes." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Refer", tone: "danger", message: "Refer if any apply.", detail: [
      "Unilateral nasal symptoms or bleeding — exclude tumour, foreign body.",
      "Persistent facial pain / pressure / fever — sinusitis or other infection.",
      "Suspected nasal polyps (anosmia, persistent congestion not allergic).",
      "Recent nasal trauma or surgery.",
      "Pregnancy or breastfeeding — INS generally safe but defer.",
      "Children under the age range of chosen agent.",
      "Glaucoma or cataracts — long-term INS caution; refer.",
      "Severe asthma uncontrolled — combined management needed.",
    ]},
    { id: "treatment", type: "comparison", title: "Step-wise treatment", intro: "Match step to symptom severity.", columns: [
      { label: "Step 1 — Oral antihistamine", rows: [
        { heading: "First choice", body: "Loratadine 10 mg OD or cetirizine 10 mg OD (non-sedating). Fexofenadine 120 mg OD for adults if cetirizine inadequate." },
        { heading: "When", body: "Mild–moderate symptoms; PRN or continuous through pollen season." },
        { heading: "Counselling", body: "Best taken regularly, not just PRN, for predictable allergen exposure." },
      ]},
      { label: "Step 2 — Add intranasal corticosteroid", rows: [
        { heading: "First choice", body: "Mometasone 50 mcg one spray to each nostril once daily, OR fluticasone 50 mcg one spray to each nostril once daily." },
        { heading: "When", body: "Moderate symptoms not controlled on antihistamine alone. Start 2 weeks before expected exposure if seasonal." },
        { heading: "Counselling", body: "Technique critical (see next slide). Full benefit takes 1–2 weeks of regular use." },
      ]},
      { label: "Step 3 — Combination", rows: [
        { heading: "Option", body: "Azelastine/fluticasone combination nasal spray (Dymista), 1 spray each nostril BD." },
        { heading: "When", body: "Severe symptoms not controlled on step 2." },
        { heading: "If still inadequate", body: "Refer for consideration of short oral steroid course or specialist allergy referral." },
      ]},
    ]},
    { id: "technique", type: "checklist", title: "INS technique — counsel every patient", intro: "Poor technique is the commonest reason INS fails.", items: [
      { label: "Blow nose first", detail: "Clear mucus before spraying." },
      { label: "Tilt head slightly forward, not back", detail: "Prevents medication running down throat." },
      { label: "Use opposite hand to opposite nostril", detail: "Right hand → left nostril; angles the spray away from the septum (avoids septal irritation/bleeding)." },
      { label: "Aim away from septum", detail: "Toward outer wall of nostril. Sniff gently — don't snort hard." },
      { label: "Don't lean back after", detail: "Stay upright; don't blow nose for 5 minutes after." },
      { label: "Once-daily timing", detail: "Same time each day; build the routine." },
    ]},
    { id: "counselling", type: "checklist", title: "Counselling and avoidance", items: [
      { label: "Allergen avoidance — pollen", detail: "Check daily pollen count. Shower and change clothes after outdoor exposure. Close windows during peak pollen times. Wraparound sunglasses outdoors." },
      { label: "Allergen avoidance — house dust mite", detail: "Mattress and pillow covers, HEPA vacuum, hot wash bedding weekly. Reduce soft furnishings/carpet if possible." },
      { label: "Allergen avoidance — pets", detail: "Keep out of bedroom; HEPA filter; regular grooming." },
      { label: "Eye symptoms", detail: "Topical antihistamine eye drops (sodium cromoglicate OTC, azelastine, olopatadine) for itchy eyes." },
      { label: "Asthma awareness", detail: "Allergic rhinitis can worsen asthma. Encourage asthma review during hayfever season." },
      { label: "Driving / occupations", detail: "Sedating antihistamines (chlorphenamine) affect driving — avoid for non-sedating alternatives. Non-sedating still occasionally cause sleepiness — assess effect." },
    ]},
    { id: "red-flags", type: "callout", title: "Refer", tone: "danger", message: "Symptoms not consistent with simple hayfever.", detail: [
      "Unilateral symptoms or bleeding.",
      "Persistent facial pain or fever — sinusitis.",
      "Anosmia not explained by congestion.",
      "Vision changes (orbital cellulitis).",
      "Asthma deterioration.",
      "No response to step 3 — refer for allergy assessment.",
    ]},
    { id: "case-1", type: "case", title: "Case 1 — step-up", scenario: "Olivia, 32, perennial allergic rhinitis (dust mite). Has been on cetirizine 10 mg daily for 3 weeks with partial improvement only. Still has nasal congestion and post-nasal drip affecting sleep. No medication, no asthma.",
      question: "What's the supply?", answer: "Add mometasone 50 mcg one spray each nostril once daily. Continue cetirizine. Counsel on correct INS technique, that benefit takes 1–2 weeks of regular use. Review at 4 weeks; consider combination spray if inadequate.",
      rationale: "Standard step 2 — adding INS to antihistamine. Technique counselling is the key clinical input." },
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Step 1: OTC oral antihistamine. Step 2: + INS. Step 3: combination spray.",
      "INS takes 1–2 weeks of regular use — counsel on persistence.",
      "Technique: blow nose, tilt forward, opposite hand to opposite nostril, aim outward, gentle sniff.",
      "Refer: unilateral symptoms, fever / facial pain, anosmia, eye complications, asthma deterioration.",
      "Pregnancy and severe asthma — refer GP.",
    ]},
  ],
  quiz: [
    { id: "q-unilateral", type: "single-choice", critical: true, question: "Patient describes persistent unilateral nasal blockage and occasional bleeding from one nostril. Action?", options: [
      { id: "a", label: "Supply INS." }, { id: "b", label: "Refer to GP / ENT — unilateral symptoms with bleeding warrant exclusion of tumour, foreign body, polyp." }, { id: "c", label: "Supply antihistamine." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Unilateral nasal symptoms — particularly with bleeding — need ENT assessment, not hayfever treatment." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant patient with severe hayfever. Action?", options: [
      { id: "a", label: "Supply mometasone INS." }, { id: "b", label: "Refer to GP/midwife. Most INS are pregnancy-safe but defer for proper antenatal review." }, { id: "c", label: "Supply only saline rinses." }, { id: "d", label: "Refuse all treatment." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy is outside the PGD. Mometasone has good pregnancy safety data but should be initiated by GP/midwife in pregnancy." },
    { id: "q-asthma", type: "single-choice", critical: true, question: "Patient with asthma reports worsening control alongside hayfever. Action?", options: [
      { id: "a", label: "Supply INS for hayfever, ignore asthma." }, { id: "b", label: "Refer to GP for asthma review. Allergic rhinitis frequently worsens asthma; coordinated management needed." }, { id: "c", label: "Supply double-strength salbutamol." }, { id: "d", label: "Stop all hayfever treatments." }
    ], correctOptionIds: ["b"], explanation: "Asthma exacerbations in hayfever season are common and need GP review. Don't manage the rhinitis in isolation." },
    { id: "q-technique", type: "single-choice", critical: true, question: "Patient on INS for 2 weeks has only mild improvement. Most likely cause?", options: [
      { id: "a", label: "Wrong agent — switch to fluticasone." }, { id: "b", label: "Poor technique — check she's tilting forward, opposite hand to opposite nostril, aiming away from septum." }, { id: "c", label: "Drug resistance." }, { id: "d", label: "Allergy progression." }
    ], correctOptionIds: ["b"], explanation: "Poor INS technique is the leading cause of treatment failure. Review and re-counsel before changing agent." },
    { id: "q-step", type: "single-choice", question: "Patient hasn't tried any treatment. Symptoms moderate. First step?", options: [
      { id: "a", label: "Combination spray." }, { id: "b", label: "OTC oral antihistamine (loratadine or cetirizine) regularly — Step 1." }, { id: "c", label: "Oral steroid." }, { id: "d", label: "INS straight away." }
    ], correctOptionIds: ["b"], explanation: "Step-wise approach: oral antihistamine first. Step up to INS only if inadequate." },
    { id: "q-sedating", type: "single-choice", question: "Patient asks if chlorphenamine is OK for daily hayfever in a working adult.", options: [
      { id: "a", label: "Yes, it's effective." }, { id: "b", label: "Avoid sedating antihistamines like chlorphenamine for daily use in working adults — impairs driving and cognition. Use non-sedating (loratadine, cetirizine, fexofenadine)." }, { id: "c", label: "Use chlorphenamine at half dose." }, { id: "d", label: "Use only at night." }
    ], correctOptionIds: ["b"], explanation: "First-generation antihistamines are sedating and impair driving and cognition. Use non-sedating second-generation for daily symptomatic management." },
    { id: "q-pollen-timing", type: "single-choice", question: "Patient wants to maximise hayfever prevention for grass pollen season. When to start INS?", options: [
      { id: "a", label: "When symptoms appear." }, { id: "b", label: "Two weeks before expected exposure. INS takes 1–2 weeks to build effect; starting early gives peak benefit when pollen rises." }, { id: "c", label: "Six months ahead." }, { id: "d", label: "Only when worst-affected." }
    ], correctOptionIds: ["b"], explanation: "INS efficacy builds over 1–2 weeks. Starting before symptoms hit gives better control through the season." },
    { id: "q-anosmia", type: "single-choice", question: "Patient reports complete loss of smell for 6 weeks, no other symptoms. Action?", options: [
      { id: "a", label: "Supply INS for likely allergic cause." }, { id: "b", label: "Refer to GP/ENT — anosmia without clear allergic context can be polyps, post-viral, neurological. Needs assessment." }, { id: "c", label: "Supply combination spray." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Persistent anosmia needs proper assessment. Polyps, post-viral, neurological causes need investigation." },
    { id: "q-eye", type: "single-choice", question: "Patient's main complaint is itchy watery eyes. What's appropriate?", options: [
      { id: "a", label: "INS only." }, { id: "b", label: "Topical antihistamine eye drops (sodium cromoglicate OTC, azelastine, olopatadine) ± oral antihistamine. INS doesn't help eyes much." }, { id: "c", label: "Refer to ophthalmology." }, { id: "d", label: "Oral steroid." }
    ], correctOptionIds: ["b"], explanation: "Topical eye drops target conjunctival symptoms. Oral antihistamines help systemic symptoms. INS is for nasal." },
    { id: "q-record", type: "single-choice", question: "Required documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Severity, previous treatments tried, step chosen with rationale, technique counselling delivered, follow-up plan — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record demonstrates step-wise prescribing. Important for INS audit because technique counselling is often the difference between success and failure." },
  ],
};
