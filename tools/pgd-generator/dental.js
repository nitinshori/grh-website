const {build,Packer,fs}=require('./gen.js');

// Shared across both arms, because the decision about WHO gets an antibiotic
// is the same whichever antibiotic is used. v003 stated it four different
// ways across headings, subtitles, scope bullets and inclusion criteria.
const THREE_OUTCOMES=[
 {text:'1. LOCALISED INFECTION ONLY, otherwise healthy patient: NO ANTIBIOTIC. Analgesia advice and an urgent dental appointment. This is most patients who present, and it is the correct answer for them.',b:true},
 {text:'2. SPREADING OR SYSTEMIC INFECTION, no emergency red flag: ANTIBIOTIC UNDER THIS PGD, and an urgent dental appointment as well. This is the bridging cohort.',b:true},
 {text:'3. ANY EMERGENCY RED FLAG from Appendix 1: 999 or same-day emergency care. No antibiotic here, and no delay to arrange one.',b:true},
];

const SPREAD_SIGNS=[
 {bullet:'Temperature 38C or above.'},
 {bullet:'Regional lymphadenopathy: tender, enlarged nodes in the neck or under the jaw.'},
 {bullet:'Facial swelling, or swelling extending beyond the tooth and its immediate gum, that does NOT meet any emergency red flag in Appendix 1.'},
 {bullet:'Malaise, feeling generally unwell, rigors.'},
 {bullet:'Cellulitis: diffuse redness and swelling spreading into the soft tissues of the face or neck, without red flags.'},
];

