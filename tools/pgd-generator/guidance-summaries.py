#!/usr/bin/env python3
"""
guidance-summaries.py  --  write part 2 of the house format into documents
                           that lost it

THE HOUSE FORMAT
----------------
Every Get Real Health PGD has three parts:
  1. what the PGD is for, and which medicines it authorises
  2. a summary of the guidance that governs the condition
  3. the PGD itself

The September 2026 rewrites dropped part 2 from twenty documents. gen.js now
refuses to build without it, but the twenty documents without a generator
script have to be patched, which is what this does.

SOURCING RULE
-------------
Every summary below is written from the actual governing document, read in
full, and each carries the source and its date so a reader can tell when the
summary goes stale. Nothing here is written from memory.

NICE CKS is geo-blocked from this environment: both web_fetch and the
browser return an empty body, because CKS restricts access to UK IP
addresses. Where CKS would be the natural source, these summaries use the
underlying NICE guideline or the Green Book chapter instead, which is what
CKS itself summarises, and name which was used. Where neither is reachable
the summary is not written rather than guessed at.

A NOTE THE VACCINE SUMMARIES ALL CARRY
--------------------------------------
Reading the five Green Book chapters in full established something worth
stating in the documents: NONE of chapters 17, 18, 22, 30 or 33 states a
post-vaccination observation period, and none requires adrenaline to be
available. Those requirements in this estate come from the product SPCs and
from Resuscitation Council UK, not from the Green Book, and the documents
now say so rather than implying the Green Book is their source.
"""

import os
import subprocess

import docx
from docx.enum.text import WD_BREAK

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PARENT = os.path.dirname(ROOT)
APPROVED = os.path.join(PARENT, "PGD Rewrite 2026", "02 Approved")
DATE = "9 September 2026"

SAFETY_NOTE = (
    "A NOTE ON WHERE THE SAFETY REQUIREMENTS IN THIS PGD COME FROM. This Green "
    "Book chapter does NOT state a post-vaccination observation period and does "
    "NOT require adrenaline to be available. Those requirements in this document "
    "come from the product Summary of Product Characteristics and from "
    "Resuscitation Council UK guidance, and are stated as Get Real Health service "
    "requirements. The chapter is cited for the disease, the recommendations, the "
    "schedule and the contraindications, and for nothing else."
)

