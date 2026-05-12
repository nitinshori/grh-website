// Registry of all training modules.
// To add a new module: create the module file, import it, and add to the
// `modules` array. Slugs must be unique and should match the PGD slug.

import type { TrainingModule } from "./types";
// Tier 1 — highest traffic / launch headlines
import { edModule } from "./ed";
import { wegovyModule } from "./wegovy";
import { mounjaroModule } from "./mounjaro";
import { trtModule } from "./trt";
import { hrtModule } from "./hrt";
import { utiModule } from "./uti";
import { emergencyContraceptionModule } from "./emergency-contraception";
import { hairLossModule } from "./hair-loss";
import { travelCoreModule } from "./travel-core";
// Tier 2 — weight management family + men's & women's health
import { saxendaModule } from "./saxenda";
import { orlistatModule } from "./orlistat";
import { mysimbaModule } from "./mysimba";
import { glp1MonitoringModule } from "./glp1-monitoring";
import { periodDelayModule } from "./period-delay";
import { prematureEjaculationModule } from "./premature-ejaculation";
import { bphModule } from "./bph";
import { recurrentUtiModule } from "./recurrent-uti";
// Tier 3 — sexual health, dermatology, common conditions
import { bvModule } from "./bv";
import { thrushModule } from "./thrush";
import { coldSoresModule } from "./cold-sores";
import { hayfeverModule } from "./hayfever";
import { acneModule } from "./acne";
import { rosaceaModule } from "./rosacea";
import { eczemaModule } from "./eczema";
import { impetigoModule } from "./impetigo";
import { soreThroatModule } from "./sore-throat";
import { earInfectionModule } from "./ear-infection";
import { woundCareModule } from "./wound-care";
import { threadwormsModule } from "./threadworms";
import { gonorrhoeaTreatmentModule } from "./gonorrhoea-treatment";
import { herpesManagementModule } from "./herpes-management";
import { genitalWartsModule } from "./genital-warts";
import { stiTestingModule } from "./sti-testing";
import { prepModule } from "./prep";
import { postnatalContraceptionModule } from "./postnatal-contraception";
import { testosteroneWomenModule } from "./testosterone-women";
import { alopeciaMinoxidilModule } from "./alopecia-minoxidil";
// Tier 4 — vaccines
import { fluModule } from "./flu";
import { covidBoosterModule } from "./covid-booster";
import { shinglesVaccineModule } from "./shingles-vaccine";
import { pneumococcalModule } from "./pneumococcal";
import { hpvModule } from "./hpv";
import { mmrModule } from "./mmr";
import { chickenpoxModule } from "./chickenpox";
import { meningitisBModule } from "./meningitis-b";
import { rsvModule } from "./rsv";
import { hepBOccupationalModule } from "./hep-b-occupational";
// Tier 5 — respiratory, CVD, mental health, smoking, sleep, alcohol
import { asthmaRescueModule } from "./asthma-rescue";
import { copdModule } from "./copd";
import { hypertensionModule } from "./hypertension";
import { statinsModule } from "./statins";
import { anxietyPropranololModule } from "./anxiety-propranolol";
import { sleepMelatoninModule } from "./sleep-melatonin";
import { smokingVareniclineModule } from "./smoking-varenicline";
import { smokingNrtModule } from "./smoking-nrt";
import { alcoholReductionModule } from "./alcohol-reduction";
// Tier 6 — travel medicine specifics
import { antiMalarialsModule } from "./anti-malarials";
import { yellowFeverModule } from "./yellow-fever";
import { rabiesModule } from "./rabies";
import { japaneseEncephalitisModule } from "./japanese-encephalitis";
import { meningitisAcwyTravelModule } from "./meningitis-acwy-travel";
import { dengueModule } from "./dengue";
import { altitudeSicknessModule } from "./altitude-sickness";
import { travellersDiarrhoeaModule } from "./travellers-diarrhoea";
import { typhoidModule } from "./typhoid";
// Tier 7 — paediatrics, dental, monitoring, treatment
import { diabetesMonitoringModule } from "./diabetes-monitoring";
import { dentalBridgingModule } from "./dental-bridging";
import { paediatricUtiModule } from "./paediatric-uti";
import { shinglesTreatmentModule } from "./shingles-treatment";

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
  gonorrhoeaTreatmentModule,
  herpesManagementModule,
  genitalWartsModule,
  stiTestingModule,
  prepModule,
  postnatalContraceptionModule,
  testosteroneWomenModule,
  alopeciaMinoxidilModule,
  // Tier 4 — vaccines
  fluModule,
  covidBoosterModule,
  shinglesVaccineModule,
  pneumococcalModule,
  hpvModule,
  mmrModule,
  chickenpoxModule,
  meningitisBModule,
  rsvModule,
  hepBOccupationalModule,
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
  // Tier 6 — travel medicine specifics
  antiMalarialsModule,
  yellowFeverModule,
  rabiesModule,
  japaneseEncephalitisModule,
  meningitisAcwyTravelModule,
  dengueModule,
  altitudeSicknessModule,
  travellersDiarrhoeaModule,
  typhoidModule,
  // Tier 7 — paediatrics, dental, monitoring, treatment
  diabetesMonitoringModule,
  dentalBridgingModule,
  paediatricUtiModule,
  shinglesTreatmentModule,
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