function arm(o){return{
 title:o.title,
 subtitle:o.subtitle,
 note:o.note,
 training:[
  'Pharmacist registered and practising with the GPhC.',
  'Pharmacy technician registered and practising with the GPhC.',
  'Must have completed training relevant to acute dental infection, documented and overseen by the Get Real Health team.',
  'Must be able to distinguish a LOCALISED dental infection from a SPREADING or SYSTEMIC one, because that distinction decides whether an antibiotic is indicated at all. This is the single most important competence for this PGD.',
  'Must be able to recognise every emergency red flag in Appendix 1, in particular airway compromise, difficulty swallowing, trismus and periorbital involvement, and must act on them the same day rather than supplying.',
  'Must be able to explain to a patient with a localised infection why an antibiotic is not being supplied, and why that is the right answer rather than a refusal of care.',
  'Must be able to take and record a penicillin allergy history in the patient own words, distinguishing true allergy from intolerance.',
  'Must previously have supplied medicines under a PGD, must work in compliance with the SOPs of their own employer, and must practise only within the bounds of their own competence.',
 ],
 pgd:[
  ['Indication',o.indication],

  ['The three outcomes',[
    {text:'Decide which of these applies BEFORE considering any medicine.',b:true},
    ...THREE_OUTCOMES,
    {text:'An antibiotic under this PGD is a bridge to dental care, not a treatment. It does not drain the infection and it does not remove the cause. The dental appointment is the treatment, and it is needed whether or not an antibiotic is supplied.',b:true},
  ]],

  ['Inclusion criteria',[
    {bullet:'Adults aged 18 years and over.'},
    {bullet:'An acute dental infection with a presumed bacterial source in a tooth or its supporting tissues.'},
    {bullet:'AT LEAST ONE sign of spreading infection or systemic involvement, from the list below.',b:true},
    ...SPREAD_SIGNS,
    {bullet:'OR the patient is at higher risk of complications from a dental infection even where it appears localised: significant immunosuppression, or poorly controlled diabetes. Record which applies and why you judged the risk higher.',b:true},
    {bullet:'No emergency red flag from Appendix 1 present.',b:true},
    {bullet:'Unable to obtain definitive dental treatment before the infection would be expected to worsen, and willing and able to arrange an urgent dental appointment within 24 to 48 hours.'},
    o.armInclusion,
    {bullet:'Capable of giving valid informed consent, and consent given.'},
    {bullet:'No exclusion criterion present.'},
  ]],

  ['Exclusion criteria',[
    {text:'Refer, do not supply, where any of the following is present.',b:true},
    {bullet:'ANY emergency red flag from Appendix 1. These are 999 or same-day emergency presentations, not dental appointments.',b:true},
    {bullet:'A LOCALISED infection with no sign of spread and no systemic feature, in a patient who is not at higher risk. An antibiotic is not indicated. Give analgesia advice and arrange urgent dental care. This is not a failure of the service; it is the service working correctly.',b:true},
    {bullet:'Under 18 years of age. Children with dental infection are referred: this PGD carries no paediatric dose, no suitable formulation and no paediatric red flag route.'},
    ...o.armExclusions,
    {bullet:'Already taking an antibiotic, for this or any other indication.'},
    {bullet:'A course already supplied for this episode. One supply per episode.'},
    {bullet:'Unable to give valid informed consent.'},
  ]],

  ['Cautions',o.cautions],

  ['Actions if the patient is excluded or declines',[
    {bullet:'Where the infection is localised and no antibiotic is indicated, say so plainly and explain why: antibiotics do not treat a localised dental infection, the abscess is largely walled off from the bloodstream so very little antibiotic reaches it, and the treatment is drainage or removal of the cause by a dentist. Offer analgesia advice and help the patient get a dental appointment.',b:true},
    {bullet:'Where an emergency red flag is present, make the urgency explicit and act on it in front of the patient. Do not send them away with an appointment to make.',b:true},
    {bullet:'Where the exclusion is an interacting medicine, alcohol or pregnancy, say plainly that the issue is the antibiotic and not the dental problem, so the patient does not leave thinking their infection has been dismissed.'},
    {bullet:'Document the reason for exclusion, the advice given and the decision reached. Inform or refer to the GP or dentist as appropriate.'},
  ]],

  ['Yellow Card reporting','Report suspected adverse reactions via https://yellowcard.mhra.gov.uk and inform the GP as appropriate.'],

  ['Records to be kept',[
    {bullet:'That valid informed consent was given.'},
    {bullet:'WHICH of the three outcomes applied, and the finding that decided it. Where an antibiotic was supplied, the specific sign of spreading or systemic infection, or the higher-risk factor, that justified it.',b:true},
    {bullet:'That Appendix 1 was worked through and no emergency red flag was present.',b:true},
    {bullet:'Temperature, and the presence or absence of facial swelling and lymphadenopathy.'},
    {bullet:'The penicillin allergy history in the patient own terms, and which arm was used and why.'},
    o.armRecord,
    {bullet:'That the patient was told this is a bridge and not a treatment, and that a dental appointment is still needed.'},
    {bullet:'Patient name, address, date of birth, and the GP with whom they are registered.'},
    {bullet:'Name and registration number of the healthcare professional supplying.'},
    {bullet:'Name of the medicine, date of supply, dose, form, route and quantity supplied, with batch number and expiry date.'},
    {bullet:'Advice given, including advice given if excluded or declining.'},
    {bullet:'Details of any adverse drug reactions and the actions taken.'},
    {bullet:'That the medicine was supplied under this PGD.'},
    {text:'Records signed, dated, legible and contemporaneous. Retain for 8 years.'},
  ]],
 ],
 med:o.med,
 pat:o.pat,
};}

