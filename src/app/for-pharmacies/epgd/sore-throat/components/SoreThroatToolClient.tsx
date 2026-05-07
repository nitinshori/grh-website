"use client";

import { useReducer, useMemo, useCallback } from "react";
import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";
import {
  validatePatientStep,
  validateConsentStep,
  validateSummaryStep,
  calculateAge,
  initialPatientDetails,
  initialConsent,
  initialSummary,
} from "../../shared/types";
import { ProgressBar } from "../../shared/components/ProgressBar";
import { StepWrapper } from "../../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../../shared/components/AlertBanner";
import { PatientDetailsStep } from "../../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../../shared/steps/ConsentStep";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../../shared/components/FormInputs";
import { FeverPAINScore } from "./FeverPAINScore";
import { SoreThroatSummaryReport } from "./SoreThroatSummaryReport";
import type { SoreThroatState } from "../lib/sore-throat-types";
import {
  initialSoreThroatSymptoms,
  initialFeverPAINScore,
  initialSoreThroatExamination,
  initialSoreThroatHistory,
  initialSoreThroatMedicine,
  initialSoreThroatCounselling,
} from "../lib/sore-throat-types";
import {
  generateExclusionAlerts,
  generateCautionAlerts,
  calculateFeverPAINScore,
  interpretFeverPAINScore,
  recommendMedicine,
  validateSymptomStep,
  validateFeverPAINStep,
  validateExaminationStep,
  validateHistoryStep,
  validateMedicineStep,
  validateCounsellingStep,
} from "../lib/sore-throat-clinical-logic";

const STEP_LABELS = [
  "Patient Details",
  "Consent & ID",
  "Symptom Assessment",
  "FeverPAIN Score",
  "Examination & Test",
  "Medical History",
  "Medicine Selection",
  "Counselling",
  "Summary & Print",
] as const;

type Action =
  | { type: "SET_STEP"; step: number }
  | { type: "UPDATE_PATIENT"; field: keyof BasePatientDetails; value: any }
  | { type: "UPDATE_CONSENT"; field: keyof BaseConsent; value: any }
  | { type: "UPDATE_SYMPTOMS"; field: string; value: any }
  | { type: "UPDATE_FEVER_PAIN"; field: string; value: any }
  | { type: "UPDATE_EXAMINATION"; field: string; value: any }
  | { type: "UPDATE_HISTORY"; field: string; value: any }
  | { type: "UPDATE_MEDICINE"; field: string; value: any }
  | { type: "UPDATE_COUNSELLING"; field: string; value: any }
  | { type: "UPDATE_SUMMARY"; field: keyof BaseSummary; value: any };

function stateReducer(state: SoreThroatState, action: Action): SoreThroatState {
  switch (action.type) {
    case "UPDATE_PATIENT":
      return {
        ...state,
        patient: { ...state.patient, [action.field]: action.value },
      };
    case "UPDATE_CONSENT":
      return {
        ...state,
        consent: { ...state.consent, [action.field]: action.value },
      };
    case "UPDATE_SYMPTOMS":
      return {
        ...state,
        symptoms: { ...state.symptoms, [action.field]: action.value },
      };
    case "UPDATE_FEVER_PAIN":
      return {
        ...state,
        feverPainScore: { ...state.feverPainScore, [action.field]: action.value },
      };
    case "UPDATE_EXAMINATION":
      return {
        ...state,
        examination: { ...state.examination, [action.field]: action.value },
      };
    case "UPDATE_HISTORY":
      return {
        ...state,
        history: { ...state.history, [action.field]: action.value },
      };
    case "UPDATE_MEDICINE":
      return {
        ...state,
        medicine: { ...state.medicine, [action.field]: action.value },
      };
    case "UPDATE_COUNSELLING":
      return {
        ...state,
        counselling: { ...state.counselling, [action.field]: action.value },
      };
    case "UPDATE_SUMMARY":
      return {
        ...state,
        summary: { ...state.summary, [action.field]: action.value },
      };
    default:
      return state;
  }
}

