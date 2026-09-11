import type { ClinicalAlert } from "../../shared/types";
import type {
  TravelCoreDestinationAssessment,
  TravelCoreMalariaRisk,
  TravelCoreVaccineAdministration,
} from "./travel-core-types";

export function daysUntilDeparture(departureDate: string): number | null {
  if (!departureDate) return null;
  const d = new Date(departureDate);
  if (isNaN(d.getTime())) return null;
  return Math.floor((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/** Dose text per the signed PGD (v004). */
export function getVaccineDoseText(v: TravelCoreVaccineAdministration): string[] {
  const lines: string[] = [];
  if (v.hepAGiven) {
    const product =
      v.hepAProduct === "havrix"
        ? "Havrix Monodose 1440 EL.U/1.0 mL, 1.0 mL"
        : v.hepAProduct === "avaxim"
        ? "Avaxim 160 U/0.5 mL, 0.5 mL"
        : "Havrix 1.0 mL or Avaxim 0.5 mL";
    lines.push(
      `Hepatitis A: ${product} by intramuscular injection in the deltoid region. ${v.hepADose === "booster" ? "Booster dose at 6 to 12 months after the primary dose for long-term protection (10+ years)." : "Primary course: one dose. Booster required at 6 to 12 months."} Do not give intravenously or intradermally.`
    );
  }
  if (v.typhoidGiven) {
    lines.push(
      "Typhoid: Typhim Vi, typhoid Vi polysaccharide vaccine 25 mcg/0.5 mL, 0.5 mL single dose by intramuscular injection in the deltoid region. Revaccination every 3 years if continuing risk. Not protective against paratyphoid A or B; 70 to 80% protective effect."
    );
  }
  if (v.choleraGiven) {
    lines.push(
      `Cholera: Dukoral oral inactivated cholera vaccine (rCTB and inactivated whole cells). ${v.choleraDose === "booster" ? "Booster: single dose every 2 years if continuing risk." : `Primary course: 2 doses, 1 to 6 weeks apart (this is dose ${v.choleraDose || "?"}).`} Dissolve the buffer sachet in about 150 mL of cool water, add the whole 3 mL vial, drink within 2 hours. No food or drink for 1 hour before and 1 hour after; no other oral medicines within 1 hour either side. Complete the course at least 1 week before potential exposure.`
    );
  }
  return lines;
}

export function getVaccineAlerts(
  v: TravelCoreVaccineAdministration,
  age: number | null,
  departureDate: string
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const anyGiven = v.hepAGiven || v.typhoidGiven || v.choleraGiven;
  const injectable = v.hepAGiven || v.typhoidGiven;

  if (anyGiven && age !== null && age < 18) {
    alerts.push({
      severity: "stop",
      code: "VACC_UNDER_18",
      message: "Under 18: outside this PGD",
      detail: "The Hepatitis A, Typhoid and Cholera PGDs cover adults aged 18 years and over only.",
    });
  }
  if (anyGiven && v.hypersensitivity) {
    alerts.push({
      severity: "stop",
      code: "VACC_HYPERSENSITIVITY",
      message: "Known hypersensitivity to the vaccine or any excipient",
      detail: "Exclusion for every vaccine in this PGD (for Dukoral, including formaldehyde). Do not administer. Advise on alternatives and inform or refer to the GP.",
    });
  }
  if (anyGiven && v.acuteFebrileIllness) {
    alerts.push({
      severity: "stop",
      code: "VACC_FEBRILE",
      message: "Acute illness with fever",
      detail: "Exclusion: defer until recovered.",
    });
  }
  if (anyGiven && v.pregnant) {
    alerts.push({
      severity: "stop",
      code: "VACC_PREGNANCY",
      message: "Pregnancy",
      detail: "Exclusion for every vaccine in this PGD: seek specialist advice. Advise the patient to discuss the timing of vaccinations with the GP before travel.",
    });
  }
  if (v.choleraGiven && v.giSymptoms) {
    alerts.push({
      severity: "stop",
      code: "CHOLERA_GI",
      message: "Acute gastrointestinal symptoms: Dukoral excluded",
      detail: "Acute illness with fever or gastrointestinal symptoms is an exclusion for Dukoral. Defer until recovered.",
    });
  }
  if (v.choleraGiven && v.severeImmunocompromise) {
    alerts.push({
      severity: "stop",
      code: "CHOLERA_IMMUNO",
      message: "Severe immunocompromise: Dukoral excluded",
      detail: "Severe immunocompromise is an exclusion for Dukoral under this PGD (though the vaccine is inactivated). Seek specialist advice.",
    });
  }
  if (v.hepAGiven && v.hepADose === "primary" && v.hepAPreviousCompleteCourse) {
    alerts.push({
      severity: "stop",
      code: "HEPA_COMPLETE_COURSE",
      message: "Previous complete Hepatitis A course",
      detail: "Inclusion requires no previous complete Hepatitis A vaccination course. A primary dose is not indicated; if a 6 to 12 month booster is due, record the dose as a booster.",
    });
  }
  if (v.hepAGiven && v.hepAImmunityDocumented) {
    alerts.push({
      severity: "stop",
      code: "HEPA_IMMUNE",
      message: "Documented Hepatitis A immunity",
      detail: "Inclusion requires no documented evidence of Hepatitis A immunity. Vaccination is not indicated.",
    });
  }
  if (v.choleraGiven && !v.choleraRiskCriteriaMet) {
    alerts.push({
      severity: "stop",
      code: "CHOLERA_NO_INDICATION",
      message: "Cholera inclusion criteria not confirmed",
      detail: "Dukoral is for travel to areas with active cholera transmission or at high risk, humanitarian, healthcare or occupational exposure, or planned extended stays in endemic areas with poor sanitation. Confirm the criterion or do not give.",
    });
  }

  if (anyGiven && v.immunocompromised) {
    alerts.push({
      severity: "caution",
      code: "VACC_IMMUNOCOMPROMISED",
      message: "Immunocompromised: reduced response possible",
      detail: "Caution: may have reduced response; seek specialist advice. (Severe immunocompromise excludes Dukoral.)",
    });
  }
  if (injectable && v.bleedingDisorder) {
    alerts.push({
      severity: "caution",
      code: "VACC_BLEEDING",
      message: "Thrombocytopenia, bleeding disorder or anticoagulation",
      detail: "Not a contraindication. Use a fine needle and apply firm pressure for 2 minutes; Havrix may be given deep subcutaneous where local guidance requires.",
    });
  }
  if (v.choleraGiven && v.recentAntibiotics) {
    alerts.push({
      severity: "caution",
      code: "CHOLERA_ANTIBIOTICS",
      message: "Recent antibiotics for enteric infection",
      detail: "Antibiotics (if recently prescribed for enteric infection) may reduce Dukoral effectiveness.",
    });
  }
  const days = daysUntilDeparture(departureDate);
  if (injectable && days !== null && days < 14) {
    alerts.push({
      severity: "caution",
      code: "VACC_TIMING",
      message: "Less than 2 weeks before departure",
      detail: "Hepatitis A and typhoid vaccines should be given at least 2 weeks before departure. Explain that protection may be incomplete and record the advice.",
    });
  }
  if (v.choleraGiven && v.choleraDose !== "booster" && days !== null && days < (v.choleraDose === "2" ? 7 : 14)) {
    alerts.push({
      severity: "caution",
      code: "CHOLERA_TIMING",
      message: "Dukoral course may not complete in time",
      detail: "The 2 dose primary course (1 to 6 weeks apart) must be completed at least 1 week before potential exposure. Confirm the dates.",
    });
  }

  return alerts;
}

export function getDestinationAlerts(
  destination: TravelCoreDestinationAssessment
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (destination.isEndemicMalariaZone && !destination.vaccinationRequirementsIdentified) {
    alerts.push({
      severity: "caution",
      code: "MALAR_NO_VACC_CHECK",
      message: "Malaria endemic zone: ensure vaccination requirements checked",
      detail: "Destination is in malaria-endemic area. Vaccination status should be reviewed.",
    });
  }

  if (destination.foodWaterRiskLevel === "high" && !destination.duration) {
    alerts.push({
      severity: "caution",
      code: "FOOD_WATER_HIGH",
      message: "High food/water risk: ensure traveller is counselled",
      detail: "Destination has high risk of food/waterborne illness. Precautions essential.",
    });
  }

  if (destination.sunExposureRisk === "high") {
    alerts.push({
      severity: "caution",
      code: "SUN_EXPOSURE_HIGH",
      message: "High sun exposure risk: ensure sun protection advised",
      detail: "Destination has high UV exposure. Sunscreen and protective clothing essential.",
    });
  }

  return alerts;
}

export function getMalariaRiskAlerts(
  malariaRisk: TravelCoreMalariaRisk
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (malariaRisk.malariaZone && !malariaRisk.chemoprophylaxisAdvised) {
    alerts.push({
      severity: "red-flag",
      code: "MALARIA_CHEMO_MISSING",
      message: "Malaria zone identified but chemoprophylaxis not advised",
      detail: "Patient travelling to malaria zone. Chemoprophylaxis assessment required.",
    });
  }

  if (malariaRisk.malariaZone && malariaRisk.resistanceProfile && !malariaRisk.recommendedDrug) {
    alerts.push({
      severity: "caution",
      code: "MALARIA_DRUG_UNCLEAR",
      message: "Resistance profile noted but drug selection unclear",
      detail: "Ensure appropriate drug selected based on resistance pattern.",
    });
  }

  return alerts;
}

export function getAllAlerts(
  destination: TravelCoreDestinationAssessment,
  malariaRisk: TravelCoreMalariaRisk,
  vaccines?: TravelCoreVaccineAdministration,
  age: number | null = null
): ClinicalAlert[] {
  return [
    ...getDestinationAlerts(destination),
    ...getMalariaRiskAlerts(malariaRisk),
    ...(vaccines ? getVaccineAlerts(vaccines, age, destination.departureDate) : []),
  ];
}

export function calculateTravelDuration(
  departureDate: string,
  returnDate: string
): number | null {
  if (!departureDate || !returnDate) return null;
  const departure = new Date(departureDate);
  const returnD = new Date(returnDate);
  if (isNaN(departure.getTime()) || isNaN(returnD.getTime())) return null;
  return Math.ceil(
    (returnD.getTime() - departure.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function assessMalariaRisk(destination: string, zone: boolean): string {
  if (!zone) return "Low risk";
  if (destination.toLowerCase().includes("africa")) return "High risk - Sub-Saharan Africa";
  if (destination.toLowerCase().includes("asia")) return "Moderate risk - Southeast Asia";
  if (destination.toLowerCase().includes("caribbean")) return "Low-moderate risk - Caribbean";
  return "Moderate risk";
}

export function getChemoprophylaxisRecommendation(
  resistanceProfile: string
): string {
  if (resistanceProfile.includes("MDR")) return "Artemether-lumefantrine or quinine";
  if (resistanceProfile.includes("CQ")) return "Atovaquone-proguanil, doxycycline, or mefloquine";
  return "Atovaquone-proguanil or doxycycline";
}
