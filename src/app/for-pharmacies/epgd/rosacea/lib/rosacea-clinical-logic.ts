// Aligned to the Metronidazole gel or Azelaic acid (Rosacea) PGD,
// version 004, issued 11 September 2026.

import type { ClinicalAlert } from "../../shared/types";
import type { RosaceaAssessment, RosaceaContraindications, RosaceaTreatment } from "./rosacea-types";

export const PGD_STRAPLINE = "Metronidazole gel or Azelaic acid (Rosacea) PGD, version 004, issued 11 September 2026";

export const PRODUCT_DETAILS: Record<string, { label: string; strength: string; frequency: string; duration: string; quantity: string; maxSupplies: number; courseWeeks: number; brandExamples: string; notes: string[] }> = {
  metronidazole: {
    label: "Metronidazole gel 0.75% w/w (POM)",
    courseWeeks: 8,
    brandExamples: "e.g. Rozex, Metrogel, or generic metronidazole 0.75% gel",
    strength: "Metronidazole 0.75% w/w gel",
    frequency: "Apply a thin layer to the affected areas of the face twice daily",
    duration: "Initial course of up to 8 weeks; reassess continued use beyond 12 weeks. Review at 8 to 12 weeks for effectiveness.",
    quantity: "One 30 g tube per supply; up to 2 x 30 g per 8-week course. Record each supply.",
    maxSupplies: 2,
    notes: [
      "Avoid contact with eyes, mucous membranes and broken skin. Wash hands after application.",
      "Use sunscreen and avoid excessive sunlight exposure.",
      "Store below 25 C. Do not freeze.",
    ],
  },
  "azelaic-acid": {
    label: "Azelaic acid 15% gel (POM)",
    courseWeeks: 12,
    brandExamples: "e.g. Finacea, or generic azelaic acid 15% gel",
    strength: "Azelaic acid 15% gel",
    frequency: "Apply a thin layer to the affected areas of the face twice daily (morning and evening). 2.5 cm (1 inch) of gel is sufficient for the entire facial area.",
    duration: "Initial course of up to 12 weeks; reassess ongoing need periodically. A distinct improvement generally becomes apparent after 4 weeks. If there is no improvement after 2 months, or a new exacerbation of rosacea, discontinue and consider other therapeutic options. Review at 8 to 12 weeks.",
    quantity: "One 30 g tube per supply (about 4 to 5 weeks at 2.5 cm twice daily); up to 3 x 30 g per 12-week course. Record each supply.",
    maxSupplies: 3,
    notes: [
      "Avoid contact with eyes, mouth, mucous membranes and broken skin. Wash hands after applying the gel.",
      "Occlusive dressings or wrappings should not be used.",
      "In the event of skin irritation, reduce the amount per application or reduce to once a day until the irritation ceases; if required, interrupt treatment for a few days. Discontinue if irritation is severe or persistent.",
      "Use sunscreen and avoid excessive UV exposure.",
      "Store below 25 C. Do not freeze.",
    ],
  },
};

export function getSubtypeAlerts(assessment: RosaceaAssessment): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  if (assessment.subtype === "phymatous") {
    // A stop, not a flag: the document refers phymatous rosacea to
    // dermatology (may require surgery or laser); neither arm treats it.
    alerts.push({ severity: "stop", code: "PHYMATOUS_REFER", message: "Phymatous rosacea, refer to GP/dermatology", detail: "Phymatous subtype requires specialist assessment (may require surgery or laser). Not for supply under this PGD; refer." });
  }
  if (assessment.ocularSymptoms) {
    alerts.push({ severity: "red-flag", code: "OCULAR_REFER", message: "Ocular symptoms reported, refer for the eyes", detail: "Neither arm treats ocular rosacea. Advise artificial tears and refer to the GP; refer to ophthalmology if severe or vision is affected." });
  }
  if (assessment.severity === "severe") {
    alerts.push({ severity: "stop", code: "SEVERE_SYSTEMIC", message: "Severe rosacea requiring systemic treatment, excluded", detail: "Both arms are for mild to moderate rosacea. Advise on alternative options; inform or refer to the GP as appropriate." });
  }
  return alerts;
}

export function getContraindicationAlerts(contraindications: RosaceaContraindications, treatment?: RosaceaTreatment): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const product = treatment?.product ?? "";
  if (contraindications.pregnancy) {
    alerts.push({ severity: "stop", code: "PREGNANCY_CI", message: "Pregnancy, excluded", detail: "Both arms exclude pregnancy unless deemed appropriate by a prescriber; there is no prescriber in a PGD supply. Refer to the GP." });
  }
  if (contraindications.breastfeeding) {
    alerts.push({ severity: "stop", code: "BREASTFEEDING_CI", message: "Breastfeeding, excluded", detail: "Both arms exclude breastfeeding unless deemed appropriate by a prescriber; there is no prescriber in a PGD supply. Refer to the GP." });
  }
  if (contraindications.underEighteen) {
    alerts.push({ severity: "stop", code: "UNDER_18_CI", message: "Under 18 years, excluded", detail: "Both arms are for adults aged 18 years and over. Refer to the GP." });
  }
  if (contraindications.brokenOrEczematousSkin) {
    alerts.push({ severity: "stop", code: "BROKEN_SKIN_CI", message: "Broken, irritated or eczematous facial skin, excluded", detail: "Exclusion for both metronidazole gel and azelaic acid gel." });
  }
  if (contraindications.hypersensitivityMetronidazole) {
    alerts.push({ severity: product === "metronidazole" ? "stop" : "caution", code: "HS_METRONIDAZOLE", message: "Hypersensitivity to metronidazole or other nitroimidazoles", detail: "Exclusion for metronidazole gel. Azelaic acid gel may be considered." });
  }
  if (contraindications.hypersensitivityAzelaicAcid) {
    alerts.push({ severity: product === "azelaic-acid" ? "stop" : "caution", code: "HS_AZELAIC", message: "Hypersensitivity to azelaic acid or any of the excipients", detail: "Exclusion for azelaic acid gel. Metronidazole gel may be considered." });
  }
  if (contraindications.asthma) {
    alerts.push({ severity: "caution", code: "ASTHMA_AZELAIC", message: "Asthma", detail: "Worsening of asthma in patients treated with azelaic acid has been reported. Counsel the patient if azelaic acid gel is supplied." });
  }
  return alerts;
}

export function getAllAlerts(assessment: RosaceaAssessment, contraindications: RosaceaContraindications, treatment?: RosaceaTreatment): ClinicalAlert[] {
  return [...getSubtypeAlerts(assessment), ...getContraindicationAlerts(contraindications, treatment)];
}

/** Arm-independent exclusions (block before a product is chosen). */
export function hasHardStops(contraindications: RosaceaContraindications, assessment?: RosaceaAssessment): boolean {
  return (
    contraindications.pregnancy ||
    contraindications.breastfeeding ||
    contraindications.underEighteen ||
    contraindications.brokenOrEczematousSkin ||
    assessment?.severity === "severe" ||
    assessment?.subtype === "phymatous"
  );
}

/** Arm-specific exclusions, evaluated once a product is chosen. */
export function hasProductHardStops(contraindications: RosaceaContraindications, treatment: RosaceaTreatment): boolean {
  if (treatment.product === "metronidazole" && contraindications.hypersensitivityMetronidazole) return true;
  if (treatment.product === "azelaic-acid" && contraindications.hypersensitivityAzelaicAcid) return true;
  return false;
}