SUMMARIES = {
 "tetanus": {
  "title": "Summary of Green Book chapter 30 guidance for tetanus",
  "source": ("UKHSA, Immunisation Against Infectious Disease, chapter 30, Tetanus. "
             "Chapter dated 2 June 2025; GOV.UK page last updated 14 August 2026. "
             "Summarised 9 September 2026."),
  "sections": [
   ("Overview", [
     "Tetanus is caused by tetanus toxin released after infection with Clostridium tetani. Spores are present in soil and manure and enter through a puncture wound, burn or scratch that may go unnoticed.",
     "Incubation is 4 to 21 days, most commonly about 10 days. It causes generalised rigidity and spasm of skeletal muscle, usually starting in the jaw and neck.",
     "The case fatality ratio ranges from 10 to 90 per cent, highest in infants and the elderly.",
     "It cannot be eradicated, because the spores are in the environment, and it is not spread person to person.",
     "Between 1984 and 2022 there were 327 cases in England and Wales, 68.3 per cent in people aged 45 or over.",
   ]),
   ("Who the chapter recommends it for", [
     "The objective of the programme is a minimum of FIVE doses of a tetanus-containing vaccine at appropriate intervals for all individuals.",
     "Td/IPV is the vaccine recommended for everyone aged 10 years or over.",
     "TRAVELLERS: all travellers should be fully immunised to the UK schedule. Where a traveller is going somewhere medical attention may not be accessible and their last dose was more than 10 years ago, a booster should be given before travel EVEN IF they have already had five doses. This is precautionary, in case immunoglobulin is not available if they sustain a tetanus-prone injury.",
     "Where tetanus, diphtheria or polio protection is needed and the last relevant dose was over 10 years ago, give Td/IPV.",
     "People who inject drugs are at greater risk; take every opportunity to ensure they are protected, and give a booster if there is any doubt.",
     "Where there is no reliable history, assume undocumented doses are missing and follow the UK catch-up recommendations for that age.",
   ]),
   ("Schedule", [
     "All tetanus-containing vaccines are single 0.5 mL doses.",
     "Aged 10 or over, primary course: three doses of a vaccine containing at least 20 IU of tetanus toxoid, four weeks apart.",
     "An interrupted course is RESUMED, not repeated, with four weeks between the remaining doses.",
     "Second booster: Td/IPV, ideally 10 years after the first tetanus booster.",
     "Someone aged 10 or over who has had only three doses should have the first booster as Td/IPV ideally five years after their last primary dose, and the second booster a minimum of five years after that.",
     "If someone attends for a routine booster having had a vaccine after a tetanus-prone wound: if it was the same vaccine now due and given after an appropriate interval, the routine booster is not required. Otherwise discount the injury dose and give the scheduled immunisation. Additional doses are unlikely to produce an unacceptable rate of reactions.",
   ]),
   ("Contraindications and precautions", [
     "Do not give to anyone who has had a confirmed anaphylactic reaction to a previous dose of a tetanus-containing vaccine, or to any component or manufacturing residue.",
     "There are very few individuals who cannot receive tetanus-containing vaccines. Where in doubt, seek specialist advice rather than withholding the vaccine.",
     "Minor illness without fever or systemic upset is not a reason to postpone. If acutely unwell, postpone until recovered.",
     "Previous systemic or local reactions are NOT a bar to further doses, including fever of any severity, hypotonic-hyporesponsive episode, persistent crying over three hours, a severe local reaction of any extent, and convulsions within three days of vaccination.",
     "Neurological conditions are not a contraindication, though deferral may be considered where there is current neurological deterioration.",
   ]),
   ("Pregnancy and immunosuppression", [
     "PREGNANCY: tetanus-containing vaccines may be given to pregnant women without delay when protection is required. There is no evidence of risk from inactivated vaccines or toxoids in pregnancy or breastfeeding.",
     "IMMUNOSUPPRESSION: give in accordance with the recommendations, including in HIV regardless of CD4 count. A full antibody response may not be made; consider re-immunisation after treatment finishes.",
     "Severely immunosuppressed people may not be adequately protected despite full immunisation, and may need additional boosting or immunoglobulin after exposure.",
   ]),
   ("Two things to know about this chapter", [
     "UKHSA states that chapter 30 IS BEING UPDATED for immunoglobulin and post-exposure advice, and directs readers to the separate guidance Tetanus: advice for health professionals in the interim. Anything about tetanus-prone wound management should follow that interim guidance rather than the chapter alone.",
     SAFETY_NOTE,
   ]),
  ],
 },

 "typhoid": {
  "title": "Summary of Green Book chapter 33 guidance for typhoid",
  "source": ("UKHSA, Immunisation Against Infectious Disease, chapter 33, Typhoid. "
             "Chapter footer dated 4 February 2022; GOV.UK page records the last "
             "update as 3 April 2020. Both dates are given because they differ. "
             "Summarised 9 September 2026."),
  "sections": [
   ("Overview", [
     "Typhoid is a systemic infection caused by Salmonella enterica serotype typhi. Paratyphoid is clinically similar and is caused by S. paratyphi A, B and C.",
     "Transmission is mainly oral, from food or water contaminated by the faeces, and occasionally urine, of cases or chronic carriers. Direct faecal-oral spread also occurs.",
     "Incubation averages 10 to 20 days, with a range of 3 to 56.",
     "Case fatality is under 1 per cent with prompt antibiotics, but may be as high as 20 per cent untreated or treated with the wrong antibiotic. Antibiotic resistance is increasing, including extensively drug-resistant typhoid in Pakistan.",
     "THERE IS NO VACCINE FOR PARATYPHOID. Say so to travellers, who often assume otherwise.",
     "The attack rate for travellers to the Indian subcontinent is estimated at 1 to 10 per 100,000 journeys.",
   ]),
   ("Who the chapter recommends it for", [
     "Travellers to typhoid-endemic areas whose planned activities put them at higher risk. Check TravelHealthPro or Travax for the destination.",
     "Those at increased risk include travellers visiting friends and relatives, and frequent or long-stay travellers to areas where sanitation and food hygiene are likely to be poor.",
     "Laboratory personnel who may handle S. typhi.",
     "The chapter states that typhoid vaccine is NOT recommended for close contacts of cases or carriers, nor during a UK outbreak.",
   ]),
   ("Schedule, Vi polysaccharide vaccine", [
     "A single 0.5 mL dose for adults and children over two years. Each dose contains 25 micrograms of Vi antigen.",
     "A single reinforcing dose at THREE YEAR intervals for those who remain at risk. Someone who has had a non-Vi typhoid vaccine may have Vi reinforcing doses on the same three-yearly basis.",
     "Children aged 12 months to two years should be immunised OFF LICENCE only if a detailed risk assessment finds the risk of typhoid high. Immunisation is not recommended under one year.",
     "A four-fold antibody rise is detectable seven days after the primary dose, maximal at one month, persisting about three years. Additional doses do not boost levels further.",
     "Give intramuscularly into the upper arm or anterolateral thigh. INTRADERMAL INJECTION MAY CAUSE A SEVERE LOCAL REACTION AND MUST BE AVOIDED. Deep subcutaneous for a bleeding disorder. Never intravenously.",
   ]),
   ("Contraindications and precautions", [
     "Do not give Vi vaccine to anyone who has had confirmed anaphylaxis to a Vi antigen-containing vaccine.",
     "A severe reaction to a previous NON-Vi typhoid vaccine does not contraindicate a Vi-containing vaccine.",
     "Minor illness without fever or systemic upset is not a reason to postpone. If acutely unwell, postpone until recovered.",
     "The gastrointestinal illness, antibiotic and antimalarial timing precautions in this chapter apply to the ORAL Ty21a vaccine only, not to Vi.",
   ]),
   ("Pregnancy and immunosuppression", [
     "PREGNANCY: no data are available on Vi in pregnancy or lactation. There is no evidence of risk from inactivated vaccines or toxoids in pregnancy or breastfeeding.",
     "IMMUNOSUPPRESSION: Vi contains no live organisms and may be given to people with HIV and to those who are immunosuppressed, in the absence of contraindications. The response may be sub-optimal, so emphasise personal, food and water hygiene.",
   ]),
   ("What to tell every traveller", [
     "The chapter is explicit: not all recipients of typhoid vaccine will be protected, and travellers must be advised to take all necessary precautions to avoid contact with or ingestion of potentially contaminated food and water.",
     "The vaccine is an addition to food and water precautions, not a replacement for them.",
     SAFETY_NOTE,
   ]),
  ],
 },

 "meningitis-acwy-travel": {
  "title": "Summary of Green Book chapter 22 guidance for meningococcal ACWY",
  "source": ("UKHSA, Immunisation Against Infectious Disease, chapter 22, "
             "Meningococcal. Chapter dated 10 June 2025; GOV.UK page last updated "
             "30 July 2025. Summarised 9 September 2026."),
  "sections": [
   ("Overview", [
     "Invasive meningococcal disease is caused by Neisseria meningitidis. Of the 12 capsular groups, B, C, W and Y cause most UK disease.",
     "Spread is by aerosol, droplets or direct contact with respiratory secretions of a carrier, and usually needs frequent or prolonged close contact. There is marked seasonality, peaking in winter.",
     "Incubation is two to seven days. Onset ranges from a mild prodrome to fulminant illness with death within 24 hours of the first symptoms.",
     "The infection is fatal in 5 to 10 per cent of cases. Survivors may develop hearing loss, severe visual impairment, communication problems, limb amputation, seizures and brain damage.",
     "Incidence is highest in infants under one, with a secondary peak at 15 to 19 years. Risk factors include smoking, preceding viral infection and living in closed or semi-closed communities such as university halls or barracks.",
   ]),
   ("Who the chapter recommends it for", [
     "ROUTINE: one dose of MenACWY conjugate vaccine at around 14 years. Anyone who missed it should be offered a dose UP TO THEIR 25TH BIRTHDAY, including people new to the UK.",
     "TRAVEL: every traveller should have a careful risk assessment covering itinerary, duration and planned activities. Those particularly at risk are visitors who live or travel rough, such as backpackers, and those living or working with local people.",
     "HAJJ AND UMRAH: proof of vaccination against groups A, C, W and Y is a VISA ENTRY REQUIREMENT for pilgrims and seasonal workers travelling to Saudi Arabia. It is also recommended for Umrah at any time of year.",
     "SUB-SAHARAN AFRICA: epidemics occur unpredictably across tropical Africa, particularly in the savannah in the dry season from December to June. Vaccination is recommended for long-stay or high-risk visitors, for example those living or working closely with local people, or backpacking.",
     "Travellers should have a quadrivalent ACWY vaccine EVEN IF they previously had MenC conjugate vaccine.",
     "OCCUPATIONAL: laboratory staff handling N. meningitidis must have MenACWY and 4CMenB, with boosters of both every five years.",
     "MEDICAL RISK GROUPS: asplenia, splenic dysfunction, and complement disorders including those on complement-inhibitor therapy. Those starting a complement inhibitor should be vaccinated at least two weeks beforehand, or given prophylactic antibiotics until two weeks after vaccination.",
   ]),
   ("Schedule and products", [
     "Licensed ages differ by product: Nimenrix from 6 weeks, MenQuadfi from 12 months, Menveo from 2 years. Check which product is in hand against the patient age.",
     "From one year of age, including adults: a single 0.5 mL dose.",
     "Under one year: two 0.5 mL doses, four weeks apart.",
     "BOOSTERS: the chapter states that booster doses in at-risk individuals are currently NOT recommended, because the need for and timing of boosters has not yet been determined. The five-yearly booster applies specifically to the occupational laboratory group.",
     "Give intramuscularly into the deltoid, or the anterolateral thigh in infants of one year and under. May be given with other vaccines at a separate site, preferably a different limb, or at least 2.5 cm apart.",
     "Menveo and Nimenrix are powder plus solvent: after reconstitution the entire 0.5 mL is drawn up and used immediately. MenQuadfi is supplied as a solution.",
   ]),
   ("Contraindications and precautions", [
     "Do not give to anyone who has had a confirmed anaphylactic reaction to a previous dose, or to any component or manufacturing residue.",
     "There are very few individuals who cannot receive meningococcal vaccines. Where in doubt, seek specialist advice rather than withholding.",
     "Minor illness without fever or systemic upset is not a reason to postpone. If acutely unwell, postpone until recovered.",
     "Previous systemic or local reaction is not a bar to further doses, on the same terms as the other chapters.",
   ]),
   ("Pregnancy and immunosuppression", [
     "PREGNANCY: meningococcal vaccines may be given when clinically indicated. There is no evidence of risk from inactivated vaccines in pregnancy or breastfeeding, and where immunisation has been given inadvertently in pregnancy there has been no evidence of harm to the foetus.",
     "IMMUNOSUPPRESSION: give in accordance with the routine schedule, including in HIV regardless of CD4 count. A full antibody response may not be made; consider re-immunisation after treatment finishes.",
   ]),
   ("A supply point for a private service", [
     "The chapter states that vaccines for private prescriptions, occupational health use or travel are NOT provided free of charge and must be ordered from the manufacturers.",
     SAFETY_NOTE,
   ]),
  ],
 },

 "hep-ab-travel": {
  "title": "Summary of Green Book chapters 17 and 18 guidance for hepatitis A and B",
  "source": ("UKHSA, Immunisation Against Infectious Disease, chapter 17, Hepatitis A "
             "(chapter dated 12 January 2024, page updated 15 January 2024) and "
             "chapter 18, Hepatitis B (chapter dated 5 February 2026, page updated "
             "24 February 2026). Summarised 9 September 2026."),
  "sections": [
   ("Hepatitis A: overview", [
     "A viral infection of the liver. The disease is generally mild but severity increases with age. Asymptomatic infection is common in children; jaundice occurs in 70 to 80 per cent of those infected as adults.",
     "There is NO chronic persistent state and chronic liver damage does not occur. Fulminant hepatitis is rare.",
     "Spread is faecal-oral, person to person or through contaminated food or drink, including shellfish, frozen berries, dates and salad vegetables. Incubation is usually around 28 to 30 days.",
     "Most adolescents and adults in the UK remain susceptible throughout life.",
     "Highest risk areas for UK travellers are the Indian subcontinent, the Middle East, Africa and South East Asia, and the risk now extends to Eastern Europe.",
   ]),
   ("Hepatitis A: who the chapter recommends it for", [
     "TRAVEL: recommended for those aged one year and over travelling to areas of high or medium endemicity. Give preferably at least two weeks before departure, but it can be given up to the day of departure. Immunisation is NOT generally considered necessary for Northern or Western Europe including Spain, Portugal and Italy, nor North America, Australia or New Zealand.",
     "People with chronic liver disease of any cause, and consider it in chronic hepatitis B or C.",
     "People with haemophilia receiving plasma-derived clotting factors, who should be immunised SUBCUTANEOUSLY.",
     "Gay, bisexual and other men who have sex with men, and people who inject drugs.",
     "Occupational: laboratory workers who may be exposed, staff and residents of some large residential institutions, sewage workers at risk of repeated exposure to raw sewage, and people working with susceptible primates. Routine immunisation is NOT indicated for most healthcare workers.",
   ]),
   ("Hepatitis A: schedule", [
     "Two doses, the second 6 to 12 months after the first.",
     "A single dose protects for up to 12 months. The second dose at 6 to 12 months gives immunity for AT LEAST 25 YEARS.",
     "A booster 25 years after a completed course is generally not needed, except for those at ongoing risk or after exposure to a case.",
     "A delayed second dose does not mean restarting: successful boosting occurs even when the second dose is delayed for several years.",
     "Where rapid protection is needed in adults, a single dose of MONOVALENT vaccine is recommended. Ambirix and Havrix Junior Monodose contain more hepatitis A antigen and protect against hepatitis A more quickly than Twinrix Paediatric or Avaxim Junior.",
     "PHENYLALANINE: Avaxim, Havrix and ViATIM contain phenylalanine in varying amounts. Advise the patient, parent or carer to account for it in meal planning on the day.",
   ]),
   ("Hepatitis B: overview and who it is for", [
     "A viral infection of the liver spread by parenteral or mucosal exposure to infected blood or body fluids: sexual contact, percutaneous blood-to-blood exposure including shared injecting equipment and needlestick injury, and perinatal transmission.",
     "Jaundice occurs in about 10 per cent of younger children and 30 to 50 per cent of adults with acute infection. Chronic infection follows in 90 per cent of those infected perinatally but 5 per cent or fewer of previously healthy adults.",
     "TRAVEL: offer immunisation to travellers to areas of high or intermediate prevalence who will do things that place them at risk, which may include sexual activity, injecting drug use, relief healthcare work, and combat or other sports with frequent blood exposure.",
     "Also immunise those at high risk of needing medical or dental procedures abroad where unsafe injections occur: long stays in high or intermediate prevalence areas, children and others who may need care while visiting family, people with chronic conditions who may need hospital care overseas such as haemodialysis, and those travelling for medical care.",
     "Testing point: where testing for markers of infection is indicated, do it AT THE SAME TIME as the first dose. Do not delay vaccination waiting for results.",
   ]),
   ("Hepatitis B: schedules", [
     "0, 1, 2 and 12 months, the ACCELERATED schedule, is the most commonly used and is what the chapter says should be used for most adult and childhood risk groups, because completion rates are higher.",
     "0, 7 and 21 days plus 12 months, the SUPER-ACCELERATED or very rapid schedule, is mainly used for travel and is licensed for adults over 18 at immediate risk. A fourth dose at 12 months should be given.",
     "0, 1 and 6 months, the STANDARD schedule, should only be used where rapid protection is not required and compliance is likely.",
     "An interrupted primary course is RESUMED, not repeated.",
     "Twinrix Adult at 0, 7 and 21 days gives more rapid hepatitis B protection than other schedules, but FULL hepatitis A protection comes later than with a vaccine containing a higher hepatitis A dose. A fourth dose at 12 months should be given.",
     "Boosters: immunocompetent children and adults who completed a primary course do NOT need a reinforcing dose. Consider one for people with kidney failure, at the time of a significant exposure, and for healthcare or laboratory workers who did not respond.",
     "Different hepatitis B monovalent and combination products are in general interchangeable.",
   ]),
   ("Contraindications, pregnancy and immunosuppression", [
     "HEPATITIS A: do not give to anyone who has had a confirmed anaphylactic reaction to a previous hepatitis A-containing vaccine or to any component. Check the data sheet for excipients.",
     "HEPATITIS B: do not give to anyone who has had a confirmed anaphylactic reaction to a previous hepatitis B-containing vaccine or to any component or manufacturing residue. The vaccine is not effective in acute hepatitis B and is not necessary where there are markers of current or past infection, but immunisation should not be delayed awaiting results.",
     "Minor illness without fever or systemic upset is not a reason to postpone.",
     "PREGNANCY: both may be given when clinically indicated. Hepatitis B immunisation must NOT be withheld from a pregnant woman in a high-risk category, since infection in pregnancy may cause severe maternal disease and chronic infection of the newborn.",
     "IMMUNOSUPPRESSION: hepatitis A may be given, though seroconversion and titres may be lower and relate to CD4 count. For hepatitis B, response rates are lower depending on the degree of immunosuppression, and more doses, a higher antigen dose or a tri-antigen vaccine may improve the response.",
     "ANTICOAGULATION: chapter 17 gives practical detail. Someone on stable anticoagulation, including warfarin where INR testing is up to date and the latest INR was below the top of range, can be vaccinated intramuscularly using a 23 gauge or finer needle, with firm pressure without rubbing for at least two minutes.",
   ]),
   ("A note on the safety requirements in this PGD", [SAFETY_NOTE]),
  ],
 },
}


