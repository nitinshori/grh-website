const {build,Packer,fs}=require('./gen.js');

// Melatonin 5 mg for adults: insomnia and jet lag. Version 001, 15 October 2026.
// Slug: melatonin. Output: melatonin-v001-SIGNED.docx.
//
// Rebuilt on 15 October 2026 to the Medical Director's binding decisions of
// that day, which replaced the first draft (all ages, four arms):
//   - ADULTS ONLY, 18 and over. No children's arm and no paediatric
//     continuation.
//   - A separate PGD from the Get Real Health Circadin PGD (slug
//     sleep-melatonin, v010), which is untouched. Circadin is not used here.
//   - One licensed product range: Adaflex 5 mg tablets, with Adaflex 3 mg
//     tablets from the same licensed range (AGB-Pharma AB). For jet lag only,
//     Melatonin 3 mg film-coated tablets (Colonis) may be used at 3 mg.
//     Unlicensed melatonin is never supplied (HMR 2012; NICE MPG2).
//   - Arm A: adult insomnia, OFF-LABEL (Adaflex is licensed for adult jet lag
//     and ADHD insomnia in children, not adult insomnia). Pharmacists only.
//   - Arm B: adult jet lag, licensed. Pharmacists or pharmacy technicians.
//
// Both review findings that still apply to an adult PGD are applied (falls
// definition, safety-critical work, pharmacist-only insomnia arm, sleep
// hygiene first, extended history and screens, prescribed melatonin,
// adult safeguarding, autoimmune wording, NSAID and beta-blocker timing
// advice removed, self-reported course counting, review window, calendar
// span, part packs, two courses then GP review, import rules).

// ── Shared wording, so that the same rule reads the same in both arms ──────

const CEILING='THE CEILING: one dose of melatonin a night, never more than 5 mg in 24 hours, counting every melatonin product the patient takes from any source. 3 mg is the maximum for a patient aged 65 or over, and for a patient taking any medicine containing an oestrogen (combined hormonal contraception as a pill, patch or ring, or HRT in any form). Only Adaflex 5 mg tablets are supplied at 5 mg.';

const FALLS='FALLS: ONE DEFINITION FOR THE WHOLE PGD. Ask every patient about falls. In the last 12 months: any fall (including any fall with injury): refer, do not supply. Counsel every patient who is supplied about getting up at night: sit on the edge of the bed for a moment before standing, put a light on, and keep the way to the toilet clear.';

const DEFS=[
 {bullet:'A SUPPLY is one consultation at which melatonin is handed over under this PGD. The day of a supply is day 0, and the first dose is taken that night.',b:true},
 {bullet:'AN INSOMNIA COURSE (arm A) is up to three supplies of 30 tablets: no more than 90 tablets and 90 nights of treatment. It begins on the day of supply 1 and ends at the first of: the last tablet of supply 3 being taken; a stopping rule applying; a review not attended by day 37 after the last supply; or day 103 after supply 1.',b:true},
 {bullet:'THE REVIEW WINDOW (arm A) is day 21 to day 30 after a supply. Supply 1 and supply 2 each contain 30 tablets, so a patient reviewed in the window is never without tablets. A review from day 31 to day 37 is still accepted: the patient will have been without tablets for up to 7 nights, which is recorded and does not restart the course. After day 37 the course has ended, and any further supply is supply 1 of a new course.'},
 {bullet:'CALENDAR SPAN (arm A): with the latest accepted reviews (day 37 after supply 1, and day 37 after supply 2, which is day 74), the last tablet of supply 3 is taken no later than day 103. A course therefore spans no more than 104 calendar days (about 15 weeks) from supply 1, and never gives more than 90 nights of treatment.',b:true},
 {bullet:'"ON REPEAT" and "REPEAT SUPPLY" mean supply 2 or supply 3 of an insomnia course, made only after an in-person review by a pharmacist at which the review criteria are met. They never mean a supply without a consultation, and this PGD never supplies melatonin on a repeat prescription basis.'},
 {bullet:'COUNTING COURSES (arm A): for THIS PGD\'s limits (the 6 month interval and the two-course rule), courses of melatonin for insomnia supplied under the Get Real Health Circadin PGD are counted as well as courses under this PGD. They are identified from the patient\'s account and the pharmacy\'s records; self-report is sufficient, no proof is required, and the answer is recorded. A course counts once supply 1 has been made, however it ended. This PGD sets its own limits only; the Circadin PGD applies its own rules.',b:true},
 {bullet:'A JET LAG COURSE (arm B) is the nights for which melatonin is taken after one journey: no more than 5 consecutive nights.'},
];

const RED_FLAGS=[
 {bullet:'Each red flag below is a referral, not a supply, in both arms. In arm A the pharmacist asks about every one and completes the screens in Appendix 2 (PHQ-2, GAD-2, STOP-Bang, Epworth) for every patient. In arm B the practitioner asks about them as symptoms; the scored screens are not required, and a traveller who describes any of these problems is referred. In arm B a pharmacy technician refers any red flag to the pharmacist, who makes the referral set out below.'},
 {bullet:'POSSIBLE SLEEP APNOEA: STOP-Bang score of 5 or more, or witnessed pauses in breathing, choking or gasping in sleep at any score, or an Epworth Sleepiness Scale score above 10 (Appendix 2). Do not supply; refer to the GP.',b:true},
 {bullet:'DEPRESSION OR ANXIETY: PHQ-2 score of 3 or more, or GAD-2 score of 3 or more (Appendix 2), or anxiety or low mood that the patient says drives the sleep problem. Do not supply; refer to the GP. ANY thoughts of self-harm or suicide, whatever the scores: same-day referral (GP, NHS 111, or 999 if there is immediate risk), and do not leave a person at immediate risk alone.',b:true},
 {bullet:'POSSIBLE OVERACTIVE THYROID: palpitations, tremor, heat intolerance, sweating, or weight loss without trying. Do not supply; refer to the GP.'},
 {bullet:'MENOPAUSAL SYMPTOMS: night sweats or hot flushes that wake the patient. Do not supply; refer to the GP to consider treating the cause.'},
 {bullet:'RESTLESS LEGS (an urge to move the legs at night relieved by movement), pain that prevents sleep or wakes the patient, waking repeatedly to pass urine, breathlessness when lying flat, or a new neurological symptom. Do not supply; refer to the GP.'},
 {bullet:'RECREATIONAL DRUGS: current use of recreational drugs, or insomnia during withdrawal from cannabis, alcohol or another substance; alcohol used to get to sleep, or a harmful drinking pattern. Do not supply; refer to the GP or a local drug and alcohol service.'},
 {bullet:'Falling asleep suddenly in the day, collapse with emotion (cataplexy), acting out dreams, or sleepwalking with injury: suspect narcolepsy or a parasomnia; do not supply; refer to the GP for a sleep service.'},
 {bullet:'New confusion or memory problems, or a diagnosis of dementia: do not supply (NICE NG97: do not offer melatonin for insomnia in Alzheimer\'s disease); refer to the GP.'},
 {bullet:'ALREADY PRESCRIBED MELATONIN by a doctor or other prescriber, for any reason: do not supply; refer back to the prescriber.',b:true},
 {bullet:'ADULT SAFEGUARDING: the request is made by a relative or carer for an adult who is not present or who lacks capacity to consent; the patient lives in a care home; or there is any concern of abuse, neglect, coercion or exploitation (including someone asking for melatonin to sedate another adult). Do not supply. Follow the pharmacy\'s adult safeguarding procedure the same day, refer care home residents to their GP, and contact the local authority adult safeguarding team where there is risk of harm.',b:true},
];

