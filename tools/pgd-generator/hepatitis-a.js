const {build,Packer,fs}=require('./gen.js');

// Standalone hepatitis A PGD, version 001, 20 September 2026.
//
// Why it exists: hepatitis A was authorised only inside two other documents,
// the Hepatitis A and B (Travel) PGD (Havrix, Engerix B, Twinrix, Avaxim) and
// the Travel Health core PGD (Havrix or Avaxim alongside typhoid and cholera).
// A pharmacist looking for "the hepatitis A PGD" found neither, and one wrote
// twice to say so. Nitin's instruction: a PGD and consultation tool of its
// own so that it is obvious.
//
// The clinical content is the hepatitis A material already authorised in
// those two documents, brought together and stated once. Nothing is widened:
// same four products, same ages, same schedule, same exclusions.

const d={
 banner:'ISSUED, VALID FROM 20 SEPTEMBER 2026',
 title:'Hepatitis A Vaccination',
 strap:'Patient Group Direction, version 001, issued 20 September 2026. Havrix Monodose, Havrix Junior Monodose, Avaxim and Avaxim Junior. Individuals aged 1 year and over, for travel and non-travel risk.',
 cover:{action:'administration',drugs:'Havrix Monodose, Havrix Junior Monodose, Avaxim or Avaxim Junior (inactivated hepatitis A vaccine)',condition:'Protection against Hepatitis A',link:'for',age:'From age 1 year onwards.'},
 purpose:{
   for:'The administration of inactivated hepatitis A vaccine to an individual aged 1 year or over who is at increased risk of hepatitis A through travel, lifestyle, medical condition or occupation, by a registered pharmacist or registered pharmacy technician in a community pharmacy, without a prescription. Administration under this PGD is a private service.',
   authorises:[
    'A first dose of monovalent hepatitis A vaccine: Havrix Monodose or Avaxim at 16 years and over; Havrix Junior Monodose or Avaxim Junior from 1 year to 15 years inclusive.',
    'A second (booster) dose 6 to 12 months after a first dose of any inactivated hepatitis A-containing vaccine (monovalent, ViATIM, Twinrix or Ambirix), or later within the window stated for the product, or, off-label and on the terms stated under Dose and frequency, later than that window, to complete the course for long-term protection.',
   ],
   notFor:[
    'Children under 1 year. None of the products is licensed below 1 year.',
    'Hepatitis B vaccination, or the combined hepatitis A and B vaccine (Twinrix). Those are under the Hepatitis A and B (Travel) PGD.',
    'Combined hepatitis A and typhoid vaccine (ViATIM), which is not given under any Get Real Health PGD. A patient primed with ViATIM may have the monovalent second dose here.',
    'Post-exposure use, that is a contact of a case of hepatitis A or a person exposed in an outbreak. Refer to the GP or the local Health Protection Team the same day.',
    'Serology to confirm immunity, before or after vaccination.',
    'A patient who has had a confirmed anaphylactic reaction or other severe hypersensitivity reaction to a previous dose of a hepatitis A-containing vaccine or to any component, including neomycin.',
    'A reinforcing dose 25 years after a completed course. Green Book chapter 17 says such a dose is generally not needed except for those at ongoing risk; a patient in that position is referred to the GP or a travel clinic, because no SmPC includes that dose.',
    'Use by a pharmacy technician in Northern Ireland. Pharmacy technicians may supply and administer under a PGD in Great Britain only.',
   ],
  },

 intro:[
  {h:'Which product, and why the age matters'},
  {bullet:'FOUR PRODUCTS, TWO STRENGTHS. The adult products (Havrix Monodose 1440 ELISA units in 1.0 mL; Avaxim 160 units in 0.5 mL) are for 16 years and over. The paediatric products (Havrix Junior Monodose 720 ELISA units in 0.5 mL; Avaxim Junior 80 units in 0.5 mL) are for 1 year to 15 years inclusive. The paediatric products contain half the antigen of the adult ones and the packaging is similar. Check the age against the product in hand before every dose.',b:true},
  {bullet:'THE DOSE VOLUMES DIFFER. Havrix Monodose is 1.0 mL. Every other product here is 0.5 mL. Do not carry a volume across from one product to another.',b:true},
  {bullet:'Havrix and Avaxim are both UK-licensed inactivated hepatitis A vaccines and either may be used. Use whichever the pharmacy holds; do not delay vaccination to obtain the other.'},
  {bullet:'A course started with one product should be completed with the same product where possible. Where it is not, the booster may be given with the other: all four SmPCs support use as the booster after a different inactivated hepatitis A vaccine (Havrix and Havrix Junior after any inactivated hepatitis A vaccine; Avaxim, from 16 years, after a monovalent or combined hepatitis A and typhoid vaccine 6 to 36 months before).'},
  {bullet:'Where rapid protection is needed, the Green Book recommends monovalent vaccine: Havrix Monodose (1440 ELISA units) carries more hepatitis A antigen than Twinrix Adult (720), and Havrix Junior Monodose (720) more than Twinrix Paediatric (360) or Avaxim Junior (80), so protection comes sooner. For a child leaving imminently Havrix Junior Monodose is the faster option.'},

  {h:'The schedule'},
  {bullet:'ONE DOSE gives protection from about 2 weeks and lasts at least a year. It can be given up to the day of departure; some protection develops before antibody is detectable, so a late dose is worth giving.',b:true},
  {bullet:'A SECOND DOSE at 6 to 12 months completes the course and gives protection for at least 25 years. No further boosters are needed for immunocompetent people.',b:true},
  {bullet:'A LATE SECOND DOSE STILL COUNTS. Do not restart the course. The licensed window is that of the product being given as the booster: Havrix Monodose up to 5 years after the first dose; Havrix Junior Monodose up to 3 years; Avaxim 6 to 36 months; Avaxim Junior 6 months to 15 years. Beyond that window, or where the first-dose product is not known, the dose is off-label and is given on the terms under Dose and frequency, not declined.',b:true},
  {bullet:'Someone who completed a two dose course (two doses at least 6 months apart, or a full Twinrix or Ambirix course), at any time in the past, needs no further dose. A patient at ongoing risk 25 years or more after their course is referred to the GP or a travel clinic; that reinforcing dose is outside this PGD. Ask, and record what they tell you.'},

  {h:'Two things this PGD deliberately does not do'},
  {bullet:'It does not cover hepatitis B or the combined vaccines. A traveller who also needs hepatitis B and has time to complete a course before exposure may be better seen under the Hepatitis A and B (Travel) PGD, which authorises Twinrix and Engerix B as well as the products here. Where departure is within about a month, or rapid hepatitis A protection is needed, give monovalent hepatitis A here now and arrange hepatitis B separately: monovalent vaccine protects against hepatitis A sooner than Twinrix.'},
  {bullet:'It does not cover post-exposure use. Hepatitis A vaccine given to a contact of a case is a public health intervention with its own timing rules and, for some contacts, immunoglobulin. That is for the Health Protection Team and the GP, the same day.'},

  {h:'Observation'},
  {bullet:'Observe every patient for 15 minutes after vaccination, seated, and record that the observation period was completed.',b:true},
 ],

 guidelines:require('./guidelines/hepatitis-a.js'),

 arms:[{
  title:'Hepatitis A vaccine',
  subtitle:'Patient Group Direction for the administration of Havrix Monodose, Havrix Junior Monodose, Avaxim or Avaxim Junior for protection against hepatitis A in individuals aged 1 year and over.',
  training:[
   'Pharmacist registered and practising with the GPhC.',
   'Pharmacy technician registered and practising with the GPhC.',
   'All users must be trained to the National Minimum Standards and Core Curriculum for Immunisation Training, and be competent in intramuscular vaccination technique in adults and children.',
   'All users must be competent in the recognition and immediate management of anaphylaxis, and hold current basic life support training.',
   'All users must be competent in assessing consent in children and young people, including parental responsibility and Gillick competence. This PGD covers children from 1 year.',
   'All users must know that the four products come in two strengths by age and that Havrix Monodose is a 1.0 mL dose while the other three are 0.5 mL. Confirm the age and the product in hand before drawing up.',
   'All users must be able to take a travel and risk history sufficient to establish the indication, and to recognise a post-exposure situation and refer it.',
   'All users must be competent in vaccine handling and cold chain management, including the action to take on a cold chain excursion.',
   'All users must have completed training in working under Patient Group Directions, for example the CPPE PGD e-learning and e-assessment or an equivalent, and have been assessed as competent to work under a PGD before first working under this one; previous experience of working under a PGD is not required. All users must work in compliance with the SOPs of their own employer, and must practise only within the bounds of their own competence.',
  ],
  pgd:[
   ['Indication','Active immunisation against hepatitis A in individuals aged 1 year and over who are at increased risk through travel, lifestyle, a medical condition or occupation, in accordance with Green Book chapter 17 and the current Summary of Product Characteristics for the product used. Administration under this PGD is a private service.'],

   ['Inclusion criteria',[
     {bullet:'Aged 1 year and over. Adult products at 16 years and over; paediatric products from 1 year to 15 years inclusive.',b:true},
     {bullet:'Travel to a destination for which NaTHNaC TravelHealthPro recommends hepatitis A vaccination for this traveller and itinerary. In practice that is most of the world outside northern and western Europe, North America, Australia and New Zealand; check the country page rather than assuming.'},
     {bullet:'Or a non-travel risk factor: chronic liver disease including chronic hepatitis B or C; haemophilia or receipt of plasma-derived clotting factors; people who inject drugs; gay, bisexual and other men who have sex with men; or an occupational risk in one of the Green Book groups: laboratory work with possible exposure to the virus, staff or residents of a large residential institution where the Green Book applies, work with repeated exposure to raw sewage, or work with susceptible primates. Food handlers, day-care staff and healthcare workers are not included unless the request comes from occupational health or the Health Protection Team; otherwise refer. In chronic liver disease prefer Havrix where held, since Avaxim has not been studied in liver disease.'},
     {bullet:'For a second dose: a first dose of any inactivated hepatitis A-containing vaccine (Havrix, Avaxim, ViATIM, Twinrix or Ambirix) 6 months or more ago, with the date known or reliably reported. Where the product is not known the second dose is off-label and is given on the terms under Dose and frequency. A patient who completed a full Twinrix or Ambirix course needs no dose.'},
     {bullet:'Valid informed consent obtained. Where the individual is under 16, from a person with parental responsibility, or from the young person where assessed as Gillick competent, with the basis of that assessment recorded. A parent accompanying a child does not automatically hold parental responsibility; ask.',b:true},
     {bullet:'The patient understands this is a private service and what it costs.'},
     {bullet:'No exclusion criterion present.'},
   ]],

   ['Exclusion criteria',[
     {text:'Refer, do not vaccinate, where any of the following applies.',b:true},
     {bullet:'Under 1 year of age.'},
     {bullet:'Confirmed anaphylactic reaction, or other severe hypersensitivity reaction, to a previous dose of any hepatitis A-containing vaccine or to any component of the product to be used. All four products may contain trace NEOMYCIN, so confirmed anaphylaxis or other severe hypersensitivity to neomycin excludes every product under this PGD. Contact dermatitis to topical neomycin is not a contraindication.',b:true},
     {bullet:'Acute severe febrile illness. Postpone until recovered. Minor illness without fever is not a reason to defer.'},
     {bullet:'A completed course: two doses at least 6 months apart, or a full Twinrix or Ambirix course. Nothing is authorised. Where the patient is at ongoing risk and 25 years or more have passed, refer to the GP or a travel clinic for a reinforcing dose; that dose is outside this PGD.'},
     {bullet:'Post-exposure use: a contact of a case, or exposure in an outbreak. Refer to the GP or the Health Protection Team the same day.',b:true},
     {bullet:'Under 16 and valid consent cannot be obtained from a person with parental responsibility, and the young person is not assessed as Gillick competent.'},
   ]],

   ['Cautions',[
     {text:'Pregnancy. Hepatitis A vaccine may be given where clearly indicated. The vaccines are inactivated. Havrix is preferred where held; where only Avaxim or Avaxim Junior is held, give it after a recorded risk-benefit assessment rather than delaying, as their SmPCs require.'},
     {text:'Breastfeeding. The Avaxim SmPCs permit use during breastfeeding; the Havrix SmPCs ask for a benefit decision because excretion in milk is unknown; the Green Book records no evidence of risk from inactivated vaccines in breastfeeding. Give where indicated and record the decision.'},
     {text:'Immunosuppression, including HIV, immunosuppressive treatment and haemodialysis. May be vaccinated, and vaccination of a person with chronic immunodeficiency such as HIV is recommended; the response may be reduced and further doses may be needed. Where the immunosuppression is a time-limited treatment and travel allows, advise deferral until it ends (Avaxim SmPC). Tell the patient that serology and further doses may be needed, that both are outside this PGD, and write to the GP or specialist. Do not tell the patient they are protected.',b:true},
     {text:'Stable anticoagulation: warfarin with INR testing up to date and the latest INR below the upper limit of the therapeutic range, or a direct oral anticoagulant taken as prescribed. Give intramuscularly with a 23 gauge or finer needle, firm pressure without rubbing for at least 2 minutes; if in doubt consult the anticoagulant prescriber.'},
     {text:'Haemophilia or other bleeding disorder, or thrombocytopenia. Give by deep subcutaneous injection, which all four SmPCs allow for patients at risk of haemorrhage, or intramuscularly only where a doctor familiar with the patient\u2019s bleeding risk has advised that route is safe. Record the route and why.',b:true},
     {text:'Phenylalanine. All four products contain phenylalanine: Havrix Monodose 166 micrograms per dose, Havrix Junior Monodose 83 micrograms, Avaxim and Avaxim Junior 10 micrograms. Relevant only in phenylketonuria; advise the patient or carer to account for it in meal planning on the day.'},
     {text:'Serology is not provided under this PGD. A patient who wants proof of immunity may still be vaccinated; refer for serology if it is needed.'},
     {text:'Latex. The needle shield of the attached-needle presentation of adult Avaxim may contain natural rubber. Check the presentation in hand before use in a latex-sensitive patient. The Avaxim Junior needle shield is polyisoprene. Havrix presentations are described as free of natural latex; check the current leaflet before reassuring a latex-allergic patient.',b:true},
     {text:'The patient also needs hepatitis B protection. This is not an exclusion. Where there is time to complete a three dose course before exposure, the combined vaccine under the Hepatitis A and B (Travel) PGD is convenient. Where departure is within about a month, or rapid hepatitis A protection is needed, give monovalent hepatitis A under this PGD now, because the Green Book states monovalent vaccine protects against hepatitis A sooner than Twinrix, and arrange hepatitis B separately. Record the decision and tell the patient this vaccine gives no protection against hepatitis B or C.'},
     {text:'A patient presenting shortly before departure. Give the dose: some protection develops before antibody is detectable and it can be given up to the day of travel. Be explicit that full protection comes after about 2 weeks.'},
   ]],

   ['Anaphylaxis and observation',[
     {text:'Adrenaline (epinephrine) 1 in 1,000 injection must be immediately available whenever a vaccine is administered under this PGD, together with a written anaphylaxis protocol consistent with current Resuscitation Council UK guidance, and a telephone.',b:true},
     {text:'All staff administering vaccines must be trained in the recognition and immediate management of anaphylaxis and must hold current basic life support training.'},
     {text:'OBSERVE EVERY PATIENT FOR 15 MINUTES AFTER VACCINATION. Vaccinate seated.',b:true},
     {text:'Anxiety-related reactions including vasovagal syncope, hyperventilation and transient visual disturbance or paraesthesia can occur before or after any injection. Procedures must be in place to prevent injury from a faint, which is common particularly in adolescents.'},
   ]],

   ['Actions if the patient is excluded or declines',[
     {bullet:'Discuss the reason for exclusion with the patient and make sure they understand it.'},
     {bullet:'Give food and water hygiene advice for the destination regardless of whether vaccine is given.'},
     {bullet:'Refer to the GP, a travel clinic or the Health Protection Team as appropriate, and make the urgency explicit where it is a post-exposure situation.',b:true},
     {bullet:'Where hepatitis B is also needed, offer the Hepatitis A and B (Travel) consultation instead of two separate ones.'},
     {bullet:'Document the reason for exclusion, the advice given and the decision reached. Inform or refer to the GP as appropriate.'},
   ]],

   ['Yellow Card reporting','Report suspected adverse reactions via https://yellowcard.mhra.gov.uk and inform the GP as appropriate.'],

   ['Records to be kept',[
     {bullet:'That valid informed consent was given, and from whom. Where the individual is under 16, the name and relationship of the person with parental responsibility, or the basis of the Gillick assessment.',b:true},
     {bullet:'Patient name, address, date of birth, and the GP with whom they are registered.'},
     {bullet:'Destination and departure date, or the non-travel risk factor that made vaccination appropriate.'},
     {bullet:'Which product was given, Havrix Monodose, Havrix Junior Monodose, Avaxim or Avaxim Junior, with batch number and expiry date.',b:true},
     {bullet:'Dose number in the course (first or second), and for a second dose the product and date of the first where known.',b:true},
     {bullet:'Date of administration, dose volume, route and anatomical site.'},
     {bullet:'The date the second dose is due, and that the patient was told.',b:true},
     {bullet:'Where the second dose was off-label (outside the licensed window of the product given, or first-dose product not known): the interval since the first dose, the first-dose product or "not known", the words "off-label, Green Book chapter 17", and that the patient was told it was off-label and why and consented on that basis.',b:true},
     {bullet:'Name and registration number of the healthcare professional administering.'},
     {bullet:'That the 15 minute observation period was completed.',b:true},
     {bullet:'Advice given, including food and water hygiene advice and advice given if the patient is excluded or declines.'},
     {bullet:'Details of any adverse drug reactions and the actions taken.'},
     {bullet:'That the vaccine was administered under this PGD.'},
     {text:'Records signed, dated, legible and contemporaneous. Adults 18 and over: 8 years. Under 18s: until the 25th birthday, or the 26th where the patient was 17 when the course finished. The patient must also be given a written record of the product, the date and when the second dose is due.'},
   ]],
  ],
  med:[
   ['Name, form and strength',[
     {bullet:'HAVRIX MONODOSE (GSK), hepatitis A vaccine (inactivated, adsorbed), 1440 ELISA units in 1.0 mL, suspension for injection in pre-filled syringe or vial, PL 10592/0037. 16 years and over.'},
     {bullet:'HAVRIX JUNIOR MONODOSE (GSK), 720 ELISA units in 0.5 mL, suspension for injection in pre-filled syringe or vial, PL 10592/0080. 1 year to 15 years inclusive.'},
     {bullet:'AVAXIM (Sanofi), hepatitis A vaccine (inactivated, adsorbed), 160 units in 0.5 mL, suspension for injection in pre-filled syringe, PL 23228/0006. 16 years and over.'},
     {bullet:'AVAXIM JUNIOR (Sanofi), 80 units in 0.5 mL, suspension for injection in pre-filled syringe, PL 23228/0007. 1 year to 15 years inclusive.'},
     {bullet:'THE DOSE VOLUMES DIFFER: 1.0 mL for Havrix Monodose, 0.5 mL for the other three. Confirm the age and the product in hand before drawing up.',b:true},
     {bullet:'All four may contain trace neomycin and contain phenylalanine. None contains a live organism.'},
   ]],
   ['Legal category','POM.'],
   ['Dose and frequency',[
     {bullet:'FIRST DOSE: one dose of the product for the patient’s age. Protection from about 2 weeks, lasting at least 12 months.'},
     {bullet:'SECOND DOSE: one dose 6 to 12 months after the first, which gives protection for at least 25 years. No further routine boosters for immunocompetent people.',b:true},
     {bullet:'LATE SECOND DOSE: give one dose of the product for the patient\u2019s age now; do not restart. The licensed window is that of the product being given: Havrix Monodose up to 5 years after the first dose, Havrix Junior Monodose up to 3 years, Avaxim 6 to 36 months, Avaxim Junior 6 months to 15 years. Outside that window, or where the first-dose product is not known, the dose is OFF-LABEL. Off-label use is authorised under this PGD on the basis of Green Book chapter 17, which states that successful boosting occurs even when the second dose is delayed for several years and the course does not need restarting. Tell the patient it is off-label and why, obtain consent on that basis, and record as set out under Records. The Havrix data on delayed boosting are from immunocompetent adults; in an immunosuppressed patient refer for serology as well.',b:true},
     {bullet:'NO REINFORCING DOSE after a completed course is authorised. Refer a patient at ongoing risk 25 years or more after their course.'},
     {bullet:'A patient who turns 16 between doses has the second dose with the adult product for their age at the time of that dose.'},
   ]],
   ['Quantity to be administered','One dose per patient per attendance: 1.0 mL of Havrix Monodose, or 0.5 mL of Havrix Junior Monodose, Avaxim or Avaxim Junior. This PGD does not permit supply of vaccine to the patient for administration elsewhere.'],
   ['Route and method of administration','Intramuscular injection: deltoid in adults, adolescents and older children; anterolateral thigh in young children. Never into the gluteal muscle, and never intravascularly or intradermally: the response is unreliable. Shake well before use and inspect; do not administer if the appearance differs from that described in the SmPC. For a patient with a bleeding disorder, use a fine needle with firm pressure, or the subcutaneous route. Where another vaccine is given at the same visit, use a separate limb where possible, or sites at least 2.5 cm apart, and record the site of each. Do not mix with any other vaccine in the same syringe.'],
   ['Co-administration','May be given at the same visit as other travel vaccines, live or inactivated, at separate sites with separate syringes, in accordance with Green Book chapter 17. Where the patient also needs hepatitis B, see the caution above; Twinrix is not given under this PGD.'],
   ['Storage and cold chain',[
     {text:'Store at +2C to +8C in the original packaging to protect from light. DO NOT FREEZE. A vaccine that has been frozen, or is suspected of having been frozen, must be quarantined, labelled and not administered: freezing separates the antigen from the aluminium adjuvant, which reduces potency and can increase reactogenicity.'},
     {text:'COLD CHAIN EXCURSION: vaccine exposed to conditions outside the stated range must be quarantined and risk assessed in accordance with UKHSA Vaccine Incident Guidance before any further use. The Havrix SmPCs state stability at up to 25C for 3 days, as a guide for that assessment only; neither Avaxim SmPC contains excursion data, so there is no permitted out-of-fridge period for those products.',b:true},
   ]],
   ['Disposal','Dispose of used syringes, needles and any discharged vaccine in a UN-approved puncture-resistant sharps container in accordance with local arrangements and HTM 07-01.'],
   ['Adverse effects','Very common: injection site pain and redness, fatigue, headache, and in children irritability. Common: fever, malaise, injection site swelling or induration, gastrointestinal upset, drowsiness and loss of appetite. Uncommon: dizziness, myalgia, rash, influenza-like illness, vomiting. Rare: paraesthesia, hypoaesthesia, pruritus, chills. Reported post-marketing (frequency not known): anaphylaxis and allergic reactions, urticaria, angioedema, erythema multiforme, lymphadenopathy, arthralgia, convulsions, Guillain-Barre syndrome, transverse myelitis, neuralgic amyotrophy, vasculitis, and transient rises in liver function tests. Consult the current SmPC for the product used.'],
  ],
  pat:[
   ['Written information','Supply the patient information leaflet for the product given, and a written record of the vaccine, the batch number, the date, and the date the second dose is due. Advise the patient to keep it, because the brand determines how the course is completed elsewhere.'],
   ['Counselling',[
     {bullet:'One dose protects you for about a year, starting around two weeks from today. The second dose, in 6 to 12 months, protects you for at least 25 years. Come back for it; we will book it now.',b:true},
     {bullet:'If you miss the second dose date, come anyway. The course does not need restarting. If it is a long time later, we may give it outside the licence, and we will tell you so.'},
     {bullet:'The vaccine does not cover everything you can catch from food and water. Drink bottled or boiled water, avoid ice, salads, shellfish and food that has been standing, and wash your hands.',b:true},
     {bullet:'Some soreness, tiredness, headache or mild fever in the first day or two is common and settles on its own.'},
     {bullet:'Where hepatitis B was discussed: this vaccine does not protect against hepatitis B or C. The precautions for those are avoiding unprotected sex, unsterile tattooing, piercing and acupuncture, and not sharing needles or razors.'},
   ]],
   ['Follow-up','Book the second dose at this appointment, 6 to 12 months from today. Seek medical advice for jaundice, dark urine or pale stools after travel, whatever the vaccination status. For a routine query about the vaccine or the schedule, contact the pharmacy.'],
  ],
 }],

 appendix:[
  {h:'Appendix 1: Key references'},
  {bullet:'UKHSA. Immunisation Against Infectious Disease (the Green Book), chapter 17, Hepatitis A, chapter dated 12 January 2024.'},
  {bullet:'Summary of Product Characteristics for Havrix Monodose, Havrix Junior Monodose, Avaxim (PL 23228/0006) and Avaxim Junior (PL 23228/0007), current versions, electronic Medicines Compendium.'},
  {bullet:'National Travel Health Network and Centre, travelhealthpro.org.uk, hepatitis A factsheet and country information pages.'},
  {bullet:'UKHSA Vaccine Incident Guidance.'},
  {bullet:'National Minimum Standards and Core Curriculum for Immunisation Training.'},
  {bullet:'Resuscitation Council UK. Emergency treatment of anaphylaxis, current guidance.'},
  {bullet:'NICE Medicines Practice Guideline 2 (MPG2): Patient Group Directions, https://www.nice.org.uk/guidance/mpg2'},
 ],

 version:'v001',
 supersedes:'None (new PGD)',
 validFrom:'20 September 2026',
 expiry:'31 July 2027',
 reviewDate:'31 May 2027, or earlier if any SmPC or Green Book chapter 17 changes',
 sigDate:'20 September 2026',
 chDate:'20 September 2026',
 changes:[
  'New standalone PGD. Hepatitis A vaccination was previously authorised only within the Hepatitis A and B (Travel) PGD and the Travel Health core PGD, and pharmacists looking for a hepatitis A PGD could not find one. This document brings the hepatitis A content of those two documents together under its own title, with its own consultation tool.',
  'Products and ages are unchanged from those documents: Havrix Monodose and Avaxim at 16 years and over, Havrix Junior Monodose and Avaxim Junior from 1 year to 15 years inclusive. Hepatitis B, Twinrix and ViATIM remain outside this PGD.',
  'The late second dose is stated per product from the current SmPCs: Havrix Monodose within 5 years, Havrix Junior Monodose within 3 years, Avaxim within 36 months, Avaxim Junior between 6 months and 15 years, with a recorded off-label decision beyond those windows rather than a refusal.',
  'Post-exposure use is an explicit exclusion with same-day referral to the GP or Health Protection Team.',
  'Corrections from the adversarial review of 20 September 2026 before first issue: no reinforcing dose after a completed course is authorised (refer at 25 years); the combined-vaccine steer follows the Green Book, monovalent first where protection is needed quickly; anticoagulation and bleeding disorders are separate cautions with the Green Book routes; immunosuppression carries the Avaxim deferral advice and the need for serology and further doses; the off-label late second dose is authorised on a stated basis with a consent script and record; a second dose after ViATIM, Twinrix or Ambirix is included; the occupational list is closed to the Green Book groups; Northern Ireland technicians excluded; adverse effects aligned to the four SmPCs.',
  'Records include the dose number, the product and date of the first dose where a second is given, the date the second dose is due, and completion of the 15 minute observation period.',
 ],
};

Packer.toBuffer(build(d)).then(b=>{fs.writeFileSync('hepatitis-a-'+d.version+'-SIGNED.docx',b);console.log('hepatitis-a '+d.version+' docx bytes',b.length);});
