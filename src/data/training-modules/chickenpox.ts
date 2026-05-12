// Chickenpox (varicella) vaccination — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const chickenpoxModule: TrainingModule = {
  slug: "chickenpox",
  title: "Chickenpox Vaccination — PGD",
  description: "Varicella vaccination of non-immune at-risk adults and contacts under PGD.",
  pgdSlugs: ["chickenpox"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Chickenpox Vaccination — Training", subtitle: "Varicella vaccine for non-immune adults at risk", estimatedMinutes: 10, objectives: [
      "Identify adult cohorts eligible (healthcare workers, household contacts of immunocompromised, non-immune adults pre-travel).",
      "Apply 2-dose schedule.",
      "Recognise live-vaccine contraindications.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Chickenpox in adults is more severe than in children — higher complication rates (pneumonia, encephalitis, severe disseminated disease). Vaccination of non-immune at-risk adults is recommended.",
      "Live attenuated varicella vaccine: 2 doses 4–8 weeks apart. >95% effective.",
      "From late 2025 the UK is rolling out routine childhood varicella vaccination — adults catching up are typically: healthcare workers, household contacts of immunocompromised, occupational exposure, non-immune adults pre-travel.",
    ], highlights: ["LIVE vaccine — pregnancy and immunosuppression contraindicated.", "2 doses, 4–8 weeks apart.", "Particularly important for non-immune HCWs and household contacts of immunocompromised."] },
    { id: "eligibility", type: "checklist", title: "Eligibility (adult cohorts)", intro: "Per Green Book chapter 34.", items: [
      { label: "Healthcare workers without immunity", detail: "Direct patient contact, with negative IgG serology or no documented history." },
      { label: "Household contacts of immunocompromised", detail: "Protects immunocompromised family member by reducing transmission." },
      { label: "Non-immune adults pre-travel or pre-procedure", detail: "Particularly travelling to areas with high exposure risk, or pre-transplant/biologic." },
      { label: "Significant exposure to chickenpox (post-exposure prophylaxis)", detail: "Within 3–5 days of exposure may prevent or attenuate disease in non-immune adult — refer GUM/GP for assessment." },
      { label: "Negative IgG serology preferred but not mandatory if no recall", detail: "Pre-vaccination IgG check is cost-effective in adults claiming history." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Absolute contraindications", tone: "danger", message: "Do not vaccinate.", detail: [
      "Pregnancy or plans for pregnancy within 1 month.",
      "Significant immunosuppression — live vaccine contraindicated.",
      "Previous anaphylaxis to varicella vaccine or component (neomycin, gelatin).",
      "Severe acute febrile illness.",
      "Recent (≤4 weeks) live vaccine.",
      "Recent (≤3 months) blood products or immunoglobulins.",
      "Active untreated TB.",
    ]},
    { id: "schedule-counselling", type: "checklist", title: "Schedule, administration, and counselling", items: [
      { label: "Dose 1", detail: "0.5 mL subcut into deltoid." },
      { label: "Dose 2", detail: "4–8 weeks after dose 1." },
      { label: "Pregnancy avoidance", detail: "Avoid conception for 1 month after vaccination." },
      { label: "Common side effects", detail: "Sore arm, mild fever, occasional rash 5–26 days post-vaccination (mild varicella-like)." },
      { label: "Contagion", detail: "Vaccine-strain virus can rarely transmit to household contacts via vaccine rash. Avoid close contact with immunocompromised, pregnant women, newborns if rash develops." },
      { label: "Document", detail: "Dose number, batch, site, expiry. NIMS upload." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "LIVE vaccine — pregnancy / immunosuppression contraindicated.",
      "2 doses 4–8 weeks apart, subcut.",
      "Adult cohorts: HCWs, household contacts of immunocompromised, non-immune at risk.",
      "Counsel: avoid conception 1 month, avoid close contact with vulnerable if rash develops.",
    ]},
  ],
  quiz: [
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant patient (non-immune HCW). Action?", options: [
      { id: "a", label: "Vaccinate now." }, { id: "b", label: "Defer until postpartum. Live vaccine contraindicated in pregnancy." }, { id: "c", label: "Half dose." }, { id: "d", label: "Subcut." }
    ], correctOptionIds: ["b"], explanation: "Live vaccine + pregnancy = contraindicated. Defer." },
    { id: "q-immuno", type: "single-choice", critical: true, question: "Patient on chemotherapy is a household contact of immunocompromised parent. Wants vaccine. Action?", options: [
      { id: "a", label: "Vaccinate." }, { id: "b", label: "Refer specialist. Patient himself is immunocompromised (on chemo); live vaccine contraindicated until immune recovery." }, { id: "c", label: "Half dose." }, { id: "d", label: "Inactivated." }
    ], correctOptionIds: ["b"], explanation: "Patient's own immunocompromise contraindicates live vaccine, regardless of household need. Specialist judgment for timing." },
    { id: "q-blood", type: "single-choice", critical: true, question: "Patient had IVIG 6 weeks ago. Wants varicella vaccine. Action?", options: [
      { id: "a", label: "Vaccinate now." }, { id: "b", label: "Defer — recent immunoglobulin (within 3 months minimum, sometimes longer) can neutralise live vaccine. GP/specialist advice on timing." }, { id: "c", label: "Half dose." }, { id: "d", label: "Subcut." }
    ], correctOptionIds: ["b"], explanation: "Passive antibody from blood products neutralises live vaccines. 3-month interval minimum." },
    { id: "q-route", type: "single-choice", question: "Administration route for varicella vaccine?", options: [
      { id: "a", label: "IM only." }, { id: "b", label: "Subcutaneous (deep subcut into deltoid) — standard route for varicella vaccine." }, { id: "c", label: "Oral." }, { id: "d", label: "Intradermal." }
    ], correctOptionIds: ["b"], explanation: "Varicella vaccine is given subcut, unlike most adult vaccines which are IM." },
    { id: "q-schedule", type: "single-choice", question: "Adult schedule?", options: [
      { id: "a", label: "Single dose." }, { id: "b", label: "2 doses, 4–8 weeks apart." }, { id: "c", label: "3 doses." }, { id: "d", label: "Annual boosters." }
    ], correctOptionIds: ["b"], explanation: "2-dose adult schedule, 4–8 weeks apart. No annual boosters." },
    { id: "q-egg-allergy", type: "single-choice", question: "Patient with egg allergy. Action?", options: [
      { id: "a", label: "Contraindicated." }, { id: "b", label: "Varicella vaccine is NOT egg-derived. Egg allergy is not a contraindication. Anaphylaxis to gelatin or neomycin (other components) is." }, { id: "c", label: "Half dose." }, { id: "d", label: "Refer." }
    ], correctOptionIds: ["b"], explanation: "Varicella vaccine doesn't use egg. Different excipient concerns (neomycin, gelatin)." },
    { id: "q-vaccine-rash", type: "single-choice", question: "Patient develops mild varicella-like rash 14 days post-vaccination. Action?", options: [
      { id: "a", label: "A&E." }, { id: "b", label: "Counsel: rare but recognised post-vaccination rash (vaccine-strain virus). Self-limiting, avoid close contact with immunocompromised, pregnant women, newborns until rash crusted." }, { id: "c", label: "Aciclovir." }, { id: "d", label: "Stop further doses." }
    ], correctOptionIds: ["b"], explanation: "Vaccine-strain rash is recognised. Mild, self-limiting; mainly relevant for theoretical transmission to vulnerable contacts." },
    { id: "q-post-exposure", type: "single-choice", question: "Non-immune adult exposed to chickenpox 4 days ago. Vaccinate today?", options: [
      { id: "a", label: "Always." }, { id: "b", label: "Refer GP/GUM — post-exposure vaccination within 3–5 days may attenuate disease. Specialist advice on optimal management (vaccination vs immunoglobulin)." }, { id: "c", label: "Already too late." }, { id: "d", label: "Inactivated alternative." }
    ], correctOptionIds: ["b"], explanation: "Post-exposure prophylaxis can include vaccination (within 3–5 days) or immunoglobulin (for high-risk contacts). Specialist judgment." },
    { id: "q-co-admin-live", type: "single-choice", question: "Patient had MMR 2 weeks ago. Wants varicella. Action?", options: [
      { id: "a", label: "Vaccinate today." }, { id: "b", label: "Wait 4 weeks from MMR before giving second live vaccine. Same-day administration of two live vaccines is acceptable, but separated administration needs 4-week interval." }, { id: "c", label: "Half dose." }, { id: "d", label: "Subcut." }
    ], correctOptionIds: ["b"], explanation: "Live vaccines: same day or 4-week separation. 2-week interval impairs second-vaccine response." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Eligibility cohort, prior history, IgG status if checked, dose number, batch/expiry, contraindications excluded, vaccine rash counselling — in the ePGD tool. NIMS upload." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record especially captures the cohort justification (HCW, household contact, etc.) and live-vaccine-specific counselling." },
  ],
};
