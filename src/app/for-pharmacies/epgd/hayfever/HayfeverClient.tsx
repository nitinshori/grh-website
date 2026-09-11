"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  HayfeverConsultationState,
  HayfeverAction,
  HayfeverPatientDetails,
  HayfeverAssessment,
  HayfeverMedicalHistory,
  HayfeverContraindications,
  HayfeverMedicineSupply,
  HayfeverCounselling,
} from "./lib/hayfever-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/hayfever-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
} from "./lib/hayfever-clinical-logic";
import { validateStep } from "./lib/hayfever-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { HayfeverSummaryReport } from "./components/HayfeverSummaryReport";
import { TextInput, Checkbox, SelectInput, TextArea, NumberInput } from "../shared/components/FormInputs";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
function reducer(state: HayfeverConsultationState, action: HayfeverAction): HayfeverConsultationState {
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
    case "UPDATE_ASSESSMENT":
      newState.assessment = { ...newState.assessment, [action.field]: action.value };
      break;
    case "UPDATE_MEDICAL_HISTORY":
      newState.medicalHistory = { ...newState.medicalHistory, [action.field]: action.value };
      break;
    case "UPDATE_CONTRAINDICATIONS":
      newState.contraindications = { ...newState.contraindications, [action.field]: action.value };
      break;
    case "UPDATE_MEDICINE_SUPPLY":
      newState.medicineSupply = { ...newState.medicineSupply, [action.field]: action.value };
      break;
    case "UPDATE_COUNSELLING":
      newState.counselling = { ...newState.counselling, [action.field]: action.value };
      break;
    case "UPDATE_SUMMARY":
      newState.summary = { ...newState.summary, [action.field]: action.value };
      break;
    case "SET_STEP":
      newState.currentStep = action.step;
      break;
    case "RESET":
      return createInitialConsultationState();
  }

  return newState;
}

