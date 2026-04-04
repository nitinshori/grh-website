"use client";

import { useReducer, useMemo, useState, useCallback } from "react";
import type {
  TravelCoreConsultationState,
  TravelCoreAction,
} from "./lib/travel-core-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialTravelCoreState } from "./lib/travel-core-types";
import {
  getAllAlerts,
  calculateTravelDuration,
  assessMalariaRisk,
  getChemoprophylaxisRecommendation,
} from "./lib/travel-core-clinical-logic";
import { validateStep } from "./lib/travel-core-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TravelCoreSummaryReport } from "./components/TravelCoreSummaryReport";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

// ─── Reducer ───

function reducer(
  state: TravelCoreConsultationState,
  action: TravelCoreAction
): TravelCoreConsultationState {
  const newState = { ...state };

  switch (action.type) {
    case "UPDATE_PATIENT":
      newState.patient = { ...newState.patient, [action.field]: action.value };
      if (action.field === "dateOfBirth") {
        newState.patient.age = calculateAge(action.value as string);
      }
      break;

    case "UPDATE_CONSENT":
      newState.consent = { ...newState.consent, [action.field]: action.value };
      break;

    case "UPDATE_DESTINATION":
      newState.destination = {
        ...newState.destination,
        [action.field]: action.value,
      };
      if (action.field === "departureDate" || action.field === "returnDate") {
        newState.destination.duration = calculateTravelDuration(
          newState.destination.departureDate,
          newState.destination.returnDate
        );
      }
      break;

    case "UPDATE_MALARIA_RISK":
      newState.malariaRisk = {
        ...newState.malariaRisk,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_PREVENTIVE_MEASURES":
      newState.preventiveMeasures = {
        ...newState.preventiveMeasures,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_MEDICINES_SUPPLIED":
      newState.medicinesSupplied = {
        ...newState.medicinesSupplied,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_SUMMARY":
      newState.summary = { ...newState.summary, [action.field]: action.value };
      break;

    case "SET_STEP":
      newState.currentStep = action.step;
      break;
  }

  return newState;
}

// ─── Component ───

export default function TravelCoreClient() {
  const [state, dispatch] = useReducer(
    reducer,
    createInitialTravelCoreState()
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const alerts = useMemo(
    () => getAllAlerts(state.destination, state.malariaRisk),
    [state.destination, state.malariaRisk]
  );

  const handleNext = useCallback(() => {
    const error = validateStep(state.currentStep, state);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    dispatch({
      type: "SET_STEP",
      step: Math.min(state.currentStep + 1, TOTAL_STEPS - 1),
    });
  }, [state]);

  const handlePrev = useCallback(() => {
    setValidationError(null);
    dispatch({ type: "SET_STEP", step: Math.max(state.currentStep - 1, 0) });
  }, []);

  const canProceed = validateStep(state.currentStep, state) === null;

  if (state.currentStep === TOTAL_STEPS - 1) {
    return (
      <div className="space-y-6">
        <ProgressBar current={state.currentStep + 1} total={TOTAL_STEPS} />
        <TravelCoreSummaryReport state={state} alerts={alerts} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProgressBar current={state.currentStep + 1} total={TOTAL_STEPS} />

      {alerts.length > 0 && (
        <AlertBanner alerts={alerts} />
      )}

      <StepWrapper
        title={STEP_LABELS[state.currentStep]}
        currentStep={state.currentStep}
        totalSteps={TOTAL_STEPS}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={canProceed}
        validationError={validationError}
      >
        {state.currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) =>
              dispatch({ type: "UPDATE_PATIENT", field, value })
            }
          />
        )}

        {state.currentStep === 1 && (
          <ConsentStep
            consent={state.consent}
            onChange={(field, value) =>
              dispatch({ type: "UPDATE_CONSENT", field, value })
            }
          />
        )}

        {state.currentStep === 2 && (
          <div className="space-y-4">
            <TextInput
              label="Destination (country/region)"
              value={state.destination.destination}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_DESTINATION",
                  field: "destination",
                  value: v,
                })
              }
              required
              placeholder="e.g., Tanzania, Southeast Asia"
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">
                  Departure date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={state.destination.departureDate}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_DESTINATION",
                      field: "departureDate",
                      value: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">
                  Return date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={state.destination.returnDate}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_DESTINATION",
                      field: "returnDate",
                      value: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Checkbox
                label="Endemic malaria zone"
                checked={state.destination.isEndemicMalariaZone}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_DESTINATION",
                    field: "isEndemicMalariaZone",
                    value: v,
                  })
                }
                description="Check destination for malaria transmission risk"
              />
              <Checkbox
                label="Vaccination requirements identified"
                checked={state.destination.vaccinationRequirementsIdentified}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_DESTINATION",
                    field: "vaccinationRequirementsIdentified",
                    value: v,
                  })
                }
                description="Yellow fever, typhoid, hepatitis A/B, etc."
              />
            </div>
            <SelectInput
              label="Food &amp; water safety risk level"
              value={state.destination.foodWaterRiskLevel}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_DESTINATION",
                  field: "foodWaterRiskLevel",
                  value: v as "low" | "moderate" | "high",
                })
              }
              options={[
                { value: "low", label: "Low risk" },
                { value: "moderate", label: "Moderate risk" },
                { value: "high", label: "High risk" },
              ]}
            />
            <SelectInput
              label="Sun exposure risk"
              value={state.destination.sunExposureRisk}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_DESTINATION",
                  field: "sunExposureRisk",
                  value: v as "low" | "moderate" | "high",
                })
              }
              options={[
                { value: "low", label: "Low risk" },
                { value: "moderate", label: "Moderate risk" },
                { value: "high", label: "High risk (equatorial/high altitude)" },
              ]}
            />
          </div>
        )}

        {state.currentStep === 3 && (
          <div className="space-y-4">
            <Checkbox
              label="Malaria transmission zone"
              checked={state.malariaRisk.malariaZone}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MALARIA_RISK",
                  field: "malariaZone",
                  value: v,
                })
              }
              description="Confirmed malaria risk for destination"
            />
            {state.malariaRisk.malariaZone && (
              <>
                <TextInput
                  label="Resistance profile"
                  value={state.malariaRisk.resistanceProfile}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_MALARIA_RISK",
                      field: "resistanceProfile",
                      value: v,
                    })
                  }
                  required
                  placeholder="e.g., CQ-resistant, MDR"
                />
                <Checkbox
                  label="Chemoprophylaxis advised"
                  checked={state.malariaRisk.chemoprophylaxisAdvised}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_MALARIA_RISK",
                      field: "chemoprophylaxisAdvised",
                      value: v,
                    })
                  }
                  description="Antimalarial medication recommended"
                />
                {state.malariaRisk.chemoprophylaxisAdvised && (
                  <TextInput
                    label="Recommended drug"
                    value={state.malariaRisk.recommendedDrug}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_MALARIA_RISK",
                        field: "recommendedDrug",
                        value: v,
                      })
                    }
                    placeholder={getChemoprophylaxisRecommendation(
                      state.malariaRisk.resistanceProfile
                    )}
                  />
                )}
              </>
            )}
          </div>
        )}

        {state.currentStep === 4 && (
          <div className="space-y-4">
            <Checkbox
              label="Insect repellent advised"
              checked={state.preventiveMeasures.insectRepellentAdvised}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_PREVENTIVE_MEASURES",
                  field: "insectRepellentAdvised",
                  value: v,
                })
              }
              description="DEET or picaridin-based repellent (20-30%)"
            />
            <Checkbox
              label="Bed net advised"
              checked={state.preventiveMeasures.bedNetAdvised}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_PREVENTIVE_MEASURES",
                  field: "bedNetAdvised",
                  value: v,
                })
              }
              description="Insecticide-treated bed net if accommodation uncertain"
            />
            <Checkbox
              label="Light, loose clothing advised"
              checked={state.preventiveMeasures.lightClothingAdvised}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_PREVENTIVE_MEASURES",
                  field: "lightClothingAdvised",
                  value: v,
                })
              }
              description="Covers arms and legs to reduce insect bites"
            />
            <Checkbox
              label="Vaccination status check advised"
              checked={state.preventiveMeasures.vaccineCheckAdvised}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_PREVENTIVE_MEASURES",
                  field: "vaccineCheckAdvised",
                  value: v,
                })
              }
              description="Yellow fever, typhoid, hepatitis A/B, Japanese encephalitis"
            />
            <Checkbox
              label="Sun protection advised"
              checked={state.preventiveMeasures.sunProtectionAdvised}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_PREVENTIVE_MEASURES",
                  field: "sunProtectionAdvised",
                  value: v,
                })
              }
              description="SPF 30+ sunscreen, reapply every 2 hours"
            />
            <Checkbox
              label="Food &amp; water precautions advised"
              checked={state.preventiveMeasures.foodWaterPrecautionsAdvised}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_PREVENTIVE_MEASURES",
                  field: "foodWaterPrecautionsAdvised",
                  value: v,
                })
              }
              description="Boiled water, cooked food, avoid ice"
            />
            <TextArea
              label="Additional vaccine/traveller notes (optional)"
              value={state.preventiveMeasures.travellersVaccineNotes}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_PREVENTIVE_MEASURES",
                  field: "travellersVaccineNotes",
                  value: v,
                })
              }
              placeholder="e.g., Yellow fever vaccine required for entry"
            />
          </div>
        )}

        {state.currentStep === 5 && (
          <div className="space-y-4">
            <Checkbox
              label="Bite avoidance kit supplied"
              checked={state.medicinesSupplied.biteAvoidanceKitSupplied}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINES_SUPPLIED",
                  field: "biteAvoidanceKitSupplied",
                  value: v,
                })
              }
              description="Insect repellent, antihistamine cream, bite balm"
            />
            <Checkbox
              label="Anti-diarrhoeal medication advised"
              checked={state.medicinesSupplied.antidiarrhoealsAdvised}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINES_SUPPLIED",
                  field: "antidiarrhoealsAdvised",
                  value: v,
                })
              }
              description="Loperamide or bismuth subsalicylate"
            />
            <Checkbox
              label="Travel first aid kit advised"
              checked={state.medicinesSupplied.firstAidKitAdvised}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINES_SUPPLIED",
                  field: "firstAidKitAdvised",
                  value: v,
                })
              }
              description="Plasters, pain relief, antihistamine, antacid"
            />
            <Checkbox
              label="Antihistamine supplied"
              checked={state.medicinesSupplied.antihistamineSupplied}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINES_SUPPLIED",
                  field: "antihistamineSupplied",
                  value: v,
                })
              }
              description="For allergic reactions and itching"
            />
            <Checkbox
              label="Skin cream supplied"
              checked={state.medicinesSupplied.skinCreamSupplied}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINES_SUPPLIED",
                  field: "skinCreamSupplied",
                  value: v,
                })
              }
              description="Sunscreen, moisturiser, or bite relief cream"
            />
            <TextArea
              label="Other medicines/supplies documented (optional)"
              value={state.medicinesSupplied.otherMedicinesNotes}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINES_SUPPLIED",
                  field: "otherMedicinesNotes",
                  value: v,
                })
              }
              placeholder="e.g., Antimalarial supply, prescription items"
            />
          </div>
        )}

        {state.currentStep === 6 && (
          <div className="space-y-4">
            <TextInput
              label="Pharmacist name"
              value={state.summary.pharmacistName}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_SUMMARY",
                  field: "pharmacistName",
                  value: v,
                })
              }
              required
              placeholder="Jane Smith"
            />
            <TextInput
              label="GPhC registration number"
              value={state.summary.pharmacistGPhC}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_SUMMARY",
                  field: "pharmacistGPhC",
                  value: v,
                })
              }
              required
              placeholder="123456"
            />
            <TextInput
              label="Pharmacy name"
              value={state.summary.pharmacyName}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_SUMMARY",
                  field: "pharmacyName",
                  value: v,
                })
              }
              placeholder="Main Street Pharmacy"
            />
            <TextArea
              label="Clinical notes (optional)"
              value={state.summary.clinicalNotes}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_SUMMARY",
                  field: "clinicalNotes",
                  value: v,
                })
              }
              placeholder="Additional clinical information, concerns, or recommendations..."
              rows={4}
            />
          </div>
        )}
      </StepWrapper>
    </div>
  );
}
