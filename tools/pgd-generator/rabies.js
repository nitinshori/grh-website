const {build,Packer,fs}=require('./gen.js');

const d={
 banner:'ISSUED, VALID FROM 8 SEPTEMBER 2026',
 title:'Rabies Pre-Exposure Prophylaxis',
 strap:'Patient Group Direction, version 002, issued 8 September 2026. Rabipur and Verorab, intramuscular route only, pre-exposure only.',

 intro:[
  {h:'Two schedules, and which one you may use'},
  {bullet:'CONVENTIONAL COURSE, PREFERRED, ALL AGES: three doses on day 0, day 7 and day 28. The third dose may be brought forward to day 21 where there is insufficient time before travel.',b:true},
  {bullet:'ACCELERATED COURSE, 18 YEARS AND OVER ONLY: three doses on day 0, day 3 and day 7, with a further dose at one year if travel to high risk areas continues. Use only where there is genuinely insufficient time for the conventional course.',b:true},
  {bullet:'The accelerated course is OFF-LABEL and requires documented consent. See the row below. Neither product SPC contains a three dose day 0, 3 and 7 pre-exposure regimen.',b:true},
  {bullet:'Under 18s may have the conventional course under this PGD. They may NOT have the accelerated course. Where a child needs a fast course, refer to a travel clinic or the GP.',b:true},
  {bullet:'Do not use the two dose day 0 and day 7 regimen that now appears in both product SPCs. UKHSA and JCVI guidance on its use in the UK is still awaited. This PGD follows the Green Book three dose schedules until that position is confirmed and this document reissued.',b:true},
  {bullet:'Observe every patient for 15 minutes after vaccination.',b:true},
  {bullet:'THIS IS PRE-EXPOSURE PROPHYLAXIS ONLY. Any bite, scratch or lick on broken skin that has already happened is a post-exposure situation and a same-day medical emergency. Refer; do not manage it here.',b:true},

  {h:'Where the age restriction comes from'},
  'The 18 year floor on the accelerated course is a Get Real Health service restriction. It is recorded here plainly so that nobody later mistakes it for a guideline requirement.',
  {bullet:'Green Book chapter 27 (19 May 2023) sets no age limit on the accelerated course.'},
  {bullet:'The Verorab SPC records that its one-week pre-exposure regimen was studied in 75 participants including 35 children aged 2 to 17, all of whom reached protective titres.'},
  {bullet:'Get Real Health has nevertheless restricted the accelerated route to adults, on the basis that a compressed course in a child with a fixed travel date leaves no margin if a dose is missed, and that a child needing a fast course is better seen by a travel clinic.'},
  {bullet:'A pharmacist should not read this restriction as a contraindication. It is a scope decision, and it may be revisited.'},

  {h:'A note on the Green Book and Verorab'},
  'Green Book chapter 27 states that Rabipur is the only rabies vaccine licensed for intramuscular use in the UK. That chapter was published on 19 May 2023. Verorab received its UK marketing authorisation, PLGB 23228/0001, on 1 November 2023, and its SPC was last revised on 29 January 2026. Both products in this PGD are UK-licensed. The chapter is simply out of date on this point, and a pharmacist who reads it should not conclude that Verorab is an unlicensed import.',
 ],

 arms:[{
  title:'Rabies vaccine, pre-exposure prophylaxis',
  subtitle:'Patient Group Direction for the administration of Rabipur or Verorab by the intramuscular route for pre-exposure prophylaxis against rabies.',
  training:[
   'Pharmacist registered and practising with the GPhC.',
   'Pharmacy technician registered and practising with the GPhC.',
   'All users must be trained to the National Minimum Standards and Core Curriculum for Immunisation Training, and be competent in intramuscular vaccination technique.',
   'All users must be competent in the recognition and immediate management of anaphylaxis, and hold current basic life support training.',
   'All users must be competent in assessing consent in children and young people, including parental responsibility and Gillick competence. The conventional course under this PGD has no lower age limit, so children are in scope.',
   'All users must know that the two products have DIFFERENT DOSE VOLUMES: Rabipur 1.0 mL, Verorab 0.5 mL. Confirm which product is in hand before drawing up.',
   'All users must understand that the accelerated day 0, 3 and 7 course is off-label under both SPCs and must be able to explain that to a patient and record the consent.',
   'All users must be able to distinguish a pre-exposure request from a post-exposure one, and must treat any exposure that has already occurred as a same-day emergency.',
   'All users must be competent in vaccine handling and cold chain management, including the action to take on a cold chain excursion.',
   'All users must previously have supplied or administered medicines under a PGD, must work in compliance with the SOPs of their own employer, and must practise only within the bounds of their own competence.',
  ],
  pgd:[
   ['Indication','Pre-exposure prophylaxis against rabies in individuals at increased risk through travel or occupation, in accordance with Green Book chapter 27. Rabies is an almost invariably fatal viral encephalitis once symptoms develop. Pre-exposure vaccination does not remove the need for post-exposure treatment, but it simplifies that treatment considerably and removes the need for rabies immunoglobulin, which is expensive and often unavailable in the countries where the risk is highest.'],

   ['Inclusion criteria',[
     {bullet:'Any age for the CONVENTIONAL course. Both products are licensed in all age groups.'},
     {bullet:'18 years and over for the ACCELERATED course.',b:true},
     {bullet:'Travel to a rabies enzootic area, particularly where post-exposure treatment and rabies biologics are lacking or in short supply at the destination, or the trip involves higher risk activities such as cycling or running, or the stay is longer than one month.'},
     {bullet:'Occupational risk abroad: animal control and wildlife workers, veterinary staff and zoologists working in enzootic areas.'},
     {bullet:'UK-based occupational risk: laboratory staff working with rabies virus, workers at DEFRA-authorised quarantine premises or animal carriers, those who regularly handle bats including voluntarily, and veterinary and technical staff with enhanced occupational risk.'},
     {bullet:'Sufficient time before travel to complete the chosen course.'},
     {bullet:'Valid informed consent obtained. Where the individual is under 16, from a person with parental responsibility, or from the young person where assessed as Gillick competent, with the basis of that assessment recorded.',b:true},
     {bullet:'Where the accelerated course is used, documented consent to off-label use. In a young person that consent must come from the person with parental responsibility as well.',b:true},
     {bullet:'No exclusion criterion present.'},
   ]],

   ['The accelerated course is off-label: what to say and record',[
     {text:'Neither SPC contains a three dose day 0, 3 and 7 pre-exposure regimen. Rabipur and Verorab each specify a three dose day 0, 7, 21 or 28 course, and a two dose day 0 and day 7 one-week regimen. The day 0, 3 and 7 course used here comes from Green Book chapter 27, not from either product licence, and is therefore off-label.',b:true},
     {text:'Where the accelerated course is used, tell the patient all of the following and record that you did:',b:true},
     {bullet:'That the schedule being used is recommended by UK national guidance but is not the schedule in the manufacturer’s licence.'},
     {bullet:'That the conventional day 0, 7 and 28 course is the preferred one, and is being departed from only because there is not enough time before travel.'},
     {bullet:'That a further dose will be needed at one year if travel to high risk areas continues.'},
     {bullet:'That pre-exposure vaccination does not remove the need to seek urgent treatment after any bite, scratch or lick on broken skin.'},
     {text:'Record the consent as given for off-label use, naming the schedule. A general consent to vaccination is not sufficient.',b:true},
     {text:'This mirrors the handling of the accelerated Japanese encephalitis schedule in the Japanese encephalitis PGD.',i:true,color:'595959'},
   ]],

   ['Exclusion criteria',[
     {text:'Refer, do not vaccinate, where any of the following applies.',b:true},
     {bullet:'ANY actual or possible exposure that has already occurred, including any bite, scratch or lick on broken skin from a mammal in a rabies risk area, however trivial and however long ago. This is post-exposure. Refer for urgent medical assessment the same day.',b:true},
     {bullet:'Under 18 and the accelerated course is being requested. The conventional course may still be given.',b:true},
     {bullet:'Confirmed anaphylactic reaction to a previous dose of rabies vaccine or to any component of the product to be used.'},
     {bullet:'For Rabipur specifically: severe egg allergy, because it contains chick embryo cell residues including ovalbumin. Verorab may be a suitable alternative.',b:true},
     {bullet:'For Verorab specifically: hypersensitivity to polymyxin B, streptomycin or neomycin, or to any antibiotic of the same class.',b:true},
     {bullet:'Acute severe febrile illness. Postpone until recovered. A minor illness without fever is not a reason to defer.'},
     {bullet:'Intradermal administration. This PGD covers the intramuscular route only. The intradermal route requires specific technique and is outside its scope.'},
     {bullet:'Immunosuppressed and the accelerated course is being requested. The Verorab SPC states the one-week regimen should not be used in immunocompromised individuals, and the same caution applies here. Use the conventional course and refer for post-course serology.',b:true},
     {bullet:'Valid informed consent not obtained, or where the accelerated course is used, consent to off-label use not obtained.'},
   ]],

   ['Cautions',[
     {text:'Pregnancy. Give pre-exposure vaccine where the risk of exposure is high and rapid access to post-exposure treatment would be limited, and record the risk assessment. There is no identified harm signal but human data are limited.'},
     {text:'Breastfeeding. The same principle applies. No risk to the infant has been identified.'},
     {text:'Immunosuppression, including HIV. A full response may not be mounted. Use the conventional three dose schedule rather than the accelerated one, and refer for post-course serology to confirm a protective titre, taken as 0.5 IU/mL or above.',b:true},
     {text:'Bleeding disorders, thrombocytopenia or anticoagulation. Give by deep subcutaneous injection rather than intramuscularly.'},
     {text:'Chloroquine antimalarial prophylaxis suppresses the response to intradermally administered rabies vaccine. This PGD uses the intramuscular route only, which is not affected, but the interaction is recorded here because patients may ask.'},
     {text:'Where rabies vaccine is co-administered with Japanese encephalitis vaccine on the accelerated JE schedule, a faster decline in rabies antibody has been observed. Bear this in mind when advising on booster timing for a traveller who has had both.'},
     {text:'Verorab contains phenylalanine, 4.1 micrograms per 0.5 mL dose. Relevant only in phenylketonuria, and at that quantity almost certainly immaterial, but worth knowing if asked.'},
     {text:'Verorab prefilled syringes without an attached needle have a tip cap containing a natural rubber latex derivative. Check before use in a latex-sensitive patient.',b:true},
   ]],

   ['Anaphylaxis and observation',[
     {text:'Adrenaline (epinephrine) 1 in 1,000 injection must be immediately available whenever a vaccine is administered under this PGD, together with a written anaphylaxis protocol consistent with current Resuscitation Council UK guidance, and a telephone.',b:true},
     {text:'All staff administering vaccines must be trained in the recognition and immediate management of anaphylaxis and must hold current basic life support training.'},
     {text:'OBSERVE EVERY PATIENT FOR 15 MINUTES AFTER VACCINATION. Vaccinate seated. Version 001 delegated the observation period to the pharmacy SOP without stating a figure; it is now 15 minutes, consistently with every other vaccination PGD in this estate.',b:true},
     {text:'Anxiety-related reactions including vasovagal syncope, hyperventilation and transient visual disturbance or paraesthesia can occur before or after any injection. Procedures must be in place to prevent injury from a faint, which is common particularly in adolescents.'},
   ]],

   ['Actions if the patient is excluded or declines',[
     {bullet:'Discuss the reason for exclusion with the patient and make sure they understand it.'},
     {bullet:'Advise on alternative options and how to access them: the GP, a travel clinic, or a specialist service.'},
     {bullet:'Where the exclusion is a possible exposure that has already occurred, make the urgency explicit. That patient needs assessment today, not an appointment.',b:true},
     {bullet:'Where a child needs a fast course and cannot have the accelerated schedule here, say so plainly and direct them to a travel clinic rather than leaving them without a route.',b:true},
     {bullet:'Document the reason for exclusion, the advice given and the decision reached. Inform or refer to the GP as appropriate.'},
   ]],

   ['Yellow Card reporting','Report suspected adverse reactions via https://yellowcard.mhra.gov.uk and inform the GP as appropriate.'],

   ['Records to be kept',[
     {bullet:'That valid informed consent was given, and from whom. Where the individual is under 16, the name and relationship of the person with parental responsibility, or the basis of the Gillick assessment.',b:true},
     {bullet:'Where the accelerated course was used, that consent to off-label use was given, naming the schedule.',b:true},
     {bullet:'Patient name, address, date of birth, and the GP with whom they are registered.'},
     {bullet:'Which product was given, Rabipur or Verorab, with batch number and expiry date.',b:true},
     {bullet:'Which schedule was used and why, and where accelerated, the reason the conventional course was not possible.',b:true},
     {bullet:'Dose number in the course, and the date the next dose is due.',b:true},
     {bullet:'Date of administration, dose volume, route and anatomical site.'},
     {bullet:'Destination and reason for travel, or the occupational indication.'},
     {bullet:'Name and registration number of the healthcare professional administering.'},
     {bullet:'That the 15 minute observation period was completed.',b:true},
     {bullet:'Advice given, including advice given if the patient is excluded or declines.'},
     {bullet:'Details of any adverse drug reactions and the actions taken.'},
     {bullet:'That the vaccine was administered under this PGD.'},
     {text:'Records signed, dated, legible and contemporaneous. Adults 18 and over: 8 years. Under 18s: until the 25th birthday, or the 26th where the patient was 17 when the course finished. The patient must also be given a written record, because it determines their post-exposure treatment if they are ever bitten.'},
   ]],
  ],
  med:[
   ['Name, form and strength',[
     {bullet:'RABIPUR (Bavarian Nordic), purified chick embryo cell vaccine. Powder and solvent, reconstituted to 1.0 mL per dose. Thiomersal free. Contains chick embryo cell residues and traces of neomycin, chlortetracycline and amphotericin B.'},
     {bullet:'VERORAB (Sanofi), purified Vero cell rabies vaccine. Powder and solvent, reconstituted to 0.5 mL per dose. PLGB 23228/0001. May contain traces of polymyxin B, streptomycin and neomycin.'},
     {bullet:'THE DOSE VOLUMES DIFFER: 1.0 mL for Rabipur, 0.5 mL for Verorab. Confirm which product is in hand before drawing up. Do not carry a volume across from one product to the other.',b:true},
     {bullet:'Where a course is started with one product, complete it with the same product wherever possible. The cell-culture vaccines may be used interchangeably if necessary.'},
   ]],
   ['Legal category','POM.'],
   ['Dose and frequency',[
     {bullet:'CONVENTIONAL, preferred, all ages: day 0, day 7 and day 28. The third dose may be brought forward to day 21 where time before travel is short.'},
     {bullet:'ACCELERATED, 18 and over only, off-label, documented consent required: day 0, day 3 and day 7, with a further dose at one year if travel to high risk areas continues.',b:true},
     {bullet:'Boosters are not routinely recommended for most travellers. A single booster may be considered after risk assessment where the primary course was completed more than a year ago and the individual is travelling again to an enzootic area.'},
     {bullet:'Those with frequent unrecognised exposure risk, such as bat handlers, should have a reinforcing dose at one year and then boosters every 3 to 5 years, or as guided by serology.'},
     {bullet:'Laboratory staff working routinely with live virus should have antibody titres checked every 6 months to determine booster timing. This is outside pharmacy scope; refer to occupational health.'},
     {bullet:'DO NOT use the two dose day 0 and day 7 regimen that appears in both SPCs. UKHSA and JCVI guidance on its use is awaited and this PGD deliberately follows the Green Book three dose schedules until that position is confirmed and this document reissued.',b:true},
   ]],
   ['Quantity to be administered','One dose per patient per attendance, in accordance with the schedule above. This PGD does not permit supply of vaccine to the patient for administration elsewhere.'],
   ['Route and method of administration','Intramuscular, into the deltoid in older children and adults, or the anterolateral thigh in infants and young children. Never into the buttock. For a patient with a bleeding disorder, give by deep subcutaneous injection instead. Reconstitute immediately before use. Rabipur must be used within one hour of reconstitution; Verorab for intramuscular use must be used immediately. Where given with other vaccines, use separate sites, preferably different limbs, or at least 2.5 cm apart, and record the site of each.'],
   ['Storage and cold chain',[
     {text:'Store at +2C to +8C in the original packaging to protect from light. Do not freeze; discard if frozen.'},
     {text:'COLD CHAIN EXCURSION: vaccine exposed to conditions outside the stated range must be quarantined and risk assessed in accordance with UKHSA Vaccine Incident Guidance before any further use. Do not administer excursion stock until that assessment is complete. Version 001 carried no cold chain excursion procedure at all.',b:true},
   ]],
   ['Disposal','Dispose of used syringes, needles, vials and any reconstituted vaccine in a UN-approved puncture-resistant sharps container in accordance with local arrangements and HTM 07-01. Version 001 carried no disposal provision.'],
   ['Adverse effects','Very common: headache, malaise, myalgia, injection site pain, fatigue and fever. Common: lymphadenopathy, reduced appetite, injection site erythema and swelling, influenza-like symptoms. Uncommon or rare: hypersensitivity reactions including rash and urticaria, dizziness, nausea, abdominal pain, chills, dyspnoea. Very rare or reported post-marketing: anaphylaxis and angioedema, encephalitis, Guillain-Barre syndrome, and for Verorab sudden hearing loss which may persist. Causality is not established for the neurological events. Consult the current SPC for the product used.'],
  ],
  pat:[
   ['Written information','Supply the patient information leaflet for the product given, and a written record of the vaccine, the schedule used, the batch number and the date the next dose is due. Tell the patient to keep that record with their passport: if they are ever bitten, it determines what post-exposure treatment they need.'],
   ['Counselling',[
     {bullet:'THIS DOES NOT MAKE YOU IMMUNE TO RABIES. If you are bitten, scratched, or licked on broken skin by any mammal, you still need urgent medical treatment. What this does is buy you time and remove the need for rabies immunoglobulin, which is often unavailable where the risk is highest.',b:true},
     {bullet:'Wash any bite or scratch immediately with soap under running water for several minutes, then seek medical help the same day, wherever you are.',b:true},
     {bullet:'Come back for every dose. A part course is not a course. We have booked your next dose.',b:true},
     {bullet:'Avoid contact with animals while you are away, including dogs, cats, monkeys and bats. Do not feed or handle them.'},
     {bullet:'Some soreness, headache, aching or mild fever in the first day or two is common and settles on its own.'},
     {bullet:'Where the accelerated schedule was used: you will need a further dose at one year if you keep travelling to high risk areas.'},
   ]],
   ['Follow-up','Book the next dose of the course at this appointment. Seek urgent medical attention for any animal bite, scratch or lick on broken skin, whatever your vaccination status and however long ago. For a routine query about the vaccine or the schedule, contact the pharmacy.'],
  ],
 }],

 appendix:[
  {h:'Appendix 1: Key references'},
  {bullet:'Immunisation Against Infectious Disease (the Green Book), chapter 27, Rabies, 19 May 2023.'},
  {bullet:'UKHSA guidelines on rabies post-exposure treatment, current version, for the exposure pathway referred to under exclusions.'},
  {bullet:'Summary of Product Characteristics for Rabipur and for Verorab, current versions. Verorab PLGB 23228/0001, first authorised 1 November 2023, text last revised 29 January 2026.'},
  {bullet:'National Travel Health Network and Centre, travelhealthpro.org.uk, for country-specific rabies risk.'},
  {bullet:'UKHSA Vaccine Incident Guidance.'},
  {bullet:'NICE Medicines Practice Guideline 2 (MPG2): Patient Group Directions, https://www.nice.org.uk/guidance/mpg2'},
 ],

 version:'v004',
 supersedes:'Version 003, 8 September 2026',
 validFrom:'9 September 2026',
 expiry:'31 July 2027',
 sigDate:'9 September 2026',
 chDate:'9 September 2026',
 changes:[
  'The practitioner Agreement to practise page, the premises block and the practitioner signature table are restored, together with the standard governance requirements: SPC and BNF familiarity, MHRA safety alerts, CPD and appraisal, indemnity, and capacity and consent. Every version 001 document carried them; no document produced by the current generator did, through one omission in one function that affected 15 live documents. Raised as blocking by an adopting pharmacy: NICE MPG2 expects a record of the individuals authorised to work under a PGD. This version changes no clinical content.',
  'Consent in children and young people added. Version 002 required only "valid informed consent obtained" while the conventional course has no lower age limit, so a child could be vaccinated with nothing in the document about parental responsibility or Gillick competence. Found by an estate-wide sweep of every vaccination PGD on 8 September 2026, which flagged the same gap in nine others.',
  'The accelerated day 0, 3 and 7 course is restricted to patients aged 18 and over. The document states plainly that this is a Get Real Health service restriction and not a guideline one, because Green Book chapter 27 sets no age limit and the Verorab evidence covers children from 2 years. The conventional course remains available at any age.',
  'The accelerated course is now identified as off-label, with a stated consent script and a requirement to record consent to off-label use naming the schedule. Neither product SPC contains a three dose day 0, 3 and 7 pre-exposure regimen; that schedule comes from the Green Book. This mirrors the handling of the accelerated Japanese encephalitis schedule.',
  'Immunosuppressed patients are excluded from the accelerated course, consistent with the Verorab SPC statement that its one-week regimen should not be used in immunocompromised individuals.',
  'A 15 minute observation period after every vaccination is stated in the document. Version 001 delegated it to the pharmacy SOP without giving a figure.',
  'A cold chain excursion procedure and a disposal provision have been added. Version 001 had neither.',
  'The differing dose volumes, Rabipur 1.0 mL and Verorab 0.5 mL, are called out as a check to be made before drawing up, and added to the training requirements.',
  'Latex in the Verorab prefilled syringe tip cap, and its phenylalanine content, added to the cautions.',
  'A note recording that Green Book chapter 27 predates the UK authorisation of Verorab, so its statement that Rabipur is the only UK-licensed intramuscular rabies vaccine is out of date. Both products in this PGD are UK-licensed.',
  'Records must now carry the product given, the schedule used and why, the dose number, the next dose date, and that the observation period was completed.',
  'The position on the two dose day 0 and day 7 SPC regimen is unchanged: it is not to be used under this PGD until UKHSA and JCVI guidance is published and this document is reissued.',
 ],
 prior:[
  ['002, 8 September 2026','Accelerated course restricted to 18 and over and identified as off-label with documented consent; immunosuppressed excluded from it; 15 minute observation, cold chain excursion and disposal added; differing dose volumes called out.'],
  ['001, 21 August 2026','Standalone rabies pre-exposure PGD, split out of the combined Japanese encephalitis, rabies and meningococcal ACWY document following a query from Pharmacy Plus Health. Rabipur and Verorab, intramuscular route only.'],
 ],
};

Packer.toBuffer(build(d)).then(b=>{fs.writeFileSync('rabies-v004-SIGNED.docx',b);console.log('rabies v004 docx bytes',b.length);});
