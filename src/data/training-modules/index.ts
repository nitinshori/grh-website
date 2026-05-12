// Registry of all training modules.
// To add a new module: create the module file, import it, and add to the
// `modules` array. Slugs must be unique and should match the PGD slug.

import type { TrainingModule } from "./types";
import { edModule } from "./ed";
import { wegovyModule } from "./wegovy";
import { mounjaroModule } from "./mounjaro";
import { saxendaModule } from "./saxenda";
import { orlistatModule } from "./orlistat";
import { mysimbaModule } from "./mysimba";
import { glp1MonitoringModule } from "./glp1-monitoring";
import { trtModule } from "./trt";
import { hrtModule } from "./hrt";
import { utiModule } from "./uti";
import { recurrentUtiModule } from "./recurrent-uti";
import { emergencyContraceptionModule } from "./emergency-contraception";
import { hairLossModule } from "./hair-loss";
import { travelCoreModule } from "./travel-core";
import { bvModule } from "./bv";
import { thrushModule } from "./thrush";
import { coldSoresModule } from "./cold-sores";
import { hayfeverModule } from "./hayfever";
import { periodDelayModule } from "./period-delay";
import { acneModule } from "./acne";
import { rosaceaModule } from "./rosacea";
import { eczemaModule } from "./eczema";
import { impetigoModule } from "./impetigo";
import { soreThroatModule } from "./sore-throat";
import { earInfectionModule } from "./ear-infection";
import { fluModule } from "./flu";
import { covidBoosterModule } from "./covid-booster";
import { shinglesVaccineModule } from "./shingles-vaccine";
import { pneumococcalModule } from "./pneumococcal";
import { asthmaRescueModule } from "./asthma-rescue";
import { copdModule } from "./copd";
import { threadwormsModule } from "./threadworms";
import { smokingVareniclineModule } from "./smoking-varenicline";
import { smokingNrtModule } from "./smoking-nrt";
import { hypertensionModule } from "./hypertension";
import { statinsModule } from "./statins";
import { prematureEjaculationModule } from "./premature-ejaculation";
import { bphModule } from "./bph";
import { anxietyPropranololModule } from "./anxiety-propranolol";
import { sleepMelatoninModule } from "./sleep-melatonin";
import { woundCareModule } from "./wound-care";
import { alcoholReductionModule } from "./alcohol-reduction";

export const modules: TrainingModule[] = [
  // Tier 1 — headlined in launch video / highest-traffic
  edModule,
  wegovyModule,
  mounjaroModule,
  trtModule,
  hrtModule,
  utiModule,
  emergencyContraceptionModule,
  hairLossModule,
  travelCoreModule,
  // Tier 2 — high-volume + weight management family + men's & women's health
  saxendaModule,
  orlistatModule,
  mysimbaModule,
  glp1MonitoringModule,
  periodDelayModule,
  prematureEjaculationModule,
  bphModule,
  recurrentUtiModule,
  // Tier 3 — sexual health, dermatology, common conditions
  bvModule,
  thrushModule,
  coldSoresModule,
  hayfeverModule,
  acneModule,
  rosaceaModule,
  eczemaModule,
  impetigoModule,
  soreThroatModule,
  earInfectionModule,
  woundCareModule,
  threadwormsModule,
  // Tier 4 — vaccines
  fluModule,
  covidBoosterModule,
  shinglesVaccineModule,
  pneumococcalModule,
  // Tier 5 — respiratory, CVD, mental health, smoking, sleep, alcohol
  asthmaRescueModule,
  copdModule,
  hypertensionModule,
  statinsModule,
  anxietyPropranololModule,
  sleepMelatoninModule,
  smokingVareniclineModule,
  smokingNrtModule,
  alcoholReductionModule,
  // Remaining tier 3-5 modules to follow in next session:
  // Sexual health: gonorrhoea, herpes, genital-warts, STI testing, PrEP, testosterone-women, postnatal-contraception
  // Vaccines: HPV, MMR, chickenpox, meningitis-B, RSV, hep-B-occupational
  // Travel-specific: anti-malarials, yellow-fever, rabies, JE, meningitis-ACWY-travel, dengue, altitude-sickness, travellers-diarrhoea, typhoid, hep-AB-travel
  // Other: diabetes monitoring, dental bridging, paediatric UTI, shingles treatment
];

export function getModuleBySlug(slug: string): TrainingModule | undefined {
  return modules.find((m) => m.slug === slug);
}

export function listModuleSummaries() {
  return modules.map((m) => ({
    slug: m.slug,
    title: m.title,
    description: m.description,
    version: m.version,
    estimatedMinutes: m.estimatedMinutes,
    questionCount: m.quiz.length,
    passMark: m.passMark,
  }));
}

export type { TrainingModule } from "./types";
