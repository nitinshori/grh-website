import type { ClinicalAlert } from "../../shared/types";
import type { TravelCoreDestinationAssessment, TravelCoreMalariaRisk } from "./travel-core-types";

export function getDestinationAlerts(
  destination: TravelCoreDestinationAssessment
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (destination.isEndemicMalariaZone && !destination.vaccinationRequirementsIdentified) {
    alerts.push({
      severity: "caution",
      code: "MALAR_NO_VACC_CHECK",
      message: "Malaria endemic zone — ensure vaccination requirements checked",
      detail: "Destination is in malaria-endemic area. Vaccination status should be reviewed.",
    });
  }

  if (destination.foodWaterRiskLevel === "high" && !destination.duration) {
    alerts.push({
      severity: "caution",
      code: "FOOD_WATER_HIGH",
      message: "High food/water risk — ensure traveller is counselled",
      detail: "Destination has high risk of food/waterborne illness. Precautions essential.",
    });
  }

  if (destination.sunExposureRisk === "high") {
    alerts.push({
      severity: "caution",
      code: "SUN_EXPOSURE_HIGH",
      message: "High sun exposure risk — ensure sun protection advised",
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
  malariaRisk: TravelCoreMalariaRisk
): ClinicalAlert[] {
  return [
    ...getDestinationAlerts(destination),
    ...getMalariaRiskAlerts(malariaRisk),
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