const COMMON_EXCL=[
 {bullet:'Aged under 18. This PGD is for adults only. Refer a child or young person to their GP.',b:true},
 {bullet:'Hypersensitivity to melatonin or to any excipient of the product to be supplied.'},
 {bullet:'Hepatic impairment of any degree, cirrhosis or chronic liver disease (the SmPC: clearance is reduced in cirrhosis; not recommended in moderate or severe hepatic impairment; this PGD refers at any degree).'},
 {bullet:'Severe renal impairment (known eGFR below 30 ml/min/1.73m2) or dialysis. Lesser degrees of known renal impairment are a caution.'},
 {bullet:'AUTOIMMUNE DISEASE, whether active or quiescent, for example rheumatoid arthritis, systemic lupus erythematosus, multiple sclerosis, inflammatory bowel disease, psoriasis or psoriatic arthritis, type 1 diabetes, coeliac disease or autoimmune thyroid disease. The immediate-release SmPCs state that there are no data on melatonin in autoimmune disease, that occasional case reports have described exacerbation, and that melatonin tablets are not recommended.',b:true},
 {bullet:'Epilepsy or any history of seizures (the SmPC: melatonin has been reported to increase, decrease or not affect seizure frequency; this PGD refers rather than supplies).'},
 {bullet:'Pregnancy, possible pregnancy, planning a pregnancy, or breastfeeding. A woman of childbearing potential who is not using contraception (the SmPC: not recommended).'},
 {bullet:'Taking FLUVOXAMINE; any benzodiazepine, z-drug (zopiclone, zolpidem, zaleplon), daridorexant or other prescribed hypnotic; WARFARIN or another vitamin K antagonist; or 5-methoxypsoralen or 8-methoxypsoralen.',b:true},
 {bullet:'Already prescribed melatonin (refer to the prescriber), or taking melatonin from any other source (bought abroad, online, or sold as a supplement) and not willing to stop it. Where the patient agrees to stop, record the product.'},
 {bullet:'Any fall as defined under Falls (How to use this PGD).',b:true},
 {bullet:'Any red flag under Red flags (How to use this PGD), including adult safeguarding. Each one is a referral, not a supply.'},
 {bullet:'The patient is not present in person, lacks capacity to consent to this treatment, or declines. A relative or carer cannot request or consent on an adult\'s behalf under this PGD.'},
];

const RENAL_SLOT='RENAL_SLOT';
const CAUTION_RENAL_A={text:'RENAL IMPAIRMENT short of severe: caution; the effect on melatonin has not been studied. Supply only where the pharmacist is satisfied it is mild and stable.'};
const CAUTION_RENAL_B={text:'KNOWN RENAL IMPAIRMENT short of severe: refer to a pharmacist (a pharmacy technician does not supply). The pharmacist supplies only where satisfied it is mild and stable; the effect on melatonin has not been studied.',b:true};
const cautionsFor=(renal)=>CAUTIONS_COMMON.map(x=>x===RENAL_SLOT?renal:x);
const CAUTIONS_COMMON=[
 {text:'DROWSINESS AND DRIVING. Melatonin has a moderate influence on the ability to drive and use machines. Advise the patient not to drive, cycle, operate machinery or work at height if drowsy, and to take particular care the next morning after the first few doses. A patient who must be alert at night (for example a carer, or a parent of an infant) is counselled specifically, and the advice is recorded.',b:true},
 {text:'OESTROGENS: combined hormonal contraception containing ethinylestradiol can raise melatonin levels 4 to 5 fold (Adaflex SmPC). The SmPC reports that HRT delays the melatonin peak without other effect on concentration; as a precaution this PGD treats every medicine containing an oestrogen the same way. 3 MG MAXIMUM for any patient taking an oestrogen, in both arms; never 5 mg.',b:true},
 {text:'OTHER MEDICINES THAT RAISE MELATONIN LEVELS: cimetidine, ciprofloxacin, norfloxacin and verapamil. Where the patient takes one of these AND another sedating medicine (an opioid, a gabapentinoid, a sedating antihistamine, a tricyclic antidepressant, an antipsychotic, or any other medicine that causes drowsiness), refer instead of supplying. Otherwise supply with counselling about increased drowsiness, and record it.'},
 {text:'OTHER SEDATING MEDICINES taken without one of the medicines above: supply with counselling about additive drowsiness.'},
 {text:'MEDICINES THAT LOWER MELATONIN LEVELS: carbamazepine, phenytoin, rifampicin, omeprazole, and smoking (smoking halves exposure; starting or stopping smoking changes the effect). Not an exclusion; tell the patient the effect may be less, and record it.'},
 {text:'NIFEDIPINE AND OTHER CALCIUM CHANNEL BLOCKERS: melatonin may reduce their blood pressure lowering effect. Not an exclusion; advise the patient to keep any planned blood pressure checks and to tell their prescriber they are taking melatonin.'},
 {text:'DIABETES OR IMPAIRED GLUCOSE TOLERANCE: melatonin taken close to a carbohydrate-rich meal may impair glucose control for several hours. The no-food rule (2 hours before and 2 hours after a dose) applies to everyone; in diabetes the dose should ideally be at least 3 hours after a meal. Advise more frequent glucose monitoring where the patient monitors.'},
 RENAL_SLOT,
 {text:'AGED 65 AND OVER: the SmPC advises caution and individual dosage because it is unclear whether older people are more sensitive. 3 MG MAXIMUM; never 5 mg.'},
 {text:'ALCOHOL should not be taken with melatonin: it reduces the effect on sleep and adds to drowsiness.'},
];

const STOP_RULES='ONE RULE PER PROBLEM, at any review or contact, in both arms: (1) arm A, no improvement in sleep (the NO BETTER band in the arm A review rules) at review 2, or at review 1 where 5 mg is not allowed: STOP, no further supply, refer to the GP. (2) Drowsiness the next day that affects daily activities, or any fall while taking melatonin: STOP, no further supply under this PGD, refer to the GP (the same day if there has been a fall with injury). (3) New or worse low mood or anxiety: STOP and refer to the GP, the same day if there are thoughts of self-harm. (4) Rash, swelling of the face, lips or tongue, or difficulty breathing: STOP; difficulty breathing or swelling of the lips or tongue is an emergency (999). (5) Any other side effect the patient finds unacceptable: STOP, and the course ends. None of the problems in rules (2) to (5) is managed by changing the dose.';

const PGD_TRAINING='All users must have completed training in working under Patient Group Directions, for example the CPPE PGD e-learning and e-assessment or an equivalent, and have been assessed as competent to work under a PGD before first working under this one; previous experience of working under a PGD is not required. All users must work in compliance with the SOPs of their own employer, and must practise only within the bounds of their own competence.';

const REFERRAL_ROUTES_B=()=>[{bullet:'Routine referral to the GP: in writing (letter or secure email) with the patient\'s consent, stating the reason and findings, and any melatonin supplied. The patient is told to book a GP appointment.'}].concat(REFERRAL_ROUTES.slice(1));
const REFERRAL_ROUTES=[
 {bullet:'Routine referral to the GP: in writing (letter or secure email) with the patient\'s consent, stating the reason, the screens and findings, and any melatonin supplied. The patient is told to book a GP appointment.'},
 {bullet:'Same-day referral: thoughts of self-harm or suicide (GP the same day, NHS 111, or 999 where there is immediate risk); a fall with injury; an adult safeguarding concern (the pharmacy\'s safeguarding procedure and the local authority adult safeguarding team).'},
 {bullet:'Emergency (999): difficulty breathing, or swelling of the lips, tongue or throat.'},
 {bullet:'Already prescribed melatonin: refer back to the prescriber.'},
 {bullet:'Where the pharmacist is unsure whether supply is appropriate, seek advice from the GP or from the Get Real Health clinical team before supplying, and do not supply until the doubt is resolved.'},
];

// ── The document ─────────────────────────────────────────────────────────

