// Yellow fever vaccination — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const yellowFeverModule: TrainingModule = {
  slug: "yellow-fever",
  title: "Yellow Fever Vaccination — PGD",
  description: "Yellow fever vaccination administration at designated yellow-fever vaccination centre under PGD.",
  pgdSlugs: ["yellow-fever"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Yellow Fever — Training", subtitle: "Live attenuated vaccine + ICVP certificate at designated centres only", estimatedMinutes: 10, objectives: [
      "Recognise that yellow fever can ONLY be administered at designated Yellow Fever Vaccination Centres (YFVCs).",
      "Apply correct eligibility and live-vaccine contraindications.",
      "Issue valid ICVP (International Certificate of Vaccination or Prophylaxis).",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Yellow fever is a flavivirus endemic in tropical Africa and parts of South America. Causes acute viral haemorrhagic illness, 30%+ mortality in severe cases. No specific treatment.",
      "Stamaril is a live attenuated vaccine, single dose providing lifetime protection per WHO. Highly effective but contraindications are stringent — risks include rare viscerotropic disease (mortality higher in older patients).",
      "UK administration restricted to designated Yellow Fever Vaccination Centres (YFVCs). Only YFVC-trained staff can issue valid International Certificate of Vaccination or Prophylaxis (ICVP).",
      "Many destinations require ICVP for entry — Sub-Saharan Africa and tropical South America especially.",
    ], highlights: ["Only designated YFVCs can administer.", "ICVP valid 10 days–lifetime (per WHO 2016 update).", "Live vaccine — strict contraindications, especially age >60 first dose."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply AND pharmacy is a designated YFVC:", items: [
      { label: "Travel to yellow-fever-endemic area OR entry-requirement country", detail: "Check WHO yellow fever maps and TravelHealthPro for current requirements." },
      { label: "Adult ≥9 months", detail: "Per Green Book; specialist care for very young children." },
      { label: "Not pregnant or breastfeeding (relative)", detail: "Live vaccine — defer unless very high exposure risk. Specialist input." },
      { label: "Not immunocompromised", detail: "Live vaccine — contraindicated. Specialist if high exposure risk." },
      { label: "Not over age 60 having first-ever dose", detail: "Rare viscerotropic disease (YEL-AVD) more common in older first-time recipients. Reasonable refusal of vaccination is acceptable if risk > benefit; alternative is exemption certificate." },
      { label: "Pharmacy is a designated YFVC", detail: "Without YFVC status, refer to a designated centre — cannot administer under this PGD." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Contraindications", tone: "danger", message: "Do not vaccinate; consider exemption certificate if needed.", detail: [
      "Immunocompromise (HIV with low CD4, chemotherapy, biologics, transplant, congenital).",
      "Severe egg allergy (anaphylaxis) — refer for specialist desensitisation if essential.",
      "Pregnancy and breastfeeding — relative; specialist input.",
      "Children <9 months.",
      "Adults >60 first-ever dose — relative; risk-benefit discussion.",
      "Anaphylaxis to vaccine component.",
      "Severe acute febrile illness.",
      "Thymus disorder history (thymectomy, thymoma, myasthenia with thymectomy) — viscerotropic disease risk.",
      "Recent live vaccine within 4 weeks.",
    ]},
    { id: "administration", type: "checklist", title: "Administration (at YFVC only)", items: [
      { label: "Stamaril 0.5 mL subcut or IM into deltoid", detail: "Live attenuated vaccine. Reconstituted per SmPC; use within 30 minutes." },
      { label: "ICVP issuance", detail: "Yellow card per WHO format. Valid from day 10 post-vaccination; lifetime per WHO 2016 unless revaccination indicated by patient factors." },
      { label: "Patient kept for ≥30-minute post-vaccination observation", detail: "Longer than other vaccines due to live nature and rare severe adverse events." },
      { label: "Co-administration with other vaccines", detail: "Same day same visit or separated by ≥4 weeks (live-vaccine rule)." },
      { label: "Counsel", detail: "Mild flu-like illness 3–14 days post-vaccination common. Severe reactions rare but real (YEL-AVD, YEL-AND) — counsel honestly." },
    ]},
    { id: "exemption-certificate", type: "callout", title: "Exemption certificate", tone: "info", message: "For patients with contraindications travelling to mandatory-ICVP countries.", detail: [
      "If patient has contraindication AND travelling to country with mandatory entry requirement, issue a medical exemption certificate (signed by YFVC clinician).",
      "Document the contraindication.",
      "Patient should also carry written supporting documentation from their travel-medicine clinic.",
      "Even with exemption, some countries may refuse entry — patient must understand the risk and have travel insurance covering it.",
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "ONLY designated YFVCs can administer yellow fever vaccine.",
      "Single dose live attenuated, lifetime protection per WHO 2016.",
      "ICVP valid from day 10 post-vaccination.",
      "Contraindications: immunocompromise, severe egg allergy, pregnancy, age >60 first dose (relative), thymus disorder.",
      "Exemption certificate available for genuine contraindications.",
      "Counsel honestly on rare severe adverse events.",
    ]},
  ],
  quiz: [
    { id: "q-yfvc", type: "single-choice", critical: true, question: "Patient wants yellow fever vaccination at your community pharmacy. Pharmacy is not a designated YFVC. Action?", options: [
      { id: "a", label: "Administer anyway." }, { id: "b", label: "Refer to a designated Yellow Fever Vaccination Centre — only YFVCs can administer yellow fever vaccine and issue valid ICVP." }, { id: "c", label: "Give certificate only." }, { id: "d", label: "Half dose." }
    ], correctOptionIds: ["b"], explanation: "YFVC designation is mandatory. Non-designated pharmacies cannot administer YF vaccine or issue ICVP." },
    { id: "q-immuno", type: "single-choice", critical: true, question: "Patient on rituximab needs yellow fever for Brazil trip. Action?", options: [
      { id: "a", label: "Vaccinate." }, { id: "b", label: "Contraindicated — live vaccine + significant immunosuppression. Refer specialist travel-medicine. Issue exemption certificate if travel essential, or consider rescheduling." }, { id: "c", label: "Half dose." }, { id: "d", label: "Inactivated." }
    ], correctOptionIds: ["b"], explanation: "Live vaccine + immunosuppression = contraindicated. Specialist for risk-benefit, exemption certificate if travel essential." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant woman travelling to yellow-fever-endemic country. Action?", options: [
      { id: "a", label: "Vaccinate." }, { id: "b", label: "Refer specialist travel clinic. Live vaccine in pregnancy is contraindicated relative; if exposure risk is high, specialist may proceed with informed consent or consider exemption." }, { id: "c", label: "Half dose." }, { id: "d", label: "Defer." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy + live vaccine = specialist context. Risk-benefit balance and exemption certificate options need specialist input." },
    { id: "q-age-60", type: "single-choice", critical: true, question: "65-year-old, never had yellow fever vaccine, planning trip to Ghana. Action?", options: [
      { id: "a", label: "Vaccinate normally." }, { id: "b", label: "Discuss risk-benefit honestly — viscerotropic disease (YEL-AVD) is rare but more common in first-time recipients >60. Lifetime risk should be weighed against trip benefit. Patient autonomy guides decision; document discussion. Reasonable to refuse if low-exposure trip." }, { id: "c", label: "Half dose." }, { id: "d", label: "Multiple doses." }
    ], correctOptionIds: ["b"], explanation: "Age >60 first dose has elevated YEL-AVD risk. Risk-benefit discussion is mandatory. Both vaccination and refusal are valid options depending on trip risk." },
    { id: "q-egg", type: "single-choice", critical: true, question: "Severe egg allergy (anaphylaxis). Yellow fever?", options: [
      { id: "a", label: "Vaccinate." }, { id: "b", label: "Contraindicated under standard PGD — yellow fever vaccine grown in egg embryos. Refer for specialist desensitisation if essential, or issue exemption." }, { id: "c", label: "Half dose." }, { id: "d", label: "Pre-medicate." }
    ], correctOptionIds: ["b"], explanation: "Yellow fever vaccine is egg-derived. Severe egg allergy = contraindication. Specialist desensitisation possible if travel essential." },
    { id: "q-validity", type: "single-choice", question: "ICVP validity per WHO 2016?", options: [
      { id: "a", label: "10 years." }, { id: "b", label: "Lifetime (valid 10 days–lifetime). Some patient groups need re-vaccination per local guidance (children, immunocompromised, pregnancy at time of original dose, HIV)." }, { id: "c", label: "1 year." }, { id: "d", label: "5 years." }
    ], correctOptionIds: ["b"], explanation: "WHO 2016 update — ICVP is lifetime. Re-vaccination only in specific patient groups." },
    { id: "q-when-valid", type: "single-choice", question: "When does the ICVP become valid for entry?", options: [
      { id: "a", label: "Immediately." }, { id: "b", label: "10 days after vaccination." }, { id: "c", label: "Day of travel." }, { id: "d", label: "After 4 weeks." }
    ], correctOptionIds: ["b"], explanation: "ICVP valid from day 10. Counsel patient on timing relative to flight." },
    { id: "q-recent-live", type: "single-choice", question: "Patient had MMR 2 weeks ago. Yellow fever today?", options: [
      { id: "a", label: "Administer today." }, { id: "b", label: "Wait — live vaccines need same-day or ≥4 weeks separation. Defer 2 more weeks." }, { id: "c", label: "Half dose." }, { id: "d", label: "Subcut alternative." }
    ], correctOptionIds: ["b"], explanation: "Live vaccines: same day or ≥4 weeks apart." },
    { id: "q-exemption", type: "single-choice", question: "Patient with valid contraindication travelling to country with mandatory ICVP. Action?", options: [
      { id: "a", label: "Cancel trip." }, { id: "b", label: "Issue medical exemption certificate signed by YFVC clinician documenting contraindication. Some countries may still refuse entry — patient must understand the risk." }, { id: "c", label: "Vaccinate anyway." }, { id: "d", label: "Half dose plus exemption." }
    ], correctOptionIds: ["b"], explanation: "Exemption certificate is the formal route for contraindicated patients. Patient still needs to understand entry risk." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Eligibility, destination, ICVP issued (or exemption with rationale), batch, expiry, site, 30-minute observation, counselling on rare adverse events — in the ePGD tool. NIMS upload." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "YFVC records must include ICVP issuance details, contraindication assessment, and observation period. Audit-critical." },
  ],
};