interface SoreThroatToolClientProps {
  currentStep: number;
  onStepChange: (step: number) => void;
}

export function SoreThroatToolClient({
  currentStep,
  onStepChange,
}: SoreThroatToolClientProps) {
  const [state, dispatch] = useReducer(stateReducer, {
    patient: { ...initialPatientDetails },
    consent: { ...initialConsent },
    symptoms: { ...initialSoreThroatSymptoms },
    feverPainScore: { ...initialFeverPAINScore },
    examination: { ...initialSoreThroatExamination },
    history: { ...initialSoreThroatHistory },
    medicine: { ...initialSoreThroatMedicine },
    counselling: { ...initialSoreThroatCounselling },
    summary: initialSummary(),
  });

  // Calculate age whenever DOB changes
  const age = useMemo(() => {
    return calculateAge(state.patient.dateOfBirth);
  }, [state.patient.dateOfBirth]);

  // Update patient age
  const patientWithAge = useMemo(() => {
    return { ...state.patient, age };
  }, [state.patient, age]);

  // Generate alerts
  const exclusionAlerts = useMemo(() => {
    return generateExclusionAlerts(age, state.symptoms, state.history);
  }, [age, state.symptoms, state.history]);

  const cautionAlerts = useMemo(() => {
    return generateCautionAlerts(state.symptoms, state.history, state.examination);
  }, [state.symptoms, state.history, state.examination]);

  const allAlerts = useMemo(() => {
    return [...exclusionAlerts, ...cautionAlerts];
  }, [exclusionAlerts, cautionAlerts]);

  const isBlocked = useMemo(() => {
    return exclusionAlerts.length > 0;
  }, [exclusionAlerts]);

  // Calculate FeverPAIN score
  const updatedFeverPain = useMemo(() => {
    const score = calculateFeverPAINScore(
      state.feverPainScore.fever,
      state.feverPainScore.purulence,
      state.feverPainScore.attendRapidly,
      state.feverPainScore.inflamedTonsils,
      state.feverPainScore.noCoughCoryza
    );
    return { ...state.feverPainScore, totalScore: score };
  }, [state.feverPainScore]);

  // Get FeverPAIN interpretation
  const feverPainInterpretation = useMemo(() => {
    return interpretFeverPAINScore(
      updatedFeverPain.totalScore,
      state.examination.rapidStrepAResult
    );
  }, [updatedFeverPain.totalScore, state.examination.rapidStrepAResult]);

  // Get medicine recommendation
  const medicineRecommendation = useMemo(() => {
    return recommendMedicine(
      updatedFeverPain.totalScore,
      state.examination.rapidStrepAResult,
      age,
      state.history.penicillinAllergy,
      state.history.rheumaticFeverHistory
    );
  }, [updatedFeverPain.totalScore, state.examination.rapidStrepAResult, age, state.history]);

  // Validation errors
  const validationErrors: Record<number, string | null> = useMemo(() => {
    return {
      0: validatePatientStep(patientWithAge, { minAge: 5 }),
      1: validateConsentStep(state.consent),
      2: validateSymptomStep(state.symptoms),
      3: validateFeverPAINStep(updatedFeverPain),
      4: validateExaminationStep(state.examination),
      5: validateHistoryStep(state.history),
      6: validateMedicineStep(state.medicine),
      7: validateCounsellingStep(state.counselling),
      8: validateSummaryStep(state.summary),
    };
  }, [
    patientWithAge,
    state.consent,
    state.symptoms,
    updatedFeverPain,
    state.examination,
    state.history,
    state.medicine,
    state.counselling,
    state.summary,
  ]);

  const completedSteps = useMemo(() => {
    const completed = new Set<number>();
    for (let i = 0; i < STEP_LABELS.length; i++) {
      if (validationErrors[i] === null) {
        completed.add(i);
      }
    }
    return completed;
  }, [validationErrors]);

  const canProceed = validationErrors[currentStep] === null;

  const handleNext = () => {
    if (canProceed && currentStep < STEP_LABELS.length - 1) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    if (completedSteps.has(step) || step <= currentStep) {
      onStepChange(step);
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
      outcome: isBlocked ? "not_supplied" : "completed",
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    };
  }, [state, isBlocked]);

  // ─── Render Step Content ───

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <AlertBanner alerts={allAlerts} />
            <PatientDetailsStep
              patient={patientWithAge}
              onChange={(field, value) => {
                dispatch({ type: "UPDATE_PATIENT", field, value });
              }}
            />
          </>
        );

      case 1:
        return (
          <>
            <AlertBanner alerts={allAlerts} />
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) => {
                dispatch({ type: "UPDATE_CONSENT", field, value });
              }}
            />
          </>
        );

      case 2:
        // Symptom Assessment
        return (
          <>
            <AlertBanner alerts={allAlerts} />
            <div className="space-y-4">
              <SelectInput
                label="Duration of symptoms"
                value={state.symptoms.duration}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SYMPTOMS",
                    field: "duration",
                    value: v,
                  })
                }
                options={[
                  { value: "<3 days", label: "Less than 3 days" },
                  { value: "3-7 days", label: "3-7 days" },
                  { value: ">7 days", label: "More than 7 days" },
                ]}
                required
              />

              <SelectInput
                label="Severity of sore throat"
                value={state.symptoms.soreThroatSeverity}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SYMPTOMS",
                    field: "soreThroatSeverity",
                    value: v,
                  })
                }
                options={[
                  { value: "mild", label: "Mild" },
                  { value: "moderate", label: "Moderate" },
                  { value: "severe", label: "Severe" },
                ]}
                required
              />

              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm font-medium text-navy-900 mb-3">
                  Associated symptoms
                </p>
                <div className="space-y-3">
                  <Checkbox
                    label="Difficulty swallowing (dysphagia)"
                    checked={state.symptoms.dysphagia}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_SYMPTOMS",
                        field: "dysphagia",
                        value: v,
                      })
                    }
                  />

                  <Checkbox
                    label="Drooling"
                    checked={state.symptoms.drooling}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_SYMPTOMS",
                        field: "drooling",
                        value: v,
                      })
                    }
                  />

                  <Checkbox
                    label="Difficulty opening mouth (trismus)"
                    checked={state.symptoms.trismus}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_SYMPTOMS",
                        field: "trismus",
                        value: v,
                      })
                    }
                  />

                  <Checkbox
                    label="Muffled voice (hot potato voice)"
                    checked={state.symptoms.muffledVoice}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_SYMPTOMS",
                        field: "muffledVoice",
                        value: v,
                      })
                    }
                  />

                  <Checkbox
                    label="Unilateral swelling"
                    checked={state.symptoms.unilateralSwelling}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_SYMPTOMS",
                        field: "unilateralSwelling",
                        value: v,
                      })
                    }
                  />
                </div>
              </div>

              <TextArea
                label="Additional symptom notes (optional)"
                value={state.symptoms.additionalNotes}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_SYMPTOMS",
                    field: "additionalNotes",
                    value: v,
                  })
                }
                placeholder="Any other relevant symptoms or observations..."
                rows={3}
              />
            </div>
          </>
        );

      case 3:
        // FeverPAIN Score
        return (
          <>
            <AlertBanner alerts={allAlerts} />
            <FeverPAINScore
              fever={state.feverPainScore.fever}
              purulence={state.feverPainScore.purulence}
              attendRapidly={state.feverPainScore.attendRapidly}
              inflamedTonsils={state.feverPainScore.inflamedTonsils}
              noCoughCoryza={state.feverPainScore.noCoughCoryza}
              onFeverChange={(v) =>
                dispatch({
                  type: "UPDATE_FEVER_PAIN",
                  field: "fever",
                  value: v,
                })
              }
              onPurulenceChange={(v) =>
                dispatch({
                  type: "UPDATE_FEVER_PAIN",
                  field: "purulence",
                  value: v,
                })
              }
              onAttendRapidlyChange={(v) =>
                dispatch({
                  type: "UPDATE_FEVER_PAIN",
                  field: "attendRapidly",
                  value: v,
                })
              }
              onInflamedTonselsChange={(v) =>
                dispatch({
                  type: "UPDATE_FEVER_PAIN",
                  field: "inflamedTonsils",
                  value: v,
                })
              }
              onNoCoughCorynaChange={(v) =>
                dispatch({
                  type: "UPDATE_FEVER_PAIN",
                  field: "noCoughCoryza",
                  value: v,
                })
              }
            />
          </>
        );

      case 4:
        // Examination & Test Results
        return (
          <>
            <AlertBanner alerts={allAlerts} />
            <div className="space-y-4">
              <SelectInput
                label="Rapid Strep A test result"
                value={state.examination.rapidStrepAResult}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_EXAMINATION",
                    field: "rapidStrepAResult",
                    value: v,
                  })
                }
                options={[
                  { value: "positive", label: "Positive" },
                  { value: "negative", label: "Negative" },
                  { value: "not-performed", label: "Not performed" },
                ]}
                required
              />

              <SelectInput
                label="Tonsillar appearance"
                value={state.examination.tonsillarAppearance}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_EXAMINATION",
                    field: "tonsillarAppearance",
                    value: v,
                  })
                }
                options={[
                  { value: "normal", label: "Normal" },
                  { value: "erythematous", label: "Erythematous (red)" },
                  { value: "exudate", label: "Exudate (white/yellow coating)" },
                  { value: "abscess", label: "Abscess" },
                ]}
                required
              />

              <Checkbox
                label="Cervical lymphadenopathy"
                checked={state.examination.cervicalLymphadenopathy}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_EXAMINATION",
                    field: "cervicalLymphadenopathy",
                    value: v,
                  })
                }
                description="Swollen lymph nodes in the neck"
              />

              <NumberInput
                label="Temperature"
                value={state.examination.temperature}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_EXAMINATION",
                    field: "temperature",
                    value: v,
                  })
                }
                unit="°C"
                placeholder="37.5"
                min={35}
                max={42}
              />
            </div>
          </>
        );

      case 5:
        // Medical History & Contraindications
        return (
          <>
            <AlertBanner alerts={allAlerts} />
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-700">
                  <span className="font-semibold">Important:</span> Screen for
                  contraindications and relevant medical history.
                </p>
              </div>

              <Checkbox
                label="Penicillin allergy"
                checked={state.history.penicillinAllergy}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_HISTORY",
                    field: "penicillinAllergy",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="Immunosuppressed"
                checked={state.history.immunosuppressed}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_HISTORY",
                    field: "immunosuppressed",
                    value: v,
                  })
                }
                description="On immunosuppressive treatment (e.g., chemotherapy, biologics)"
              />

              <Checkbox
                label="Recurrent tonsillitis"
                checked={state.history.recurrentTonsillitis}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_HISTORY",
                    field: "recurrentTonsillitis",
                    value: v,
                  })
                }
                description="7 or more episodes per year"
              />

              <Checkbox
                label="History of quinsy (peritonsillar abscess)"
                checked={state.history.previousQuinsy}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_HISTORY",
                    field: "previousQuinsy",
                    value: v,
                  })
                }
              />

              <Checkbox
                label="History of acute rheumatic fever"
                checked={state.history.rheumaticFeverHistory}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_HISTORY",
                    field: "rheumaticFeverHistory",
                    value: v,
                  })
                }
              />

              <TextArea
                label="Current medications (optional)"
                value={state.history.currentMedications}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_HISTORY",
                    field: "currentMedications",
                    value: v,
                  })
                }
                placeholder="List any relevant medications..."
                rows={2}
              />

              <TextArea
                label="Known allergies (optional)"
                value={state.history.allergies}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_HISTORY",
                    field: "allergies",
                    value: v,
                  })
                }
                placeholder="List any drug or other allergies..."
                rows={2}
              />
            </div>
          </>
        );

      case 6:
        // Medicine Selection
        return (
          <>
            <AlertBanner alerts={allAlerts} />
            <div className="space-y-4">
              <div className={`border rounded-lg p-4 ${
                feverPainInterpretation.riskLevel === "very-low"
                  ? "bg-green-50 border-green-200"
                  : feverPainInterpretation.riskLevel === "moderate"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-red-50 border-red-200"
              }`}>
                <p className="text-sm font-semibold">
                  {feverPainInterpretation.label}
                </p>
                <p className="text-xs mt-1 text-gray-600">
                  {feverPainInterpretation.recommendation}
                </p>
              </div>

              {medicineRecommendation.shouldPrescribe ? (
                <div className="space-y-4">
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                    <p className="text-xs text-teal-700">
                      <span className="font-semibold">Recommendation:</span>{" "}
                      {medicineRecommendation.recommendation}
                    </p>
                  </div>

                  <SelectInput
                    label="Medicine"
                    value={state.medicine.medicine}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_MEDICINE",
                        field: "medicine",
                        value: v,
                      })
                    }
                    options={[
                      {
                        value: "phenoxymethylpenicillin",
                        label: "Phenoxymethylpenicillin (Pen V)",
                      },
                      { value: "clarithromycin", label: "Clarithromycin" },
                    ]}
                    required
                  />

                  <TextInput
                    label="Dose"
                    value={state.medicine.dose}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_MEDICINE",
                        field: "dose",
                        value: v,
                      })
                    }
                    placeholder={medicineRecommendation.dose}
                    required
                  />

                  <TextInput
                    label="Frequency"
                    value={state.medicine.frequency}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_MEDICINE",
                        field: "frequency",
                        value: v,
                      })
                    }
                    placeholder={medicineRecommendation.frequency}
                    required
                  />

                  <TextInput
                    label="Duration"
                    value={state.medicine.duration}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_MEDICINE",
                        field: "duration",
                        value: v,
                      })
                    }
                    placeholder={medicineRecommendation.duration}
                    required
                  />

                  <NumberInput
                    label="Quantity"
                    value={state.medicine.quantity}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_MEDICINE",
                        field: "quantity",
                        value: v,
                      })
                    }
                    placeholder="e.g., 20"
                  />

                  <Checkbox
                    label="Back-up/delayed antibiotic prescription"
                    checked={state.medicine.backupPrescription}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_MEDICINE",
                        field: "backupPrescription",
                        value: v,
                      })
                    }
                    description="Prescription to be used only if symptoms worsen or do not improve within 3-5 days"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-green-700">
                      No antibiotic recommended
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Recommend self-care management and monitor symptoms.
                    </p>
                  </div>

                  <SelectInput
                    label="Medicine"
                    value={state.medicine.medicine}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_MEDICINE",
                        field: "medicine",
                        value: v,
                      })
                    }
                    options={[
                      { value: "none", label: "No antibiotic" },
                      {
                        value: "phenoxymethylpenicillin",
                        label: "Phenoxymethylpenicillin (override)",
                      },
                      { value: "clarithromycin", label: "Clarithromycin (override)" },
                    ]}
                    required
                  />

                  {state.medicine.medicine !== "none" && (
                    <>
                      <TextInput
                        label="Dose"
                        value={state.medicine.dose}
                        onChange={(v) =>
                          dispatch({
                            type: "UPDATE_MEDICINE",
                            field: "dose",
                            value: v,
                          })
                        }
                        required
                      />

                      <TextInput
                        label="Frequency"
                        value={state.medicine.frequency}
                        onChange={(v) =>
                          dispatch({
                            type: "UPDATE_MEDICINE",
                            field: "frequency",
                            value: v,
                          })
                        }
                        required
                      />

                      <TextInput
                        label="Duration"
                        value={state.medicine.duration}
                        onChange={(v) =>
                          dispatch({
                            type: "UPDATE_MEDICINE",
                            field: "duration",
                            value: v,
                          })
                        }
                        required
                      />

                      <NumberInput
                        label="Quantity"
                        value={state.medicine.quantity}
                        onChange={(v) =>
                          dispatch({
                            type: "UPDATE_MEDICINE",
                            field: "quantity",
                            value: v,
                          })
                        }
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        );

      case 7:
        // Counselling
        return (
          <>
            <AlertBanner alerts={allAlerts} />
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-700">
                  <span className="font-semibold">Counselling:</span> Confirm all
                  relevant advice has been given to the patient.
                </p>
              </div>

              <div className="space-y-3">
                <Checkbox
                  label="Importance of completing the full course of antibiotics"
                  checked={state.counselling.completeCourse}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_COUNSELLING",
                      field: "completeCourse",
                      value: v,
                    })
                  }
                />

                <Checkbox
                  label="Pain relief options (paracetamol/ibuprofen)"
                  checked={state.counselling.painRelief}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_COUNSELLING",
                      field: "painRelief",
                      value: v,
                    })
                  }
                />

                <Checkbox
                  label="Importance of maintaining fluid intake"
                  checked={state.counselling.fluidIntake}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_COUNSELLING",
                      field: "fluidIntake",
                      value: v,
                    })
                  }
                />

                <Checkbox
                  label="Soft foods and adequate nutrition"
                  checked={state.counselling.softFoods}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_COUNSELLING",
                      field: "softFoods",
                      value: v,
                    })
                  }
                />

                <Checkbox
                  label="Return if symptoms worsen or no improvement in 3-5 days"
                  checked={state.counselling.returnIfWorsening}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_COUNSELLING",
                      field: "returnIfWorsening",
                      value: v,
                    })
                  }
                />

                <Checkbox
                  label="Red flag symptoms (difficulty breathing, unable to swallow)"
                  checked={state.counselling.redFlagSymptoms}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_COUNSELLING",
                      field: "redFlagSymptoms",
                      value: v,
                    })
                  }
                />

                <Checkbox
                  label="Avoid sharing antibiotics with others"
                  checked={state.counselling.avoidAntibioticSharing}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_COUNSELLING",
                      field: "avoidAntibioticSharing",
                      value: v,
                    })
                  }
                />

                <Checkbox
                  label="When safe to return to school/work"
                  checked={state.counselling.schoolWorkAdvice}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_COUNSELLING",
                      field: "schoolWorkAdvice",
                      value: v,
                    })
                  }
                />
              </div>
            </div>
          </>
        );

      case 8:
        // Summary & Print
        return (
          <SoreThroatSummaryReport
            patient={patientWithAge}
            consent={state.consent}
            symptoms={state.symptoms}
            feverPainScore={updatedFeverPain}
            examination={state.examination}
            history={state.history}
            medicine={state.medicine}
            counselling={state.counselling}
            summary={state.summary}
            alerts={allAlerts}
            onSummaryChange={(field, value) => {
              dispatch({ type: "UPDATE_SUMMARY", field, value });
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <ProgressBar
        stepLabels={STEP_LABELS}
        currentStep={currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
        hasErrors={validationErrors[currentStep] !== null || isBlocked}
      />

      <StepWrapper
        title={STEP_LABELS[currentStep]}
        currentStep={currentStep}
        totalSteps={STEP_LABELS.length}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={canProceed}
        validationError={validationErrors[currentStep]}
        isBlocked={isBlocked && currentStep !== 0}
       getConsultationData={getConsultationData}>
        {renderStepContent()}
      </StepWrapper>
    </div>
  );
}