const d={
 banner:'ISSUED, VALID FROM 15 OCTOBER 2026',
 title:'Melatonin 5 mg for Adults: Insomnia and Jet Lag',
 strap:'Patient Group Direction, version 001, issued 15 October 2026. Get Real Health Limited. Melatonin, licensed Adaflex 3 mg and 5 mg tablets, adults aged 18 and over only, never more than 5 mg in 24 hours. Two arms: A, insomnia in adults (OFF-LABEL, pharmacists only), a course of up to three 30-tablet supplies; and B, jet lag in adults (licensed), up to 5 nights per journey.',
 cover:{action:'supply',drugs:'melatonin (Adaflex 5 mg tablets and Adaflex 3 mg tablets; for jet lag only, also Melatonin 3 mg film-coated tablets)',condition:'Insomnia and Jet Lag in Adults',age:'Adults aged 18 years and over only. No children.'},
 purpose:{
   for:'This Patient Group Direction, issued by Get Real Health Limited, authorises the supply of licensed immediate-release melatonin tablets, never more than 5 mg in 24 hours, to adults aged 18 and over, face to face on the premises, without a prescription, in two arms: insomnia (off-label) and jet lag (licensed). Every product supplied is a UK-licensed medicine. Sleep hygiene advice is given to every insomnia patient, and jet lag advice to every traveller, whether or not anything is supplied. Supply is a private service.',
   authorises:[
    'ARM A, ADULTS AGED 18 AND OVER, INSOMNIA (OFF-LABEL): Adaflex 3 mg tablets, one tablet nightly 1 to 2 hours before bedtime, increased once to Adaflex 5 mg where the review criteria allow; a course of up to three supplies of 30 tablets (90 nights at most, within 104 calendar days), with an in-person pharmacist review before supply 2 and supply 3, a stop rule if there is no benefit, GP notification, and a documented GP review before any third or later course.',
    'ARM B, ADULTS AGED 18 AND OVER, JET LAG (LICENSED): melatonin 3 mg (Adaflex 3 mg tablets or Melatonin 3 mg film-coated tablets), or Adaflex 5 mg tablets where the 5 mg criteria are met, at destination bedtime for up to 5 nights per journey; up to 10 doses per supply and no more than four supplies in any 12 months.',
   ],
   staff:'Arm A (insomnia): registered pharmacists only, because it depends on a diagnostic sift for secondary causes of insomnia and on off-label consent. Arm B (jet lag): registered pharmacists or registered pharmacy technicians.',
   notFor:[
    'Anyone under 18, for any indication. This PGD has no children\'s arm and does not continue melatonin started for a child or young person.',
    'Any unlicensed melatonin: imported products, specials, and anything sold as a food supplement. A PGD can only cover a licensed medicine.',
    'Circadin or any prolonged-release melatonin. Patients aged 55 and over may instead be eligible under the separate Get Real Health Circadin PGD (see How to use this PGD).',
    'Any dose above 5 mg in 24 hours from all sources combined; any dose above 3 mg for a patient aged 65 or over or taking an oestrogen; and more than one dose a night.',
    'A patient already prescribed melatonin. Refer to the prescriber.',
    'Insomnia that is secondary to another condition, a medicine or a substance; shift work; professional drivers and safety-critical workers (arm A); and any red flag. These are referrals.',
    'An adult who is not present, who lacks capacity to consent, or who lives in a care home; and any request made by a carer or relative on an adult\'s behalf.',
    'Remote or telephone consultations. The patient is seen on the premises.',
   ],
  },

 intro:[
  {h:'Which arm'},
  {bullet:'Adults only: confirm the patient is aged 18 or over on the day of supply. Adult with difficulty sleeping at home, and no secondary cause: arm A (pharmacist only). Adult travelling by air across 5 or more time zones: arm B. Anyone who fits neither arm is referred and given the relevant advice.',b:true},
  {bullet:'PATIENTS AGED 55 AND OVER WITH INSOMNIA may also be eligible under the separate Get Real Health Circadin PGD (Insomnia in Adults Aged 55 and Over (Circadin)). The pharmacist chooses ONE route for each course and records which, and does not switch route within a course. Courses supplied under the Circadin PGD count towards this PGD\'s course limits (see Counting courses under Definitions).',b:true},
  {bullet:'A patient in the middle of an arm A course is not supplied under arm B: they take no more than one dose of melatonin a night.'},
  {bullet:CEILING,b:true},
  {h:'Licensed, off-label and unlicensed'},
  {bullet:'Every product named in this PGD holds a UK marketing authorisation. Arm B is within the licence of the product supplied. ARM A IS OFF-LABEL: Adaflex is licensed for jet lag in adults and for insomnia in children aged 6 to 17 with ADHD, not for insomnia in adults. The basis on which arm A is authorised, as the Medical Director\'s decision, is set out in that arm, and the patient is told and consents on that basis.',b:true},
  {bullet:'Unlicensed melatonin cannot be supplied under a PGD. Do not supply, recommend or endorse melatonin sold as a food supplement or bought online; tell the patient it is unregulated in the UK and that the dose on the label may not be what is in the product.'},
  {h:'Sleep hygiene comes first'},
  {bullet:'Give the sleep hygiene advice in Appendix 1 to every insomnia patient, whether or not anything is supplied, in writing as well as in conversation. Cognitive behavioural therapy for insomnia (CBT-I) is the first-line treatment in NICE CKS and works better than any tablet over time; tell the patient how to access it (NHS Talking Therapies self-referral, or a digital CBT-I programme recommended by NICE) and record that you did.',b:true},
  {h:'Red flags'},
  ...RED_FLAGS,
  {h:'Falls'},
  {bullet:FALLS,b:true},
  {h:'Definitions used throughout'},
  ...DEFS,
  {h:'Stopping rules'},
  {bullet:STOP_RULES,b:true},
 ],

 guidelines:require('./guidelines/melatonin.js'),

 arms:[

 // ── ARM A ────────────────────────────────────────────────────────────────
 {
  title:'Arm A: melatonin 3 mg to 5 mg, insomnia in adults (off-label)',
  drug:'Arm A: Adaflex 3 mg and 5 mg tablets (melatonin), insomnia in adults aged 18 and over (OFF-LABEL)',
  subtitle:'Patient Group Direction for the OFF-LABEL supply of Adaflex 3 mg and 5 mg tablets (immediate-release melatonin, a UK-licensed medicine) for the short-term treatment of insomnia in adults aged 18 years and over. Adaflex is licensed for jet lag in adults and for insomnia in children aged 6 to 17 with ADHD; its use for insomnia in adults is outside the licence.',
  note:'OFF-LABEL ARM. Pharmacists only. The patient is told that the supply is outside the licence, why, and what the alternatives are, and consents on that basis. The GP is told of every course.',
  training:[
   'Pharmacist registered and practising with the GPhC. This arm is not used by pharmacy technicians: the diagnostic sift for secondary insomnia and the off-label consent are the pharmacist\'s.',
   'ALL USERS MUST BE ABLE TO DISTINGUISH PRIMARY FROM SECONDARY INSOMNIA and must take the history set out in this arm, covering mood and anxiety, thyroid symptoms, menopausal symptoms, pain, snoring and daytime sleepiness, restless legs, night-time urination, shift work, alcohol, caffeine, recreational drugs and withdrawal, falls, cognition and the full medicine list including decongestants.',
   'All users must be competent to administer and score the PHQ-2, GAD-2, STOP-Bang and Epworth Sleepiness Scale as set out in Appendix 2, and to respond to a disclosure of thoughts of self-harm, including same-day and emergency referral.',
   'All users must have completed adult safeguarding training to at least level 2 and know the pharmacy\'s adult safeguarding procedure.',
   'All users must understand what off-label supply under a PGD means, be able to explain it to a patient in plain language, and record the consent. Indemnity must cover off-label supply under this PGD.',
   'All users must be competent to give sleep hygiene advice and to signpost cognitive behavioural therapy for insomnia.',
   PGD_TRAINING,
  ],
  pgd:[
   ['Indication','Short-term treatment of insomnia (difficulty getting to sleep, staying asleep, or waking early and not getting back to sleep) in an adult aged 18 or over, where there is no secondary cause and no red flag, sleep hygiene has been tried first (or severe daytime impairment is documented), and the patient, having been offered CBT-I, wishes to take a short course of medicine. OFF-LABEL: see the next row.'],
   ['Off-label use: statement and basis (NICE MPG2 1.1.7)',[
     {text:'THIS IS OFF-LABEL USE OF A LICENSED MEDICINE. Adaflex 3 mg and 5 mg tablets hold UK marketing authorisations (PL 52497/0003 and PL 52497/0005) for the short-term treatment of jet lag in adults and for insomnia in children and adolescents aged 6 to 17 with ADHD. Supply for insomnia in adults is outside those licences. No UK guideline recommends immediate-release melatonin for insomnia in adults.',b:true},
     {text:'BASIS, RECORDED AS THE DECISION OF THE MEDICAL DIRECTOR, 15 OCTOBER 2026, and accepted by the Head Pharmacist:'},
     {bullet:'Clinical experience: in the Medical Director\'s clinical experience, a short course of melatonin helps some adults whose insomnia has not responded to sleep hygiene alone. Melatonin has a recognised hypnotic and sedative effect and increases the propensity to sleep (Adaflex SmPC, section 5.1), and prolonged-release melatonin is licensed, and recommended by NICE CKS, for short-term use in insomnia in adults over 55.'},
     {bullet:'The evidence is limited, and the patient is told so: the benefit of immediate-release melatonin for insomnia in adults has not been established to the standard of a licence, and national guidance does not recommend it. It is offered as a short, reviewed trial that stops if it does not help, alongside sleep hygiene and CBT-I, not instead of them.'},
     {bullet:'Safety: the dose (3 mg, and 5 mg at most) is within the licensed adult dose range of the same product (1 to 5 mg for jet lag). The SmPC states that melatonin causes few, and no serious, adverse reactions in the short term, up to three months, and the course here gives no more than 90 nights. The alternative short-term hypnotics that NICE CKS mentions for adults, the z-drugs, carry recognised risks of dependence, tolerance and next-day impairment.'},
     {bullet:'Limits: pharmacists only; a full history and screening for secondary causes; exclusions for falls, safety-critical work and the SmPC cautions; an in-person review before each further supply; a stop rule if there is no benefit, with referral to the GP; a fixed course of 90 nights at most; and a documented GP review before any third or later course.'},
     {bullet:'Consent and notification: the patient is told in plain language that the use is off-label and signs the consent statement in Appendix 4, and the GP is informed within 7 days of supply 1 and at the end of the course.'},
   ]],
   ['Inclusion criteria',[
     {bullet:'Aged 18 years or over on the day of supply, present in person, with capacity to consent.',b:true},
     {bullet:'Difficulty getting to sleep, staying asleep, or waking early, on at least 3 nights a week for at least 4 weeks, affecting daytime functioning.'},
     {bullet:'The history in Records has been taken and no secondary cause, no red flag and no fall (as defined) is present. Screens (Appendix 2): PHQ-2 below 3, GAD-2 below 3, STOP-Bang below 5 with no witnessed pauses in breathing, choking or gasping, and Epworth Sleepiness Scale 10 or below.',b:true},
     {bullet:'SLEEP HYGIENE FIRST: the advice in Appendix 1 has been followed for at least 2 weeks before supply 1 without sufficient benefit; OR severe daytime impairment is documented (what it is, for example unable to work or to care for dependants safely, and why waiting 2 weeks is not reasonable), in which case sleep hygiene starts today alongside the course. CBT-I has been offered and signposted.',b:true},
     {bullet:'Registered with a GP, and agrees to the GP being informed within 7 days of supply 1 and at the end of the course. A patient who will not allow the GP to be told is not supplied.',b:true},
     {bullet:'For a woman of childbearing potential: not pregnant, not breastfeeding, not planning a pregnancy, and using contraception.'},
     {bullet:'Explicit consent to off-label treatment after the explanation under Counselling, with the consent statement in Appendix 4 signed by the patient.',b:true},
     {bullet:'SUPPLY 1 OF A COURSE: no course of melatonin for insomnia (under this PGD or the Get Real Health Circadin PGD) has ended in the last 6 months; and, where the patient has already had two or more such courses, a GP review since the end of the most recent course is documented (a letter, a record in the NHS App or Summary Care Record, or the GP\'s reply to the pharmacy) and does not advise against further melatonin. Previous courses are counted from the pharmacy record and the patient\'s own account.',b:true},
     {bullet:'SUPPLY 2 OR SUPPLY 3 (on repeat, as defined): reviewed in person by a pharmacist within the review window (day 21 to day 30 after the last supply, accepted up to day 37), the arm A review rules permit a further supply, and the course total will not exceed three supplies, 90 tablets or day 103 after supply 1.',b:true},
     {bullet:'No exclusion criterion present.'},
   ]],
   ['Exclusion criteria: secondary insomnia, refer',[
     {text:'Where any of these is present the insomnia is likely to be secondary. Refer to the GP; do not supply.',b:true},
     {bullet:'Any red flag (How to use this PGD): possible sleep apnoea, depression or anxiety, overactive thyroid, menopausal night sweats, restless legs, pain, nocturia, recreational drugs or withdrawal, narcolepsy or parasomnia, cognitive impairment.'},
     {bullet:'SHIFT WORK of any pattern, or a delayed sleep pattern (falling asleep very late and sleeping late when free to do so), which suggests a circadian rhythm disorder and needs assessment.'},
     {bullet:'Caffeine late in the day or in high total amounts, not yet addressed.'},
     {bullet:'A medicine that could be causing the insomnia, for example a DECONGESTANT (pseudoephedrine, phenylephrine), a corticosteroid, a beta-agonist, an SSRI or SNRI started or changed before the insomnia began, a stimulant, levothyroxine recently started or increased, or a diuretic taken in the evening.',b:true},
     {bullet:'Insomnia present for less than 4 weeks. Give sleep hygiene advice; do not medicate a short-lived disturbance.'},
   ]],
   ['Exclusion criteria: all other',[
     {text:'Refer, do not supply, where any of the following applies.',b:true},
     ...COMMON_EXCL,
     {bullet:'PROFESSIONAL DRIVERS AND SAFETY-CRITICAL WORKERS: anyone who drives for a living (including taxi, delivery, bus, lorry and emergency vehicle drivers), pilots and aircrew, train drivers, air traffic controllers, operators of dangerous machinery, and anyone working at height or in another role where next-day drowsiness is a safety risk. Refer to the GP (NICE CKS advises specialist advice for occupational at-risk groups).',b:true},
     {bullet:'Currently in a course under the Get Real Health Circadin PGD. One route per course.'},
     {bullet:'Supply 1 requested within 6 months of the end of a previous course, or after two or more courses without a documented GP review as described under Inclusion criteria.'},
     {bullet:'At supply 2 or supply 3: a stopping rule applies, the review rules do not permit a further supply, the review was not in person, or it is after day 37.'},
   ]],
   ['Patients aged 55 and over','May be eligible under this arm or under the separate Get Real Health Circadin PGD (licensed for primary insomnia from age 55). The pharmacist chooses one route for the course, records which and why, and does not switch within a course. Courses supplied under the Circadin PGD count towards this PGD\'s 6 month interval and two-course rule (see Counting courses under Definitions).'],
   ['Cautions',cautionsFor(CAUTION_RENAL_A)],
   ['Review rules and stopping rules',[
     {text:'At every review, ask and record: sleep compared with the start (the patient\'s own 0 to 10 rating of their sleep quality, recorded at supply 1 and at each review, and nights a week affected), next-day drowsiness, falls, mood (repeat the PHQ-2 and GAD-2), side effects, other melatonin, new medicines, and adherence to the timing and no-food rules.',b:true},
     {bullet:'SLEEP RATING BANDS, used for every review decision: the change in the patient\'s 0 to 10 sleep quality rating from the baseline recorded at supply 1. CLEARLY BETTER: improved by 3 or more points. A LITTLE BETTER: improved by 1 or 2 points. NO BETTER: no change, or worse. Record the rating and the band.',b:true},
     {bullet:'REVIEW 1 (before supply 2): CLEARLY BETTER and tablets tolerated: supply 2 at 3 mg. A LITTLE BETTER or NO BETTER, tablets tolerated, and the patient is under 65, takes no oestrogen and has no caution that makes a higher dose unsafe: supply 2 at 5 mg (the only dose increase in the course). A LITTLE BETTER but the patient cannot have 5 mg: supply 2 at 3 mg. NO BETTER and the patient cannot have 5 mg: STOP (stopping rule 1), refer to the GP.',b:true},
     {bullet:'REVIEW 2 (before supply 3): NO BETTER: STOP (stopping rule 1), no supply 3, refer to the GP. CLEARLY BETTER or A LITTLE BETTER: supply 3 at the same dose; where the patient is still on 3 mg, is A LITTLE BETTER, and the 5 mg criteria above are met, supply 3 may be at 5 mg.',b:true},
     {bullet:'Stopping rules (2) to (5) (How to use this PGD) at any time: STOP. None of these problems is managed by changing the dose.'},
     {bullet:'END OF COURSE: after supply 3, or at any stop, the GP is informed. No further melatonin under this PGD for 6 months; and after two courses in total, none until a GP review is documented.'},
   ]],
   ['Actions if the patient is excluded or declines',[
     {bullet:'Explain why and what to do instead. Where the exclusion is a possible secondary cause or a red flag, name it and make the referral concrete: snoring with daytime sleepiness needs a sleep apnoea assessment; low mood needs a mood assessment, the same day if there are thoughts of self-harm.'},
     {bullet:'Give the sleep hygiene advice in Appendix 1 in every case, and signpost CBT-I.'},
     {bullet:'Document the reason, the advice and the referral. Inform the GP with the patient\'s consent.'},
   ]],
   ['Arrangements for referral and further advice',REFERRAL_ROUTES],
   ['Yellow Card reporting','Report suspected adverse reactions via https://yellowcard.mhra.gov.uk and inform the GP. Because this is off-label use, report every suspected adverse reaction.'],
   ['Records to be kept',[
     {bullet:'Patient name, address, date of birth, AGE CONFIRMED AS 18 OR OVER, GP, occupation, and that no occupational exclusion applies.',b:true},
     {bullet:'That the patient was told the supply is off-label, what the licence covers, why it is used, that benefit is uncertain and national guidance does not recommend it, and the alternatives; and that the patient signed the consent statement (Appendix 4).',b:true},
     {bullet:'Duration and pattern of the insomnia, its effect on daytime functioning, and the baseline 0 to 10 sleep quality rating.'},
     {bullet:'THE SECONDARY-CAUSE HISTORY, each asked and recorded: mood and anxiety with PHQ-2 and GAD-2 scores (and self-harm thoughts), thyroid symptoms, menopausal symptoms, pain, snoring with STOP-Bang and Epworth scores, restless legs, night-time urination, shift work, alcohol, caffeine, recreational drugs and withdrawal, cognition, falls, safeguarding, and the full medicine list including decongestants, oestrogens and any melatonin from any source.',b:true},
     {bullet:'How long sleep hygiene had been followed before supply 1, or the severe daytime impairment documented instead; and that CBT-I was signposted.'},
     {bullet:'For a woman of childbearing potential: pregnancy and breastfeeding excluded, and the contraceptive method.'},
     {bullet:'THE COURSE: supply number (1, 2 or 3), date of supply 1, tablets and strength supplied today and in the course so far, the date the previous course ended and the number of previous courses (from the pharmacy record and as reported by the patient, asked specifically about supplies elsewhere and under the Circadin PGD), any GP review documented before a third or later course, and the route chosen for a patient aged 55 or over.',b:true},
     {bullet:'At supply 2 or supply 3: the review date, the day number after the last supply, any nights without tablets, and the review findings and decision under the review rules.'},
     {bullet:'Product, PL number, strength, batch, expiry, dose, quantity, and whether a full original pack or a part pack was supplied.'},
     {bullet:'That drowsiness, driving, falls, food and alcohol advice was given.'},
     {bullet:'That the GP was informed within 7 days of supply 1 and at the end of the course, and how.'},
     {bullet:'Name and registration number of the pharmacist, and the words "off-label supply under Get Real Health PGD Melatonin 5 mg for Adults: Insomnia and Jet Lag, version 001, arm A".',b:true},
     {bullet:'Advice given if the patient is excluded or declines, and any adverse reaction and the action taken.'},
     {text:'Records signed, dated, legible and contemporaneous; electronic records acceptable; kept for 8 years.'},
   ]],
  ],
  med:[
   ['Name, form and strength','Adaflex 3 mg tablets (melatonin, PL 52497/0003) and Adaflex 5 mg tablets (melatonin, PL 52497/0005), immediate-release tablets, AGB-Pharma AB (marketing authorisation holder). Lactose free. Used OFF-LABEL for insomnia in adults. No other product is supplied under arm A.'],
   ['Legal category','POM.'],
   ['Off-label status','Off-label by indication (licensed for adult jet lag and for ADHD insomnia in children aged 6 to 17). The dose is within the licensed adult dose range of the product.'],
   ['Dose and frequency',[
     {bullet:'SUPPLY 1: 3 mg (one Adaflex 3 mg tablet) once nightly, 1 to 2 hours before bedtime. No food for 2 hours before and 2 hours after the dose.',b:true},
     {bullet:'SUPPLY 2 AND SUPPLY 3: 3 mg, or 5 mg (one Adaflex 5 mg tablet) once nightly on the same timing where the review rules allow. The dose is increased once at most, from 3 mg to 5 mg, and never above 5 mg. 3 mg is the maximum at age 65 or over and with any oestrogen.',b:true},
     {bullet:'Missed dose: skip it; do not take it later in the night or double the next dose.'},
     {bullet:'Stopping: may be stopped at any time without tapering.'},
   ]],
   ['Maximum dose and duration',[
     {bullet:'One tablet a night; 5 mg in 24 hours at most.',b:true},
     {bullet:'Per course: three supplies, 90 tablets, 90 nights of treatment, and no more than 104 calendar days from supply 1 to the last tablet. The maximum total quantity in a course is 390 mg (30 x 3 mg, then 60 x 5 mg).',b:true},
     {bullet:'Between courses: at least 6 months from the end of one course to supply 1 of the next. After two courses in total (courses under this PGD, and courses supplied under the Get Real Health Circadin PGD, counted for this PGD\'s limit), a further course only after a documented GP review. A patient who needs longer treatment is referred to the GP.',b:true},
   ]],
   ['Quantity to be supplied','SUPPLY 1: 30 tablets of Adaflex 3 mg. SUPPLY 2: 30 tablets of Adaflex 3 mg or Adaflex 5 mg. SUPPLY 3: 30 tablets of Adaflex 3 mg or Adaflex 5 mg. One strength per supply. Supply the original pack of 30 with its patient information leaflet; where only the 100-tablet pack is held, supply 30 tablets as a part pack (see Appendix 5) with a copy of the leaflet.'],
   ['Route and method of administration','Oral. Swallow with water. The tablet may be crushed and mixed with water immediately before taking.'],
   ['Labelling','Label as a dispensed medicine: "Take ONE tablet at night, 1 to 2 hours before bedtime. Do not eat for 2 hours before or 2 hours after taking." Add BNF cautionary label 2 (may cause drowsiness; if affected do not drive or operate machinery; avoid alcoholic drink).'],
   ['Storage','Do not store above 25 C. Store in the original package to protect from light.'],
   ['Drug interactions','See the exclusion criteria and cautions. Check the current SmPC and BNF against the full medicine list.'],
   ['Adverse effects','The SmPC: few, and no serious, adverse reactions in the short term (up to three months); long-term effects are poorly studied. Common: headache, somnolence. Uncommon: migraine, lethargy, dizziness, irritability, nervousness, restlessness, insomnia, abnormal dreams, nightmares, anxiety, abdominal pain, dyspepsia, mouth ulceration, dry mouth, nausea, dermatitis, night sweats, pruritus, rash, hypertension, chest pain, abnormal liver function tests, weight gain. Rare: depressed mood, syncope, memory impairment, restless legs, visual disturbance, palpitations, leucopenia, thrombocytopenia, and others listed in the SmPC. Frequency not known: hypersensitivity reactions, angioedema, hyperglycaemia. Refer to the current SmPC.'],
  ],
  pat:[
   ['Written information','The manufacturer\'s patient information leaflet (which describes the licensed uses, not insomnia in adults), the sleep hygiene advice in Appendix 1, a copy of the signed consent statement, and a written note of the review window and the stopping rules.'],
   ['Counselling',[
     {bullet:'OFF-LABEL CONSENT SCRIPT, given in substance and recorded: "This medicine, Adaflex, is melatonin. It is licensed in the UK for jet lag in adults and for sleep problems in children with ADHD, but not for insomnia in adults, so using it for you is outside its licence. It is a properly licensed medicine, not a supplement. The evidence that it helps adults with insomnia is limited, and national guidance does not recommend it, so it may not work for you. Its side effects are usually mild, mainly headache and drowsiness. The treatment that works best for poor sleep is cognitive behavioural therapy for insomnia, which we have told you how to get. If you would still like to try it, it is one tablet a night, we will review you in person before each further supply, we will stop it if your sleep has not improved, the whole course is no more than 90 nights, and we will tell your GP. Are you happy to go ahead on that basis?" The patient signs the consent statement.',b:true},
     {bullet:'One tablet a night, 1 to 2 hours before bed. Do not eat for 2 hours before or 2 hours after taking it.'},
     {bullet:'It may make you drowsy. Do not drive or use machinery if you are affected, especially the morning after the first few nights. Do not drink alcohol with it.'},
     {bullet:'Take care getting up in the night: sit on the edge of the bed for a moment first, put a light on, and keep the way to the toilet clear.'},
     {bullet:'Come back in person on day 21 to day 30 after this supply (today is day 0), before your tablets run out, if you want to continue. If your sleep has not improved, we will stop it and suggest you see your GP.',b:true},
     {bullet:'Stop and contact us or your GP if you feel drowsy in the day, have a fall, or feel low or anxious. Seek help the same day if you have thoughts of harming yourself. Call 999 for swelling of the lips or tongue or difficulty breathing.',b:true},
     {bullet:'Do not take any other melatonin, including supplements, while you are taking this. The sleep habits in the leaflet we gave you matter more than the tablets; keep them going after the course ends.'},
   ]],
   ['Follow-up','In-person pharmacist review before supply 2 and supply 3, in the review window. GP informed within 7 days of supply 1 and at the end of the course (including a stop), with the patient\'s consent. A patient mid-course when this version expires continues under the successor version, or is referred to the GP if there is none.'],
  ],
  refs:['Adaflex 3 mg tablets, Summary of Product Characteristics, emc, https://www.medicines.org.uk/emc/product/13630/smpc','Adaflex 5 mg tablets, Summary of Product Characteristics, emc, https://www.medicines.org.uk/emc/product/13632/smpc','NICE Clinical Knowledge Summary: Insomnia, last revised June 2026.','NICE guideline NG97, Dementia, recommendation on melatonin, https://www.nice.org.uk/guidance/ng97/chapter/Recommendations'],
 },

 // ── ARM B ────────────────────────────────────────────────────────────────
 {
  title:'Arm B: melatonin 3 mg or 5 mg, jet lag in adults',
  drug:'Arm B: Adaflex 3 mg or 5 mg tablets, or Melatonin 3 mg film-coated tablets, jet lag in adults aged 18 and over (licensed)',
  subtitle:'Patient Group Direction for the supply of immediate-release melatonin 3 mg, or 5 mg, for the short-term treatment of jet lag in adults aged 18 years and over travelling by air across 5 or more time zones. Within the licence of the product supplied.',
  training:[
   'Pharmacist registered and practising with the GPhC, or pharmacy technician registered and practising with the GPhC.',
   'All users must be able to explain the timing rules for jet lag (destination bedtime, not before 20:00 or after 04:00 local time, not on the aircraft), the no-food rule, and the non-drug measures and travel advice in Appendix 3.',
   'All users must know the red flags and the falls definition in this PGD, and must refer to a pharmacist any patient with a red flag and any patient whose request suggests insomnia at home rather than jet lag.',
   PGD_TRAINING,
  ],
  pgd:[
   ['Indication','Short-term treatment of jet lag in an adult aged 18 or over, for a planned journey by air crossing 5 or more time zones (in either direction; benefit is greater eastward and with more time zones crossed), in accordance with the SmPC of the product supplied.'],
   ['Inclusion criteria',[
     {bullet:'Aged 18 years or over on the day of supply, present in person, with capacity to consent.',b:true},
     {bullet:'A planned journey crossing 5 or more time zones, with the destination, dates and time difference recorded. A return journey that also crosses 5 or more time zones may be covered by the same supply.',b:true},
     {bullet:'For a woman of childbearing potential: not pregnant, not breastfeeding, not planning a pregnancy, and using contraception (the SmPCs do not recommend melatonin in women of childbearing potential not using contraception).',b:true},
     {bullet:'For 5 mg (Adaflex 5 mg only): the patient has taken melatonin 3 mg for jet lag before, it was tolerated, and it did not adequately relieve symptoms; AND that 3 mg use is either recorded (in this pharmacy\'s records or another supply record the pharmacist has seen) or was of a licensed product the patient can name and obtained on prescription or from a pharmacy. Previous use of a supplement or unlicensed melatonin does not count. The patient is under 65 and takes no oestrogen.',b:true},
     {bullet:'Fewer than four supplies under this arm in the 12 months before today.'},
     {bullet:'Not in the middle of an arm A course or a Circadin course.'},
     {bullet:'Valid informed consent.'},
     {bullet:'No exclusion criterion present.'},
   ]],
   ['Exclusion criteria',[
     {text:'Refer, do not supply, where any of the following applies.',b:true},
     ...COMMON_EXCL,
     {bullet:'Pilots, aircrew, air traffic controllers, or anyone who will be on safety-critical duty during the trip. Refer to their aviation medical examiner or occupational health service.'},
     {bullet:'Insomnia at home rather than jet lag. Refer to a pharmacist to consider arm A.'},
     {bullet:'For the Melatonin 3 mg film-coated tablet (Colonis): rare hereditary galactose intolerance, total lactase deficiency or glucose-galactose malabsorption (it contains lactose). Supply Adaflex 3 mg instead, which contains none.'},
     {bullet:'Four supplies under this arm already made in the last 12 months. Refer to a prescriber.'},
   ]],
   ['Cautions',[...cautionsFor(CAUTION_RENAL_B),
     {text:'CAFFEINE: a high caffeine intake can raise melatonin levels. In arm B this is counselling only, not an exclusion or a reason to refer: advise the traveller to limit caffeine, especially later in the day (Appendix 3).'},
     {text:'MEN PLANNING A PREGNANCY: the Colonis SmPC (section 4.6) states that Melatonin 3 mg film-coated tablets are not recommended in women and men planning pregnancy (high doses and use for longer than indicated may compromise fertility). Where the Colonis tablet is to be supplied to a man, ask whether he and his partner are planning a pregnancy; if so, counsel him on this point and record the advice.'},
     {text:'DRIVING AFTER ARRIVAL. Do not take a dose on a night after which the patient must drive or operate machinery before a full night\'s sleep.'},
   ]],
   ['Actions if the patient is excluded or declines','Explain why, give the non-drug jet lag advice in Appendix 3, and refer where the exclusion is clinical. Document the reason and the advice.'],
   ['Arrangements for referral and further advice',REFERRAL_ROUTES_B()],
   ['Yellow Card reporting','Report suspected adverse reactions via https://yellowcard.mhra.gov.uk.'],
   ['Records to be kept',[
     {bullet:'That valid informed consent was given.'},
     {bullet:'Patient name, address, date of birth, age confirmed as 18 or over, occupation, and GP.'},
     {bullet:'The journey: destination, dates, time zones crossed and direction; whether the supply covers the outward journey, the return journey, or both; and that destination import advice was given.',b:true},
     {bullet:'The full medicine list (including oestrogens), the exclusion, falls and caution checks, and for a woman of childbearing potential pregnancy, breastfeeding and contraception.'},
     {bullet:'For 5 mg: the previous 3 mg use, the product and where it came from (or the record seen), and why it was inadequate.'},
     {bullet:'Product, PL number, strength, batch, expiry, number of tablets supplied, whether a part pack, and the number of supplies under this arm in the last 12 months including today (from the pharmacy record and as reported by the patient).',b:true},
     {bullet:'That the timing, food, alcohol, drowsiness, falls and driving advice and Appendix 3 were given.'},
     {bullet:'Name and registration number of the practitioner, and that the supply was under this PGD, arm B.'},
     {text:'Records signed, dated, legible and contemporaneous; kept for 8 years.'},
   ]],
  ],
  med:[
   ['Name, form and strength',[
     {bullet:'Adaflex 3 mg tablets (AGB-Pharma AB, PL 52497/0003) or Adaflex 5 mg tablets (PL 52497/0005), immediate release, lactose free.'},
     {bullet:'Melatonin 3 mg film-coated tablets (Colonis Pharma, PL 41344/0053), immediate release, at 3 mg only; contains lactose.'},
     {bullet:'ONLY ADAFLEX 5 mg IS SUPPLIED AT 5 mg. One product and strength per supply. Record the product and PL number supplied.',b:true},
   ]],
   ['Legal category','POM.'],
   ['Dose and frequency',[
     {bullet:'3 mg once daily at the habitual bedtime at the destination, starting on the first night after arrival, for a maximum of 5 consecutive nights per journey. Not before 20:00 or after 04:00 local time at the destination, and not on the aircraft.',b:true},
     {bullet:'5 mg (Adaflex 5 mg) once daily on the same schedule, ONLY where the inclusion criterion for 5 mg is met. 3 mg maximum at age 65 or over or with any oestrogen. 5 mg is the ceiling: the 6 mg dose in the Colonis SmPC is not used under this PGD.',b:true},
     {bullet:'No food for 2 hours before and 2 hours after the dose. No alcohol while taking it.'},
     {bullet:'Missed dose: skip it; do not take it after 04:00 local time.'},
   ]],
   ['Maximum dose and duration',[
     {bullet:'One tablet a night; 5 mg in 24 hours at most; 5 nights per journey; up to two journeys (outward and return) per supply, so no more than 10 tablets (50 mg at 5 mg) per supply.',b:true},
     {bullet:'No more than four supplies under this arm in any 12 months, which keeps the patient within the licensed maximum of 16 treatment cycles a year. A patient who needs more is referred to a prescriber.',b:true},
   ]],
   ['Quantity to be supplied','10 tablets where the supply covers two journeys (5 nights each), or 5 tablets for one journey. Adaflex and the Colonis tablets come in larger packs, so arm B supplies are part packs: see Appendix 5. Supply in a suitably labelled container with a copy of the patient information leaflet.'],
   ['Route and method of administration','Oral. Swallow with water. Adaflex may be crushed and mixed with water immediately before taking.'],
   ['Labelling','Label as a dispensed medicine: "Take ONE tablet at bedtime at your destination, for up to 5 nights after each flight. Not before 8pm or after 4am local time. Do not eat for 2 hours before or 2 hours after." Add BNF cautionary label 2 (may cause drowsiness; if affected do not drive or operate machinery; avoid alcoholic drink).'],
   ['Storage','Adaflex: do not store above 25 C, protected from light. Melatonin 3 mg film-coated tablets (Colonis): Store below 25°C (SmPC section 6.4). Keep in the labelled container supplied.'],
   ['Adverse effects','Common: headache, somnolence. Uncommon: dizziness, irritability, nervousness, restlessness, abnormal dreams, anxiety, abdominal pain, dyspepsia, dry mouth, nausea, rash, pruritus, hypertension. Rare: syncope, memory impairment, palpitations, visual disturbance, leucopenia, thrombocytopenia. Frequency not known: hypersensitivity reactions, angioedema, hyperglycaemia. Side effects in jet lag studies were mild and often hard to separate from jet lag itself. Refer to the current SmPC.'],
  ],
  pat:[
   ['Written information','A copy of the patient information leaflet and the jet lag advice in Appendix 3, with the timing rules written out for this trip.'],
   ['Counselling',[
     {bullet:'Take it at bedtime at your destination, starting on the first night there, for no more than 5 nights. Not before 8pm or after 4am local time, and never on the plane.',b:true},
     {bullet:'Do not eat for 2 hours before or 2 hours after a dose, and do not drink alcohol while you are taking it.'},
     {bullet:'Limit caffeine (coffee, tea, cola, energy drinks), especially later in the day: a lot of caffeine can increase the effect of melatonin and keep you awake.'},
     {bullet:'It can make you drowsy. Do not take it on a night before you need to drive or work with machinery, and do not drive if you feel drowsy. Take care getting up in the night in an unfamiliar room.',b:true},
     {bullet:'BEFORE YOU TRAVEL, check the rules of the country you are going to: some countries restrict bringing in melatonin or treat it as a controlled or prescription medicine. Carry it in the labelled container we gave you, in your hand luggage, with this pharmacy\'s record of the supply.',b:true},
     {bullet:'Daylight at the right time of day and the advice in the leaflet we gave you do as much as the tablets.'},
     {bullet:'Stop taking it for a rash, swelling, or if it makes you feel unwell. Call the emergency number of the country you are in for swelling of the lips or tongue or difficulty breathing.'},
   ]],
   ['Follow-up','None routinely. The patient is asked to tell the pharmacy of any side effect on return. Apply the stopping rules if they report one.'],
  ],
  refs:['Adaflex 5 mg tablets, Summary of Product Characteristics, emc, https://www.medicines.org.uk/emc/product/13632/smpc','Adaflex 3 mg tablets, Summary of Product Characteristics, emc, https://www.medicines.org.uk/emc/product/13630/smpc','Melatonin 3 mg film-coated tablets (Colonis Pharma), Summary of Product Characteristics, emc, https://www.medicines.org.uk/emc/product/10405/smpc'],
 },
 ],

 appendix:[
  {h:'Appendix 1: Sleep hygiene advice for adults, to be given to every insomnia patient'},
  {text:'Give this whether or not you supply. It has the better long-term evidence.'},
  {tbl:[
   ['Timing',[{bullet:'Get up at the same time every day, including weekends. Fixing the wake time matters more than fixing the bedtime.'},{bullet:'Only go to bed when sleepy.'},{bullet:'If awake for more than about 20 minutes, get up, do something quiet and dull in another room, and go back when sleepy.'}]],
   ['Daytime',[{bullet:'Get daylight in the morning, ideally outdoors.'},{bullet:'Take regular exercise, but not in the hour or so before bed.'},{bullet:'Avoid daytime naps, or keep them short and before mid-afternoon.'}]],
   ['Substances',[{bullet:'No caffeine after midday, including tea, cola and energy drinks.'},{bullet:'Alcohol gets you to sleep and then wakes you in the night. It is not a sleep aid.'},{bullet:'Nicotine is a stimulant; avoid it near bedtime.'},{bullet:'No large meal within 2 hours of bed.'}]],
   ['The bedroom',[{bullet:'Cool, dark and quiet. Bed is for sleep: no screens or work, and no screens for at least an hour before bed.'},{bullet:'Turn the clock away from you.'}]],
   ['The evening',[{bullet:'Wind down for an hour before bed and dim the lights.'},{bullet:'Write tomorrow\'s worries down earlier in the evening.'}]],
   ['Further help',[{bullet:'Cognitive behavioural therapy for insomnia (CBT-I) is the most effective treatment for long-standing poor sleep. Ask about NHS Talking Therapies (self-referral) or a digital CBT-I programme recommended by NICE.'}]],
  ]},
  {h:'Appendix 2: Screening tools for arm A'},
  {text:'Ask each question as written and record each score. A positive screen is a referral, not a supply.',b:true},
  {tbl:[
   ['PHQ-2 (depression)',[{text:'Over the last 2 weeks, how often have you been bothered by: (1) little interest or pleasure in doing things; (2) feeling down, depressed or hopeless? Each scored 0 (not at all), 1 (several days), 2 (more than half the days) or 3 (nearly every day). Total 0 to 6. A total of 3 or more is positive: do not supply; refer to the GP.'},{text:'Whatever the score, ask directly about thoughts of self-harm or suicide. Any such thoughts: same-day referral.',b:true}]],
   ['GAD-2 (anxiety)',[{text:'Over the last 2 weeks, how often have you been bothered by: (1) feeling nervous, anxious or on edge; (2) not being able to stop or control worrying? Scored as the PHQ-2. A total of 3 or more is positive: do not supply; refer to the GP.'}]],
   ['STOP-Bang (sleep apnoea)',[{text:'One point each for: Snoring loudly; Tired, fatigued or sleepy in the daytime; Observed to stop breathing, choke or gasp in sleep; high blood Pressure, treated or not; BMI over 35; Age over 50; Neck circumference over 40 cm; Gender male. Total 0 to 8. A total of 5 or more, or any witnessed pauses in breathing, choking or gasping, is positive: do not supply; refer to the GP.'}]],
   ['Epworth Sleepiness Scale (daytime sleepiness)',[{text:'Completed by the patient on the pharmacy\'s licensed Epworth Sleepiness Scale form (eight everyday situations, each scored 0 to 3). Record the total, 0 to 24. A total above 10 is excessive daytime sleepiness: do not supply; refer to the GP. The questionnaire wording is not reproduced in this document because it is used under licence.'}]],
  ]},
  {h:'Appendix 3: Jet lag advice, with or without melatonin'},
  {bullet:'Travelling east (for example UK to Asia or Australia): seek morning daylight and avoid late evening light at the destination for the first few days.'},
  {bullet:'Travelling west (for example UK to the Americas): seek late afternoon and evening daylight, and stay up until local bedtime.'},
  {bullet:'Adopt local meal and sleep times from arrival. Keep naps short (under 30 minutes) and early in the day.'},
  {bullet:'Drink water on the flight; limit alcohol and caffeine, especially later in the day.'},
  {bullet:'For trips of 2 days or less, it may be better to stay on UK time.'},
  {bullet:'Melatonin, if supplied: at destination bedtime, not before 20:00 or after 04:00 local time, never on the plane, up to 5 nights, no food for 2 hours either side.'},
  {bullet:'IMPORT RULES: check the destination country\'s rules on bringing in melatonin before travelling (for example on the destination\'s embassy or government website); some countries restrict it or treat it as a controlled or prescription medicine. Carry it in the pharmacy-labelled container, in hand luggage.',b:true},
  {h:'Appendix 4: Off-label consent statement (arm A), signed by the patient'},
  {bullet:'The consultation record carries this statement above the patient\'s signature: "I have been told that Adaflex (melatonin) is a licensed medicine in the UK for jet lag in adults and for sleep problems in children with ADHD, and that using it for my insomnia is outside its licence. I have been told that the evidence that it helps adults with insomnia is limited and that national guidance does not recommend it, what its side effects are, that cognitive behavioural therapy for insomnia is the recommended treatment and how to get it, that the course is no more than 90 nights with an in-person review before each further supply, that it will be stopped if my sleep does not improve, and that my GP will be informed. I consent to treatment on that basis."'},
  {h:'Appendix 5: Notes for the adopting pharmacy\'s SOP'},
  {bullet:'PART PACKS. Arm B supplies (5 or 10 tablets) are always part packs, and an arm A supply is a part pack where only the 100-tablet pack is held. Split from an original manufacturer\'s pack under the pharmacy\'s own procedure: a clean, dry, light-protective container with a child-resistant closure, labelled as a dispensed medicine with the product name, strength, PL number, batch number and expiry date of the source pack, and a copy of the patient information leaflet. Record the source pack\'s batch and expiry against the supply. Keep the remaining stock in its original pack, marked as opened, with the leaflet.',b:true},
  {bullet:'BOOKING ARM A REVIEWS. At each arm A supply, book or write down the review window (day 21 to day 30 after the supply) so the patient returns before their tablets run out. Reviews are by a pharmacist, in person. A pharmacy technician who is asked for a further arm A supply passes the patient to a pharmacist.'},
  {bullet:'COUNTING. Check the pharmacy\'s records for previous supplies under this PGD and the Get Real Health Circadin PGD, and ask the patient about supplies elsewhere. The patient\'s own account is accepted and recorded; no proof is required.'},
  {bullet:'GP NOTIFICATION (arm A). Within 7 days of supply 1, and at the end of the course, send the GP the product, strength, dose, quantity, the off-label status, the screens and the reason for supply; at the end of the course, the outcome and the reason the course ended.'},
  {bullet:'STOCK. Hold only the licensed products named in this PGD. Do not hold or supply unlicensed melatonin for any purpose under this PGD.'},
  {h:'Appendix 6: Key references'},
  {bullet:'Adaflex 3 mg tablets SmPC, emc product 13630, https://www.medicines.org.uk/emc/product/13630/smpc'},
  {bullet:'Adaflex 5 mg tablets SmPC, emc product 13632, https://www.medicines.org.uk/emc/product/13632/smpc'},
  {bullet:'Melatonin 3 mg film-coated tablets (Colonis Pharma) SmPC, emc product 10405, https://www.medicines.org.uk/emc/product/10405/smpc'},
  {bullet:'NICE Clinical Knowledge Summary: Insomnia, last revised June 2026.'},
  {bullet:'NICE guideline NG97, Dementia: assessment, management and support, https://www.nice.org.uk/guidance/ng97'},
  {bullet:'NICE Medicines Practice Guideline 2 (MPG2): Patient Group Directions, https://www.nice.org.uk/guidance/mpg2'},
  {bullet:'The Human Medicines Regulations 2012, Schedule 16 (particulars to be included in a PGD).'},
  {bullet:'Get Real Health PGD: Insomnia in Adults Aged 55 and Over (Circadin), current version.'},
 ],

 adultsOnly:true,
 version:'v001',
 supersedes:'None (new PGD)',
 validFrom:'15 October 2026',
 expiry:'31 July 2027',
 reviewDate:'31 May 2027, or earlier if a product SmPC, NICE CKS Insomnia or national guidance on melatonin changes',
 sigDate:'15 October 2026',
 chDate:'15 October 2026',
 changes:[
  'New PGD (slug melatonin), issued 15 October 2026 to the Medical Director\'s decisions of that day. It is separate from the Get Real Health Circadin PGD (Insomnia in Adults Aged 55 and Over (Circadin), version 010), which is unchanged and which this PGD does not replace. The unissued first draft of this PGD (melatonin for all ages, four arms) was rebuilt before issue; the items below record the decisions.',
  'ADULTS ONLY, 18 and over. The draft children\'s continuation arm (Slenyto, Adaflex or Sleplag for ages 2 to 25) and all paediatric content (Gillick competence, children\'s safeguarding, children\'s sleep advice, the under-2 and EEG statements) are removed. Children and young people are referred to their GP or prescriber.',
  'ONE LICENSED PRODUCT RANGE. Adaflex 5 mg tablets, with Adaflex 3 mg tablets from the same licensed range (AGB-Pharma AB), are the products for both arms; Melatonin 3 mg film-coated tablets (Colonis) remain available for jet lag at 3 mg only. Circadin, Slenyto and Sleplag oral solution are removed. Unlicensed melatonin (specials, imports, supplements) is never supplied, because a PGD may only include licensed medicines (Human Medicines Regulations 2012; NICE MPG2).',
  'ARM A, ADULT INSOMNIA, OFF-LABEL. Replaces the draft Circadin arms for adults 55 and over and 18 to 54. Adaflex is used outside its licence (adult jet lag; ADHD insomnia in children) for adult insomnia: 3 mg nightly 1 to 2 hours before bed, increased once to 5 mg at review where benefit is absent or partial (never above 3 mg at 65 or over or with an oestrogen); three supplies of 30 tablets, 90 nights and 104 calendar days at most; in-person pharmacist review on day 21 to day 30 after each supply (accepted to day 37); stop and refer to the GP if there is no benefit; 6 months between courses; after two courses a documented GP review before any further course. The off-label statement and the MPG2 1.1.7 basis are recorded as the Medical Director\'s decision, with signed patient consent and GP notification within 7 days.',
  'PATIENTS 55 AND OVER may be eligible under this PGD or the Circadin PGD. Courses supplied under the Circadin PGD count towards this PGD\'s course limits (by the patient\'s account and pharmacy records), and the pharmacist chooses one route per course.',
  'ARM B, ADULT JET LAG, LICENSED. Only Adaflex 5 mg is used at 5 mg; 3 mg maximum with combined hormonal contraception or any other oestrogen, and at 65 or over; previous 3 mg use qualifying for 5 mg must be recorded or of a named licensed product (supplements do not count); Sleplag removed; travellers told to check destination import rules. Pharmacy technicians may supply under arm B; arm A is pharmacist only.',
  'REVIEW FINDINGS APPLIED. One falls definition (in the last 12 months: any fall (including any fall with injury): refer), with counselling about getting up at night. Professional drivers and safety-critical workers excluded from arm A. Sleep hygiene for at least 2 weeks before supply 1, or documented severe daytime impairment. History and red flags extended to overactive thyroid symptoms, menopausal night sweats, recreational drugs and cannabis withdrawal, decongestants, depression and anxiety (PHQ-2 and GAD-2), sleep apnoea (STOP-Bang and Epworth), restless legs, pain and shift work. Currently prescribed melatonin: refer to the prescriber. Adult safeguarding: a carer requesting for an adult who lacks capacity, or a care home resident: refer.',
  'WORDING CORRECTED OR REMOVED. Autoimmune disease: the SmPC wording is now quoted accurately (no data; occasional case reports in the immediate-release SmPCs; not recommended). The advice on the evening timing of NSAIDs and beta-blockers is removed. Thioridazine and imipramine (a Slenyto interaction) are removed with Slenyto. Course counting accepts the patient\'s own account. The review window is set so that a patient reviewed on time is never without tablets, and the calendar span of a course is stated. Part-pack handling is set out for the adopting pharmacy\'s SOP (Appendix 5).',
 ],
};

Packer.toBuffer(build(d)).then(b=>{fs.writeFileSync(__dirname+'/melatonin-'+d.version+'-SIGNED.docx',b);console.log('melatonin '+d.version+' docx bytes',b.length);});
