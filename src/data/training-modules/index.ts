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
import { emergencyContraceptionModule } from "./emergency-contraception";
import { hairLossModule } from "./hair-loss";
import { travelCoreModule } from "./travel-core";
import { bvModule } from "./bv";
import { thrushModule } from "./thrush";
import { coldSoresModule } from "./cold-sores";
import { hayfeverModule } from "./hayfever";
import { periodDelayModule } from "./period-delay";
import { acneModule } from "./acne";

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
  // Tier 2 — weight management family + cycle/sexual health
  saxendaModule,
  orlistatModule,
  mysimbaModule,
  glp1MonitoringModule,
  periodDelayModule,
  // Tier 3 — sexual health + dermatology + minor ailments
  bvModule,
  thrushModule,
  coldSoresModule,
  hayfeverModule,
  acneModule,
  // More tiers to follow as drafted.
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
