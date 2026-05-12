export interface Article {
  slug: string;
  title: string;
  description: string;
  category: "PGD Fundamentals" | "Revenue & Growth" | "Clinical Services" | "Compliance" | "Industry";
  readTime: string;
  publishDate: string;
  primaryKeyword: string;
  content: string; // markdown-style plain text — rendered as HTML sections
}

export const articles: Article[] = [
  {
    slug: "what-is-a-patient-group-direction",
    title: "What Is a Patient Group Direction (PGD)?",
    description:
      "A clear, practical guide to PGDs — what they are, how they work, who can use them, and why they matter for UK community pharmacy.",
    category: "PGD Fundamentals",
    readTime: "6 min read",
    publishDate: "2025-06-01",
    primaryKeyword: "what is a patient group direction",
    content: `A Patient Group Direction is a written instruction that allows specified healthcare professionals — including pharmacists — to supply or administer a medicine to patients who meet certain criteria, without needing an individual prescription from a doctor.

PGDs have been part of UK healthcare since 2000. They exist because the traditional model — patient sees GP, GP writes prescription, patient collects from pharmacy — is too slow for many routine clinical needs. Travel vaccinations, emergency contraception, UTI treatment, and dozens of other services can be safely and efficiently provided directly by a pharmacist under a PGD.

The legal framework sits under the Human Medicines Regulations 2012 (as amended). A PGD must be authorised by a designated body — typically an NHS organisation or a private healthcare provider registered with the CQC — and signed off by a doctor and a pharmacist.

For pharmacists, PGDs represent a significant commercial and clinical opportunity. They allow community pharmacy to move beyond dispensing into direct patient care, generating new revenue while reducing pressure on GP surgeries and A&E departments.

Every PGD has inclusion and exclusion criteria, clinical assessment steps, counselling requirements, and documentation standards. The pharmacist follows a structured protocol for each consultation, ensuring patient safety and creating an auditable record.

There are currently over 100 medicines that can be supplied under PGD in community pharmacy, covering travel health, vaccines, sexual health, weight management, skin conditions, respiratory conditions, and more. The number is growing as NICE and the MHRA approve new pathways.

To use a PGD, a pharmacist must be named on the direction, have completed the relevant training, and be assessed as competent by the authorising body. This is not a one-off process — ongoing CPD and periodic reassessment are standard requirements.

If you're a pharmacy owner or superintendent considering PGD services, the key question is not whether to offer them — it's which PGDs to prioritise and which provider gives you the best combination of clinical governance, training, technology, and value.`,
  },
  {
    slug: "pgd-vs-psd-whats-the-difference",
    title: "PGD vs PSD — What's the Difference?",
    description:
      "PGDs and PSDs both let pharmacists supply medicines, but they work differently. Here's what you need to know.",
    category: "PGD Fundamentals",
    readTime: "5 min read",
    publishDate: "2025-06-08",
    primaryKeyword: "PGD vs PSD pharmacy",
    content: `Both Patient Group Directions (PGDs) and Patient Specific Directions (PSDs) allow medicines to be supplied without a traditional prescription, but they serve different purposes and have different legal requirements.

A PGD is a pre-authorised direction that allows a named healthcare professional to supply a specified medicine to any patient who fits the defined criteria. It's a one-to-many model — one direction covers an entire patient group.

A PSD, by contrast, is a one-to-one instruction. A prescriber (usually a doctor) writes a direction for a specific, named patient. It's essentially a prescription alternative used in settings like hospitals and clinics where standard prescriptions aren't practical.

For community pharmacy, PGDs are far more relevant. They allow pharmacists to assess and treat patients independently, without needing to contact a prescriber for each individual. This is what makes services like travel vaccination clinics, UTI treatment, and weight management commercially viable in pharmacy.

The key differences come down to scope, flexibility, and autonomy. Under a PGD, the pharmacist makes the clinical decision. Under a PSD, the prescriber has already made the decision — the pharmacist is simply carrying out the instruction.

From a governance perspective, PGDs require more upfront work — they need formal authorisation, training, and competency assessment. But once in place, they give the pharmacist full clinical autonomy within the scope of the direction.

PSDs are simpler to set up but less scalable. Every patient needs an individual direction from a prescriber, which creates a bottleneck.

For pharmacy owners thinking about private services, PGDs are the foundation. They're what enable you to run a travel clinic, offer weight management consultations, or provide sexual health services without relying on a GP for every patient.

The practical takeaway: if you want to build a scalable private services operation, you need PGDs. PSDs have their place in specific clinical settings, but they're not the tool for growing a pharmacy-based clinical services business.`,
  },
  {
    slug: "most-profitable-pgds-for-pharmacy",
    title: "Which PGDs Make the Most Money for Pharmacies?",
    description:
      "A data-driven look at the highest-revenue PGD services for UK community pharmacies — and how to prioritise your service portfolio.",
    category: "Revenue & Growth",
    readTime: "8 min read",
    publishDate: "2025-06-15",
    primaryKeyword: "most profitable PGDs for pharmacy",
    content: `Not all PGDs are created equal when it comes to revenue. The difference between a well-chosen PGD portfolio and a poorly chosen one can be tens of thousands of pounds per year.

The highest-revenue PGD category in UK community pharmacy is travel health. A single travel consultation can generate between £150 and £300 per patient when you factor in multiple vaccinations, anti-malarials, and follow-up doses. The average pharmacy with a well-run travel clinic earns upwards of £46,000 per year from travel services alone.

Weight management is the fastest-growing category. GLP-1 treatments like Wegovy and Mounjaro generate £200–350 per patient per month, with patients typically staying on treatment for 6–12 months. A pharmacy seeing just 10 weight management patients generates £24,000–42,000 annually from this service alone.

Vaccines beyond travel — private flu, shingles (Shingrix), chickenpox, and the newer RSV vaccines — form a strong secondary revenue layer. Shingles vaccination generates £150–200 per two-dose course, and the private market for over-70s is significant since the NHS programme has age caps.

Men's and women's health services generate moderate per-consultation revenue but have high volume and strong repeat rates. Erectile dysfunction and hair loss treatments create loyal, returning patients. HRT initiation is a major emerging opportunity — one in three women in menopause receive no treatment, and pharmacy-based HRT under PGD is virtually uncontested.

Sexual health, particularly PrEP for HIV prevention, represents a growing private market. Thousands of patients currently pay £50+ per month through online clinics — pharmacy-based PrEP under PGD is faster, more accessible, and builds local relationships.

The key to maximising revenue is portfolio breadth combined with smart prioritisation. Launch with high-demand, high-margin services first (travel, weight management, vaccines), then layer in volume-driving services (UTI, ED, skin) that keep footfall high and build patient loyalty.

The critical mistake is limiting your portfolio to what competitors offer. If you only provide the same 20 PGDs as Pharmadoctor, you're competing on price. If you offer 60+ including exclusive services like HRT, TRT, and PrEP, you're competing on access — and winning.`,
  },
  {
    slug: "how-to-start-a-travel-clinic-in-your-pharmacy",
    title: "How to Start a Travel Clinic in Your Pharmacy",
    description:
      "A step-by-step guide to launching a profitable travel clinic — from PGD procurement to patient marketing.",
    category: "Revenue & Growth",
    readTime: "10 min read",
    publishDate: "2025-06-22",
    primaryKeyword: "how to start a travel clinic pharmacy",
    content: `Travel health is the single most profitable PGD service category for UK community pharmacies. Here's how to set one up properly.

Step one is securing your PGDs. You need a PGD provider that covers the full range of travel vaccines — typhoid, hepatitis A, hepatitis B, diphtheria/polio/tetanus, cholera, yellow fever, Japanese encephalitis, rabies, meningitis ACWY, and dengue. You also need anti-malarial PGDs for Malarone, Doxycycline, and Mefloquine, plus supporting PGDs for altitude sickness and traveller's diarrhoea standby packs.

Step two is training. Every pharmacist delivering the service must complete accredited training for each PGD. This covers the clinical pathway, inclusion and exclusion criteria, vaccine schedules, cold chain management, anaphylaxis response, and documentation requirements. Good providers include this training as part of the package.

Step three is your consultation setup. You need a private consultation room with a clinical waste bin, sharps disposal, anaphylaxis kit (with in-date adrenaline auto-injectors), a fridge with temperature monitoring for vaccine storage, and a digital system for recording consultations.

Step four is stock. Travel vaccines represent a significant upfront investment. Start with the highest-demand lines — Hepatitis A, Typhoid, and DTP are your bread and butter. Add specialist vaccines as demand grows. Work with your wholesaler on returns policies for short-dated stock.

Step five is marketing. Most travel patients find their pharmacy through Google. Make sure your Google Business profile lists travel vaccination services. Put signage in-store. Post on local social media groups when travel season approaches (January–March is peak booking season for summer travel).

Step six is pricing. Travel consultations should be priced to reflect the clinical expertise involved. A full pre-travel consultation with multiple vaccines typically ranges from £150–300. Don't undercut yourself — patients are comparing you to GP travel clinics charging similar rates, not to free NHS services.

The biggest mistake new travel clinics make is launching with too few vaccines. If a patient needs four vaccines and you only stock two, they'll go elsewhere for all four. Complete your portfolio from day one.

Revenue expectations: a well-marketed travel clinic in a reasonably busy location should generate £30,000–50,000 in its first year, growing to £46,000+ as repeat patients and word-of-mouth build.`,
  },
  {
    slug: "can-pharmacy-technicians-use-pgds",
    title: "Can Pharmacy Technicians Use PGDs?",
    description:
      "The regulatory position on pharmacy technicians and PGDs has changed. Here's what the June 2024 update means for your team.",
    category: "PGD Fundamentals",
    readTime: "4 min read",
    publishDate: "2025-07-01",
    primaryKeyword: "pharmacy technicians PGDs",
    content: `The short answer is: it's changing, and the direction of travel is clear.

Historically, only specified healthcare professionals could operate under PGDs. For pharmacy, this meant registered pharmacists. Pharmacy technicians — despite being GPhC-registered professionals with significant clinical training — were excluded from the legal framework.

In June 2024, the UK government consulted on extending PGD eligibility to pharmacy technicians for specific, lower-risk services. This follows the broader trend of expanding the pharmacy technician role that began with the Pharmacy First programme and the GPhC's revised standards for initial education and training.

The rationale is straightforward: pharmacy technicians are already performing many aspects of clinical service delivery. They take patient histories, conduct screening assessments, and support consultation workflows. Allowing them to supply certain medicines under PGD — with appropriate training and governance — increases capacity without compromising safety.

For pharmacy owners and superintendents, this has practical implications. If your pharmacists are the bottleneck for PGD services — particularly high-volume, lower-complexity services like flu vaccination, emergency contraception, or minor ailment treatment — technician-delivered PGDs could significantly increase your consultation capacity.

The key point to understand is that this won't be a blanket extension. The regulatory change is expected to specify which PGDs technicians can operate under, with requirements for additional training, competency assessment, and clinical supervision. The pharmacist remains the responsible professional — but the delivery model becomes more flexible.

What should you do now? First, make sure your PGD provider is preparing for the change. The best providers are already designing training pathways and updated governance frameworks for technician-delivered PGDs. Second, identify which of your current services would benefit from technician delivery — typically the high-volume, protocol-driven services with clear inclusion and exclusion criteria.

This is not a future consideration. The regulatory wheels are turning and the pharmacies that prepare now will be first to benefit when the change takes effect.`,
  },
  {
    slug: "hrt-through-pharmacy-what-is-possible-under-pgd",
    title: "HRT Through Pharmacy — What's Possible Under PGD?",
    description:
      "One in three menopausal women receive no treatment. Pharmacy-based HRT under PGD could change that — here's how.",
    category: "Clinical Services",
    readTime: "7 min read",
    publishDate: "2025-07-08",
    primaryKeyword: "HRT pharmacy PGD",
    content: `HRT is one of the biggest untapped opportunities in UK community pharmacy. The demand is enormous, GP capacity is stretched, and the clinical governance framework for pharmacy-based initiation is maturing rapidly.

The numbers are stark: approximately 13 million women in the UK are currently peri-menopausal or post-menopausal. One in three receive no treatment at all. Among those who do seek help, the average wait for a GP menopause appointment is 4–8 weeks — and many GPs lack confidence in prescribing HRT, leading to further referrals and delays.

This is where pharmacy comes in. A PGD for HRT initiation allows a trained pharmacist to assess menopausal symptoms, confirm eligibility, prescribe appropriate HRT, and provide counselling — all in a single consultation. The patient walks in with symptoms and walks out with treatment.

The clinical pathway under PGD typically covers first-line HRT options: transdermal oestrogen patches or gel (preferred over oral for safety), plus micronised progesterone for women with a uterus. The PGD defines clear inclusion criteria, exclusion criteria (family history of breast cancer, VTE risk factors, etc.), required assessments, and follow-up protocols.

From a revenue perspective, HRT consultations typically command £80–150 for the initial assessment, with follow-up reviews generating additional income. Given the ongoing nature of HRT — most women stay on treatment for years — this creates a loyal, returning patient base.

The competitive landscape is remarkable for what's missing. Pharmadoctor does not offer HRT under PGD. ECG does not offer it either. The online clinic market (Leva, The Menopause Charity) serves some demand but lacks the face-to-face clinical relationship that many women prefer. Pharmacy-based HRT under PGD is virtually uncontested.

For pharmacists, the training requirement is substantial but achievable. Expect 8–12 hours of accredited learning covering menopause physiology, HRT prescribing, risk assessment, and patient counselling. This is specialist clinical work — but it's squarely within pharmacist competence when properly trained and governed.

The first pharmacies to offer this service will build powerful local reputations. Menopause is no longer a taboo subject — women are actively searching for accessible, knowledgeable healthcare providers. Be the pharmacy that shows up.`,
  },
  {
    slug: "glp1-weight-management-pharmacy-complete-guide",
    title: "GLP-1 Weight Management in Pharmacy — A Complete Guide",
    description:
      "Wegovy, Mounjaro, and the GLP-1 revolution — what pharmacy owners need to know about the fastest-growing PGD category.",
    category: "Clinical Services",
    readTime: "9 min read",
    publishDate: "2025-07-15",
    primaryKeyword: "GLP-1 pharmacy weight management",
    content: `GLP-1 receptor agonists have transformed weight management. For pharmacy, they represent the fastest-growing revenue opportunity in a generation.

Semaglutide (Wegovy) and tirzepatide (Mounjaro) are the two dominant treatments. Both are injectable, both require clinical assessment before initiation, and both need ongoing monitoring and dose titration — making them ideal for pharmacy-based delivery under PGD.

The patient demand is extraordinary. Obesity affects over 25% of UK adults. NHS waiting lists for weight management services are measured in months. Online clinics have proliferated, but many offer medication without adequate clinical oversight — post it and forget it. Pharmacy fills the gap: accessible, clinical, face-to-face, and ongoing.

Under PGD, the pharmacist conducts an initial assessment (BMI, medical history, contraindications, current medications), initiates treatment at the appropriate starting dose, and schedules follow-up consultations for dose titration and monitoring. The structured protocol ensures patient safety while creating a natural recurring revenue stream.

Revenue modelling is compelling. GLP-1 treatments generate £200–350 per patient per month. A pharmacy managing 15 active weight management patients generates approximately £36,000–63,000 annually from this single service category. Most patients remain on treatment for 6–12 months, with many continuing longer.

The key differentiator for pharmacy versus online clinics is the ongoing monitoring. Dose titration for both semaglutide and tirzepatide follows a structured escalation schedule. Side effects (nausea, constipation, injection site reactions) need management. Blood pressure and other parameters need checking. This is clinical work — and it's work that online clinics do poorly.

Stock management requires attention. GLP-1 medications are expensive (wholesale cost £150–250 per month) and require cold chain storage. Start with a manageable patient cohort and scale as your supply chain stabilises. Consider patient pre-payment to manage cash flow.

Training covers GLP-1 pharmacology, patient assessment, injection technique (you'll be teaching patients to self-inject), dose titration protocols, side effect management, and when to refer. Expect 6–10 hours of accredited learning.

Do not launch your PGD service portfolio without weight management. It is the service patients are actively searching for, and the pharmacy that offers it locally will capture significant market share.`,
  },
  {
    slug: "how-to-switch-pgd-providers",
    title: "How to Switch PGD Providers",
    description:
      "Thinking about changing your PGD provider? Here's a practical guide to making the switch without disrupting your services.",
    category: "Revenue & Growth",
    readTime: "6 min read",
    publishDate: "2025-07-22",
    primaryKeyword: "how to switch PGD provider",
    content: `Switching PGD providers feels daunting, but it's more straightforward than most pharmacy owners expect. Here's what's actually involved.

The first thing to understand is that PGDs are not transferable between providers. When you switch, you're not migrating documents — you're adopting a new set of PGDs from your new provider. Your old PGDs cease to be valid once you leave your current provider (or at their expiry date, whichever comes first).

Step one: review your current contract. Most PGD providers operate on annual subscriptions. Check your notice period and renewal date. Many pharmacies time their switch to coincide with renewal to avoid paying two providers simultaneously.

Step two: assess what you're getting from your current provider versus what you need. Common reasons pharmacies switch include limited PGD range (providers offering 20–30 PGDs when 60+ are available), per-consultation fees eating into margins, outdated or clunky consultation technology, poor training quality, and lack of superintendent oversight tools.

Step three: onboarding with your new provider. A good provider should have you operational within 48 hours. This includes issuing your new PGDs, setting up platform access, completing initial training (or recognising equivalent prior learning), and verifying competency assessments.

Step four: the transition. In practice, most pharmacies run a brief overlap period — typically one to two weeks — where they wind down services under the old provider while ramping up under the new one. Patient records belong to the pharmacy, not the provider, so there's no data migration issue if you've been maintaining your own records.

Step five: notify your patients. For ongoing services (weight management, HRT, repeat prescriptions), let patients know you've upgraded your service provider. Frame it positively — more services, better technology, same clinical team.

Common concerns that turn out to be non-issues: training recognition (good providers don't make you repeat training you've already done), CQC notification (switching providers doesn't change your CQC registration status), and service continuity (if your new provider covers the same PGDs, there's no gap).

The real question isn't whether switching is difficult — it isn't. The question is whether your current provider is costing you money through per-consultation fees, limited service range, or outdated technology. If the answer is yes, the switch pays for itself quickly.`,
  },
  {
    slug: "nhs-funding-crisis-what-it-means-for-your-pharmacy",
    title: "The NHS Funding Crisis and What It Means for Your Pharmacy",
    description:
      "NHS pharmacy funding has fallen in real terms for a decade. Here's what the numbers mean and how private PGD services can fill the gap.",
    category: "Industry",
    readTime: "7 min read",
    publishDate: "2025-08-01",
    primaryKeyword: "NHS pharmacy funding crisis 2025",
    content: `The financial reality facing UK community pharmacy is stark. NHS funding has not kept pace with inflation, costs have risen sharply, and the traditional dispensing model is under pressure from multiple directions.

The numbers tell the story. The Community Pharmacy Contractual Framework (CPCF) delivered a funding settlement that many pharmacy bodies have described as inadequate. When adjusted for inflation, real-terms funding per pharmacy has declined consistently over the past decade. The average independent pharmacy now operates on margins that would be unsustainable in most other healthcare settings.

Meanwhile, costs have risen. Energy bills, staff wages (following National Living Wage increases), drug tariff fluctuations, and property costs have all increased. The Pharmaceutical Services Negotiating Committee (PSNC) has repeatedly highlighted the growing gap between what pharmacies receive and what it costs to operate.

Dispensing volume — historically the core revenue driver — is under structural pressure. Repeat dispensing hubs, online pharmacies, and GP-direct dispensing are all reducing footfall. The number of pharmacies in England has been declining year on year.

Against this backdrop, private clinical services under PGD represent one of the most viable diversification strategies available to community pharmacy.

The revenue potential is significant. A pharmacy offering a comprehensive PGD service portfolio — travel health, weight management, vaccines, sexual health, women's health — can generate £50,000 or more per year in private service revenue. This is net new income, not a reallocation of existing NHS fees.

Critically, private PGD services carry no per-item clawback risk, no drug tariff exposure, and no Category M uncertainty. The pharmacy sets the price, delivers the service, and keeps the revenue. The only cost is the PGD provider subscription and the pharmacist's time — which is already being paid for.

The pharmacies that thrive in the current funding environment will be those that build sustainable private revenue streams alongside their NHS contract. PGD services are not a replacement for NHS income — they're the growth engine that makes the overall business model viable.

This is not a theoretical argument. The pharmacies already offering comprehensive PGD services are the ones reporting stable or growing total revenue, while those relying solely on NHS dispensing are facing the squeeze.`,
  },
  {
    slug: "pgd-compliance-checklist",
    title: "PGD Compliance Checklist — Everything You Need Before You Start",
    description:
      "A practical compliance checklist for pharmacies about to start delivering PGD services. Print it, pin it, use it.",
    category: "Compliance",
    readTime: "5 min read",
    publishDate: "2025-08-08",
    primaryKeyword: "PGD compliance checklist",
    content: `Before you deliver your first consultation under PGD, you need to have these elements in place. This checklist covers the legal, clinical, and operational requirements for compliant PGD service delivery in UK community pharmacy.

Legal and Governance: Your PGDs must be authorised by a body legally permitted to do so. Each PGD must be signed by a doctor and a pharmacist. The PGD must be in date — expired PGDs are not valid. Every pharmacist delivering under the PGD must be individually named on the direction. Your pharmacy must have appropriate indemnity insurance covering PGD service delivery.

Training and Competency: Every named pharmacist must have completed accredited training for each PGD they will operate under. Competency assessments must be documented and dated. Records of training completion must be accessible for audit. Ongoing CPD requirements must be met — PGD competence is not a one-off assessment.

Consultation Environment: You need a private consultation room that meets GPhC standards. The room must have appropriate clinical waste disposal (yellow bins for clinical waste, sharps containers for needles). An anaphylaxis kit must be present and in date — this includes adrenaline auto-injectors, and the pharmacist must be trained in their use. For vaccine services, you need a pharmaceutical-grade fridge with continuous temperature monitoring and documented logs.

Documentation and Record-Keeping: Every consultation must be fully documented, including patient identification, clinical assessment, inclusion/exclusion criteria checks, the supply decision, patient counselling provided, and patient consent. Records must be retained for a minimum period as defined in your PGD (typically 8 years for adults, until the patient reaches 25 for children). Records must be stored in compliance with GDPR and accessible for clinical governance review.

Operational Requirements: Standard Operating Procedures (SOPs) for each PGD service must be in place and accessible to all staff. Adverse reaction reporting procedures (Yellow Card scheme) must be understood and accessible. A procedure for managing clinical incidents must be documented. Stock management procedures — including cold chain protocols for vaccines — must be in place.

CQC Considerations: If you are delivering services under PGDs issued by a CQC-registered provider, the provider holds the CQC registration for the clinical service. Your pharmacy should confirm this arrangement is documented. If you are seeking your own CQC registration for independent PGD services, the requirements are more extensive — consult the CQC provider handbook.

Superintendent Oversight: If you operate multiple branches, the superintendent pharmacist must have visibility of which PGDs are active at each site, which pharmacists are trained and named, consultation volumes, and compliance status. A centralised dashboard for this purpose is strongly recommended.

This checklist is not exhaustive — your PGD provider should supply detailed operational guidance. But if you can tick every item above, you're in a strong position to deliver safe, compliant, and profitable PGD services.`,
  },
  {
    slug: "how-to-add-private-services-to-a-uk-community-pharmacy",
    title: "How to Add Private Services to a UK Community Pharmacy in 2026",
    description:
      "Step-by-step guide for UK community pharmacy owners and superintendents: which private services to offer first, what PGDs you need, regulatory steps, what it costs, and how long it actually takes to go live.",
    category: "Revenue & Growth",
    readTime: "9 min read",
    publishDate: "2026-05-11",
    primaryKeyword: "how to add private services to a community pharmacy",
    content: `Why this matters now:

NHS community-pharmacy funding has fallen roughly 30% in real terms since 2015. Branch closures are at a record high. The pharmacies that are growing — not just surviving — have one thing in common: they have built a meaningful private clinical service alongside the NHS contract. Patient Group Directions (PGDs) are the legal mechanism that makes this possible.

This guide answers the question UK pharmacy owners and superintendents are increasingly asking: what does it actually take to add private services to a community pharmacy in 2026, and how do you avoid the common mistakes?

What are private pharmacy services under PGD?

A Patient Group Direction is a written instruction that allows a named, trained pharmacist to supply or administer a specific medicine to any patient who meets defined inclusion criteria — without an individual prescription. Under PGD, a pharmacist can run a travel clinic, prescribe weight-management medication, supply HRT or TRT, treat UTIs, manage hair loss, deliver flu and COVID vaccinations privately, treat erectile dysfunction, supply emergency contraception, and many more — all directly from the pharmacy, all paid for by the patient.

The legal framework sits under the Human Medicines Regulations 2012. A PGD must be authorised by a registered organisation (typically a CQC-registered private healthcare provider) and signed by both a doctor and a pharmacist. The pharmacist then completes structured training and a competency assessment before being named on the PGD.

Which private services should you offer first?

The right starting set depends on your patient demographics, but five categories consistently produce the strongest early revenue for new entrants:

Weight management — GLP-1 services (Wegovy, Mounjaro), plus older agents like Saxenda, Mysimba, and Orlistat. High patient demand, high revenue per consultation, and recurring revenue once a patient starts a programme.

Travel health — pre-travel consultations and vaccinations (yellow fever, hepatitis A and B, typhoid, rabies, Japanese encephalitis, anti-malarials). Seasonal but margin-rich. A single family booking can generate £400–£600.

Hormone therapy — HRT for menopausal women, TRT for men with clinical testosterone deficiency. Long-duration relationships, predictable repeat consultations, and a route to PMR-style ongoing care.

Sexual health — ED, contraception, emergency contraception, UTI treatment, STI testing. High volume, fast consultations, and meaningful walk-in convenience for patients.

Travel and weight-management services typically have the fastest payback. UTI, contraception, and minor ailments build steady walk-in volume that supports the rest.

What you actually need to go live

Five things are non-negotiable:

A PGD provider. You can author PGDs in-house, but it's a significant clinical-governance and medico-legal undertaking. The vast majority of independent pharmacies use a registered PGD provider that supplies the documents, training, and named-clinician sign-off.

CQC registration (England) or HIW registration (Wales). Required for private clinical services delivered in pharmacy. The registration is for the activity, not the building — your PGD provider's registration may cover you depending on the arrangement, or you may register yourself.

Trained, named pharmacists. Every pharmacist using a PGD must be named on it, have completed the relevant training, and have passed a competency assessment. Locums working in your branch must be onboarded the same way.

A consultation tool that creates auditable records. Paper records are technically allowed but practically dangerous — for audit, for governance, and for managing locums consistently. A purpose-built ePGD tool walks the pharmacist through the same structured assessment every time and produces a defensible record.

An appointment-booking workflow. You can run drop-in for some services, but appointment-led services (travel clinic, GLP-1, HRT, TRT) need a diary so patients can book themselves and your team isn't constantly answering the phone.

How long does it take?

Onboarding to a good PGD provider should take days, not weeks. A typical timeline:

Day 1–2: Sign-up, contract, payment mandate, account creation. PGDs available in your platform on day one.

Day 2–5: Each pharmacist on your team completes the online training and competency assessment for the PGDs you want to offer. Most experienced pharmacists complete a single PGD's training in 30–60 minutes. The bottleneck is staff time, not the platform.

Day 3–5: Set up your patient-facing booking page, marketing materials, in-pharmacy signage. Run a soft-launch to staff and family members to test the workflow end-to-end.

Day 5+: Start consulting paying patients.

Pharmacies stuck in months-long onboardings are almost always blocked on internal training scheduling, not on the PGD provider. Front-load training and you'll be running paying consultations within a week of signing.

What does it cost?

PGD providers price along three models:

Per-pharmacist seat plus per-consultation fee. Common with legacy providers. Predictable for them, expensive for you — every pharmacist licence is a fixed cost regardless of whether they consult, and the per-consultation fee directly reduces your margin.

Annual licence per pharmacy. Typically £2,500–£2,700 per pharmacy per year (inc. VAT), paid upfront. Better than per-pharmacist seats, but you commit to the full year on day one.

Flat monthly fee per pharmacy. £100 per pharmacy per month is the current Get Real Health price — covers every pharmacist on the team (including locums), every PGD on the platform, every consultation, training, clinical support, and the ePGD tool. No per-consultation fees.

Most pharmacies break even on PGD services in their first month — a single GLP-1 patient typically covers the monthly platform fee with margin to spare. Travel consultations break even on the platform inside the first booking.

What about insurance, indemnity, and clinical support?

You need clinical-negligence cover that explicitly covers private prescribing under PGD. Standard NPA cover does not always extend automatically to private services — check with your insurer before going live. Your PGD provider should have its own professional-indemnity policy covering the PGD authoring itself.

Clinical support — a phone or message line where your pharmacists can speak to a senior clinician for edge cases — is a non-negotiable. If your provider doesn't supply this, build a relationship with a friendly GP or pharmacist independent prescriber who can take calls.

What the leading PGD platforms have in common

Look for: a single flat fee, complete PGD coverage from day one (not "available in 6 weeks"), genuine clinical authorship (a named doctor on every PGD, not white-labelled templates), CQC and HIW registration, an ePGD consultation tool that walks the pharmacist through a structured assessment, online training and competency assessment included, an appointment diary built into the platform (not bolted on), audit logging and superintendent oversight, and onboarding in days not months.

Avoid: per-pharmacist licensing, per-consultation fees, "platform fees" on top of the licence fee, providers without CQC/HIW registration, providers without a named clinician on each PGD, providers that require you to author your own PGDs as part of "white-labelling".

Get Real Health is built around this checklist — 70 PGDs, £100 per pharmacy per month, CQC and HIW registered, Dr Nitin Shori (NHS GP and ex-Medical Director of Pharmacy2U) named on every PGD, onboarding in 48 hours, no per-consultation fees, locums included. If you'd like to see the platform in action, book a 30-minute discovery call at getrealhealthpgd.co.uk/book.

The bigger picture

The community pharmacy operating model is changing whether owners want it to or not. The NHS contract alone is no longer enough to keep most branches profitable. Private services are not a growth strategy — they're now a survival strategy. The pharmacies that will be standing in five years are the ones that move into private services this year and treat them as a core line of business, not a side experiment. The infrastructure to do that — PGDs, training, governance, technology — is now available off the shelf, at a price that even a single-store independent can absorb in week one.`,
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export const ARTICLE_CATEGORIES = [
  "PGD Fundamentals",
  "Revenue & Growth",
  "Clinical Services",
  "Compliance",
  "Industry",
] as const;
