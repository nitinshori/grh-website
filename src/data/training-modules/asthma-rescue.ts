// Asthma rescue inhaler (emergency salbutamol supply) — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const asthmaRescueModule: TrainingModule = {
  slug: "asthma-rescue",
  title: "Asthma Rescue (Salbutamol Emergency Supply) — PGD",
  description: "Emergency supply of salbutamol inhaler for known asthmatic without immediate access to their prescription.",
  pgdSlugs: ["asthma-rescue"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Asthma Rescue — Training", subtitle: "Emergency salbutamol supply for known asthmatic patients", estimatedMinutes: 10, objectives: [
      "Identify patients eligible for emergency salbutamol supply under the PGD.",
      "Recognise an acute asthma attack and apply appropriate referral.",
      "Counsel on inhaler technique, MART vs SABA-only regimes, and the need for proper GP review.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Salbutamol short-acting beta-agonist (SABA) is widely used as a reliever inhaler. Modern guidance (BTS/SIGN/NICE/GINA) increasingly recommends MART (maintenance and reliever therapy with an ICS-formoterol inhaler) rather than SABA-only, due to mortality data on SABA over-reliance.",
      "Emergency supply PGD covers patients who have run out, lost, or been unable to access their usual reliever, and need a single short-term supply to bridge until GP appointment. Not for first-time asthmatics — those must be diagnosed first.",
    ], highlights: ["Use of >2 SABA inhalers per month is a marker of poor asthma control — refer.", "Modern guidance favours MART over SABA-only for many patients.", "Acute severe attack = 999, not pharmacy supply."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Aged 12+", detail: "Younger children — refer to GP/urgent care, paediatric assessment." },
      { label: "Known asthmatic", detail: "Not first-time. Has been previously prescribed a SABA. PGD does NOT cover initial diagnosis or prescription." },
      { label: "Currently controlled enough to be managing day-to-day", detail: "Not in an acute attack now. If acutely unwell, refer / call ambulance." },
      { label: "Lost / run out / left at home / on travel", detail: "Genuine bridging need, not regular substitute for GP supply." },
      { label: "Not had >2 SABA inhalers in past month", detail: "Over-use signals poor control; refer GP for review." },
      { label: "No red flags currently (see next slide)", detail: "Hospital admission within 12 months for asthma, recent oral steroid course, or current acute symptoms — refer." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "When NOT to supply", tone: "danger", message: "Refer to GP / urgent care / 999.", detail: [
      "Currently in an acute asthma attack — see red-flag slide.",
      "First-time wheezer / undiagnosed.",
      "Recent (≤4 weeks) hospital admission for asthma — refer GP urgently.",
      "Recent oral steroid course (≤4 weeks) — asthma poorly controlled, needs review.",
      "Multiple SABA inhalers used in past month — over-reliance is a mortality marker.",
      "Patient describes worsening control over the last few weeks — refer for proper review.",
      "Children under 12 — refer.",
    ]},
    { id: "acute-recognition", type: "callout", title: "Recognising acute asthma — call 999", tone: "danger", message: "Acute asthma attack signs.", detail: [
      "Severe: can't complete sentences in one breath, RR ≥25 (adult), HR ≥110, PEF 33–50% best/predicted.",
      "Life-threatening: silent chest, cyanosis, exhaustion, confusion, PEF <33%, SpO2 <92%, hypotension, bradycardia.",
      "ACTION: 999 / A&E. While waiting: salbutamol 10 puffs via spacer, oxygen if available, sit upright.",
      "Don't be reassured by 'silent chest' — it indicates severe airflow obstruction, NOT improvement.",
    ]},
    { id: "supply", type: "checklist", title: "Supply rules", intro: "Conditions of emergency supply.", items: [
      { label: "Salbutamol 100 mcg MDI — one inhaler", detail: "Up to one inhaler as bridging. Not the patient's regular ongoing supply." },
      { label: "Strongly encourage GP appointment", detail: "Within days — for review of underlying control." },
      { label: "Inform GP via the standard emergency-supply notification", detail: "Document the supply and notification in the ePGD tool." },
      { label: "Spacer if appropriate", detail: "MDI without spacer has poor lung delivery for many users. Encourage spacer use; PGD may include a spacer supply if available." },
      { label: "Check inhaler technique", detail: "Many asthmatics use MDI poorly. Use the consultation to demonstrate." },
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Inhaler technique", detail: "Shake. Breathe out. Mouthpiece in mouth, lips sealed. Start slow inhalation as you press the canister. Continue slow inhalation. Hold breath 10 seconds. Wait ≥30 seconds before second puff." },
      { label: "Spacer benefits", detail: "Improves drug delivery, especially during attack or for poor technique. Strongly recommend." },
      { label: "Reliever overuse warning", detail: "Using a SABA >3 times a week is a marker of poor control. Needs GP review for preventer or MART approach." },
      { label: "Action plan", detail: "Encourage personalised written asthma action plan via GP. Includes when to step up, when to seek help, when to call 999." },
      { label: "Trigger awareness", detail: "Cold air, exercise, allergens, infections, NSAIDs (some patients). Adjust environment where possible." },
      { label: "Smoking cessation", detail: "If relevant — single most important intervention." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Emergency bridging supply only — not regular substitute for GP prescription.",
      "Acute attack = 999. Silent chest = severe.",
      ">2 inhalers/month or recent admission/steroids = refer, don't supply.",
      "Check inhaler technique at every supply — most patients use MDI poorly.",
      "Strongly encourage GP review for control, action plan, MART consideration.",
    ]},
  ],
  quiz: [
    { id: "q-acute", type: "single-choice", critical: true, question: "Patient walks in unable to complete a sentence, RR 28, looks distressed. Says they need their inhaler. Action?", options: [
      { id: "a", label: "Supply one inhaler urgently." }, { id: "b", label: "Call 999 immediately. Give 10 puffs of salbutamol via spacer while waiting. Sit upright. This is a severe acute asthma attack — needs hospital management." }, { id: "c", label: "Refer to GP." }, { id: "d", label: "Tell to use someone else's." }
    ], correctOptionIds: ["b"], explanation: "Severe acute asthma is a 999 call. Pharmacy can provide initial bronchodilator while ambulance arrives, but the destination is A&E, not just a new inhaler." },
    { id: "q-over-use", type: "single-choice", critical: true, question: "Patient says she's been getting through 3 inhalers a month for several months. Wants another emergency supply. Action?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Do not supply emergency PGD. Over-use of SABA (>2 inhalers/month) is a mortality risk signal. Refer to GP urgently for asthma review — likely needs preventer or MART therapy." }, { id: "c", label: "Supply 2 inhalers." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "SABA over-reliance is associated with asthma mortality. Don't enable continued over-use; refer for proper review." },
    { id: "q-recent-admission", type: "single-choice", critical: true, question: "Patient was admitted to hospital with asthma 2 weeks ago, on oral steroids since. Wants emergency supply. Action?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Refer urgently to GP — recent admission and oral steroids signal poor control needing urgent review, not bridging supply." }, { id: "c", label: "Supply at half dose." }, { id: "d", label: "Refer A&E." }
    ], correctOptionIds: ["b"], explanation: "Recent hospital admission + oral steroids means the asthma is unstable and needs proper review, not emergency supply." },
    { id: "q-first-ever", type: "single-choice", critical: true, question: "Patient describes wheezing for the first time, never been diagnosed with asthma. Wants an inhaler. Action?", options: [
      { id: "a", label: "Supply salbutamol." }, { id: "b", label: "Refer to GP. First-time wheeze needs diagnosis (spirometry, history) — could be asthma, COPD, infection, or other. PGD is for established asthmatics only." }, { id: "c", label: "Supply if BP normal." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "PGD doesn't cover initial diagnosis. First wheezer needs proper assessment." },
    { id: "q-silent-chest", type: "single-choice", critical: true, question: "Acutely unwell asthmatic — patient is quiet, you can't hear wheeze on listening. What does this mean?", options: [
      { id: "a", label: "He's improving — wheeze has resolved." }, { id: "b", label: "Silent chest is a sign of SEVERE airway obstruction. Air movement is too poor to generate wheeze. Immediate 999." }, { id: "c", label: "Asthma resolved." }, { id: "d", label: "Mild attack." }
    ], correctOptionIds: ["b"], explanation: "Silent chest = severe. No air movement = no wheeze. The most dangerous sign. 999 immediately." },
    { id: "q-technique", type: "single-choice", question: "Why is inhaler technique counselling important at every supply?", options: [
      { id: "a", label: "It's a regulatory requirement only." }, { id: "b", label: "Up to 70% of asthmatics use their MDI poorly, getting only a fraction of the dose to the lung. Improving technique can be more impactful than changing drugs." }, { id: "c", label: "It's optional." }, { id: "d", label: "Only matters for spacer users." }
    ], correctOptionIds: ["b"], explanation: "Technique is the most under-addressed aspect of asthma care. Every encounter is an opportunity." },
    { id: "q-spacer", type: "single-choice", question: "Patient asks if she should use a spacer with her salbutamol.", options: [
      { id: "a", label: "Spacers are for children only." }, { id: "b", label: "Spacers improve lung delivery substantially, especially during attacks and for users with poor technique. Strongly recommend." }, { id: "c", label: "Spacers reduce dose." }, { id: "d", label: "Only with steroid inhalers." }
    ], correctOptionIds: ["b"], explanation: "Spacers improve lung deposition for all ages. Essential during acute attacks." },
    { id: "q-children", type: "single-choice", question: "10-year-old boy, known asthmatic, lost his inhaler. Action?", options: [
      { id: "a", label: "Supply emergency salbutamol." }, { id: "b", label: "Refer to GP or urgent care. Under 12 is outside PGD scope." }, { id: "c", label: "Supply paediatric dose." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Paediatric asthma management is outside this PGD." },
    { id: "q-mart", type: "single-choice", question: "Patient is on a SABA-only regimen (no preventer) and wants emergency supply for the second time this season. Action?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Supply if eligible AND refer to GP for review — SABA-only management is no longer first-line for adult asthma; consider MART (ICS-formoterol) for both maintenance and reliever, per current BTS/SIGN/GINA guidance." }, { id: "c", label: "Refuse outright." }, { id: "d", label: "Supply two inhalers." }
    ], correctOptionIds: ["b"], explanation: "Current guidance favours MART over SABA-only. Pattern of repeated emergency SABA supply suggests undermanaged disease — refer for proper regimen." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Acute features assessed and excluded, frequency of SABA use, hospital/steroid history, technique counselled, GP notification — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Documentation captures the clinical decision and the GP notification — essential for emergency supply audit." },
  ],
};
