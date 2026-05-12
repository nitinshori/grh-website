// Registry of all training modules.
// To add a new module: create the module file, import it, and add to the
// `modules` array. Slugs must be unique and should match the PGD slug.

import type { TrainingModule } from "./types";
import { edModule } from "./ed";
import { wegovyModule } from "./wegovy";
import { mounjaroModule } from "./mounjaro";
import { trtModule } from "./trt";
import { hrtModule } from "./hrt";

export const modules: TrainingModule[] = [
  // Tier 1 — headlined in launch video / highest-traffic
  edModule,
  wegovyModule,
  mounjaroModule,
  trtModule,
  hrtModule,
  // Tier 2+ to follow as drafted.
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