def build_sections(entry):
    """Flatten a summary into the --section format used by the patcher."""
    out = []
    for heading, bullets in entry["sections"]:
        out.append((heading, bullets))
    return out


def apply(slug, src_docx, out_docx, version, supersedes):
    entry = SUMMARIES[slug]
    d = docx.Document(src_docx)

    p = d.add_paragraph()
    p.add_run().add_break(WD_BREAK.PAGE)
    h = d.add_paragraph()
    h.add_run(entry["title"]).bold = True
    d.add_paragraph(entry["source"])
    d.add_paragraph(
        "This summary is part 2 of the house format for a Get Real Health PGD: "
        "what the PGD is for, then the guidance that governs the condition, then "
        "the PGD itself. It is here so that a pharmacist can hold this document "
        "against the guidance it claims to follow. It summarises the source named "
        "above and adds nothing to it."
    )
    for heading, bullets in build_sections(entry):
        hh = d.add_paragraph()
        hh.add_run(heading).bold = True
        for b in bullets:
            d.add_paragraph(b)

    p = d.add_paragraph()
    p.add_run().add_break(WD_BREAK.PAGE)
    hh = d.add_paragraph()
    hh.add_run("Version and change record").bold = True
    for line in [
        "Version: " + version,
        "Issued: " + DATE,
        "Supersedes: " + supersedes,
        "Change: the summary of the governing guidance is restored as part 2 of "
        "the document. Twenty documents lost that section in the September 2026 "
        "rewrites, because the generator did not emit it and no check looked for "
        "it. Nothing else in this document is altered, and this is not a clinical "
        "review of the remainder.",
        "Authorised by Nitin Shori, Medical Director (GMC 6047293) and Chris "
        "Pilkington, Head Pharmacist (GPhC 2046322), on " + DATE + ". Signatures "
        "applied digitally on their joint instruction.",
    ]:
        d.add_paragraph(line)

    d.save(out_docx)
    subprocess.run(["soffice", "--headless", "--convert-to", "pdf", out_docx],
                   cwd=APPROVED, capture_output=True)
    print(f"{slug:24} {version}  guidance summary written")


if __name__ == "__main__":
    JOBS = [
        # slug, source docx, output docx, new version, supersedes
        ("tetanus", "tetanus-v004-SIGNED.docx", "tetanus-v005-SIGNED.docx",
         "v005", "Version 004, 9 September 2026"),
        ("typhoid", "typhoid-v003-SIGNED.docx", "typhoid-v004-SIGNED.docx",
         "v004", "Version 003, 9 September 2026"),
        ("meningitis-acwy-travel", "menacwy-v003-SIGNED.docx",
         "menacwy-v004-SIGNED.docx", "v004", "Version 003, 9 September 2026"),
        ("hep-ab-travel", "hep-ab-travel-v003-SIGNED.docx",
         "hep-ab-travel-v004-SIGNED.docx", "v004", "Version 003, 9 September 2026"),
    ]
    for slug, src, out, ver, sup in JOBS:
        apply(slug,
              os.path.join(APPROVED, src),
              os.path.join(APPROVED, out),
              ver, sup)
