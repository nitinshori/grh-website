"use client";

import { useReducer, useMemo, useState, useCallback } from "react";
import type {
  ECConsultationState,
  ECAction,
  ECPatientDetails,
  ECClinicalAssessment,
  ECMedicalHistory,
  ECMedications,
  ECMedicineSelection,
  ECCounselling,
  ECConsultationSummary,
} from "./lib/ec-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/ec-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
  calculateHoursSinceUPSI,
  getMedicineAvailability,
} from "./lib/ec-clinical-logic";
import { validateStep } from "./lib/ec-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TimeCalculator } from "./components/TimeCalculator";
import { ECSummaryReport } from "./components/ECSummaryReport";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

// ─── Reducer ───

function reducer(state: ECConsultationState, action: ECAction): ECConsultationState {
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

    case "UPDATE_CLINICAL_ASSESSMENT":
      newState.clinicalAssessment = {
        ...newState.clinicalAssessment,
        [action.field]: action.value,
      };
      if (action.field === "upsiDate" || action.field === "upsiTime") {
        newState.clinicalAssessment.hoursSinceUPSI = calculateHoursSinceUPSI(
          newState.clinicalAssessment.upsiDate,
          newState.clinicalAssessment.upsiTime
        );
      }
      break;

    case "UPDATE_MEDICAL_HISTORY":
      newState.medicalHistory = {
        ...newState.medicalHistory,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_MEDICATIONS":
      newState.medications = { ...newState.medications, [action.field]: action.value };
      break;

    case "UPDATE_MEDICINE_SELECTION":
      newState.medicineSelection = {
        ...newState.medicineSelection,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_COUNSELLING":
      newState.counselling = {
        ...newState.counselling,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_SUMMARY":
      newState.summary = { ...newState.summary, [action.field]: action.value };
      break;

    case "SET_STEP":
      newState.currentStep = action.step;
      break;

    case "NEXT_STEP":
      newState.currentStep = Math.min(newState.currentStep + 1, TOTAL_STEPS - 1);
      break;

    case "PREV_STEP":
      newState.currentStep = Math.max(newState.currentStep - 1, 0);
      break;

    case "RESET":
      return createInitialConsultationState();

    default:
      break;
  }

  return newState;
}

// ─── Main Component ───

export function ECToolClient() {
  const [state, dispatch] = useReducer(reducer, createInitialConsultationState());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set()
  );

  // Compute alerts and recommendations
  const alerts = useMemo(() => getAllAlerts(state), [state]);
  const doseRecommendation = useMemo(() => calculateDoseRecommendation(state), [state]);
  const hasStops = useMemo(() => hasHardStops(alerts), [alerts]);
  const medicineAvailability = useMemo(() => getMedicineAvailability(state), [state]);

  // Update alerts in state
  const updatedState = useMemo(() => {
    const newState = { ...state };
    newState.alerts = alerts;
    newState.doseRecommendation = doseRecommendation;
    return newState;
  }, [state, alerts, doseRecommendation]);

  // Validation for current step
  const validationError = useMemo(() => validateStep(state.currentStep, state), [state.currentStep, state]);

  // Can proceed to next step?
  const canProceed = !validationError && (!hasStops || state.currentStep >= 6);

  // Mark step as completed
  const markStepComplete = useCallback(() => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(state.currentStep);
    setCompletedSteps(newCompleted);
  }, [completedSteps, state.currentStep]);

  const handleNext = () => {
    if (canProceed) {
      markStepComplete();
      dispatch({ type: "NEXT_STEP" });
    }
  };

  const handlePrev = () => {
    dispatch({ type: "PREV_STEP" });
  };

  const handleStepClick = (step: number) => {
    if (step < state.currentStep) {
      dispatch({ type: "SET_STEP", step });
    }
  };

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
      clinicalData: state as unknown as Record<string, unknown>,
      outcome: hasStops ? "not_supplied" : "completed",
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    };
  }, [state, hasStops]);

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
  }, []);


  // ─── Step Content Renderers ───

  const renderStep = () => {
    switch (state.currentStep) {
      case 0: // Patient Details
        return (
          <StepWrapper
            title="Patient Details"
            description="Confirm patient identity and age."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <PatientDetailsStep
              patient={state.patient}
              onChange={(field, value) =>
                dispatch({ type: "UPDATE_PATIENT", field, value })
              }
              genderOption={{
                label: "Patient is female",
                description:
                  "Emergency contraception is for patients who are female.",
                checked: state.patient.femaleConfirmed,
                onToggle: (v) =>
                  dispatch({ type: "UPDATE_PATIENT", field: "femaleConfirmed", value: v }),
              }}
            />
            {state.patient.age !== null && state.patient.age >= 13 && state.patient.age <= 15 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
                <Checkbox
                  label="Fraser competence confirmed"
                  checked={state.patient.fraserCompetent ?? false}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_PATIENT",
                      field: "fraserCompetent",
                      value: v,
                    })
                  }
                  description="For patients aged 13-15, confirm that they understand the implications of emergency contraception and are competent to consent."
                />
              </div>
            )}
          </StepWrapper>
        );

      case 1: // Consent & ID
        return (
          <StepWrapper
            title="Consent & ID Verification"
            description="Obtain informed consent and verify identity."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) =>
                dispatch({ type: "UPDATE_CONSENT", field, value })
              }
            />
          </StepWrapper>
        );

      case 2: // Clinical Assessment
        return (
          <StepWrapper
            title="Clinical Assessment"
            description="Record UPSI details and timing. This determines which medicines can be offered."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <div className="mb-6">
                <h3 className="font-semibold text-sm text-navy-900 mb-3">
                  Time since UPSI
                </h3>
                <TimeCalculator
                  upsiDate={state.clinicalAssessment.upsiDate}
                  upsiTime={state.clinicalAssessment.upsiTime}
                  onHoursUpdate={(hours) => {
                    // Hours are auto-updated through reducer
                  }}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">
                    Date of UPSI <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={state.clinicalAssessment.upsiDate}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_CLINICAL_ASSESSMENT",
                        field: "upsiDate",
                        value: e.target.value,
                      })
                    }
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">
                    Time of UPSI (approximate) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    value={state.clinicalAssessment.upsiTime}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_CLINICAL_ASSESSMENT",
                        field: "upsiTime",
                        value: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">
                  Last menstrual period <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={state.clinicalAssessment.lastMenstrualPeriod}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_CLINICAL_ASSESSMENT",
                      field: "lastMenstrualPeriod",
                      value: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                />
              </div>

              <Checkbox
                label="Menstrual cycle is regular"
                checked={state.clinicalAssessment.cycleRegular}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_CLINICAL_ASSESSMENT",
                    field: "cycleRegular",
                    value: v,
                  })
                }
              />

              {state.clinicalAssessment.cycleRegular && (
                <NumberInput
                  label="Cycle length"
                  value={state.clinicalAssessment.cycleLength}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_CLINICAL_ASSESSMENT",
                      field: "cycleLength",
                      value: v,
                    })
                  }
                  min={21}
                  max={35}
                  unit="days"
                />
              )}

              <Checkbox
                label="Patient reports pregnancy-like symptoms"
                checked={state.clinicalAssessment.currentPregnancySymptoms}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_CLINICAL_ASSESSMENT",
                    field: "currentPregnancySymptoms",
                    value: v,
                  })
                }
                description="e.g. nausea, breast tenderness"
              />

              <Checkbox
                label="Patient already uses regular contraception"
                checked={state.clinicalAssessment.regularContraception}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_CLINICAL_ASSESSMENT",
                    field: "regularContraception",
                    value: v,
                  })
                }
              />

              {state.clinicalAssessment.regularContraception && (
                <div className="space-y-4">
                  <TextInput
                    label="Type of contraception"
                    value={state.clinicalAssessment.contraceptionType}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_CLINICAL_ASSESSMENT",
                        field: "contraceptionType",
                        value: v,
                      })
                    }
                    placeholder="e.g. combined pill, IUD, implant"
                  />
                  <TextInput
                    label="How the contraception failed"
                    value={state.clinicalAssessment.contraceptionFailureType}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_CLINICAL_ASSESSMENT",
                        field: "contraceptionFailureType",
                        value: v,
                      })
                    }
                    placeholder="e.g. condom split, missed pills"
                  />
                </div>
              )}

              <Checkbox
                label="Patient has already used emergency contraception this cycle"
                checked={state.clinicalAssessment.previousEC}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_CLINICAL_ASSESSMENT",
                    field: "previousEC",
                    value: v,
                  })
                }
              />

              {state.clinicalAssessment.previousEC && (
                <TextArea
                  label="Details of previous EC use"
                  value={state.clinicalAssessment.previousECDetails}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_CLINICAL_ASSESSMENT",
                      field: "previousECDetails",
                      value: v,
                    })
                  }
                  placeholder="What was used, when, etc."
                />
              )}

              <Checkbox
                label="Patient reports multiple UPSI episodes this cycle"
                checked={state.clinicalAssessment.additionalUPSIInstances}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_CLINICAL_ASSESSMENT",
                    field: "additionalUPSIInstances",
                    value: v,
                  })
                }
                description="Discussion of ongoing risk and long-term contraception is important."
              />
            </div>
          </StepWrapper>
        );

      case 3: // Medical History
        return (
          <StepWrapper
            title="Medical History"
            description="Identify contraindications and cautions relevant to emergency contraception."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <SelectInput
                label="Pregnancy test result"
                value={state.medicalHistory.pregnancyTestResult}
                onChange={(v: string) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "pregnancyTestResult",
                    value: v as "positive" | "negative" | "not-done" | "",
                  })
                }
                options={[
                  { value: "negative", label: "Negative" },
                  { value: "positive", label: "Positive" },
                  { value: "not-done", label: "Not done" },
                ]}
                required
              />

              <Checkbox
                label="Severe hepatic impairment"
                checked={state.medicalHistory.severeHepatic}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "severeHepatic",
                    value: v,
                  })
                }
                description="Contraindication for both levonorgestrel and ulipristal."
              />

              <Checkbox
                label="Severe asthma"
                checked={state.medicalHistory.severeAsthma}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "severeAsthma",
                    value: v,
                  })
                }
                description="Contraindication for ulipristal."
              />

              <Checkbox
                label="Crohn's disease or inflammatory bowel disease"
                checked={state.medicalHistory.crohnsDisease}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "crohnsDisease",
                    value: v,
                  })
                }
                description="May reduce efficacy of oral emergency contraception."
              />

              <Checkbox
                label="Currently breastfeeding"
                checked={state.medicalHistory.breastfeeding}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "breastfeeding",
                    value: v,
                  })
                }
                description="Both medicines can be used with precautions (expression/discard of milk)."
              />

              <Checkbox
                label="Previous ectopic pregnancy"
                checked={state.medicalHistory.previousEctopic}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "previousEctopic",
                    value: v,
                  })
                }
                description="Emergency contraception can still be used; advise on warning signs."
              />

              <Checkbox
                label="Porphyria"
                checked={state.medicalHistory.porphyria}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "porphyria",
                    value: v,
                  })
                }
                description="May be contraindicated; specialist advice recommended."
              />
            </div>
          </StepWrapper>
        );

      case 4: // Current Medications
        return (
          <StepWrapper
            title="Current Medications & Interactions"
            description="Check for interactions and efficacy-reducing drugs."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          >
            <div className="space-y-4">
              <Checkbox
                label="Takes enzyme-inducing drugs"
                checked={state.medications.takesEnzymeInducers}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "takesEnzymeInducers",
                    value: v,
                  })
                }
                description="e.g. carbamazepine, phenytoin, phenobarbital, rifampicin, St John's Wort"
              />

              {state.medications.takesEnzymeInducers && (
                <TextArea
                  label="Specify which enzyme-inducing drugs"
                  value={state.medications.enzymeInducerDetails}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_MEDICATIONS",
                      field: "enzymeInducerDetails",
                      value: v,
                    })
                  }
                  required
                />
              )}

              <Checkbox
                label="Already taken ulipristal (EllaOne) this cycle"
                checked={state.medications.takesUPA}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "takesUPA",
                    value: v,
                  })
                }
                description="Cannot combine with levonorgestrel."
              />

              <Checkbox
                label="Currently uses hormonal contraception"
                checked={state.medications.currentHormonalContraception}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICATIONS",
                    field: "currentHormonalContraception",
                    value: v,
                  })
                }
              />

              {state.medications.currentHormonalContraception && (
                <TextInput
                  label="Type of hormonal contraception"
                  value={state.medications.hormonalContraceptionType}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_MEDICATIONS",
                      field: "hormonalContraceptionType",
                      value: v,
                    })
                  }
                  placeholder="e.g. combined oral contraceptive, POP, patch, ring"
                  required
                />
              )}
            </div>
          </StepWrapper>
        );

      case 5: // Contraindications Review
        return (
          <StepWrapper
            title="Contraindications & Clinical Alerts Review"
            description="Review identified contraindications and clinical concerns."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={!hasStops}
            validationError={
              hasStops
                ? "Hard stop contraindications present — cannot proceed to medicine selection."
                : null
            }
            isBlocked={hasStops}
          >
            {alerts.length > 0 ? (
              <AlertBanner alerts={alerts} />
            ) : (
              <p className="text-sm text-gray-600">No alerts identified.</p>
            )}

            {hasStops && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-sm font-semibold text-red-700 mb-2">
                  Hard Stop — Cannot Supply
                </p>
                <p className="text-sm text-red-600">
                  Based on the identified contraindications, emergency contraception cannot be
                  supplied. The patient should be referred to their GP or local sexual health
                  clinic for further advice, including consideration of copper IUD if within 5
                  days of UPSI.
                </p>
              </div>
            )}
          </StepWrapper>
        );

      case 6: // Medicine Selection
        return (
          <StepWrapper
            title="Medicine Selection"
            description="Select appropriate emergency contraception based on clinical assessment."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
          >
            <div className="space-y-4">
              {doseRecommendation && doseRecommendation.medicine !== "none" && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Recommended:
                  </p>
                  <p className="text-sm text-blue-800">
                    {doseRecommendation.medicine === "levonorgestrel"
                      ? "Levonorgestrel"
                      : "Ulipristal"}{" "}
                    {doseRecommendation.dose}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {doseRecommendation.reason}
                  </p>
                </div>
              )}

              <SelectInput
                label="Medicine selected"
                value={state.medicineSelection.medicine}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICINE_SELECTION",
                    field: "medicine",
                    value: v as "levonorgestrel" | "ulipristal" | "",
                  })
                }
                options={[
                  {
                    value: "levonorgestrel",
                    label: `Levonorgestrel (${medicineAvailability.canUseLNG ? "Available" : "Not available"})`,
                  },
                  {
                    value: "ulipristal",
                    label: `Ulipristal/EllaOne (${medicineAvailability.canUseUPA ? "Available" : "Not available"})`,
                  },
                ]}
                required
              />

              {state.medicineSelection.medicine === "levonorgestrel" && (
                <SelectInput
                  label="Dose"
                  value={state.medicineSelection.dose}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_MEDICINE_SELECTION",
                      field: "dose",
                      value: v,
                    })
                  }
                  options={[
                    { value: "1.5mg", label: "1.5mg (standard single dose)" },
                    {
                      value: "3mg",
                      label: "3mg (double dose for enzyme inducers)",
                    },
                  ]}
                  required
                />
              )}

              {state.medicineSelection.medicine === "ulipristal" && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-sm font-medium text-navy-900">Dose</p>
                  <p className="text-sm text-gray-700 mt-1">30mg (single dose)</p>
                </div>
              )}

              {state.medicineSelection.medicine === "levonorgestrel" &&
                state.medications.takesEnzymeInducers && (
                  <Checkbox
                    label="Double dosing required"
                    checked={state.medicineSelection.doubleDosingRequired}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_MEDICINE_SELECTION",
                        field: "doubleDosingRequired",
                        value: v,
                      })
                    }
                    description="Patient takes enzyme inducers; 3mg dose recommended for adequate efficacy."
                  />
                )}

              <Checkbox
                label="Override automatic recommendation"
                checked={state.medicineSelection.pharmacistOverride}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICINE_SELECTION",
                    field: "pharmacistOverride",
                    value: v,
                  })
                }
                description="Tick if deviating from recommended dose/medicine."
              />

              {state.medicineSelection.pharmacistOverride && (
                <TextArea
                  label="Reason for override"
                  value={state.medicineSelection.overrideReason}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_MEDICINE_SELECTION",
                      field: "overrideReason",
                      value: v,
                    })
                  }
                  required
                  placeholder="Document clinical reasoning for deviation from guidance."
                />
              )}
            </div>
          </StepWrapper>
        );

      case 7: // Counselling & Follow-up
        return (
          <StepWrapper
            title="Counselling & Follow-up Advice"
            description="Confirm counselling points discussed with patient."
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
          getConsultationData={getConsultationData}
          onNewConsultation={handleNewConsultation}
          >
            <div className="space-y-3">
              <Checkbox
                label="Advised when to take the medicine"
                checked={state.counselling.timingAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "timingAdvice",
                    value: v,
                  })
                }
                description="As soon as possible; levonorgestrel within 72 hours, ulipristal within 120 hours."
              />

              <Checkbox
                label="Advised what to do if vomiting occurs"
                checked={state.counselling.vomitingAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "vomitingAdvice",
                    value: v,
                  })
                }
                description="If vomiting within 2 hours (LNG) or 3 hours (UPA), repeat dose advised."
              />

              <Checkbox
                label="Advised emergency contraception is not 100% effective"
                checked={state.counselling.notGuaranteed}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "notGuaranteed",
                    value: v,
                  })
                }
                description="Backup contraception (condom) recommended until next period."
              />

              <Checkbox
                label="Advised to take pregnancy test if period is >7 days late"
                checked={state.counselling.pregnancyTestAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "pregnancyTestAdvice",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Future contraception options discussed"
                checked={state.counselling.futureContraceptionDiscussed}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "futureContraceptionDiscussed",
                    value: v,
                  })
                }
                description="Long-acting methods, pill, barrier methods, etc."
              />

              <Checkbox
                label="Advised when to contact GP / return for review"
                checked={state.counselling.returnToGPAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "returnToGPAdvice",
                    value: v,
                  })
                }
                description="If period does not arrive, if unusually heavy bleeding, or if abdominal pain."
              />

              <Checkbox
                label="STI screening advice provided"
                checked={state.counselling.stiScreeningAdvice}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "stiScreeningAdvice",
                    value: v,
                  })
                }
                description="Given information about accessing STI testing."
              />

              <Checkbox
                label="Side effects explained"
                checked={state.counselling.sideEffectsExplained}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "sideEffectsExplained",
                    value: v,
                  })
                }
                description="Nausea, headache, irregular bleeding, dizziness, etc."
              />

              <Checkbox
                label="Discussed how to restart/continue regular contraception"
                checked={state.counselling.hormonalContraceptionRestart}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_COUNSELLING",
                    field: "hormonalContraceptionRestart",
                    value: v,
                  })
                }
                description="LNG: restart immediately. UPA: restart after 5 days."
              />
            </div>
          </StepWrapper>
        );

      case 8: // Summary & Print
        return (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-navy-900">
                Summary & Consultation Record
              </h2>
            </div>

            <div className="px-6 py-6">
              <div className="space-y-4 mb-6">
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
                />
                <TextInput
                  label="Pharmacy address"
                  value={state.summary.pharmacyAddress}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_SUMMARY",
                      field: "pharmacyAddress",
                      value: v,
                    })
                  }
                />
                <TextArea
                  label="Additional clinical notes"
                  value={state.summary.clinicalNotes}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_SUMMARY",
                      field: "clinicalNotes",
                      value: v,
                    })
                  }
                  placeholder="Any additional information to record..."
                />
              </div>

              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-600 mb-4">
                  Review the summary below before printing the consultation record.
                </p>
                <ECSummaryReport state={updatedState} />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
              <button
                onClick={() => dispatch({ type: "PREV_STEP" })}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-navy-900 transition-colors"
              >
                &larr; Previous
              </button>

              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-navy-900 hover:bg-navy-950 text-white transition-colors"
              >
                Print Consultation Record
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <ProgressBar
        stepLabels={STEP_LABELS}
        currentStep={state.currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
        hasErrors={Boolean(validationError)}
      />

      {/* Alert Banner */}
      {alerts.length > 0 && state.currentStep < 6 && (
        <AlertBanner alerts={alerts} />
      )}

      {/* Step Content */}
      {renderStep()}
    </div>
  );
}
