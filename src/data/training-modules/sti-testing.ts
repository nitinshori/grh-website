// STI testing — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const stiTestingModule: TrainingModule = {
  slug: "sti-testing",
  title: "STI Testing — PGD",
  description: "Sample collection and signposting for asymptomatic and symptomatic STI testing under PGD.",
  pgdSlugs: ["sti-testing"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "STI Testing — Training", subtitle: "Sample collection for asymptomatic / symptomatic patients", estimatedMinutes: 10, objectives: [
      "Triage patients to appropriate testing pathway (full STI screen, targeted screen, urgent GUM referral).",
      "Apply appropriate sample collection per site of exposure.",
      "Coordinate result delivery, treatment pathways, partner notification.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Standard UK STI screen: chlamydia + gonorrhoea (NAAT), HIV, syphilis. Hepatitis B/C for at-risk groups (MSM, IDU, sex workers, certain countries of origin). HPV — separate testing pathway.",
      "PGD covers sample collection and result delivery for asymptomatic patients. Symptomatic patients usually need GUM/sexual health clinic for fuller assessment.",
      "Lab pathway: NAAT for chlamydia/gonorrhoea (self-taken vaginal swab or first-void urine; rectal/pharyngeal swabs per exposure); serology for HIV/syphilis. Most labs offer combined test kits for postal or in-clinic.",
    ], highlights: ["Standard screen: chlamydia + gonorrhoea + HIV + syphilis.", "Symptomatic patients = refer GUM, not PGD.", "Asymptomatic + at-risk = sample collection + signpost services."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Adult, 16+", detail: "Under 16 — refer GUM (safeguarding pathway)." },
      { label: "Asymptomatic OR mild non-specific symptoms", detail: "Significant symptoms (discharge, severe pain, abnormal bleeding, ulcers) = refer GUM for full assessment." },
      { label: "Identifiable risk factor or scheduled routine screen", detail: "Recent UPSI, new partner, occupational risk, MSM screening, PrEP user, request before new relationship, etc." },
      { label: "Patient willing to provide samples and follow up", detail: "Result delivery and treatment / partner notification must be possible." },
      { label: "No recent unprotected sexual assault", detail: "Refer SARC / specialist pathway." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Refer GUM", tone: "danger", message: "Refer for these.", detail: [
      "Significant symptoms — urethral / vaginal discharge, severe pelvic / testicular pain, ulcers, abnormal bleeding.",
      "Suspected PID, epididymo-orchitis, disseminated infection.",
      "Recent sexual assault — SARC pathway with forensic preservation.",
      "Pregnancy + STI concern — antenatal pathway.",
      "Children under 16 — safeguarding.",
      "Patient unable to follow up for results.",
      "Indication for HIV PEP (high-risk exposure <72 hours) — A&E urgent.",
      "Active outbreak / blistering / ulceration — needs visual exam at GUM.",
    ]},
    { id: "screen-types", type: "comparison", title: "Test types and sample sites", intro: "Choose based on exposure history.", columns: [
      { label: "Standard asymptomatic screen", rows: [
        { heading: "Chlamydia + gonorrhoea", body: "NAAT. Vulvovaginal swab (women — self-taken) OR first-void urine (men). Send rectal + pharyngeal swabs if exposure at those sites (e.g. MSM, oral receptive)." },
        { heading: "HIV", body: "Blood — usually finger-prick or venous. 4th-generation assay (antigen + antibody) detects from 4 weeks. Window period: counsel re-test at 12 weeks if recent high-risk exposure." },
        { heading: "Syphilis", body: "Blood — treponemal antibody. Reactive results need follow-up specific testing." },
      ]},
      { label: "Risk-based additions", rows: [
        { heading: "Hepatitis B", body: "HBsAg, anti-HBc for MSM, IDU, certain countries of origin, sex workers." },
        { heading: "Hepatitis C", body: "Anti-HCV for IDU, MSM with risk factors, blood-product exposure." },
        { heading: "Trichomonas vaginalis", body: "NAAT (selected labs) — symptomatic women or contacts." },
        { heading: "Mycoplasma genitalium", body: "NAAT in symptomatic men or refractory cases — usually GUM." },
      ]},
    ]},
    { id: "results-pathway", type: "checklist", title: "Result delivery and treatment pathway", intro: "Plan before sample taken.", items: [
      { label: "How results delivered", detail: "Phone, secure portal, in-person — patient choice. Specify time-frame (typically 7–10 days for NAAT, longer for serology)." },
      { label: "Negative results", detail: "Communicate with reassurance + safer-sex counselling. Encourage repeat per ongoing risk." },
      { label: "Positive results", detail: "Phone call ideally. Plan: treatment (under appropriate PGD or GUM referral), partner notification, repeat testing schedule." },
      { label: "Window periods", detail: "HIV / syphilis serology may not detect very recent exposure (within 4–12 weeks). Repeat at 3 months if early test was within window period." },
      { label: "Partner notification", detail: "GUM has formal contact-tracing service. Anonymous notification possible if patient prefers." },
      { label: "Document", detail: "Tests offered / done, samples taken, declined items, patient understanding, follow-up plan." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Asymptomatic screen = PGD scope. Symptomatic = refer GUM.",
      "Standard 4: chlamydia, gonorrhoea, HIV, syphilis. Add Hep B/C per risk.",
      "Self-taken swabs for women; first-void urine for men. Rectal/pharyngeal per exposure.",
      "Window-period counselling — repeat at 3 months for recent high-risk exposure.",
      "Partner notification via GUM service.",
      "High-risk exposure <72 hours = HIV PEP urgent referral.",
    ]},
  ],
  quiz: [
    { id: "q-symptomatic", type: "single-choice", critical: true, question: "Man with urethral discharge, dysuria for 3 days. Action?", options: [
      { id: "a", label: "Sample collection for asymptomatic screen." }, { id: "b", label: "Refer to GUM — symptomatic presentation needs same-day GUM assessment including microscopy, full assessment, and empirical treatment options." }, { id: "c", label: "Treat empirically." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Symptomatic = GUM, not asymptomatic screening pathway. Urgent same-day usually appropriate." },
    { id: "q-pep", type: "single-choice", critical: true, question: "Patient reports UPSI with a partner she now knows is HIV-positive, 36 hours ago. Action?", options: [
      { id: "a", label: "Standard STI screen now." }, { id: "b", label: "Refer urgently for HIV PEP — eligible up to 72 hours post-exposure; A&E or specialist HIV service for assessment and PEP initiation." }, { id: "c", label: "HIV test only." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "HIV PEP is time-critical. Within 72 hours of high-risk exposure. Don't lose time on routine testing first." },
    { id: "q-assault", type: "single-choice", critical: true, question: "Patient discloses recent sexual assault. Action?", options: [
      { id: "a", label: "Take STI samples now." }, { id: "b", label: "Refer to SARC (Sexual Assault Referral Centre). Forensic samples and trauma support take priority over routine testing. PEP also considered urgently." }, { id: "c", label: "Reassure and proceed." }, { id: "d", label: "Discuss next week." }
    ], correctOptionIds: ["b"], explanation: "Sexual assault has specific pathway — SARC for forensic preservation, support, PEP/EC, and structured STI follow-up." },
    { id: "q-window", type: "single-choice", critical: true, question: "Patient had high-risk exposure 5 days ago. Asymptomatic. Wants HIV test. Action?", options: [
      { id: "a", label: "Test today and reassure if negative." }, { id: "b", label: "Counsel on window period — even 4th-generation HIV test may not detect very recent infection. Offer test now AND repeat at 6 weeks and 12 weeks for confidence. Also consider PEP if within 72 hours." }, { id: "c", label: "Wait 6 months." }, { id: "d", label: "Refuse to test." }
    ], correctOptionIds: ["b"], explanation: "Window period counselling is mandatory. Negative early test doesn't exclude recent infection. Repeat at 12 weeks recommended." },
    { id: "q-self-swab", type: "single-choice", question: "Asymptomatic woman wants chlamydia / gonorrhoea screen. Best sample?", options: [
      { id: "a", label: "Endocervical swab only at GUM." }, { id: "b", label: "Self-taken vulvovaginal swab — equally sensitive to clinician-taken, more comfortable, suitable for pharmacy." }, { id: "c", label: "First-void urine." }, { id: "d", label: "Blood test." }
    ], correctOptionIds: ["b"], explanation: "Self-taken vulvovaginal swab is current gold standard for asymptomatic women — equivalent sensitivity, more comfortable, no need for speculum exam." },
    { id: "q-msm", type: "single-choice", question: "MSM patient asks for full STI screen. Receptive anal and oral sex. Sites?", options: [
      { id: "a", label: "Urine only." }, { id: "b", label: "First-void urine (urethral), rectal swab, pharyngeal swab — for chlamydia and gonorrhoea, all sites of exposure. Plus blood for HIV, syphilis, Hep B (and Hep C per risk)." }, { id: "c", label: "Blood only." }, { id: "d", label: "Genital area only." }
    ], correctOptionIds: ["b"], explanation: "MSM with receptive anal and oral exposure needs triple-site swabs plus serology. Single-site testing misses 60%+ of infections in this group." },
    { id: "q-pregnant-screen", type: "single-choice", question: "Pregnant patient (12 weeks) wants routine STI screen. Action?", options: [
      { id: "a", label: "PGD screen." }, { id: "b", label: "Standard antenatal care already includes HIV/syphilis/Hep B testing as part of NHS antenatal screening. Coordinate with midwife / GP; PGD can provide additional asymptomatic chlamydia / gonorrhoea testing if appropriate." }, { id: "c", label: "Defer until postpartum." }, { id: "d", label: "Refuse." }
    ], correctOptionIds: ["b"], explanation: "Antenatal screening already covers HIV, syphilis, Hep B. Additional chlamydia / gonorrhoea screening reasonable; coordinate with antenatal team." },
    { id: "q-positive-result", type: "single-choice", question: "Patient's chlamydia NAAT is positive. Action?", options: [
      { id: "a", label: "Email the result." }, { id: "b", label: "Phone call, explain, arrange treatment (doxycycline 100 mg BD x 7 days under chlamydia PGD if available, or GUM referral), discuss partner notification (60 days), repeat testing at 3 months — re-infection common." }, { id: "c", label: "Send a text." }, { id: "d", label: "Let GP handle." }
    ], correctOptionIds: ["b"], explanation: "Positive results need direct conversation — by phone if not in person. Treatment + partner notification + re-test plan all need explaining." },
    { id: "q-confidentiality", type: "single-choice", question: "Patient asks about confidentiality of STI testing.", options: [
      { id: "a", label: "Always recorded on GP record." }, { id: "b", label: "Standard PGD record in our system. NHS STI testing is generally confidential — not shared with GP without consent, though emergency situations or notifiable diseases may require disclosure. GUM testing is fully confidential." }, { id: "c", label: "Always shared with employer." }, { id: "d", label: "Anonymous unless treatment needed." }
    ], correctOptionIds: ["b"], explanation: "STI care is confidentiality-protected, with GP notification only with consent. GUM is the most confidential pathway. Counsel transparently to encourage testing." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Risk assessment, tests offered / declined / done, sample sites collected, result delivery preference and contact, window-period counselling, partner-notification plan, follow-up arrangements — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record demonstrates appropriate triage and the comprehensive testing/follow-up plan." },
  ],
};
