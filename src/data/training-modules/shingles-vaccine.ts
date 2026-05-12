// Shingles vaccine (Shingrix) — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const shinglesVaccineModule: TrainingModule = {
  slug: "shingles-vaccine",
  title: "Shingles Vaccination (Shingrix) — PGD",
  description: "Eligibility, administration and counselling for the Shingrix recombinant zoster vaccine under PGD.",
  pgdSlugs: ["shingles-vaccine"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Shingles Vaccination — Training", subtitle: "Shingrix recombinant zoster vaccine (RZV)", estimatedMinutes: 10, objectives: [
      "Identify eligible cohorts for Shingrix under the current Green Book schedule.",
      "Apply the 2-dose schedule correctly with appropriate interval.",
      "Counsel on side effects (reactogenicity is significant), and recognise anaphylaxis.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Shingles (herpes zoster) results from reactivation of varicella-zoster virus (VZV) latent in dorsal root ganglia after chickenpox. Risk rises with age and immunosuppression. Complications include postherpetic neuralgia (PHN), ocular zoster, ramsay-hunt syndrome.",
      "Shingrix (RZV — recombinant zoster vaccine) is a non-live subunit vaccine with adjuvant. Highly effective (>90% efficacy against zoster and PHN). Has largely replaced the older live Zostavax (which can't be used in immunocompromised).",
      "UK programme: routine offer at age 65 (or 60–69 immunocompromised) plus catch-up of 70–79 olds, plus immunocompromised adults aged 18+. Two doses, 8 weeks to 6 months apart.",
    ], highlights: ["Two doses, separated by 8 weeks – 6 months.", "Live Zostavax replaced by non-live Shingrix.", "Safe in immunocompromised (unlike Zostavax)."] },
    { id: "eligibility", type: "checklist", title: "Eligibility (typical Green Book cohorts)", intro: "Check current Green Book chapter 28a for any updates.", items: [
      { label: "Age 65 (routine)", detail: "Eligible from 65th birthday." },
      { label: "Age 70–79 (catch-up)", detail: "Catch-up cohort for those who missed initial Zostavax programme. Time-limited; check current letter." },
      { label: "Immunocompromised adults aged 18+", detail: "Recipients of HSCT or solid-organ transplant, on biological therapy (e.g. rituximab), HIV, certain haematological cancers. Use Shingrix only — never live Zostavax in this group." },
      { label: "Second-dose interval", detail: "Immunocompetent: 8 weeks – 6 months after first. Immunocompromised: 8 weeks – 6 months but generally as soon as practicable." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Contraindications", tone: "danger", message: "Do not vaccinate.", detail: [
      "Previous anaphylaxis to Shingrix or any component.",
      "Severe acute febrile illness today — postpone.",
      "Pregnancy — avoid (lack of data); defer until postpartum.",
      "Breastfeeding — case-by-case; generally avoided unless high indication.",
      "Active shingles episode — defer until acute episode has resolved (typically wait until lesions crusted).",
    ]},
    { id: "administration", type: "checklist", title: "Administration", items: [
      { label: "Reconstitution", detail: "Mix the vial of antigen with the vial of adjuvant suspension per SmPC. Use within 6 hours (refrigerated) or 30 minutes (room temp)." },
      { label: "Site", detail: "Deltoid IM." },
      { label: "Needle", detail: "23G 25mm (blue) standard adult." },
      { label: "Dose", detail: "0.5 mL IM. First dose then second dose 8 weeks – 6 months later." },
      { label: "Post-vaccination observation", detail: "15 minutes minimum. Anaphylaxis preparedness." },
      { label: "Co-administration", detail: "Can be given with flu vaccine same day (different deltoids), or any other inactivated vaccine. Spacing not required from live vaccines either." },
    ]},
    { id: "side-effects", type: "checklist", title: "Side effects — counsel pre-emptively", intro: "Shingrix is significantly more reactogenic than most vaccines.", items: [
      { label: "Local reactions (common)", detail: "Pain at injection site (~75% of patients), redness, swelling. Can be significant — pre-warn patient." },
      { label: "Systemic reactions (common)", detail: "Fatigue (~45%), myalgia (~45%), headache (~35%), fever, shivering, GI symptoms. Usually peak 24–48h, settle by 72h." },
      { label: "Pre-empt the second dose", detail: "Many patients hesitate after a reactogenic first dose. Reassure: reactions are expected, transient, and the second dose is essential for protection." },
      { label: "Analgesia", detail: "Paracetamol / ibuprofen acceptable for symptom relief. Doesn't reduce vaccine efficacy." },
      { label: "Rare — severe allergy / anaphylaxis", detail: "Standard protocol if it happens." },
      { label: "Severe local reaction extending past joint, persistent fever >48h, or any concerning symptom — review", detail: "" },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Routine at age 65 + catch-up 70–79 + immunocompromised 18+.",
      "Two doses, 8 weeks – 6 months apart.",
      "Highly reactogenic — pre-warn patient.",
      "Safe in immunocompromised (unlike older Zostavax).",
      "Don't vaccinate during active shingles — wait until resolved.",
      "Document batch and site every time.",
    ]},
  ],
  quiz: [
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant patient eligible by age for Shingrix. Action?", options: [
      { id: "a", label: "Vaccinate." }, { id: "b", label: "Defer until postpartum — lack of pregnancy safety data. Pregnancy not an absolute contraindication for non-live vaccines but typically deferred." }, { id: "c", label: "Vaccinate first trimester only." }, { id: "d", label: "Vaccinate third trimester." }
    ], correctOptionIds: ["b"], explanation: "Without robust pregnancy safety data, defer to postpartum. Eligibility by age remains valid." },
    { id: "q-immunocompromised", type: "single-choice", critical: true, question: "Patient on rituximab for lymphoma is eligible for Shingrix. Vaccine choice?", options: [
      { id: "a", label: "Zostavax." }, { id: "b", label: "Shingrix (RZV) — non-live, safe in immunocompromised. Zostavax is live and contraindicated." }, { id: "c", label: "Neither vaccine in immunocompromised." }, { id: "d", label: "Half dose." }
    ], correctOptionIds: ["b"], explanation: "Shingrix replaced Zostavax precisely because it's non-live and safe in immunocompromised. Zostavax is contraindicated in this group." },
    { id: "q-active-shingles", type: "single-choice", critical: true, question: "Patient eligible by age, currently has active shingles rash. Action?", options: [
      { id: "a", label: "Vaccinate now." }, { id: "b", label: "Defer until current episode has resolved (lesions crusted). No benefit from vaccination during active episode and increased risk of reactogenicity confusion with natural illness." }, { id: "c", label: "Half dose." }, { id: "d", label: "Vaccinate other arm." }
    ], correctOptionIds: ["b"], explanation: "Wait until active shingles resolved. Then vaccinate; previous shingles is not a contraindication." },
    { id: "q-interval", type: "single-choice", critical: true, question: "Patient had first Shingrix 4 weeks ago and wants second dose now. Action?", options: [
      { id: "a", label: "Vaccinate." }, { id: "b", label: "Defer — minimum interval is 8 weeks." }, { id: "c", label: "Vaccinate at half dose." }, { id: "d", label: "Refer." }
    ], correctOptionIds: ["b"], explanation: "Minimum interval is 8 weeks between doses. Earlier vaccination is not on schedule." },
    { id: "q-reactogenicity", type: "single-choice", question: "Patient had a sore arm and fever 2 days after first Shingrix. Worried about second dose. Action?", options: [
      { id: "a", label: "Don't give second dose." }, { id: "b", label: "Counsel that reactogenicity is common and expected with Shingrix. Reassure on transient nature; encourage second dose for proper protection. Paracetamol acceptable for symptoms." }, { id: "c", label: "Give half dose for second." }, { id: "d", label: "Switch to Zostavax." }
    ], correctOptionIds: ["b"], explanation: "Shingrix reactogenicity is well-documented. Reassure and encourage second dose — without it, protection is suboptimal." },
    { id: "q-co-admin-flu", type: "single-choice", question: "Patient is eligible for Shingrix and flu vaccine. Same day?", options: [
      { id: "a", label: "No, separate by 4 weeks." }, { id: "b", label: "Yes, can be co-administered same day in different deltoids. Both inactivated; no interaction." }, { id: "c", label: "No, never." }, { id: "d", label: "Only with consent form." }
    ], correctOptionIds: ["b"], explanation: "Co-administration acceptable. Different deltoids; observation as standard." },
    { id: "q-anaphylaxis-prior", type: "single-choice", question: "Patient had anaphylaxis to a previous Shingrix dose. Action?", options: [
      { id: "a", label: "Vaccinate second dose." }, { id: "b", label: "Do not give further Shingrix under PGD. Refer to GP / allergy clinic for specialist assessment." }, { id: "c", label: "Half dose." }, { id: "d", label: "Switch to Zostavax." }
    ], correctOptionIds: ["b"], explanation: "Previous anaphylaxis to Shingrix = absolute contraindication. Specialist allergy review." },
    { id: "q-zostavax-history", type: "single-choice", question: "Patient had Zostavax (live) 4 years ago. Now eligible by age for Shingrix programme. Action?", options: [
      { id: "a", label: "Already protected — no need." }, { id: "b", label: "Eligible for Shingrix — recommended re-vaccination with the better-evidenced regimen. Standard 2-dose schedule." }, { id: "c", label: "Half doses." }, { id: "d", label: "Refer." }
    ], correctOptionIds: ["b"], explanation: "Shingrix recommended even after prior Zostavax — provides better and more durable protection. Two-dose schedule as for any new patient." },
    { id: "q-acute-illness", type: "single-choice", question: "Patient has fever 38.6°C with sore throat today. Action?", options: [
      { id: "a", label: "Vaccinate now." }, { id: "b", label: "Postpone until recovered. Acute moderate-severe febrile illness defers vaccination." }, { id: "c", label: "Vaccinate half dose." }, { id: "d", label: "Refer." }
    ], correctOptionIds: ["b"], explanation: "Acute febrile illness = postpone. Reschedule when recovered." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Dose number (1 or 2), interval from first, batch, expiry, site, eligibility cohort, contraindications excluded, consent, observation — in the ePGD tool. NIMS upload." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Vaccinations require structured records with batch number for cohort safety follow-up. NIMS upload standard for the programme." },
  ],
};