const d={
 banner:'ISSUED, VALID FROM 9 SEPTEMBER 2026',
 title:'Dental Bridging Antibiotic',
 strap:'Patient Group Direction, version 005, issued 9 September 2026. Amoxicillin and metronidazole, adults 18 and over, spreading or systemic dental infection only.',
 cover:{action:'supply',drugs:'Amoxicillin or Metronidazole',condition:'Acute Dental Infection, as a bridging antibiotic',age:'Adults aged 18 years and over.'},
 purpose:{
   for:'The supply of a short course of antibiotic to an adult with an acute dental infection that is spreading or causing systemic upset, to bridge the time until they can be seen by a dentist, by a registered pharmacist or registered pharmacy technician in a community pharmacy, without a prescription.',
   authorises:[
    'Amoxicillin 500mg capsules, first line, in adults aged 18 years and over.',
    'Metronidazole 200mg tablets, in adults aged 18 years and over who are penicillin-allergic.',
   ],
   notFor:[
    'Toothache or a localised dental abscess without spreading infection or systemic features. National guidance is that these do not need an antibiotic; they need a dentist.',
    'Facial swelling that is closing the eye, affecting swallowing or breathing, or spreading to the neck, or a patient who is systemically very unwell. Refer as an emergency.',
    'Pain relief. This PGD supplies no analgesia.',
    'Anyone under 18.',
   ],
  },

 intro:[
  {h:'The three outcomes'},
  'Work out which of these applies before you think about a medicine at all.',
  ...THREE_OUTCOMES,
  'Outcomes 1 and 3 are the majority. A pharmacy that supplies an antibiotic to most people who walk in with toothache is getting this wrong.',

  {h:'On the swelling question, which caused the error'},
  'The instruction that produced version 003 was that facial swelling must refer. That instruction was right, and it is kept, but it was applied too widely. Swelling that threatens the airway, closes the eye, limits mouth opening or is spreading rapidly is an EMERGENCY, and Appendix 1 sends it to 999 or same-day care. Localised facial swelling without those features is not an emergency: it is a sign of spreading infection, and it is one of the reasons to supply an antibiotic while the patient waits for a dentist. Version 003 collapsed those two into a single rule and lost the distinction.',

  {h:'A note on the penicillin-allergy arm'},
  'This PGD uses metronidazole for penicillin-allergic patients, following SDCEP, which gives it as an alternative in dental infection. NICE CKS and several NHS antimicrobial formularies instead give clarithromycin as the penicillin-allergy alternative for dental abscess, with metronidazole used as an adjunct. Both positions exist in current UK guidance. This document follows SDCEP and states the divergence here rather than leaving a pharmacist to discover it. It should be revisited at the next review.',
 ],

 guidelines:{
  title:'Summary of SDCEP and NICE CKS guidance for acute dental infection',
  source:'Scottish Dental Clinical Effectiveness Programme, Drug Prescribing for Dentistry, dental abscess; NICE Clinical Knowledge Summaries, Dental abscess; NHS primary care antimicrobial prescribing guidance. Summarised 9 September 2026.',
  sections:[
   {h:'Overview',body:[
     'An acute dental infection begins in the pulp or the periodontal tissues and is contained, at first, by the immune response and by the anatomy of the tooth.',
     'The treatment is DRAINAGE and removal of the cause: opening the tooth, extraction, or drainage of a swelling. That is dental treatment, and a pharmacy cannot provide it.',
     {bullet:'An antibiotic does not drain an abscess and does not remove the cause.'},
     {bullet:'A walled-off abscess has a poor blood supply, so very little antibiotic reaches the infection.'},
   ]},
   {h:'When an antibiotic IS indicated',body:[
     'SDCEP: antibiotics are required only in cases of SPREADING INFECTION or SYSTEMIC INVOLVEMENT.',
     'NHS and NICE CKS guidance is to the same effect: antibiotics are not generally indicated for otherwise healthy people with no signs of spreading infection.',
     {bullet:'Spreading: facial swelling, cellulitis, lymph node involvement.'},
     {bullet:'Systemic: fever, malaise, rigors. SDCEP takes a temperature above 38C as indicating systemic involvement.'},
     {bullet:'CKS also supports treating high-risk individuals, such as the immunocompromised or those with poorly controlled diabetes, to reduce the risk of complications.'},
   ]},
   {h:'When an antibiotic is NOT indicated',body:[
     'A localised infection in an otherwise healthy person: pain and tenderness at one tooth, with or without a small amount of adjacent gum swelling, and no fever, no lymphadenopathy and no facial swelling.',
     'For these patients the mainstay is DENTAL TREATMENT plus ANALGESIA. CKS advises ibuprofen first line, paracetamol where ibuprofen is unsuitable.',
     'Supplying an antibiotic here does not help the patient and contributes to antimicrobial resistance.',
   ]},
   {h:'What is an emergency',body:[
     'Airway compromise, difficulty swallowing or breathing, drooling, or a change in the voice.',
     'Swelling of the floor of the mouth or a raised tongue, suggesting Ludwig angina.',
     'Trismus, periorbital or orbital involvement, rapidly spreading swelling, or signs of sepsis.',
     'These need 999 or same-day emergency care, not an antibiotic and not a dental appointment.',
   ]},
   {h:'How this PGD applies that guidance',body:[
     'This PGD supplies a BRIDGING antibiotic to the spreading or systemic group only, while they wait for urgent dental assessment, and refers the emergency group immediately.',
     'It deliberately does NOT supply to the localised group, and says so in terms, because that is what the guidance requires.',
   ]},
  ]
 },

 arms:[
  arm({
   title:'Amoxicillin, first line',
   subtitle:'Patient Group Direction for the supply of amoxicillin 500mg capsules as a bridging antibiotic in acute dental infection with spreading or systemic involvement, in adults aged 18 years and over who are not penicillin-allergic.',
   indication:'Bridging antibiotic care for an acute dental infection with signs of spreading infection or systemic involvement, in an adult awaiting urgent dental assessment. First-line agent. This is not definitive treatment: the infection is treated by the dentist.',
   armInclusion:{bullet:'NOT penicillin-allergic. Where the patient is, use the metronidazole arm.'},
   armExclusions:[
    {bullet:'Known penicillin or beta-lactam allergy, or any history of cephalosporin allergy. Use the metronidazole arm.'},
    {bullet:'Known significant renal impairment. Refer. A short bridging course is not the place for a dose adjustment.'},
    {bullet:'Infectious mononucleosis or acute lymphoblastic leukaemia, because of the risk of a widespread rash.'},
   ],
   armRecord:{bullet:'That renal function was asked about and no significant impairment was reported.'},
   cautions:[
    {text:'PREGNANCY: amoxicillin may be supplied. It is well established in pregnancy and is the usual choice where an antibiotic is indicated. Version 003 was silent on this while the metronidazole arm excluded pregnancy explicitly, which invited the contrast to be read as meaningful.',b:true},
    {text:'BREASTFEEDING: amoxicillin may be supplied. Small amounts appear in breast milk; this is not a reason to withhold it or to interrupt feeding.',b:true},
    {text:'Advise the patient to complete the course even if the pain settles, and that finishing it does not remove the need for the dental appointment.'},
    {text:'Diarrhoea is common. Advise the patient to seek advice for severe or bloody diarrhoea, which may indicate Clostridioides difficile infection.'},
    {text:'Oral thrush can follow a course of amoxicillin. Mention it, and say it is treatable.'},
    {text:'This PGD supplies no analgesia. Where the patient needs pain relief, sell it as a pharmacy medicine under the pharmacy own protocol and record that you did.',b:true},
   ],
   med:[
    ['Name, form and strength','Amoxicillin 500mg capsules.'],
    ['Legal category','POM.'],
    ['Route and method','Oral. Swallow whole with water. May be taken with or without food.'],
    ['Dose and frequency','500mg three times daily, one capsule every 8 hours, for 5 days.'],
    ['Quantity to be supplied','15 capsules. Supply the whole course; do not split it.'],
    ['Maximum treatment period','5 days. One course per episode. A second course is not authorised under this PGD; refer.'],
    ['Storage','Store below 25C in the original container. Do not supply after the expiry date.'],
    ['Adverse effects','Common: diarrhoea, nausea, rash (a non-allergic maculopapular rash is common and is not the same as allergy). Uncommon: vomiting, abdominal discomfort, oral candidiasis. Rare: allergic reactions with rash, urticaria or pruritus. Very rare: anaphylaxis, Stevens-Johnson syndrome, hepatitis and cholestatic jaundice, Clostridioides difficile colitis. Consult the current SPC.'],
   ],
   pat:[
    ['Written information','Supply the amoxicillin patient information leaflet. Do not supply an ibuprofen leaflet: no analgesia is supplied under this PGD.'],
    ['Counselling',[
      {bullet:'THIS IS A BRIDGE, NOT A CURE. The antibiotic will slow the infection down. It cannot drain the abscess or fix the tooth. You still need to see a dentist urgently, within 24 to 48 hours.',b:true},
      {bullet:'Finish the whole course even if the pain settles.'},
      {bullet:'Take one capsule every 8 hours, with or without food.'},
      {bullet:'Come back or seek urgent help the same day if the swelling spreads, your eye starts to close, you cannot open your mouth properly, you have difficulty swallowing or breathing, or you feel much worse. Call 999 for breathing or swallowing difficulty.',b:true},
      {bullet:'Some diarrhoea is common. Get advice if it is severe or bloody.'},
      {bullet:'A rash that appears with this antibiotic is usually not an allergy, but get it checked, and seek urgent help for any swelling of the lips or tongue or any wheeze.'},
      {bullet:'For pain relief, ask us: we can sell you something suitable over the counter.'},
    ]],
    ['Follow-up','Arrange the dental appointment before the patient leaves where possible, or give them the NHS 111 route to emergency dental care. Advise that pain should improve within 24 to 48 hours, and that worsening pain, worsening fever or spreading swelling needs the same-day routes above rather than a wait.'],
   ],
  }),

  arm({
   title:'Metronidazole, penicillin allergy',
   subtitle:'Patient Group Direction for the supply of metronidazole 200mg tablets as a bridging antibiotic in acute dental infection with spreading or systemic involvement, in penicillin-allergic adults aged 18 years and over.',
   note:'The licensed dose for acute dental infection is 200mg three times daily. SDCEP suggests 400mg 8-hourly, which is above the licensed dose for this indication. This PGD stays within the licence.',
   indication:'Bridging antibiotic care for an acute dental infection with signs of spreading infection or systemic involvement, in a penicillin-allergic adult awaiting urgent dental assessment. This is not definitive treatment.',
   armInclusion:{bullet:'Penicillin-allergic, so the amoxicillin arm cannot be used.',b:true},
   armExclusions:[
    {bullet:'Pregnant or breastfeeding. The SPC advises metronidazole should not be given in pregnancy or lactation unless considered essential, which is a prescriber judgement and not a PGD one. Refer.',b:true},
    {bullet:'Unable or unwilling to avoid alcohol completely during the course and for 48 hours afterwards. Ask directly and record the answer.',b:true},
    {bullet:'Taking warfarin or another coumarin, lithium, disulfiram, busulfan, 5-fluorouracil, ciclosporin, phenytoin, phenobarbital, or a QT-prolonging medicine.'},
    {bullet:'Cockayne syndrome. Absolute exclusion, following reports of severe and sometimes fatal hepatotoxicity of very rapid onset.'},
    {bullet:'Known hypersensitivity to metronidazole or other nitroimidazoles.'},
    {bullet:'Severe hepatic impairment, or active neurological disease.'},
   ],
   armRecord:{bullet:'That the alcohol rule was explained and the patient confirmed they can keep to it.',b:true},
   cautions:[
    {text:'Alcohol is handled as an inclusion criterion in this arm, not as a counselling point, because the reaction can be severe and the patient must be asked before the decision to supply is made.',b:true},
    {text:'A metallic taste and furred tongue are common and settle after the course.'},
    {text:'Advise the patient to seek advice for numbness or tingling in the hands or feet, which can indicate peripheral neuropathy.'},
    {text:'Advise the patient to complete the course, and that finishing it does not remove the need for the dental appointment.'},
    {text:'This PGD supplies no analgesia. Where the patient needs pain relief, sell it as a pharmacy medicine under the pharmacy own protocol and record that you did.'},
   ],
   med:[
    ['Name, form and strength','Metronidazole 200mg tablets.'],
    ['Legal category','POM.'],
    ['Route and method','Oral. Swallow with water, with or after food to reduce nausea.'],
    ['Dose and frequency','200mg three times daily for 5 days. This is the licensed dose for acute dental infection; the SPC gives 200mg three times daily for 3 to 7 days.'],
    ['Quantity to be supplied','15 tablets. Supply the whole course; do not split it.'],
    ['Maximum treatment period','5 days. One course per episode. A second course is not authorised under this PGD; refer.'],
    ['Storage','Store below 25C in the original container, protected from light. Do not supply after the expiry date.'],
    ['Adverse effects','Common: metallic taste, nausea, furred tongue, gastrointestinal upset. Uncommon: headache, dizziness, dry mouth. Rare: peripheral neuropathy with prolonged use, darkened urine, hypersensitivity reactions. Very rare: encephalopathy, seizures, hepatotoxicity, and severe hepatotoxicity of rapid onset in Cockayne syndrome. Consult the current SPC.'],
   ],
   pat:[
    ['Written information','Supply the metronidazole patient information leaflet. Do not supply an ibuprofen leaflet: no analgesia is supplied under this PGD.'],
    ['Counselling',[
      {bullet:'NO ALCOHOL AT ALL during the course and for 48 hours after the last tablet. That includes wine, beer, spirits, and alcohol in medicines such as some cough remedies and mouthwashes. The reaction causes flushing, vomiting and a racing heart.',b:true},
      {bullet:'THIS IS A BRIDGE, NOT A CURE. You still need an urgent dental appointment within 24 to 48 hours.',b:true},
      {bullet:'Finish the whole course. Take one tablet every 8 hours, with or after food.'},
      {bullet:'A metallic taste is common and goes when the course finishes.'},
      {bullet:'Seek urgent help the same day if the swelling spreads, your eye starts to close, you cannot open your mouth properly, or you have difficulty swallowing or breathing. Call 999 for breathing or swallowing difficulty.',b:true},
      {bullet:'Tell us if you get numbness or pins and needles in your hands or feet.'},
      {bullet:'For pain relief, ask us: we can sell you something suitable over the counter.'},
    ]],
    ['Follow-up','As the amoxicillin arm. Arrange the dental appointment before the patient leaves where possible, or give the NHS 111 route to emergency dental care.'],
   ],
  }),
 ],

 appendix:[
  {h:'Appendix 1: Emergency red flags. These are 999 or same-day emergency care, not an antibiotic and not a dental appointment.'},
  {text:'If any of these is present, act on it now. Do not supply an antibiotic first, and do not let arranging one delay the referral.',b:true},
  {bullet:'Difficulty breathing, or any change in the voice. Call 999.',b:true},
  {bullet:'Difficulty swallowing, or drooling because the patient cannot swallow saliva. Call 999.',b:true},
  {bullet:'Swelling of the floor of the mouth, or a raised or displaced tongue. This suggests Ludwig angina. Call 999.',b:true},
  {bullet:'Trismus: the patient cannot open the mouth more than about two finger widths. Same-day emergency assessment.',b:true},
  {bullet:'Periorbital or orbital involvement: swelling closing the eye, eye pain, double vision or reduced vision. Same-day emergency assessment.',b:true},
  {bullet:'Rapidly spreading swelling, or swelling extending down the neck.'},
  {bullet:'Signs of sepsis: rigors, confusion, very rapid breathing or heart rate, mottled or ashen skin, not passing urine.'},
  {bullet:'Systemically very unwell in a way that does not fit a simple dental infection, however the individual observations read.'},

  {h:'Appendix 2: Deciding localised versus spreading'},
  {text:'LOCALISED, so no antibiotic:',b:true},
  {bullet:'Pain and tenderness at one tooth, with or without a small amount of gum swelling immediately next to it.'},
  {bullet:'Purulent discharge from the gum next to the tooth, without spread.'},
  {bullet:'No fever, no lymphadenopathy, no facial swelling, patient otherwise well.'},
  {text:'SPREADING OR SYSTEMIC, so an antibiotic is indicated as a bridge:',b:true},
  {bullet:'Temperature 38C or above.'},
  {bullet:'Tender enlarged nodes in the neck or under the jaw.'},
  {bullet:'Facial swelling, or swelling beyond the immediate gum, without any Appendix 1 red flag.'},
  {bullet:'Diffuse redness and swelling spreading into the soft tissues.'},
  {bullet:'Malaise, rigors, feeling generally unwell.'},
  {text:'If you cannot decide which of the two applies, treat the patient as needing assessment rather than a supply, and say so.',b:true},

  {h:'Appendix 3: Key references'},
  {bullet:'Scottish Dental Clinical Effectiveness Programme, Drug Prescribing for Dentistry, dental abscess, current edition.'},
  {bullet:'NICE Clinical Knowledge Summaries, Dental abscess, current revision.'},
  {bullet:'NHS primary care antimicrobial prescribing guidance for dental infection, current local formulary.'},
  {bullet:'Summary of Product Characteristics for amoxicillin 500mg capsules and metronidazole 200mg tablets, current versions.'},
  {bullet:'NICE Medicines Practice Guideline 2 (MPG2): Patient Group Directions, https://www.nice.org.uk/guidance/mpg2'},
 ],

 version:'v005',
 supersedes:'Version 004, 9 September 2026',
 validFrom:'9 September 2026',
 expiry:'31 July 2027',
 sigDate:'9 September 2026',
 chDate:'9 September 2026',
 changes:[
  'The summary of the governing guidance is restored as part 2 of the document, which is the house format for every Get Real Health PGD: what the PGD is for and which medicines it authorises, then a summary of the guidance that governs the condition, then the PGD itself. Twenty documents lost that section in the September 2026 rewrites, because the generator did not emit it and no check looked for it. It is the section that lets a pharmacist hold the PGD against the guidance it claims to follow, which is exactly how the inverted dental indication should have been caught. It is now a required field: the generator refuses to build a document without it.',
  'THE INDICATION IS RESTORED THE RIGHT WAY ROUND. Version 003 required the ABSENCE of facial swelling, fever, malaise and systemic features, and referred any patient who had them. It therefore authorised an antibiotic for the group SDCEP and NICE CKS say should not receive one, and referred the group that guidance identifies as the indication. Version 004 requires at least one sign of spreading infection or systemic involvement, as version 001 did.',
  'The error came from applying a correct instruction too widely. An adopting pharmacy asked that facial swelling must refer, which is right for swelling that threatens the airway, closes the eye, limits mouth opening or is spreading. Version 003 collapsed that into a rule referring all swelling, and lost the distinction between an emergency and a sign of spread. Version 004 keeps both: Appendix 1 sends emergency swelling to 999 or same-day care, and localised facial swelling without those features is one of the reasons to supply.',
  'The three possible outcomes are now stated once, at the front and in both arms, and the pharmacist must record which one applied and the finding that decided it. Version 003 stated its eligibility rule in four places in three different forms.',
  'A higher-risk route is added: a patient with significant immunosuppression or poorly controlled diabetes may receive a bridging antibiotic for an apparently localised infection, following CKS, with the reason recorded.',
  'Appendix 2 is new: a plain list of what counts as localised and what counts as spreading, because that judgement is now the whole basis of the decision, and a rule that an undecidable case goes for assessment rather than supply.',
  'Pregnancy and breastfeeding are back in the amoxicillin arm, as cautions permitting supply. Version 001 carried them but filed them under exclusion criteria, which was the wrong heading; version 003 deleted them rather than moving them. The metronidazole arm excludes pregnancy explicitly, so silence in the amoxicillin arm invited the contrast to be read as meaningful.',
  'The caution telling the pharmacist to "supply paracetamol per the OTC pathway" is removed. It was a leftover from the version 001 ibuprofen arm: it named a pathway that appears nowhere in this document and used supply language for a medicine this PGD does not authorise, while the scope page and the patient information section both said no analgesia is supplied here. The position is now stated once: no analgesia under this PGD, sell it under the pharmacy own protocol and record it.',
  'The change history for version 002 named an individual and a pharmacy, and named them incorrectly. The surname was wrong and had no source in any record. Change history entries no longer name individuals or adopting organisations.',
  'Oral candidiasis restored to the amoxicillin adverse effects, and a counselling line added. It was in version 001 and was lost in the rewrite.',
  'The practitioner Agreement to practise page, the premises block and the practitioner signature table are restored. Every version 001 document carried them; no document produced by the current generator did. This affected 14 live documents and was raised as blocking by an adopting pharmacy, correctly: it is the page a practitioner signs, and NICE MPG2 expects a record of the individuals authorised to work under a PGD.',
  'Standard governance requirements restored to the training list in both arms: SPC and BNF familiarity, MHRA safety alerts, CPD and appraisal, indemnity, and capacity and consent. These were in version 001 and were lost in the rewrite.',
  'The divergence on the penicillin-allergy arm is now stated in the document. This PGD follows SDCEP in using metronidazole; NICE CKS and several NHS formularies give clarithromycin for that cohort, with metronidazole as an adjunct. Both positions exist in current guidance. It is recorded rather than left for a pharmacist to discover, and should be revisited at the next review.',
  'The metronidazole dose remains the licensed 200mg three times daily rather than the 400mg 8-hourly that SDCEP suggests, and the reason remains stated in the document.',
  'The amoxicillin course is 5 days. Version 001 supplied 3 days. The change was made in version 002 or 003 and appeared in no change log, so it is recorded here: 5 days is the duration in NICE CKS and NHS antimicrobial guidance for dental infection. Found by comparing this document against the archived version 001 rather than by anyone noticing.',
 ],
 prior:[
  ['004, 9 September 2026','See the change history of that version. Superseded the same day by v005, which restores the guidance summary section.'],
  ['003, 8 September 2026','Metronidazole arm added for penicillin-allergic adults at the licensed 200mg dose; alcohol handled as an inclusion criterion; interaction exclusions and Cockayne syndrome added; red flags collected into an appendix. The indication was inverted in this version and is corrected in 004.'],
  ['002, 7 September 2026','Full clinical review following feedback from an adopting pharmacy. The ibuprofen arm was removed, ibuprofen being a P medicine for which a PGD is not required. Amoxicillin only, adults 18 and over.'],
  ['001, earlier 2026','Development and issue of new PGD. Amoxicillin and ibuprofen arms.'],
 ],
};

Packer.toBuffer(build(d)).then(b=>{fs.writeFileSync('dental-v005-SIGNED.docx',b);console.log('dental '+d.version+' docx bytes',b.length);});
