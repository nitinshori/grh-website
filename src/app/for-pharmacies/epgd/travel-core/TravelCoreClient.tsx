"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import type {
  TravelCoreConsultationState,
  TravelCoreAction,
  TravelCoreVaccineAdministration,
} from "./lib/travel-core-types";
import {
  STEP_LABELS,
  TOTAL_STEPS,
  TRAVEL_CORE_PGD_VERSION,
  createInitialTravelCoreState,
  type HepAProduct,
  type HepADose,
  type CholeraDose,
  type InjectionSite,
  type ChemoprophylaxisPlan,
  type ExclusionReferral,
} from "./lib/travel-core-types";
import {
  getAllAlerts,
  getVaccineDoseText,
  getBoosterDueDates,
  calculateTravelDuration,
  daysUntilDeparture,
} from "./lib/travel-core-clinical-logic";
import { validateStep } from "./lib/travel-core-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TravelCoreSummaryReport } from "./components/TravelCoreSummaryReport";
import {
  TextInput,
  Checkbox,
  SelectInput,
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
      // One flag drives the malaria step: ticking "endemic malaria zone" here
      // is the same fact as "malaria transmission zone" on step 3.
      if (action.field === "isEndemicMalariaZone") {
        newState.malariaRisk = { ...newState.malariaRisk, malariaZone: Boolean(action.value) };
      }
      break;

    case "UPDATE_MALARIA_RISK":
      newState.malariaRisk = {
        ...newState.malariaRisk,
        [action.field]: action.value,
      };
      if (action.field === "malariaZone") {
        newState.destination = { ...newState.destination, isEndemicMalariaZone: Boolean(action.value) };
      }
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

    case "UPDATE_VACCINES":
      newState.vaccines = {
        ...newState.vaccines,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_SUMMARY":
      newState.summary = { ...newState.summary, [action.field]: action.value };
      break;

    case "SET_STEP":
      newState.currentStep = action.step;
      break;

    case "RESET":
      return createInitialTravelCoreState();
  }

  return newState;
}

// ─── Component ───

