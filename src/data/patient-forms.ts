/**
 * Printable blank patient forms.
 *
 * Each form is a paper version of the questions a patient can answer for
 * themselves before an ePGD consultation. The questions are derived ONLY
 * from the inclusion criteria, exclusion criteria and cautions of the LIVE
 * signed PGD named in `pgdDocument`, which is read from the PGD document
 * manifest (PGD_MASTER_FILES) by slug, so a printed form always cites the
 * current file. Clinical judgements the patient cannot
 * make (examination, observations, weighing, competence) are listed in
 * `pharmacyChecks` for the pharmacist to tick.
 *
 * The paper form never makes the decision. The completed form must be
 * entered into the ePGD tool, which applies the PGD and records the outcome.
 *
 * When a PGD is reissued, re-check its criteria against these questions.
 * `pgdDocument` follows the manifest and needs no edit.
 */

import { PGD_MASTER_FILES } from "@/lib/pgd-document-manifest";

export type PatientFormQuestionType = "yesno" | "text";

export interface PatientFormQuestion {
  id: string;
  text: string;
  /** Short plain-English hint printed under the question. */
  help?: string;
  /** "yesno" (default) prints Yes / No / Not sure boxes; "text" prints writing lines. */
  type?: PatientFormQuestionType;
  /** Number of writing lines for "text" questions (default 1). */
  lines?: number;
}

export interface PatientFormSection {
  heading: string;
  intro?: string;
  questions: PatientFormQuestion[];
}

export interface PatientFormConfig {
  slug: string;
  /** Service title printed at the top of the form. */
  title: string;
  /** Short line printed under the title. */
  intro?: string;
  /** The live signed PGD file the questions were taken from. */
  pgdDocument: string;
  /** Who the service is for, in plain words. */
  ageNote: string;
  /** Vaccine forms print batch, expiry and injection site in the pharmacy box. */
  isVaccine: boolean;
  /** Print a parent or guardian signature line (only where the PGD allows under 16s with parental consent). */
  guardianLine: boolean;
  /** Extra note printed beside the signature, for example about under 16s. */
  under16Note?: string;
  sections: PatientFormSection[];
  /** Consent statement the patient signs. */
  consent: string;
  /** Pharmacist-only items printed as tick boxes in the "For pharmacy use only" box. */
  pharmacyChecks: string[];
}

const BLOOD_THINNER_HELP =
  "For example warfarin, apixaban, rivaroxaban, edoxaban or dabigatran.";

const KIDNEY_QUESTION =
  "Have you ever been told you have kidney disease, or that your kidneys do not work as well as they should?";

const STANDARD_CONSENT =
  "The information I have given on this form is correct to the best of my knowledge. I understand the pharmacist will go through my answers with me and decide whether this treatment is suitable, and that they may refer me elsewhere. I agree to the pharmacy keeping a record of this consultation and, where needed, sharing it with my GP.";

const EC_CONSENT =
  "The information I have given on this form is correct to the best of my knowledge. I understand the pharmacist will go through my answers with me and decide whether this treatment is suitable, and that they may refer me elsewhere. I agree to the pharmacy keeping a confidential record of this consultation. Your answers are confidential: we will only share information with your GP if you agree, unless we are worried about your safety or someone else's.";

const VACCINE_CONSENT =
  "The information I have given on this form is correct to the best of my knowledge. I understand the pharmacist will go through my answers with me and decide whether the vaccine is suitable. If it is, I agree to have it and to wait in the pharmacy for 15 minutes afterwards. I agree to the pharmacy keeping a record of this vaccination and, where needed, sharing it with my GP.";

// COVID-19 PGD v011 (Green Book chapter 14a): routine 15-minute observation is
// suspended, so the COVID form does not ask everyone to wait.
const COVID_VACCINE_CONSENT =
  "The information I have given on this form is correct to the best of my knowledge. I understand the pharmacist will go through my answers with me and decide whether the vaccine is suitable. If it is, I agree to have it. The pharmacist will tell me if I need to wait in the pharmacy afterwards. I agree to the pharmacy keeping a record of this vaccination and, where needed, sharing it with my GP.";