export default function HayfeverClient() {
  const [state, dispatch] = useReducer(reducer, createInitialConsultationState());
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

  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const alerts = useMemo(() => getAllAlerts(state), [state]);
  const hardStops = useMemo(() => hasHardStops(state), [state]);
  const doseRecommendation = useMemo(() => calculateDoseRecommendation(state), [state]);
  const validationError = useMemo(() => validateStep(state, state.currentStep), [state]);
  // A stop anywhere blocks Next on every step, including the last (Save &
  // Print). Stops used to gate steps 0 to 5 only and handleNext never
  // checked them (adversarial review, 11 Sep 2026).
  const canProceed = useMemo(() => {
    if (hardStops) return false;
    return !validationError;
  }, [validationError, hardStops]);

  const handleNext = useCallback(() => {
    if (hardStops) return;
    if (!validationError && state.currentStep < TOTAL_STEPS - 1) {
      const newCompleted = new Set(completedSteps);
      newCompleted.add(state.currentStep);
      setCompletedSteps(newCompleted);
      dispatch({ type: "SET_STEP", step: state.currentStep + 1 });
    }
  }, [state.currentStep, validationError, completedSteps, hardStops]);

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
  }, []);

  const handlePrev = useCallback(() => {
    if (state.currentStep > 0) {
      dispatch({ type: "SET_STEP", step: state.currentStep - 1 });
    }
  }, [state.currentStep]);

  const handleStepClick = useCallback((step: number) => {
    if (completedSteps.has(step) || step <= state.currentStep) {
      dispatch({ type: "SET_STEP", step });
    }
  }, [completedSteps, state.currentStep]);

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) =>
              dispatch({ type: "UPDATE_PATIENT", field: field as keyof HayfeverPatientDetails, value })
            }
            requireAdult={false}
          />
        );

      case 1:
        return (
          <ConsentStep
            consent={state.consent}
            onChange={(field, value) =>
              dispatch({ type: "UPDATE_CONSENT", field, value })
            }
          />
        );

      case 2:
        return (
          <div className="space-y-4">
            <SelectInput
              label="Symptom severity"
              value={state.assessment.symptomSeverity}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "symptomSeverity", value: v })
              }
              options={[
                { value: "mild", label: "Mild (occasional symptoms)" },
                { value: "moderate", label: "Moderate (regular symptoms)" },
                { value: "severe", label: "Severe (significant impact on daily life)" },
              ]}
              required
            />
            <SelectInput
              label="Temporal pattern"
              value={state.assessment.seasonalOrPerennial}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "seasonalOrPerennial", value: v })
              }
              options={[
                { value: "seasonal", label: "Seasonal (specific months)" },
                { value: "perennial", label: "Perennial (year-round)" },
                { value: "both", label: "Both seasonal and perennial triggers" },
              ]}
              required
            />
            <TextInput
              label="Previous OTC treatments tried"
              value={state.assessment.previousOTCUse}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "previousOTCUse", value: v })
              }
              placeholder="e.g., cetirizine, loratadine"
            />
            <TextInput
              label="Current symptom duration"
              value={state.assessment.symptomDuration}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "symptomDuration", value: v })
              }
              placeholder="e.g., past 2 weeks"
            />
            <Checkbox
              label="Previous diagnosis of allergic rhinitis, or recurrence of known symptoms"
              checked={state.assessment.previousDiagnosisOrRecurrence}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "previousDiagnosisOrRecurrence", value: v })
              }
              description="Inclusion criterion for fexofenadine 120 mg under this PGD."
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Checkbox
              label="Co-existing asthma or LRTI history (red flag: refer)"
              checked={state.medicalHistory.asthmaOrLrti}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "asthmaOrLrti", value: v })
              }
              description="Hayfever with asthma is a reason to refer, not to treat here. Ticking this raises a red flag on every step and prints the referral advice on the record. This PGD does not authorise montelukast or any asthma treatment; the asthma needs reviewing by the GP."
            />
            <Checkbox
              label="Severe hepatic impairment"
              checked={state.medicalHistory.severeHepaticImpairment}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "severeHepaticImpairment", value: v })
              }
              description="Exclusion for fexofenadine. Dymista: caution in hepatic impairment."
            />
            <Checkbox
              label="Severe renal impairment"
              checked={state.medicalHistory.renalImpairment}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "renalImpairment", value: v })
              }
              description="Exclusion for fexofenadine"
            />
            <Checkbox
              label="Recent nasal surgery or trauma"
              checked={state.medicalHistory.recentNasalSurgery}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "recentNasalSurgery", value: v })
              }
              description="Exclusion for Dymista nasal spray"
            />
            <Checkbox
              label="Untreated fungal, bacterial or viral nasal infection"
              checked={state.medicalHistory.untreatedNasalInfection}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "untreatedNasalInfection", value: v })
              }
              description="Exclusion for Dymista nasal spray"
            />
            <Checkbox
              label="History of cardiovascular disease"
              checked={state.medicalHistory.cardiovascularDisease}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "cardiovascularDisease", value: v })
              }
              description="Caution with fexofenadine"
            />
            <Checkbox
              label="Glaucoma"
              checked={state.medicalHistory.glaucoma}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "glaucoma", value: v })
              }
              description="Caution with Dymista"
            />
            <Checkbox
              label="Tuberculosis"
              checked={state.medicalHistory.tuberculosis}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "tuberculosis", value: v })
              }
              description="Caution with Dymista"
            />
            <Checkbox
              label="Phenylketonuria (PKU)"
              checked={state.medicalHistory.phenylketonuria}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "phenylketonuria", value: v })
              }
              description="Some formulations contain aspartame"
            />
            <TextInput
              label="Other medical conditions"
              value={state.medicalHistory.otherConditions}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "otherConditions", value: v })
              }
              placeholder="e.g., hypertension, cardiac conditions"
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Checkbox
              label="Patient is pregnant"
              checked={state.contraindications.pregnant}
              onChange={(v) =>
                dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "pregnant", value: v })
              }
              description="Exclusion for fexofenadine under this PGD. Inform or refer to the GP as appropriate."
            />
            <Checkbox
              label="Patient is breastfeeding"
              checked={state.contraindications.breastfeeding}
              onChange={(v) =>
                dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "breastfeeding", value: v })
              }
              description="Exclusion for fexofenadine under this PGD. Inform or refer to the GP as appropriate."
            />
            <Checkbox
              label="Patient is under 12 years"
              checked={state.contraindications.childUnder12}
              onChange={(v) =>
                dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "childUnder12", value: v })
              }
              description="Exclusion for both fexofenadine and Dymista. Also enforced from the date of birth."
            />
            <Checkbox
              label="Known hypersensitivity to fexofenadine or any component of the formulation"
              checked={state.contraindications.hypersensitivityFexofenadine}
              onChange={(v) =>
                dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "hypersensitivityFexofenadine", value: v })
              }
              description="Exclusion for fexofenadine"
            />
            <Checkbox
              label="Known hypersensitivity to azelastine, fluticasone or any excipient"
              checked={state.contraindications.hypersensitivityDymista}
              onChange={(v) =>
                dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "hypersensitivityDymista", value: v })
              }
              description="Exclusion for Dymista nasal spray"
            />
            <TextInput
              label="Current medications that may interact"
              value={state.contraindications.otherMedicines}
              onChange={(v) =>
                dispatch({ type: "UPDATE_CONTRAINDICATIONS", field: "otherMedicines", value: v })
              }
              placeholder="List any current medications"
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <SelectInput
              label="Medicine selection"
              value={state.medicineSupply.medicineSelected}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "medicineSelected", value: v })
              }
              options={[
                { value: "fexofenadine", label: "Fexofenadine 120 mg tablets, one daily (up to 30 tablets)" },
                { value: "dymista", label: "Dymista nasal spray (azelastine 137 micrograms / fluticasone propionate 50 micrograms per actuation), one spray each nostril twice daily, one 23 g bottle" },
                // Montelukast is not offered. See hayfever-clinical-logic.ts.
                { value: "combination", label: "Combination: fexofenadine 120 mg tablets + Dymista nasal spray" },
              ]}
              required
            />
            {(state.medicineSupply.medicineSelected === "fexofenadine" ||
              state.medicineSupply.medicineSelected === "combination") && (
              <SelectInput
                label="Fexofenadine 120 mg brand supplied"
                value={state.medicineSupply.fexofenadineBrand}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "fexofenadineBrand", value: v })
                }
                options={[
                  { value: "allevia", label: "Allevia 120 mg tablets (P). Where the P licence is narrower than this PGD, the P licence governs." },
                  { value: "generic", label: "Generic fexofenadine 120 mg tablets (POM, supplied under this PGD)" },
                ]}
                required
              />
            )}
            {(state.medicineSupply.medicineSelected === "dymista" ||
              state.medicineSupply.medicineSelected === "combination") && (
              <Checkbox
                label="Dual therapy required: monotherapy with either an intranasal antihistamine or a corticosteroid is not sufficient"
                checked={state.medicineSupply.dualTherapyRequired}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "dualTherapyRequired", value: v })
                }
                description="Dymista inclusion criterion: moderate to severe allergic rhinitis requiring dual therapy."
                required
              />
            )}
            {(state.medicineSupply.medicineSelected === "fexofenadine" ||
              state.medicineSupply.medicineSelected === "combination") && (
              <NumberInput
                label="Fexofenadine 120 mg tablets supplied"
                value={state.medicineSupply.fexofenadineQuantity}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "fexofenadineQuantity", value: v })
                }
                min={1}
                max={30}
                unit="tablets (maximum 30)"
                required
              />
            )}
            {(state.medicineSupply.medicineSelected === "dymista" ||
              state.medicineSupply.medicineSelected === "combination") && (
              <NumberInput
                label="Dymista 23 g bottles supplied"
                value={state.medicineSupply.dymistaBottles}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "dymistaBottles", value: v })
                }
                min={1}
                max={1}
                unit="bottle (one per supply)"
                required
              />
            )}
            {doseRecommendation && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-navy-900 space-y-1">
                <p><span className="font-medium">Medicine:</span> {doseRecommendation.medicine}</p>
                <p><span className="font-medium">Dose:</span> {doseRecommendation.dose}</p>
                <p><span className="font-medium">Quantity and treatment period:</span> {doseRecommendation.duration}</p>
              </div>
            )}
            <Checkbox
              label="Dosage confirmed with patient"
              checked={state.medicineSupply.dosageConfirmed}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "dosageConfirmed", value: v })
              }
            />
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <Checkbox
              label="Allergen avoidance measures discussed"
              checked={state.counselling.allergenAvoidance}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "allergenAvoidance", value: v })
              }
              description="Keeping windows closed, avoiding outdoor activities during high pollen counts"
            />
            <Checkbox
              label="Correct nasal spray technique advised (Dymista)"
              checked={state.counselling.nasalSprayTechnique}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "nasalSprayTechnique", value: v })
              }
              description="Advise on correct nasal spray technique to optimise efficacy and reduce side effects. Spray directed away from the nasal septum."
            />
            <Checkbox
              label="Effectiveness timeline explained"
              checked={state.counselling.effectivenessTimeline}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "effectivenessTimeline", value: v })
              }
              description="Dymista: assess effectiveness after 2 to 4 weeks; reassess need for continued treatment if symptoms persist beyond 4 weeks. Fexofenadine: if symptoms persist beyond 7 days or worsen, refer to a healthcare provider."
            />
            <Checkbox
              label="Combination therapy rationale explained"
              checked={state.counselling.combinationRationale}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "combinationRationale", value: v })
              }
              description="Fexofenadine 120 mg and Dymista may be supplied together for moderate to severe symptoms"
            />
            <Checkbox
              label="Avoid alcohol and other sedating antihistamines (fexofenadine)"
              checked={state.counselling.alcoholSedatingAdvice}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "alcoholSedatingAdvice", value: v })
              }
            />
            <Checkbox
              label="Non-sedating antihistamine, but occasional drowsiness may still occur (fexofenadine)"
              checked={state.counselling.drowsinessAdvice}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "drowsinessAdvice", value: v })
              }
            />
            <Checkbox
              label="Possible side effects and need for ongoing review if used long-term (Dymista)"
              checked={state.counselling.sideEffectsAdvice}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "sideEffectsAdvice", value: v })
              }
              description="Nasal irritation, headache, epistaxis (nosebleeds), bitter taste, somnolence. Rare: hypersensitivity reactions."
            />
            <Checkbox
              label="Follow-up advice given"
              checked={state.counselling.followUpAdvice}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "followUpAdvice", value: v })
              }
              description="Seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3 to 4 weeks, or the patient becomes systemically very unwell."
              required
            />
            <Checkbox
              label="Patient information leaflet (PIL) supplied with the medication"
              checked={state.counselling.pilSupplied}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "pilSupplied", value: v })
              }
              required
            />
            <Checkbox
              label="Wraparound sunglasses recommended"
              checked={state.counselling.wrapsunglasses}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "wrapsunglasses", value: v })
              }
              description="Reduces pollen exposure to eyes"
            />
            <Checkbox
              label="Pollen forecast checking advised"
              checked={state.counselling.pollenForecastAdvice}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "pollenForecastAdvice", value: v })
              }
            />
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="Pharmacist name"
                value={state.summary.pharmacistName}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })
                }
                required
                placeholder="Your name"
              />
              <TextInput
                label="GPhC registration number"
                value={state.summary.pharmacistGPhC}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })
                }
                required
                placeholder="e.g., 123456"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                label="Pharmacy name"
                value={state.summary.pharmacyName}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })
                }
                placeholder="Your pharmacy"
              />
              <TextInput
                label="Pharmacy address"
                value={state.summary.pharmacyAddress}
                onChange={(v) =>
                  dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyAddress", value: v })
                }
                placeholder="Address"
              />
            </div>
            <TextArea
              label="Clinical notes (optional)"
              value={state.summary.clinicalNotes}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })
              }
              placeholder="Additional clinical details or follow-up advice"
              rows={4}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Consultation Record Data (for saving to database) ───
  // Returns a record on every step so an exclusion can be saved as "not
  // supplied" from the step it is raised on.
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    const supplied = !hardStops && !!doseRecommendation;
    const quantityParts: string[] = [];
    const med = state.medicineSupply.medicineSelected;
    if ((med === "fexofenadine" || med === "combination") && state.medicineSupply.fexofenadineQuantity)
      quantityParts.push(`${state.medicineSupply.fexofenadineQuantity} x fexofenadine 120 mg tablets`);
    if ((med === "dymista" || med === "combination") && state.medicineSupply.dymistaBottles)
      quantityParts.push(`${state.medicineSupply.dymistaBottles} x Dymista 23 g bottle`);
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
        gpAddress: state.patient.gpAddress,
        gpPhone: state.patient.gpPhone,
        gpEmail: state.patient.gpEmail,
        gpOdsCode: state.patient.gpOdsCode,
      },
      clinicalData: { ...state, alerts, hardStops } as unknown as Record<string, unknown>,
      outcome: hardStops ? "not_supplied" : "completed",
      ...(supplied
        ? {
            medicine: {
              name: doseRecommendation.medicine,
              dose: doseRecommendation.dose,
              duration: doseRecommendation.duration,
              quantity: quantityParts.join(" + "),
            },
          }
        : {}),
      summary: {
        pharmacistName: state.summary.pharmacistName || __pharmProfile?.name || "",
        pharmacistGPhC: state.summary.pharmacistGPhC || __pharmProfile?.gphcNumber || "",
        pharmacyName: state.summary.pharmacyName || __pharmProfile?.pharmacyName,
        pharmacyAddress: state.summary.pharmacyAddress || __pharmProfile?.pharmacyAddress,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
      consent: { notifyGp: state.consent.notifyGp },
    };
  }, [state, hardStops, alerts, doseRecommendation, __pharmProfile]);

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
          canProceed={canProceed}
          validationError={validationError}
          isBlocked={hardStops}
          getConsultationData={getConsultationData}
          onNewConsultation={handleNewConsultation}
        >
          <HayfeverSummaryReport
            state={state}
            alerts={alerts}
            doseRecommendation={doseRecommendation}
          />
        </StepWrapper>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProgressBar
        currentStep={state.currentStep}
        totalSteps={TOTAL_STEPS}
        stepLabels={STEP_LABELS}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      {alerts.length > 0 && (
        <AlertBanner alerts={alerts} />
      )}

      <StepWrapper
        currentStep={state.currentStep}
        totalSteps={TOTAL_STEPS}
        title={STEP_LABELS[state.currentStep]}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={canProceed}
        validationError={validationError}
        isBlocked={hardStops}
        getConsultationData={getConsultationData}
      >
        {renderStep()}
      </StepWrapper>
    </div>
  );
}
