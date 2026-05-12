// COVID-19 booster — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const covidBoosterModule: TrainingModule = {
  slug: "covid-booster",
  title: "COVID-19 Booster Vaccination — PGD",
  description: "Eligibility and administration of COVID-19 booster vaccines under PGD.",
  pgdSlugs: ["covid-booster"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "COVID-19 Booster — Training", subtitle: "Seasonal booster vaccination under PGD", estimatedMinutes: 10, objectives: [
      "Identify eligible adult cohorts for COVID-19 booster vaccination per current Green Book and JCVI advice.",
      "Apply correct interval rules (≥3 months since last dose; ≥4 weeks from infection in some scenarios).",
      "Administer vaccine safely and manage anaphylaxis preparation.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "COVID-19 booster vaccination is recommended seasonally (typically autumn) for adult risk groups identified by JCVI. Eligibility and product vary by season — check current Green Book and annual letter.",
      "Available products typically include Pfizer-BioNTech (Comirnaty, mRNA, including variant-updated XBB or JN.1 strains), Moderna (Spikevax, mRNA), and Novavax (protein-subunit) in some contexts.",
      "Eligibility is updated each season; refer to current Green Book chapter 14a and seasonal letter rather than relying on prior cohort definitions.",
    ], highlights: ["Eligibility changes seasonally — check current guidance.", "Minimum interval since last dose typically ≥3 months.", "Anaphylaxis preparation always required."] },
    { id: "eligibility", type: "checklist", title: "Eligibility (typical adult cohorts — check current letter)", intro: "Adult cohorts commonly include:", items: [
      { label: "Age 65+ (or whichever age threshold is current)", detail: "Threshold has varied (65, 70, 75) by season. Check the current Green Book." },
      { label: "Adults in clinical risk groups", detail: "Similar list to flu vaccination: chronic respiratory, cardiac, renal, liver, neurological, diabetes, immunosuppression, asplenia, severe obesity." },
      { label: "Pregnancy", detail: "Recommended; safe in any trimester." },
      { label: "Frontline health/social care workers", detail: "Per current letter." },
      { label: "Carers and household contacts of immunosuppressed", detail: "Sometimes included; check current cohort." },
    ]},
    { id: "intervals", type: "callout", title: "Interval rules", tone: "info", message: "Spacing rules between doses and after infection.", detail: [
      "Minimum interval since last COVID-19 vaccine dose: ≥3 months (sometimes 6 months in non-risk groups; check current season).",
      "Following COVID-19 infection: at least 4 weeks from symptom onset (or first positive test if asymptomatic) before booster.",
      "Following other vaccines: COVID-19 can be co-administered or separated by any interval (no minimum spacing required).",
      "Following high-dose steroids or immunosuppressive treatment: consider timing per specialist advice.",
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Contraindications", tone: "danger", message: "Do not vaccinate under PGD if any apply — refer.", detail: [
      "Previous anaphylaxis to a COVID-19 vaccine or any component (including PEG for mRNA vaccines).",
      "Severe acute febrile illness today — postpone.",
      "History of myocarditis or pericarditis post-mRNA vaccine — specialist review.",
      "Confirmed PEG allergy.",
      "Current COVID-19 infection — wait minimum 4 weeks.",
      "Previous severe reaction post-vaccine that's not been investigated — refer.",
    ]},
    { id: "administration", type: "checklist", title: "Administration", items: [
      { label: "Pre-check", detail: "Eligibility, contraindications, intervals, consent, vaccine name/expiry/batch." },
      { label: "Vaccine handling", detail: "Per current SmPC. Refrigerated; gentle inversion; not shaken; once-thawed times tracked." },
      { label: "Site", detail: "Deltoid IM." },
      { label: "Needle", detail: "23G 25mm (blue) standard adult." },
      { label: "Technique", detail: "Standard IM. 15-minute post-vaccination observation. Anaphylaxis preparedness throughout." },
      { label: "Co-administration", detail: "COVID and flu vaccines can be given same day, different deltoids, OR separately at any interval." },
    ]},
    { id: "side-effects", type: "checklist", title: "Side effects — counsel routinely", items: [
      { label: "Common — local", detail: "Pain, redness, swelling at injection site." },
      { label: "Common — systemic", detail: "Fatigue, headache, muscle ache, low-grade fever, chills. Usually 24–48 hours." },
      { label: "Less common", detail: "Lymphadenopathy in injected arm — usually settles in 10 days. Important to mention if patient has imaging scheduled (could be mistaken for malignancy)." },
      { label: "Rare — myocarditis / pericarditis", detail: "Mostly young males post-mRNA. Chest pain, shortness of breath, palpitations after vaccination — seek urgent assessment." },
      { label: "Rare — anaphylaxis", detail: "Manage per protocol. Adrenaline IM, 999." },
      { label: "Paracetamol", detail: "Acceptable for symptomatic relief." },
    ]},
    { id: "red-flags", type: "callout", title: "Red flags", tone: "danger", message: "Escalate as appropriate.", detail: [
      "Anaphylaxis — immediate adrenaline IM, 999.",
      "Chest pain, breathlessness, palpitations days–weeks post-vaccine — possible myocarditis, urgent review.",
      "Severe persistent headache, visual changes — possible VTE/CVST (very rare).",
      "Severe lymphadenopathy >1 month — refer.",
      "Vasovagal post-injection — manage with positioning, monitor.",
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Check current Green Book and seasonal letter for eligibility — changes annually.",
      "Minimum 3 months since last COVID vaccine; 4 weeks since infection.",
      "Co-administration with flu vaccine acceptable.",
      "Anaphylaxis preparedness mandatory.",
      "Counsel routinely on myocarditis red flags in young males.",
      "Document batch / lot number.",
    ]},
  ],
  quiz: [
    { id: "q-anaphylaxis-prior", type: "single-choice", critical: true, question: "Patient had anaphylaxis to a previous COVID-19 vaccine. Action?", options: [
      { id: "a", label: "Vaccinate with different brand." }, { id: "b", label: "Refer to GP / allergy clinic for specialist assessment. Anaphylaxis to a COVID vaccine is an absolute contraindication under this PGD." }, { id: "c", label: "Vaccinate at half dose." }, { id: "d", label: "Vaccinate after antihistamine." }
    ], correctOptionIds: ["b"], explanation: "Previous anaphylaxis to any COVID vaccine is absolute contraindication under PGD. Specialist allergy assessment may identify the component (PEG vs spike protein etc.) and determine if alternative formulation is safe." },
    { id: "q-interval", type: "single-choice", critical: true, question: "Patient had a COVID booster 2 months ago. Wants another now. Action?", options: [
      { id: "a", label: "Vaccinate now." }, { id: "b", label: "Defer — minimum 3 months between COVID doses." }, { id: "c", label: "Vaccinate at half dose." }, { id: "d", label: "Refer." }
    ], correctOptionIds: ["b"], explanation: "Minimum 3 months between COVID doses. Earlier vaccination may impair immune response and offers no additional benefit." },
    { id: "q-infection", type: "single-choice", critical: true, question: "Patient had a positive COVID test 2 weeks ago, symptoms now resolved. Wants booster. Action?", options: [
      { id: "a", label: "Vaccinate now." }, { id: "b", label: "Defer — at least 4 weeks from symptom onset / first positive test before vaccinating." }, { id: "c", label: "Vaccinate at half dose." }, { id: "d", label: "Refer." }
    ], correctOptionIds: ["b"], explanation: "Wait at least 4 weeks from infection. The natural infection itself acts as an immune boost; vaccination too soon offers no benefit and may be poorly tolerated." },
    { id: "q-myocarditis", type: "single-choice", critical: true, question: "20-year-old male, healthy, had myocarditis after his last mRNA COVID vaccine (confirmed by cardiology). Wants another booster. Action?", options: [
      { id: "a", label: "Vaccinate with same mRNA." }, { id: "b", label: "Refer to cardiology / GP — myocarditis post-mRNA vaccine is a contraindication to further mRNA under PGD. Specialist may recommend alternative (e.g. Novavax protein-subunit) if eligible." }, { id: "c", label: "Vaccinate at half dose." }, { id: "d", label: "Vaccinate other arm." }
    ], correctOptionIds: ["b"], explanation: "Confirmed post-vaccine myocarditis is contraindication for further mRNA. Specialist review for alternative product or watch-and-wait." },
    { id: "q-co-admin", type: "single-choice", question: "Patient eligible for both flu and COVID booster. Can they be given the same day?", options: [
      { id: "a", label: "No — separate by 4 weeks." }, { id: "b", label: "Yes — co-administration is acceptable. Different deltoids; observe 15 minutes after both. Counsel that reactogenicity may be slightly higher." }, { id: "c", label: "No — never co-administer." }, { id: "d", label: "Only in immunocompetent." }
    ], correctOptionIds: ["b"], explanation: "Co-administration of flu and COVID is acceptable. Different sites (each deltoid), single observation period." },
    { id: "q-pregnancy", type: "single-choice", question: "Pregnant patient (28 weeks) wants COVID booster. Action?", options: [
      { id: "a", label: "Defer until after delivery." }, { id: "b", label: "Vaccinate — COVID vaccine is recommended in pregnancy. Standard dose, IM." }, { id: "c", label: "Refer to obstetric specialist." }, { id: "d", label: "Vaccinate only in third trimester." }
    ], correctOptionIds: ["b"], explanation: "COVID vaccine is recommended in pregnancy at any trimester. Pregnancy is high-risk for severe COVID; vaccine is well-evidenced safe." },
    { id: "q-needle", type: "single-choice", question: "Standard adult IM needle for COVID vaccine?", options: [
      { id: "a", label: "21G 50mm green." }, { id: "b", label: "23G 25mm blue, deltoid IM." }, { id: "c", label: "16G 16mm orange, subcut." }, { id: "d", label: "Insulin needle." }
    ], correctOptionIds: ["b"], explanation: "Standard adult IM deltoid is 23G 25mm. Same as other adult IM vaccines." },
    { id: "q-arm-lump", type: "single-choice", question: "Patient post-vaccination has a small armpit lymph node on the injected side, no other symptoms. Action?", options: [
      { id: "a", label: "Refer urgently for cancer workup." }, { id: "b", label: "Reassure — reactive lymphadenopathy is common post-vaccine and settles in days to weeks. Mention to any clinician doing imaging in the next 6 weeks." }, { id: "c", label: "Antibiotic." }, { id: "d", label: "Stop vaccination programme." }
    ], correctOptionIds: ["b"], explanation: "Post-vaccine lymphadenopathy is common and benign. Important to mention to clinicians scheduled to image (mammography, CT) so it isn't misinterpreted as pathology." },
    { id: "q-eligibility", type: "single-choice", question: "What's the authoritative current source for COVID booster eligibility?", options: [
      { id: "a", label: "Last year's flu letter." }, { id: "b", label: "Current Green Book chapter 14a and the current season's vaccination letter / SOP from NHS England." }, { id: "c", label: "BNF." }, { id: "d", label: "Patient request." }
    ], correctOptionIds: ["b"], explanation: "Eligibility cohorts change each season. Always check current Green Book and seasonal NHS letter, not prior-year cohort definitions." },
    { id: "q-record", type: "single-choice", question: "Documentation requirements?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Eligibility category, vaccine name/brand/batch/expiry, site, dose, contraindications and interval check confirmed, consent, post-vaccination observation — in the ePGD tool. Upload to GP record / National Immunisation Management Service per current policy." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Vaccination records must include batch number (cohort safety follow-up), and upload to NIMS / patient GP record per current standing operating procedure." },
  ],
};