export default function TravelCoreClient() {
  const [state, dispatch] = useReducer(
    reducer,
    createInitialTravelCoreState()
  );
  // Auto-fill pharmacist details from logged-in user. Refires when fields
  // are empty (e.g. after "New Consultation"), so subsequent patients fill too.
  const __pharmProfile = usePharmacistProfile();
  useEffect(() => {
    if (!__pharmProfile) return;
    if (state.summary.pharmacistName || state.summary.pharmacistGPhC) return;
    dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: __pharmProfile.name } as any);
    dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: __pharmProfile.gphcNumber } as any);
    dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: __pharmProfile.pharmacyName } as any);
    dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyAddress", value: __pharmProfile.pharmacyAddress } as any);
  }, [__pharmProfile, state.summary.pharmacistName, state.summary.pharmacistGPhC]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const alerts = useMemo(
    () => getAllAlerts(state.destination, state.malariaRisk, state.vaccines, state.patient.age),
    [state.destination, state.malariaRisk, state.vaccines, state.patient.age]
  );
  const anyVaccineGiven = state.vaccines.hepAGiven || state.vaccines.typhoidGiven || state.vaccines.choleraGiven;
  const vaccineStops = alerts.some((a) => a.severity === "stop");
  const setVaccine = (field: keyof TravelCoreVaccineAdministration, value: unknown) =>
    dispatch({ type: "UPDATE_VACCINES", field, value });

  const handleNext = useCallback(() => {
    // A stop anywhere blocks Next on every step, not only the vaccine step
    // (adversarial review, 11 Sep 2026).
    const stop = alerts.find((a) => a.severity === "stop");
    if (stop) {
      setValidationError(`Exclusion present: ${stop.message}. Record the advice given and save as not supplied, or resolve the exclusion.`);
      return;
    }
    const error = validateStep(state.currentStep, state);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    setCompletedSteps((prev) => new Set([...prev, state.currentStep]));
    dispatch({
      type: "SET_STEP",
      step: Math.min(state.currentStep + 1, TOTAL_STEPS - 1),
    });
  }, [state, alerts]);

  const handlePrev = useCallback(() => {
    setValidationError(null);
    dispatch({ type: "SET_STEP", step: Math.max(state.currentStep - 1, 0) });
  }, []);

  // Backwards only: forward movement is always through Next, where the gates are.
  const handleStepClick = useCallback(
    (step: number) => {
      if (step < state.currentStep) {
        setValidationError(null);
        dispatch({ type: "SET_STEP", step });
      }
    },
    [state.currentStep]
  );

  const handleNewConsultation = useCallback(() => {
    setCompletedSteps(new Set());
    setValidationError(null);
    // Full reset so vaccine batch numbers, exclusions and advice ticks never
    // carry over from the previous patient.
    dispatch({ type: "RESET" });
  }, []);

  const canProceed = validateStep(state.currentStep, state) === null && !vaccineStops;
  const daysToDeparture = daysUntilDeparture(state.destination.departureDate);
  const boosterDue = useMemo(() => getBoosterDueDates(state.vaccines), [state.vaccines]);

  // ─── Consultation Record Data (for saving to database) ───
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    return {
      patient: {
        firstName: state.patient.firstName,
        lastName: state.patient.lastName,
        dateOfBirth: state.patient.dateOfBirth,
        nhsNumber: state.patient.nhsNumber,
        phone: state.patient.phone,
        email: state.patient.email,
        address: state.patient.address,
        gpName: state.patient.gpName,
        gpPractice: state.patient.gpPractice,
      },
      clinicalData: {
        ...state,
        completedSteps: undefined,
        alerts,
        pgdVersion: TRAVEL_CORE_PGD_VERSION,
        vaccineDoses: vaccineStops ? [] : getVaccineDoseText(state.vaccines),
        boosterDue: vaccineStops ? [] : boosterDue,
        exclusion: vaccineStops
          ? {
              reasons: alerts.filter((a) => a.severity === "stop").map((a) => a.message),
              advice: state.vaccines.exclusionAdvice,
              referral: state.vaccines.exclusionReferral,
            }
          : null,
        adverseReaction: state.vaccines.adverseReaction ? state.vaccines.adverseReactionDetails : null,
      } as unknown as Record<string, unknown>,
      outcome: vaccineStops
        ? (state.vaccines.exclusionReferral && state.vaccines.exclusionReferral !== "declined" ? "referred" : "not_supplied")
        : anyVaccineGiven
        ? "completed"
        : "not_supplied",
      ...(anyVaccineGiven && !vaccineStops
        ? {
            medicine: {
              name: [
                state.vaccines.hepAGiven ? (state.vaccines.hepAProduct === "avaxim" ? "Avaxim (hepatitis A)" : "Havrix Monodose (hepatitis A)") : null,
                state.vaccines.typhoidGiven ? "Typhim Vi (typhoid)" : null,
                state.vaccines.choleraGiven ? "Dukoral (cholera, oral)" : null,
              ].filter(Boolean).join("; "),
              dose: [
                state.vaccines.hepAGiven ? `Hepatitis A ${state.vaccines.hepAProduct === "avaxim" ? "0.5 mL" : "1.0 mL"} IM, ${state.vaccines.hepADose || "dose"}` : null,
                state.vaccines.typhoidGiven ? "Typhim Vi 0.5 mL IM, single dose" : null,
                state.vaccines.choleraGiven ? `Dukoral one 3 mL vial with buffer, oral, ${state.vaccines.choleraDose === "booster" ? "booster" : `dose ${state.vaccines.choleraDose}`}` : null,
              ].filter(Boolean).join("; "),
              duration: "Single visit",
              quantity: [state.vaccines.hepAGiven, state.vaccines.typhoidGiven, state.vaccines.choleraGiven].filter(Boolean).length,
            },
          }
        : {}),
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        pharmacyName: state.summary.pharmacyName,
        pharmacyAddress: state.summary.pharmacyAddress,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
      consent: { notifyGp: !!state.consent.notifyGp },
    };
  }, [state, alerts, anyVaccineGiven, vaccineStops, boosterDue]);

  // Shown on any step where a stop is present. The document: "Document any
  // advice given and the decision reached. Inform or refer to the GP."
  const exclusionOutcomeBlock = vaccineStops ? (
    <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-300 print:hidden">
      <p className="text-sm font-semibold text-red-800">Exclusion: record the advice given and the decision reached</p>
      <p className="text-xs text-red-800">No vaccine can be given under this PGD while an exclusion applies. Advise on alternative options and how to access them, then use &quot;Save as not supplied&quot; in the step footer.</p>
      <TextArea label="Advice given and decision reached" value={state.vaccines.exclusionAdvice} onChange={(v) => setVaccine("exclusionAdvice", v)} placeholder="e.g. Pregnant: advised to discuss vaccine timing with GP before travel; food and water advice given" rows={3} required />
      <SelectInput label="GP informed or referral" value={state.vaccines.exclusionReferral} onChange={(v) => setVaccine("exclusionReferral", v as ExclusionReferral)} options={[
        { value: "gp-informed", label: "GP informed" },
        { value: "gp-referred", label: "Referred to GP" },
        { value: "travel-clinic", label: "Referred to a travel health clinic" },
        { value: "declined", label: "Patient declined referral; advice given" },
      ]} required />
    </div>
  ) : null;

  if (state.currentStep === TOTAL_STEPS - 1) {
    return (
      <div className="space-y-6">
        <ProgressBar
          currentStep={state.currentStep}
          totalSteps={TOTAL_STEPS}
          stepLabels={STEP_LABELS}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />
        <StepWrapper
          currentStep={state.currentStep}
          totalSteps={TOTAL_STEPS}
          title={STEP_LABELS[state.currentStep]}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={validateStep(7, state) === null && !vaccineStops}
          validationError={vaccineStops ? "Exclusion criteria met: record the advice given and save as not supplied" : validateStep(7, state)}
          isBlocked={vaccineStops}
          getConsultationData={getConsultationData}
          onNewConsultation={handleNewConsultation}
        >
          {exclusionOutcomeBlock}
          <TravelCoreSummaryReport state={state} alerts={alerts} boosterDue={boosterDue} isBlocked={vaccineStops} />
        </StepWrapper>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProgressBar
        stepLabels={STEP_LABELS}
        currentStep={state.currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
        hasErrors={validationError !== null}
      />

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
        isBlocked={vaccineStops}
        getConsultationData={getConsultationData}
        onNewConsultation={handleNewConsultation}
      >
        {state.currentStep !== 6 && exclusionOutcomeBlock}
        {state.currentStep === 0 && (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) =>
              dispatch({ type: "UPDATE_PATIENT", field, value })
            }
            requireAdult={false}
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
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
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
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
                />
              </div>
            </div>
            {daysToDeparture !== null && (
              <p className="text-xs text-gray-600">{daysToDeparture < 0 ? `Departure date is ${-daysToDeparture} days in the past: check the dates` : `${daysToDeparture} days to departure`}</p>
            )}
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
            <div className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30 text-sm">
              Malaria chemoprophylaxis is outside this PGD, which authorises three vaccines. Record the risk assessment and where the traveller was sent. Supply of antimalarials is under the anti-malarials PGD; this tool does not recommend a drug.
            </div>
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
                  label="TravelHealthPro malaria note (optional)"
                  value={state.malariaRisk.resistanceProfile}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_MALARIA_RISK",
                      field: "resistanceProfile",
                      value: v,
                    })
                  }
                  placeholder="e.g. high risk, chloroquine-resistant P. falciparum per TravelHealthPro"
                />
                <Checkbox
                  label="Chemoprophylaxis advised as indicated by TravelHealthPro"
                  checked={state.malariaRisk.chemoprophylaxisAdvised}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_MALARIA_RISK",
                      field: "chemoprophylaxisAdvised",
                      value: v,
                    })
                  }
                  description="Bite avoidance advice is given in every case; chemoprophylaxis where TravelHealthPro recommends it"
                />
                <SelectInput
                  label="Chemoprophylaxis plan"
                  value={state.malariaRisk.chemoprophylaxisPlan}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_MALARIA_RISK",
                      field: "chemoprophylaxisPlan",
                      value: v as ChemoprophylaxisPlan,
                    })
                  }
                  options={[
                    { value: "supplied-antimalarials-pgd", label: "Supplied at this visit under the anti-malarials PGD (separate consultation record)" },
                    { value: "referred-antimalarials-pgd", label: "Booked for an anti-malarials PGD consultation" },
                    { value: "referred-gp-travel-clinic", label: "Referred to GP or travel health clinic" },
                    { value: "not-required", label: "Not required per TravelHealthPro for this itinerary (bite avoidance only)" },
                    { value: "declined", label: "Traveller declined chemoprophylaxis; risks explained" },
                  ]}
                  required
                />
              </>
            )}
          </div>
        )}

        {state.currentStep === 4 && (
          <div className="space-y-4">
            <p className="text-xs text-gray-600">Record the advice given. None of these is required to proceed.</p>
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
            <p className="text-xs text-gray-600">Optional. These items are outside this PGD; record only what was actually supplied or advised. Nothing here is required to proceed.</p>
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
            <p className="text-sm text-gray-600">
              Vaccines administered under {TRAVEL_CORE_PGD_VERSION}. Adults aged 18 years and over. Select each vaccine given today and record the batch, expiry and site.
            </p>

            <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-semibold text-red-800">Exclusions (all three vaccines)</p>
              <Checkbox label="Known hypersensitivity to the vaccine or any excipient (Dukoral: including formaldehyde)" checked={state.vaccines.hypersensitivity} onChange={(v) => setVaccine("hypersensitivity", v)} />
              <Checkbox label="Acute illness with fever (defer until recovered)" checked={state.vaccines.acuteFebrileIllness} onChange={(v) => setVaccine("acuteFebrileIllness", v)} />
              <Checkbox label="Pregnant (seek specialist advice)" checked={state.vaccines.pregnant} onChange={(v) => setVaccine("pregnant", v)} />
              <p className="text-sm font-semibold text-red-800 pt-2">Dukoral only</p>
              <Checkbox label="Acute gastrointestinal symptoms (defer until recovered)" checked={state.vaccines.giSymptoms} onChange={(v) => setVaccine("giSymptoms", v)} />
              <Checkbox label="Severe immunocompromise" checked={state.vaccines.severeImmunocompromise} onChange={(v) => setVaccine("severeImmunocompromise", v)} />
            </div>

            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-700">Cautions</p>
              <Checkbox label="Immunocompromised (may have reduced response; seek specialist advice)" checked={state.vaccines.immunocompromised} onChange={(v) => setVaccine("immunocompromised", v)} />
              <Checkbox label="Thrombocytopenia, bleeding disorder or anticoagulation (fine needle, firm pressure 2 minutes)" checked={state.vaccines.bleedingDisorder} onChange={(v) => setVaccine("bleedingDisorder", v)} />
              <Checkbox label="Recent antibiotics for enteric infection (may reduce Dukoral effectiveness)" checked={state.vaccines.recentAntibiotics} onChange={(v) => setVaccine("recentAntibiotics", v)} />
            </div>

            <div className="space-y-3 p-4 bg-white rounded-lg border border-gray-200">
              <Checkbox label="Hepatitis A vaccine (Havrix Monodose 1440 EL.U/1.0 mL or Avaxim 160 U/0.5 mL), intramuscular, deltoid" checked={state.vaccines.hepAGiven} onChange={(v) => setVaccine("hepAGiven", v)} description="Inclusion: travelling to an area of high or intermediate hepatitis A prevalence; no previous complete course; no documented immunity" />
              {state.vaccines.hepAGiven && (
                <div className="space-y-3 pl-2 border-l-2 border-gray-200">
                  <Checkbox label="Inclusion met: destination has high or intermediate hepatitis A prevalence on current TravelHealthPro guidance (checked at this consultation)" checked={state.vaccines.hepAInclusionMet} onChange={(v) => setVaccine("hepAInclusionMet", v)} />
                  <Checkbox label="Previous complete Hepatitis A vaccination course (primary dose plus booster): excluded" checked={state.vaccines.hepAPreviousCompleteCourse} onChange={(v) => setVaccine("hepAPreviousCompleteCourse", v)} />
                  <Checkbox label="Documented evidence of Hepatitis A immunity: excluded" checked={state.vaccines.hepAImmunityDocumented} onChange={(v) => setVaccine("hepAImmunityDocumented", v)} />
                  <SelectInput label="Product" value={state.vaccines.hepAProduct} onChange={(v) => setVaccine("hepAProduct", v as HepAProduct)} options={[
                    { value: "havrix", label: "Havrix Monodose 1440 EL.U/1.0 mL (dose 1.0 mL)" },
                    { value: "avaxim", label: "Avaxim 160 U/0.5 mL (dose 0.5 mL)" },
                  ]} required />
                  <SelectInput label="Dose" value={state.vaccines.hepADose} onChange={(v) => setVaccine("hepADose", v as HepADose)} options={[
                    { value: "primary", label: "Primary course: one dose (no previous hepatitis A vaccine)" },
                    { value: "booster", label: "Booster at 6 to 12 months after the primary dose" },
                  ]} required />
                  {state.vaccines.hepADose === "booster" && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <TextInput label="Date of the primary dose" type="date" value={state.vaccines.hepAPrimaryDoseDate} onChange={(v) => setVaccine("hepAPrimaryDoseDate", v)} required />
                      <SelectInput label="Product used for the primary dose" value={state.vaccines.hepAPrimaryProduct} onChange={(v) => setVaccine("hepAPrimaryProduct", v as HepAProduct)} options={[
                        { value: "havrix", label: "Havrix (booster 6 to 12 months)" },
                        { value: "avaxim", label: "Avaxim (booster 6 to 36 months)" },
                      ]} required />
                    </div>
                  )}
                  <div className="grid sm:grid-cols-3 gap-4">
                    <TextInput label="Batch number" value={state.vaccines.hepABatch} onChange={(v) => setVaccine("hepABatch", v)} required />
                    <TextInput label="Expiry date" type="date" value={state.vaccines.hepAExpiry} onChange={(v) => setVaccine("hepAExpiry", v)} required />
                    <SelectInput label="Site" value={state.vaccines.hepASite} onChange={(v) => setVaccine("hepASite", v as InjectionSite)} options={[
                      { value: "left-deltoid", label: "Left deltoid" },
                      { value: "right-deltoid", label: "Right deltoid" },
                    ]} required />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 p-4 bg-white rounded-lg border border-gray-200">
              <Checkbox label="Typhoid vaccine (Typhim Vi 25 mcg/0.5 mL), 0.5 mL intramuscular, deltoid" checked={state.vaccines.typhoidGiven} onChange={(v) => setVaccine("typhoidGiven", v)} description="Inclusion: travelling to an area of high or intermediate typhoid prevalence (South Asia, Southeast Asia, Africa, Central/South America). Revaccination every 3 years if continuing risk" />
              {state.vaccines.typhoidGiven && (
                <div className="space-y-3 pl-2 border-l-2 border-gray-200">
                  <Checkbox label="Inclusion met: destination has high or intermediate typhoid prevalence on current TravelHealthPro guidance (checked at this consultation)" checked={state.vaccines.typhoidInclusionMet} onChange={(v) => setVaccine("typhoidInclusionMet", v)} />
                  <Checkbox label="Previous typhoid Vi vaccine dose (revaccination is every 3 years)" checked={state.vaccines.typhoidPreviousDose} onChange={(v) => setVaccine("typhoidPreviousDose", v)} />
                  {state.vaccines.typhoidPreviousDose && (
                    <TextInput label="Date of the previous typhoid dose" type="date" value={state.vaccines.typhoidPreviousDoseDate} onChange={(v) => setVaccine("typhoidPreviousDoseDate", v)} required />
                  )}
                  <div className="grid sm:grid-cols-3 gap-4">
                    <TextInput label="Batch number" value={state.vaccines.typhoidBatch} onChange={(v) => setVaccine("typhoidBatch", v)} required />
                    <TextInput label="Expiry date" type="date" value={state.vaccines.typhoidExpiry} onChange={(v) => setVaccine("typhoidExpiry", v)} required />
                    <SelectInput label="Site" value={state.vaccines.typhoidSite} onChange={(v) => setVaccine("typhoidSite", v as InjectionSite)} options={[
                      { value: "left-deltoid", label: "Left deltoid" },
                      { value: "right-deltoid", label: "Right deltoid" },
                    ]} required />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 p-4 bg-white rounded-lg border border-gray-200">
              <Checkbox label="Cholera vaccine (Dukoral), oral" checked={state.vaccines.choleraGiven} onChange={(v) => setVaccine("choleraGiven", v)} description="Primary course 2 doses 1 to 6 weeks apart; booster every 2 years if continuing risk. Buffer in about 150 mL cool water, whole 3 mL vial, drink within 2 hours; nothing by mouth for 1 hour either side" />
              {state.vaccines.choleraGiven && (
                <div className="space-y-3 pl-2 border-l-2 border-gray-200">
                  <Checkbox label="Inclusion met: travel to an area with active cholera transmission or high risk; humanitarian, healthcare or occupational exposure; or planned extended stay in an endemic area with poor sanitation" checked={state.vaccines.choleraRiskCriteriaMet} onChange={(v) => setVaccine("choleraRiskCriteriaMet", v)} />
                  <SelectInput label="Dose" value={state.vaccines.choleraDose} onChange={(v) => setVaccine("choleraDose", v as CholeraDose)} options={[
                    { value: "1", label: "Primary course, dose 1 of 2" },
                    { value: "2", label: "Primary course, dose 2 of 2 (1 to 6 weeks after dose 1)" },
                    { value: "booster", label: "Booster (every 2 years if continuing risk)" },
                  ]} required />
                  {state.vaccines.choleraDose === "2" && (
                    <TextInput label="Date of dose 1 (dose 2 is due 1 to 6 weeks later; beyond 6 weeks the course restarts)" type="date" value={state.vaccines.choleraDose1Date} onChange={(v) => setVaccine("choleraDose1Date", v)} required />
                  )}
                  {state.vaccines.choleraDose === "booster" && (
                    <TextInput label="Date the last course or booster was completed (beyond 2 years the primary course is repeated)" type="date" value={state.vaccines.choleraLastCourseDate} onChange={(v) => setVaccine("choleraLastCourseDate", v)} required />
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <TextInput label="Batch number" value={state.vaccines.choleraBatch} onChange={(v) => setVaccine("choleraBatch", v)} required />
                    <TextInput label="Expiry date" type="date" value={state.vaccines.choleraExpiry} onChange={(v) => setVaccine("choleraExpiry", v)} required />
                  </div>
                </div>
              )}
            </div>

            {anyVaccineGiven && (
              <div className="p-4 bg-[color:var(--tenant-primary)]/10 rounded-lg border border-[color:var(--tenant-primary)]/30 text-sm space-y-1">
                <p className="font-semibold">Dose and route</p>
                {getVaccineDoseText(state.vaccines).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
                <p className="mt-1">Vaccinate at least 2 weeks before departure if possible. Where more than one vaccine is given, use separate sites and record the site of each.</p>
                {boosterDue.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold">Next dose or booster due</p>
                    {boosterDue.map((b) => (
                      <p key={b.vaccine}>{b.vaccine}: {b.due ? `${b.due}. ` : ""}{b.note}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {exclusionOutcomeBlock}

            {!anyVaccineGiven && (
              <Checkbox label="No vaccine administered at this visit (advice only, or patient excluded or declined; document the advice given)" checked={state.vaccines.noVaccineToday} onChange={(v) => setVaccine("noVaccineToday", v)} />
            )}

            {anyVaccineGiven && (
              <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm font-semibold text-amber-800">Before and after administration</p>
                <Checkbox label="Adrenaline (epinephrine) 1 in 1,000 injection immediately available in the room, in date, with a telephone and a written anaphylaxis protocol (Resuscitation Council UK)" checked={state.vaccines.adrenalineAvailable} onChange={(v) => setVaccine("adrenalineAvailable", v)} />
                <Checkbox label="Observed for 15 minutes after vaccination, seated, and the observation period completed" checked={state.vaccines.observationCompleted} onChange={(v) => setVaccine("observationCompleted", v)} />
                <Checkbox label="Adverse reaction observed during or after vaccination" checked={state.vaccines.adverseReaction} onChange={(v) => { setVaccine("adverseReaction", v); if (!v) setVaccine("adverseReactionDetails", ""); }} />
                {state.vaccines.adverseReaction && (
                  <TextArea label="Adverse reaction and action taken (report via Yellow Card and inform the GP)" value={state.vaccines.adverseReactionDetails} onChange={(v) => setVaccine("adverseReactionDetails", v)} rows={2} required />
                )}
                <Checkbox label="Patient information leaflet supplied for each vaccine; importance of completing the course and the booster schedule explained (Hepatitis A at 6 to 12 months; Typhoid every 3 years; Cholera every 2 years)" checked={state.vaccines.pilSupplied} onChange={(v) => setVaccine("pilSupplied", v)} />
                <Checkbox label="Follow-up advice given: report serious side effects; food and water hygiene; travel insurance covering medical evacuation for remote areas; report symptoms of hepatitis A, typhoid or cholera (fever, diarrhoea, jaundice) immediately; if pregnant or planning pregnancy discuss timing with the GP" checked={state.vaccines.followUpAdviceGiven} onChange={(v) => setVaccine("followUpAdviceGiven", v)} />
              </div>
            )}
          </div>
        )}

        {state.currentStep === 7 && (
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
            <p className="text-xs text-gray-500">{TRAVEL_CORE_PGD_VERSION}.</p>
          </div>
        )}
      </StepWrapper>
    </div>
  );
}