export const PATIENT_FORMS: PatientFormConfig[] = [
  // ── Flu ─────────────────────────────────────────────────────────────
  {
    slug: "flu",
    title: "Flu vaccination (2026/27 season)",
    intro:
      "Please answer these questions before your flu vaccination. If you are filling this in for a child, answer for the child.",
    pgdDocument: PGD_MASTER_FILES["flu"],
    ageNote: "For people aged 2 years and over.",
    isVaccine: true,
    guardianLine: true,
    under16Note:
      "For a child under 16, a parent or guardian should usually sign. The pharmacist will discuss this with you.",
    sections: [
      {
        heading: "About this vaccination",
        questions: [
          {
            id: "had-this-season",
            text: "Have you already had a flu vaccine this season (autumn 2026 onwards)?",
            help: "If your child is under 9 and coming for their second dose, tick Yes and tell the pharmacist.",
          },
          {
            id: "child-first-flu",
            text: "For children aged 2 to 8 only: is this the first time your child has ever had a flu vaccine?",
            help: "Children under 9 having flu vaccine for the first time need two doses, at least 4 weeks apart.",
          },
          {
            id: "nhs-eligible",
            text: "Do you think you may be able to get a free NHS flu vaccine?",
            help: "The pharmacist will check this with you before going ahead privately.",
          },
        ],
      },
      {
        heading: "Your health",
        questions: [
          {
            id: "anaphylaxis-flu",
            text: "Have you ever had a severe allergic reaction (anaphylaxis) to a flu vaccine?",
          },
          {
            id: "vaccine-allergy",
            text: "Have you ever had an allergic reaction to any vaccine, or to any ingredient in a vaccine?",
            help: "If yes, please write what happened in the box below.",
          },
          { id: "egg-allergy", text: "Do you have an egg allergy?" },
          {
            id: "fever",
            text: "Are you unwell today with a high temperature (fever)?",
            help: "A minor cold without a temperature is usually fine.",
          },
          {
            id: "bleeding-disorder",
            text: "Do you have a bleeding disorder, such as haemophilia?",
          },
          {
            id: "anticoagulant",
            text: "Do you take a medicine to thin your blood (an anticoagulant)?",
            help: `${BLOOD_THINNER_HELP} If you take warfarin, please bring your latest INR result.`,
          },
          { id: "pregnant", text: "Are you pregnant, or could you be pregnant?" },
          {
            id: "immune",
            text: "Do you have a weakened immune system, because of an illness or a treatment?",
            help: "For example chemotherapy, high-dose steroids or other medicines that lower immunity.",
          },
          {
            id: "fainting",
            text: "Have you ever fainted or felt faint after an injection?",
          },
          {
            id: "allergy-details",
            text: "Please give details of any allergies or reactions:",
            type: "text",
            lines: 2,
          },
        ],
      },
    ],
    consent: VACCINE_CONSENT,
    pharmacyChecks: [
      "Told of NHS entitlement where eligible",
      "Vaccine licensed for this age (only cell-based IIVc under 18)",
      "Egg-free vaccine used where egg allergy",
      "Child under 9, first season: dose 1 of 2, second dose booked",
      "Bleeding risk or anticoagulation assessed (INR checked if on warfarin)",
      "Consent and, where under 16, Gillick competence or parental consent recorded",
      "15 minute observation completed",
    ],
  },

  // ── COVID-19 ────────────────────────────────────────────────────────
  {
    slug: "covid-booster",
    title: "COVID-19 vaccination (2026/27)",
    intro:
      "Please answer these questions before your COVID-19 vaccination. If you are filling this in for a young person, answer for them.",
    pgdDocument: PGD_MASTER_FILES["covid-booster"],
    ageNote: "For people aged 12 years and over.",
    isVaccine: true,
    guardianLine: true,
    under16Note:
      "For a young person under 16, a parent or guardian should usually sign. The pharmacist will discuss this with you.",
    sections: [
      {
        heading: "About this vaccination",
        questions: [
          {
            id: "had-covid-vaccine",
            text: "Have you had a COVID-19 vaccine before?",
          },
          {
            id: "last-dose-date",
            text: "Date of your last COVID-19 vaccine, if known:",
            type: "text",
          },
          {
            id: "last-dose-3-months",
            text: "Was your last COVID-19 vaccine less than 3 months ago?",
          },
          {
            id: "nhs-eligible",
            text: "Do you think you may be able to get a free NHS COVID-19 vaccine?",
            help: "For example if you are aged 75 or over, live in a care home for older adults, or have a weakened immune system.",
          },
          {
            id: "care-home",
            text: "Do you live in a care home for older adults?",
          },
        ],
      },
      {
        heading: "Your health",
        questions: [
          {
            id: "anaphylaxis",
            text: "Have you ever had a severe allergic reaction (anaphylaxis) to a COVID-19 vaccine or to any of its ingredients?",
          },
          {
            id: "peg-allergy",
            text: "Do you have an allergy to polyethylene glycol (PEG) or polysorbate 80, or any other vaccine or medicine ingredient?",
            help: "These ingredients are found in some medicines and cosmetics. If yes, write the details below.",
          },
          {
            id: "myocarditis",
            text: "Have you ever had myocarditis or pericarditis (inflammation of or around the heart) after any COVID-19 vaccine?",
          },
          {
            id: "capillary-leak",
            text: "Have you ever had capillary leak syndrome?",
          },
          {
            id: "fever",
            text: "Are you unwell today with a high temperature (fever)?",
            help: "A minor cold without a temperature is usually fine.",
          },
          {
            id: "current-covid",
            text: "Do you have COVID-19 at the moment, or have you tested positive and not yet recovered?",
          },
          {
            id: "bleeding-disorder",
            text: "Do you have a bleeding disorder, such as haemophilia?",
          },
          {
            id: "anticoagulant",
            text: "Do you take a medicine to thin your blood (an anticoagulant)?",
            help: BLOOD_THINNER_HELP,
          },
          {
            id: "immune",
            text: "Do you have a weakened immune system, because of an illness or a treatment?",
            help: "For example chemotherapy, high-dose steroids or other medicines that lower immunity.",
          },
          {
            id: "pregnant",
            text: "Are you pregnant, or could you be pregnant?",
            help: "Breastfeeding is fine.",
          },
          {
            id: "fainting",
            text: "Have you ever fainted or felt faint after an injection?",
          },
          {
            id: "allergy-details",
            text: "Please give details of any allergies or reactions:",
            type: "text",
            lines: 2,
          },
        ],
      },
    ],
    consent: COVID_VACCINE_CONSENT,
    pharmacyChecks: [
      "Told of NHS entitlement where eligible",
      "At least 3 months since last dose",
      "Not an unvaccinated immunosuppressed person needing a primary course",
      "Pregnant: only where in an NHS-eligible group (mRNA vaccine, group recorded)",
      "Comirnaty XFG used where immunosuppressed or aged 75 and over",
      "Bleeding risk or anticoagulation assessed",
      "Consent and, where under 16, Gillick competence or parental consent recorded",
      "Observation needed: none / 15 min / 30 min; completed",
    ],
  },

  // ── Travel core: hepatitis A, typhoid, cholera ──────────────────────
  {
    slug: "travel-core",
    title: "Travel vaccinations: hepatitis A, typhoid and cholera",
    intro:
      "Please answer these questions before your travel vaccination appointment.",
    pgdDocument: PGD_MASTER_FILES["travel-core"],
    ageNote: "For adults aged 18 years and over.",
    isVaccine: true,
    guardianLine: false,
    sections: [
      {
        heading: "Your trip",
        questions: [
          {
            id: "destinations",
            text: "Which countries, and which areas within them, are you visiting?",
            type: "text",
            lines: 2,
          },
          { id: "departure", text: "Date you leave:", type: "text" },
          { id: "duration", text: "How long will you be away?", type: "text" },
          {
            id: "trip-type",
            text: "What kind of trip is it, and where will you stay?",
            help: "For example holiday, visiting family, backpacking, hotels, camping or rural areas.",
            type: "text",
          },
          {
            id: "high-risk-work",
            text: "Will you be doing healthcare, aid or humanitarian work, or staying a long time somewhere with poor sanitation (unsafe water or toilets)?",
          },
        ],
      },
      {
        heading: "Vaccines you have had before",
        questions: [
          {
            id: "prev-hep-a",
            text: "Have you had a hepatitis A vaccine before?",
            help: "If yes, write when and how many doses in the box below.",
          },
          {
            id: "hep-a-immune",
            text: "Have you ever had hepatitis A, or been told you are immune to it?",
          },
          {
            id: "prev-typhoid",
            text: "Have you had a typhoid vaccine before?",
            help: "If yes, write when in the box below.",
          },
          {
            id: "prev-cholera",
            text: "Have you had the cholera vaccine (a drink) before?",
          },
          {
            id: "vaccine-details",
            text: "Details of previous travel vaccines (name and date, if known):",
            type: "text",
            lines: 2,
          },
        ],
      },
      {
        heading: "Your health",
        questions: [
          {
            id: "vaccine-allergy",
            text: "Have you ever had an allergic reaction to a vaccine, or to any ingredient in a vaccine (including formaldehyde)?",
          },
          {
            id: "fever",
            text: "Are you unwell today with a high temperature (fever)?",
          },
          {
            id: "gi-upset",
            text: "Do you have diarrhoea, vomiting or a stomach upset at the moment?",
          },
          { id: "pregnant", text: "Are you pregnant, or could you be pregnant?" },
          {
            id: "bleeding",
            text: "Do you have a bleeding disorder or a low platelet count?",
          },
          {
            id: "anticoagulant",
            text: "Do you take a medicine to thin your blood (an anticoagulant)?",
            help: BLOOD_THINNER_HELP,
          },
          {
            id: "immune",
            text: "Do you have a weakened immune system, because of an illness (such as HIV) or a treatment?",
          },
          {
            id: "chemo",
            text: "Are you having chemotherapy or other treatment for cancer that lowers your immunity?",
          },
          {
            id: "transplant",
            text: "Have you had an organ or bone marrow transplant?",
            help: "If yes, tell the pharmacist when.",
          },
          {
            id: "steroids",
            text: "In the last 4 weeks, have you taken steroid tablets (such as prednisolone) for 2 weeks or more?",
            help: "If yes, tell the pharmacist the dose.",
          },
          {
            id: "antibiotics",
            text: "Have you been prescribed antibiotics recently?",
          },
        ],
      },
    ],
    consent: VACCINE_CONSENT,
    pharmacyChecks: [
      "Destination risk checked against current TravelHealthPro information",
      "Previous doses and immunity reviewed",
      "Bleeding risk or anticoagulation assessed (fine needle, firm pressure)",
      "Immunosuppression assessed (cholera: severe immunosuppression excluded)",
      "Cholera: no food, drink or oral medicines 1 hour before and after explained",
      "Vaccine(s) given:  Hepatitis A  /  Typhoid  /  Cholera",
      "15 minute observation completed (injected vaccines)",
    ],
  },

  // ── Impetigo ────────────────────────────────────────────────────────
  {
    slug: "impetigo",
    title: "Impetigo treatment",
    intro:
      "Please answer these questions before your consultation. If you are filling this in for a child, answer for the child.",
    pgdDocument: PGD_MASTER_FILES["impetigo"],
    ageNote:
      "For children and adults. Which treatment is suitable depends on age; the pharmacist will explain.",
    isVaccine: false,
    guardianLine: true,
    under16Note:
      "For a child under 16, a parent or guardian should usually sign. The pharmacist will discuss this with you.",
    sections: [
      {
        heading: "About the skin problem",
        questions: [
          {
            id: "where",
            text: "Where on the body are the sores?",
            type: "text",
          },
          {
            id: "how-long",
            text: "How long have you had them?",
            type: "text",
          },
          {
            id: "widespread",
            text: "Are there more than about 5 sores, or do they cover an area wider than about 5cm (2 inches)?",
          },
          {
            id: "blisters",
            text: "Are any of the sores large blisters filled with fluid?",
          },
          {
            id: "eye",
            text: "Are any of the sores on or near the eye, or on the eyelid?",
          },
          {
            id: "spreading",
            text: "Is there redness, warmth, swelling or pain spreading beyond the sores?",
          },
          {
            id: "unwell",
            text: "Do you feel generally unwell, have a high temperature (fever), or have swollen glands?",
          },
          {
            id: "recurrent",
            text: "Have you had impetigo several times before?",
          },
          {
            id: "already-antibiotic",
            text: "Have you already had an antibiotic cream or antibiotic medicine for these sores?",
          },
          {
            id: "cream-failed",
            text: "Have you already used a cream on these sores for 2 days or more without it getting better?",
          },
          {
            id: "eczema-cold-sores",
            text: "Do you have eczema, or get cold sores, in or near the affected area?",
          },
        ],
      },
      {
        heading: "Your health",
        questions: [
          {
            id: "immune",
            text: "Do you have a weakened immune system, because of an illness or a treatment?",
          },
          {
            id: "penicillin-allergy",
            text: "Are you allergic to penicillin?",
            help: "If yes, write what happened in the box below, for example rash, swelling, breathing difficulty or sickness.",
          },
          {
            id: "other-antibiotic-allergy",
            text: "Are you allergic to any other antibiotic?",
            help: "For example fusidic acid, flucloxacillin, a cephalosporin, clarithromycin or erythromycin.",
          },
          {
            id: "fluclox-jaundice",
            text: "Have you ever had jaundice (yellow skin or eyes) or liver problems after taking flucloxacillin?",
          },
          {
            id: "liver-kidney",
            text: "Do you have severe liver disease or severe kidney disease?",
          },
          {
            id: "heart-rhythm",
            text: "Have you ever been told you have a heart rhythm problem, such as a long QT interval?",
          },
          {
            id: "low-salts",
            text: "Have you been told you have low potassium or low magnesium in your blood?",
          },
          {
            id: "pregnant",
            text: "Are you pregnant, or could you be pregnant?",
          },
          { id: "breastfeeding", text: "Are you breastfeeding?" },
          {
            id: "oral-medicine",
            text: "If the treatment is for a child: can the child take a liquid medicine by mouth?",
          },
          {
            id: "allergy-details",
            text: "Please give details of any allergies or reactions:",
            type: "text",
            lines: 2,
          },
        ],
      },
      {
        heading: "Do you take any of these medicines?",
        intro:
          "Please tick Yes if you take any of the following, and list them in the medicines box below.",
        questions: [
          {
            id: "interacting-medicines",
            text: "Simvastatin, lovastatin or any other statin, colchicine, ergotamine, ticagrelor, midazolam, lomitapide, ivabradine, ranolazine, domperidone, pimozide, warfarin, digoxin, ciclosporin, tacrolimus, any medicine for epilepsy or seizures, or any medicine you have been told can affect your heart rhythm.",
          },
        ],
      },
    ],
    consent: STANDARD_CONSENT,
    pharmacyChecks: [
      "Non-bullous or bullous; localised or widespread; lesion count recorded",
      "Hydrogen peroxide 1% offered first where suitable (localised)",
      "Not cellulitis, herpes simplex, eczema herpeticum or fungal infection",
      "Not systemically unwell",
      "Child weighed today (macrolide dose by weight):  ______ kg",
      "Arm used:  Fusidic acid cream  /  Flucloxacillin (aged 3 months to 17 years inclusive only)  /  Clarithromycin  /  Erythromycin",
      "Consent and, where under 16, Gillick competence or parental consent recorded",
    ],
  },

  // ── Skin infection ──────────────────────────────────────────────────
  {
    slug: "skin-infection",
    title: "Skin infection treatment",
    intro:
      "Please answer these questions before your consultation. If you are filling this in for a child, answer for the child.",
    pgdDocument: PGD_MASTER_FILES["skin-infection"],
    ageNote:
      "For people aged 2 years and over. Cellulitis can only be treated here from age 12.",
    isVaccine: false,
    guardianLine: true,
    under16Note:
      "For a child under 16, a parent or guardian should usually sign. The pharmacist will discuss this with you.",
    sections: [
      {
        heading: "About the infection",
        questions: [
          { id: "where", text: "Where on the body is the infection?", type: "text" },
          {
            id: "how-started",
            text: "How long have you had it, and how did it start (for example a cut, a graze or eczema)?",
            type: "text",
          },
          {
            id: "bite",
            text: "Was it caused by an animal bite or a human bite?",
          },
          {
            id: "face-hand",
            text: "Is the infection on your face, around your eye, or on your hand?",
          },
          {
            id: "joint",
            text: "Is it over a joint or a tendon, or do you have deep pain in a bone or joint nearby?",
            help: "A tendon is the tough cord that joins a muscle to a bone, for example at the back of the heel.",
          },
          {
            id: "nec-fasc",
            text: "Is the pain much worse than the skin looks, is the redness spreading very quickly, or are there blisters, dark or dusky patches, or a crackling feeling under the skin?",
            help: "If yes, tell a member of staff straight away.",
          },
          {
            id: "abscess",
            text: "Is there a painful lump full of pus (an abscess or boil)?",
          },
          {
            id: "unwell",
            text: "Do you feel very unwell, or have a high temperature, shivering, dizziness or confusion?",
          },
          {
            id: "already-antibiotic",
            text: "Have you already taken an antibiotic for this infection?",
          },
          {
            id: "fungal",
            text: "Could this be a fungal infection that has not been treated, such as an itchy, scaly, ring-shaped rash or athlete's foot?",
          },
          {
            id: "viral",
            text: "Are there groups of small painful blisters or punched-out sores, especially on skin with eczema?",
          },
          {
            id: "diabetic-foot",
            text: "Do you have diabetes, and is the infection on your foot?",
          },
          {
            id: "review",
            text: "If the pharmacist asks, could you come back to this pharmacy in 2 days (48 hours) for a check?",
          },
        ],
      },
      {
        heading: "Your health",
        questions: [
          {
            id: "immune",
            text: "Do you have a weakened immune system, because of an illness or a treatment?",
          },
          {
            id: "penicillin-allergy",
            text: "Are you allergic to penicillin or any similar antibiotic (such as amoxicillin or a cephalosporin)?",
            help: "If yes, write what happened in the box below.",
          },
          {
            id: "other-antibiotic-allergy",
            text: "Are you allergic to clarithromycin, erythromycin, doxycycline or any other antibiotic?",
          },
          {
            id: "fluclox-jaundice",
            text: "Have you ever had jaundice (yellow skin or eyes) or liver problems after taking flucloxacillin?",
          },
          { id: "kidney", text: KIDNEY_QUESTION },
          { id: "liver", text: "Do you have severe liver disease?" },
          {
            id: "heart-rhythm",
            text: "Have you ever been told you have a heart rhythm problem, such as a long QT interval?",
          },
          {
            id: "salts",
            text: "Have you been told you have a problem with the salts in your blood, such as low potassium or magnesium?",
          },
          {
            id: "mg-sle-porphyria",
            text: "Do you have myasthenia gravis, lupus (SLE) or porphyria?",
          },
          {
            id: "pregnant",
            text: "Are you pregnant, or could you be pregnant?",
          },
          { id: "breastfeeding", text: "Are you breastfeeding?" },
          {
            id: "allergy-details",
            text: "Please give details of any allergies or reactions:",
            type: "text",
            lines: 2,
          },
        ],
      },
      {
        heading: "Do you take any of these medicines?",
        intro:
          "Please tick Yes if you take any of the following, and list them in the medicines box below.",
        questions: [
          {
            id: "blood-thinners",
            text: "A blood thinner such as warfarin, apixaban, rivaroxaban, edoxaban or dabigatran.",
          },
          {
            id: "isotretinoin",
            text: "Isotretinoin (for acne).",
          },
          {
            id: "interacting-medicines",
            text: "Colchicine, simvastatin, lovastatin, ergotamine, midazolam, domperidone, pimozide, ticagrelor, ivabradine, ranolazine, lomitapide, astemizole, cisapride, terfenadine, or any medicine you have been told can affect your heart rhythm.",
          },
        ],
      },
    ],
    consent: STANDARD_CONSENT,
    pharmacyChecks: [
      "All observations within thresholds for the age band (Appendix 1)",
      "No features of necrotising fasciitis or sepsis",
      "Not tinea, viral infection, abscess needing drainage or bite",
      "Cellulitis (12 and over only): margins marked, 48 hour review booked in person",
      "Weight (arm 2, must be 12 kg or more):  ______ kg",
      "Arm used:  Flucloxacillin  /  Clarithromycin  /  Doxycycline",
      "Consent and, where under 16, Gillick competence or parental consent recorded",
    ],
  },

  // ── UTI ─────────────────────────────────────────────────────────────
  {
    slug: "uti",
    title: "Urinary tract infection (UTI) treatment",
    intro:
      "Please answer these questions before your consultation. Your answers are confidential.",
    pgdDocument: PGD_MASTER_FILES["uti"],
    ageNote:
      "This service is for women aged 16 to 64 who are not pregnant. Men, and women outside this age range, need to see their GP.",
    isVaccine: false,
    guardianLine: false,
    sections: [
      {
        heading: "Your symptoms",
        questions: [
          { id: "dysuria", text: "Do you have pain or burning when you pass urine?" },
          {
            id: "frequency",
            text: "Are you needing to pass urine more often than usual?",
          },
          {
            id: "urgency",
            text: "Do you get a sudden, urgent need to pass urine?",
          },
          {
            id: "nocturia",
            text: "Are you waking at night to pass urine, which is new for you?",
          },
          {
            id: "days",
            text: "How many days have you had these symptoms?",
            type: "text",
          },
          {
            id: "over-7-days",
            text: "Have you had these symptoms for more than 7 days?",
          },
        ],
      },
      {
        heading: "Warning signs",
        intro: "If you tick Yes to any of these, please tell a member of staff straight away.",
        questions: [
          {
            id: "fever",
            text: "Do you have a high temperature, or are you shivering or shaking?",
          },
          {
            id: "loin-pain",
            text: "Do you have pain in your back or side, below the ribs?",
          },
          { id: "vomiting", text: "Are you feeling sick or being sick?" },
          { id: "blood", text: "Can you see blood in your urine?" },
          {
            id: "confusion",
            text: "Are you confused, unusually drowsy, or feeling very unwell?",
          },
        ],
      },
      {
        heading: "Other questions",
        questions: [
          { id: "pregnant", text: "Are you pregnant, or could you be pregnant?" },
          { id: "breastfeeding", text: "Are you breastfeeding?" },
          {
            id: "sti-symptoms",
            text: "Do you have unusual vaginal discharge, pelvic pain, or bleeding between periods or after sex?",
          },
          {
            id: "new-partner",
            text: "Have you had a new or recent sexual partner?",
          },
          {
            id: "sti-risk",
            text: "Do you think you could have a sexually transmitted infection?",
          },
          {
            id: "catheter",
            text: "Do you have a urinary catheter, or have you had one removed in the last 7 days?",
          },
          {
            id: "recurrent",
            text: "Have you had 2 or more UTIs in the last 6 months, or 3 or more in the last 12 months?",
          },
          {
            id: "already-antibiotic",
            text: "Have you already taken an antibiotic for this infection, from anywhere?",
          },
          {
            id: "trimethoprim-3m",
            text: "Have you taken trimethoprim for any reason in the last 3 months?",
          },
          {
            id: "kidney",
            text: KIDNEY_QUESTION,
            help: "If you are aged 60 to 64, please bring a kidney blood test (eGFR) result from the last 12 months, for example from the NHS App.",
          },
          {
            id: "kidney-follow-up",
            text: "Are you having any check-ups or follow-up for your kidneys?",
          },
          {
            id: "urinary-tract",
            text: "Have you been told you have a problem with the shape or working of your bladder or kidneys, or kidney stones?",
          },
          {
            id: "immune",
            text: "Do you have a weakened immune system, because of an illness or a treatment?",
          },
          {
            id: "g6pd",
            text: "Have you been told you have G6PD deficiency (an inherited blood enzyme condition)?",
          },
          {
            id: "nitrofurantoin-reaction",
            text: "Have you ever had an allergy or bad reaction to nitrofurantoin or trimethoprim?",
            help: "For example breathing or lung problems, numbness or tingling, or liver problems after nitrofurantoin.",
          },
          { id: "porphyria", text: "Do you have porphyria?" },
          {
            id: "neuropathy",
            text: "Do you have diabetes, or any condition that causes numbness or tingling in your hands or feet?",
          },
          {
            id: "blood-disorder",
            text: "Have you been told you have low folate, a type of anaemia caused by low folate or B12, or any other blood disorder?",
          },
          { id: "liver", text: "Do you have liver disease?" },
        ],
      },
      {
        heading: "Do you take any of these medicines?",
        intro:
          "Please tick Yes if you take any of the following, and list them in the medicines box below.",
        questions: [
          { id: "methotrexate", text: "Methotrexate." },
          {
            id: "bp-potassium",
            text: "A blood pressure or heart medicine such as ramipril, lisinopril, losartan, candesartan (or any ACE inhibitor or ARB), spironolactone, eplerenone or amiloride.",
          },
          {
            id: "other-interacting",
            text: "Phenytoin, azathioprine, ciclosporin, digoxin, repaglinide, dofetilide, or warfarin.",
          },
        ],
      },
    ],
    consent: STANDARD_CONSENT,
    pharmacyChecks: [
      "Female, aged 16 to 64; two or more of dysuria, new nocturia, frequency, urgency",
      "No red flag in Appendix 1",
      "Aged 60 to 64 (nitrofurantoin): eGFR 45 or more within 12 months seen. Result ____ Date ____ Source ____",
      "Nitrofurantoin: G6PD deficiency risk asked, including whether the patient or their family originates from an area where G6PD deficiency is common",
      "Trimethoprim only: gate reason recorded (contraindicated / previous intolerance / nitrofurantoin unavailable)",
      "Medicine supplied:  Nitrofurantoin  /  Trimethoprim",
      "48 hour and immediate safety-netting advice given",
    ],
  },

  // ── Emergency contraception ─────────────────────────────────────────
  {
    slug: "emergency-contraception",
    title: "Emergency contraception",
    intro:
      "Your answers are confidential. The pharmacist will go through them with you in private. The copper coil (IUD) is the most effective emergency contraception, and you can ask about it.",
    pgdDocument: PGD_MASTER_FILES["emergency-contraception"],
    ageNote:
      "If you are under 16, you can still be seen. The pharmacist will talk with you privately before deciding.",
    isVaccine: false,
    guardianLine: false,
    under16Note:
      "If you are under 16, the pharmacist will talk with you privately. You do not need a parent to sign.",
    sections: [
      {
        heading: "About this time",
        questions: [
          {
            id: "upsi-when",
            text: "When did the unprotected sex, or the contraception problem, happen? (date and roughly what time)",
            type: "text",
          },
          {
            id: "other-upsi",
            text: "Have you had any other unprotected sex since your last period?",
            help: "If yes, write when in the box below.",
          },
          {
            id: "contraception",
            text: "What contraception, if any, do you usually use?",
            type: "text",
          },
          {
            id: "hormonal-7-days",
            text: "Have you taken any hormonal contraception (such as the pill, mini pill, patch or ring) in the last 7 days?",
          },
          {
            id: "ec-this-cycle",
            text: "Have you already taken emergency contraception since your last period?",
          },
          {
            id: "upsi-details",
            text: "Details (other dates, or which emergency contraception you took):",
            type: "text",
          },
        ],
      },
      {
        heading: "Your periods",
        questions: [
          {
            id: "lmp",
            text: "First day of your last period (date):",
            type: "text",
          },
          {
            id: "cycle",
            text: "How many days are there usually between your periods, and are they regular?",
            type: "text",
          },
          {
            id: "possibly-pregnant",
            text: "Was your last period late, lighter or shorter than usual, or do you think you could already be pregnant?",
          },
        ],
      },
      {
        heading: "Your health",
        questions: [
          {
            id: "weight",
            text: "Do you weigh 70kg (about 11 stone) or more, or has your BMI been 26 or more?",
            help: "This can affect which emergency contraception works best for you.",
          },
          { id: "breastfeeding", text: "Are you breastfeeding?" },
          {
            id: "enzyme-inducers",
            text: "In the last 4 weeks, have you taken any medicines for epilepsy, rifampicin, HIV medicines, or St John's Wort?",
            help: "These can stop some emergency contraception working as well.",
          },
          {
            id: "liver",
            text: "Do you have severe liver disease, such as cirrhosis?",
          },
          {
            id: "absorption",
            text: "Do you have Crohn's disease, or another condition that affects how your body absorbs medicines?",
          },
          {
            id: "ectopic",
            text: "Have you ever had an ectopic pregnancy (a pregnancy outside the womb)?",
          },
          {
            id: "asthma",
            text: "Do you have severe asthma that needs steroid tablets and is not well controlled?",
          },
          {
            id: "galactose",
            text: "Have you been told you have a rare inherited condition called galactose intolerance?",
          },
          { id: "porphyria", text: "Do you have porphyria?" },
          {
            id: "ec-allergy",
            text: "Have you ever had an allergic reaction to emergency contraception (levonorgestrel or ulipristal)?",
          },
        ],
      },
    ],
    consent: EC_CONSENT,
    pharmacyChecks: [
      "Aged under 13: not supplied, same-day referral and safeguarding referral made",
      "Aged 13 to 15: Fraser competence, coercion, partner age and safeguarding assessed and recorded",
      "Within 72 hours (levonorgestrel) or 120 hours (ulipristal) of unprotected sex",
      "Copper IUD discussed and offered",
      "Enzyme inducer in last 4 weeks: IUD offered, or levonorgestrel 3 mg (not ulipristal)",
      "Weight 70 kg or over or BMI 26 or over: ulipristal preferred, or levonorgestrel 3 mg recorded",
      "Hormonal contraception in the last 7 days: levonorgestrel considered; if ulipristal given, restart hormonal contraception only after 5 days and use condoms meanwhile",
      "Medicine supplied:  Levonorgestrel 1.5 mg  /  Levonorgestrel 3 mg  /  Ulipristal 30 mg",
    ],
  },
];

/** Slugs that have a printable patient form. */
export const PATIENT_FORM_SLUGS: ReadonlySet<string> = new Set(
  PATIENT_FORMS.map((f) => f.slug),
);

export function getPatientForm(slug: string): PatientFormConfig | undefined {
  return PATIENT_FORMS.find((f) => f.slug === slug);
}
