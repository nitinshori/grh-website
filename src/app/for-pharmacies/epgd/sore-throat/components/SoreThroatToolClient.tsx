"use client";

import { useReducer, useMemo, useCallback, useEffect, useState } from "react";
import { usePharmacistProfile } from "../../shared/hooks/usePharmacistProfile";
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
  expectedQuantity,
  PEN_V_DURATIONS,
  CLARI_DURATIONS,
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

function createInitialState(): SoreThroatState {
  return {
    patient: { ...initialPatientDetails },
    consent: { ...initialConsent },
    symptoms: { ...initialSoreThroatSymptoms },
    feverPainScore: { ...initialFeverPAINScore },
    examination: { ...initialSoreThroatExamination },
    history: { ...initialSoreThroatHistory },
    medicine: { ...initialSoreThroatMedicine },
    counselling: { ...initialSoreThroatCounselling },
    summary: initialSummary(),
  };
}

type Action =
  | { type: "SET_STEP"; step: number }
  | { type: "RESET" }
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
    case "RESET":
      // Fresh objects every time: nothing from the previous patient survives.
      return createInitialState();
    case "UPDATE_PATIENT":
      return {
        ...state,
        patient: {
          ...state.patient,
          [action.field]: action.value,
          ...(action.field === "dateOfBirth" ? { age: calculateAge(String(action.value ?? "")) } : {}),
        },
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
  const [state, dispatch] = useReducer(stateReducer, undefined, createInitialState);
  // Steps actually passed by pressing Next (not "every step whose validator
  // happens to be null", which made Summary clickable from step 0).
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

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
    return generateExclusionAlerts(age, state.symptoms, state.history, state.examination);
  }, [age, state.symptoms, state.history, state.examination]);

  const cautionAlerts = useMemo(() => {
    return generateCautionAlerts(state.symptoms, state.history, state.examination);
  }, [state.symptoms, state.history, state.examination]);

  const allAlerts = useMemo(() => {
    return [...exclusionAlerts, ...cautionAlerts];
  }, [exclusionAlerts, cautionAlerts]);

  const isBlocked = useMemo(() => {
    return exclusionAlerts.length > 0;
  }, [exclusionAlerts]);

  // Calculate FeverPAIN score. "Attend rapidly" is derived from the recorded
  // duration and "fever" is forced on by a measured temperature of 38 or
  // above, so the score cannot contradict the facts recorded beside it.
  const updatedFeverPain = useMemo(() => {
    const attendRapidly = state.symptoms.duration === "<3 days";
    const fever =
      state.feverPainScore.fever ||
      (state.examination.temperature !== null && state.examination.temperature >= 38);
    const score = calculateFeverPAINScore(
      fever,
      state.feverPainScore.purulence,
      attendRapidly,
      state.feverPainScore.inflamedTonsils,
      state.feverPainScore.noCoughCoryza
    );
    return { ...state.feverPainScore, fever, attendRapidly, totalScore: score };
  }, [state.feverPainScore, state.symptoms.duration, state.examination.temperature]);

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
      state.history.penicillinAllergy === "yes",
      state.history.rheumaticFeverHistory
    );
  }, [updatedFeverPain.totalScore, state.examination.rapidStrepAResult, age, state.history]);

  // Validation errors
  const validationErrors: Record<number, string | null> = useMemo(() => {
    const perStep = {
      0: validatePatientStep(patientWithAge, { minAge: 18 }),
      1: validateConsentStep(state.consent),
      2: validateSymptomStep(state.symptoms),
      3: validateFeverPAINStep(updatedFeverPain),
      4: validateExaminationStep(state.examination),
      5: validateHistoryStep(state.history),
      6: validateMedicineStep(state.medicine, {
        shouldPrescribe: medicineRecommendation.shouldPrescribe,
        penicillinAllergy: state.history.penicillinAllergy === "yes",
      }),
      7: validateCounsellingStep(state.counselling, {
        medicine: state.medicine.medicine,
        oralContraceptive: state.history.oralContraceptive,
      }),
    };
    // Save & Print on the last step runs every validator again, so an
    // answer changed on an earlier step (a new allergy, a different
    // medicine) is never printed without the medicine check running.
    const all =
      perStep[0] || perStep[1] || perStep[2] || perStep[3] || perStep[4] || perStep[5] || perStep[6] || perStep[7] || validateSummaryStep(state.summary);
    return { ...perStep, 8: all };
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
    medicineRecommendation.shouldPrescribe,
  ]);

  const canProceed = validationErrors[currentStep] === null && !isBlocked;

  const handleNext = () => {
    if (canProceed && currentStep < STEP_LABELS.length - 1) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      onStepChange(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCompletedSteps((prev) => new Set([...prev].filter((s) => s < currentStep - 1)));
      onStepChange(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    // Backwards only; every later step is forgotten so an edited answer has
    // to pass Next (and its validator) again.
    if (step <= currentStep) {
      setCompletedSteps((prev) => new Set([...prev].filter((s) => s < step)));
      onStepChange(step);
    }
  };

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
    onStepChange(0);
  }, [onStepChange]);

  // ─── Consultation Record Data (for saving to database) ───
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    const m = state.medicine;
    const supplied = !isBlocked && m.medicine !== "" && m.medicine !== "none";
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
      clinicalData: { ...state, patient: patientWithAge, feverPainScore: updatedFeverPain, alerts: allAlerts } as unknown as Record<string, unknown>,
      outcome: isBlocked ? "referred" : m.medicine === "none" ? "not_supplied" : "completed",
      medicine: supplied
        ? {
            name: m.medicine === "phenoxymethylpenicillin" ? "Phenoxymethylpenicillin 500mg tablets" : "Clarithromycin 250mg tablets",
            dose: `${m.dose} ${m.frequency}`.trim(),
            duration: m.duration,
            quantity: m.quantity,
          }
        : undefined,
      summary: {
        pharmacistName: state.summary.pharmacistName || __pharmProfile?.name || "",
        pharmacistGPhC: state.summary.pharmacistGPhC || __pharmProfile?.gphcNumber || "",
        pharmacyName: state.summary.pharmacyName || __pharmProfile?.pharmacyName,
        pharmacyAddress: state.summary.pharmacyAddress || __pharmProfile?.pharmacyAddress,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
      consent: { notifyGp: !!state.consent.notifyGp },
    };
  }, [state, isBlocked, patientWithAge, updatedFeverPain, allAlerts, __pharmProfile]);

  // Shown on every clinical step where a stop exists: the advice given and
  // the decision reached (document record item), then "Save as not supplied".
  const exclusionBox = isBlocked ? (
    <div className="p-4 bg-red-50 rounded-lg border border-red-200 space-y-2 mb-4">
      <p className="text-sm font-medium text-navy-900">Excluded: record the advice given and the decision reached, then use Save as not supplied</p>
      <p className="text-xs text-gray-700">Advise on alternative treatment options and how these can be accessed. Inform or refer to the GP as appropriate.</p>
      <TextArea
        label="Advice given and decision reached"
        value={state.counselling.exclusionAdvice}
        onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "exclusionAdvice", value: v })}
        rows={3}
        placeholder="e.g. emergency referral to A&E for suspected quinsy; GP informed"
      />
    </div>
  ) : null;

  // Antibiotic counselling items only apply where an antibiotic is supplied.
  const antibioticSupplied =
    !isBlocked && state.medicine.medicine !== "" && state.medicine.medicine !== "none";

  // ─── Render Step Content ───

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <AlertBanner alerts={allAlerts} />
            {exclusionBox}
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
            {exclusionBox}
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
            {exclusionBox}
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
                  { value: "<3 days", label: "Less than 3 days (scores the FeverPAIN 'attend rapidly' point)" },
                  { value: "3-7 days", label: "3-7 days" },
                  { value: "8-14 days", label: "8-14 days" },
                  { value: ">14 days", label: "More than 2 weeks (excluded: refer to GP)" },
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
                    label="Unilateral peritonsillar swelling"
                    checked={state.symptoms.unilateralSwelling}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_SYMPTOMS",
                        field: "unilateralSwelling",
                        value: v,
                      })
                    }
                  />

                  <Checkbox
                    label="Stridor"
                    checked={state.symptoms.stridor}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_SYMPTOMS",
                        field: "stridor",
                        value: v,
                      })
                    }
                  />

                  <Checkbox
                    label="Difficulty breathing"
                    checked={state.symptoms.difficultyBreathing}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_SYMPTOMS",
                        field: "difficultyBreathing",
                        value: v,
                      })
                    }
                  />

                  <Checkbox
                    label="Inability to swallow saliva"
                    checked={state.symptoms.unableToSwallowSaliva}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_SYMPTOMS",
                        field: "unableToSwallowSaliva",
                        value: v,
                      })
                    }
                  />

                  <Checkbox
                    label="Deviation of the uvula"
                    checked={state.symptoms.uvulaDeviation}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_SYMPTOMS",
                        field: "uvulaDeviation",
                        value: v,
                      })
                    }
                  />
                </div>
                <p className="text-xs text-red-700 mt-2">
                  Any of drooling, trismus, muffled voice, unilateral peritonsillar swelling, stridor,
                  difficulty breathing, inability to swallow saliva or deviation of the uvula
                  (suspected quinsy or epiglottitis) is an exclusion: emergency referral, 999 or A&E.
                  Do not examine the throat with a tongue depressor where epiglottitis is possible.
                </p>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <Checkbox
                  label="Persistent unilateral neck lump, unilateral tonsillar enlargement or hoarseness for more than 3 weeks"
                  checked={state.symptoms.persistentNeckLumpOrHoarseness}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_SYMPTOMS",
                      field: "persistentNeckLumpOrHoarseness",
                      value: v,
                    })
                  }
                  description="Exclusion: refer to the GP (possible malignancy pathway)"
                />
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
            {exclusionBox}
            <FeverPAINScore
              fever={updatedFeverPain.fever}
              purulence={state.feverPainScore.purulence}
              attendRapidly={updatedFeverPain.attendRapidly}
              inflamedTonsils={state.feverPainScore.inflamedTonsils}
              noCoughCoryza={state.feverPainScore.noCoughCoryza}
              attendRapidlyLocked
              attendRapidlyNote={
                state.symptoms.duration
                  ? `Derived from the duration recorded on the Symptom Assessment step (${state.symptoms.duration})`
                  : "Derived from the duration recorded on the Symptom Assessment step"
              }
              feverLocked={state.examination.temperature !== null && state.examination.temperature >= 38}
              feverNote={
                state.examination.temperature !== null && state.examination.temperature >= 38
                  ? `Measured temperature ${state.examination.temperature} C on the Examination step`
                  : "Temperature above 38 C in the last 24 hours (reported); a measured temperature of 38 or above sets this automatically"
              }
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
            {exclusionBox}
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
                required
              />

              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm font-medium text-navy-900 mb-1">
                  Sepsis and systemic illness screen
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Temperature 38°C or above together with any of the following is an exclusion:
                  emergency referral. Heart rate, respiratory rate and systolic BP must all be
                  measured and recorded before Next.
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <NumberInput
                    label="Heart rate"
                    value={state.examination.heartRate}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_EXAMINATION",
                        field: "heartRate",
                        value: v,
                      })
                    }
                    unit="bpm"
                    placeholder="e.g. 80"
                    required
                    min={20}
                    max={250}
                  />
                  <NumberInput
                    label="Respiratory rate"
                    value={state.examination.respiratoryRate}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_EXAMINATION",
                        field: "respiratoryRate",
                        value: v,
                      })
                    }
                    unit="/min"
                    placeholder="e.g. 16"
                    required
                    min={4}
                    max={80}
                  />
                  <NumberInput
                    label="Systolic BP"
                    value={state.examination.systolicBP}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_EXAMINATION",
                        field: "systolicBP",
                        value: v,
                      })
                    }
                    unit="mmHg"
                    placeholder="e.g. 120"
                    required
                    min={40}
                    max={260}
                  />
                </div>
                <div className="space-y-2 mt-3">
                  <Checkbox
                    label="New confusion"
                    checked={state.examination.newConfusion}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_EXAMINATION",
                        field: "newConfusion",
                        value: v,
                      })
                    }
                  />
                  <Checkbox
                    label="Patient looks unwell"
                    checked={state.examination.looksUnwell}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_EXAMINATION",
                        field: "looksUnwell",
                        value: v,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </>
        );

      case 5:
        // Medical History & Contraindications
        return (
          <>
            <AlertBanner alerts={allAlerts} />
            {exclusionBox}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-700">
                  <span className="font-semibold">Important:</span> Screen for
                  contraindications and relevant medical history.
                </p>
              </div>

              <Checkbox
                label="Able to take oral medication"
                checked={state.history.ableToTakeOralMedication}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_HISTORY",
                    field: "ableToTakeOralMedication",
                    value: v,
                  })
                }
                description="Inclusion criterion: required"
                required
              />

              <Checkbox
                label="Recent antibiotic use for this illness"
                checked={state.history.recentAntibioticForThisIllness}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_HISTORY",
                    field: "recentAntibioticForThisIllness",
                    value: v,
                  })
                }
                description="Exclusion: the PGD requires no recent antibiotic use for this illness"
              />

              <div className="space-y-1">
                <SelectInput
                  label="Penicillin or beta-lactam allergy"
                  value={state.history.penicillinAllergy}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_HISTORY",
                      field: "penicillinAllergy",
                      value: v,
                    })
                  }
                  options={[
                    { value: "no", label: "No: phenoxymethylpenicillin arm" },
                    { value: "yes", label: "Yes: phenoxymethylpenicillin excluded; clarithromycin arm applies" },
                  ]}
                  required
                />
                <p className="text-xs text-gray-500">Chooses the arm. Non-anaphylaxis history preferred for macrolide use.</p>
              </div>

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
                description="Exclusion: refer for a same-day full blood count and clinical assessment"
              />

              <Checkbox
                label="Takes a medicine that can cause neutropenia"
                checked={state.history.neutropeniaRiskMedicine}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_HISTORY",
                    field: "neutropeniaRiskMedicine",
                    value: v,
                  })
                }
                description="Chemotherapy, carbimazole, clozapine, methotrexate or other DMARDs. Exclusion: refer for a same-day full blood count and clinical assessment"
              />

              <Checkbox
                label="Severe hepatic or renal dysfunction"
                checked={state.history.severeHepaticOrRenalDysfunction}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_HISTORY",
                    field: "severeHepaticOrRenalDysfunction",
                    value: v,
                  })
                }
                description="Exclusion. Mild to moderate renal or hepatic impairment: generally safe, monitor function"
              />

              <Checkbox
                label="Pregnant or breastfeeding"
                checked={state.history.pregnantOrBreastfeeding}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_HISTORY",
                    field: "pregnantOrBreastfeeding",
                    value: v,
                  })
                }
                description="Caution: penicillin V is generally safe; clarithromycin relatively safe (small amount passes to breast milk). Ensure informed consent"
              />

              <Checkbox
                label="Possible mononucleosis (glandular fever)"
                checked={state.history.suspectedMononucleosis}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_HISTORY",
                    field: "suspectedMononucleosis",
                    value: v,
                  })
                }
                description="Phenoxymethylpenicillin is avoided (risk of rash). With no penicillin allergy this is a stop: no PGD antibiotic until the diagnosis is clarified. With a penicillin allergy the clarithromycin arm applies (caution)"
              />

              <Checkbox
                label="Uses oral contraception"
                checked={state.history.oralContraceptive}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_HISTORY",
                    field: "oralContraceptive",
                    value: v,
                  })
                }
                description="Caution: advise additional contraception during the course and for 7 days afterwards"
              />

              {state.history.penicillinAllergy === "yes" && (
                <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-amber-800">
                    Clarithromycin arm: exclusions and cautions (check every current medicine
                    against the clarithromycin SmPC before supply)
                  </p>
                  <Checkbox
                    label="Known hypersensitivity to macrolides"
                    checked={state.history.macrolideAllergy}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_HISTORY",
                        field: "macrolideAllergy",
                        value: v,
                      })
                    }
                    description="Clarithromycin, erythromycin, azithromycin. Exclusion"
                  />
                  <Checkbox
                    label="Concurrent ergotamine or dihydroergotamine"
                    checked={state.history.ergotamineUse}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_HISTORY",
                        field: "ergotamineUse",
                        value: v,
                      })
                    }
                    description="Risk of ergot toxicity. Exclusion"
                  />
                  <Checkbox
                    label="Concurrent simvastatin or lovastatin"
                    checked={state.history.simvastatinLovastatinUse}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_HISTORY",
                        field: "simvastatinLovastatinUse",
                        value: v,
                      })
                    }
                    description="Increased statin levels. Exclusion"
                  />
                  <Checkbox
                    label="QT prolongation or risk factors"
                    checked={state.history.qtProlongationRisk}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_HISTORY",
                        field: "qtProlongationRisk",
                        value: v,
                      })
                    }
                    description="Hypokalaemia, hypomagnesaemia, cardiac arrhythmia history. Exclusion"
                  />
                  {!state.history.qtProlongationRisk && (
                    <Checkbox
                      label="Baseline QT risk assessed: no cardiac history, no known electrolyte disturbance, no other QT-prolonging medicine"
                      checked={state.history.qtBaselineRiskAssessed}
                      onChange={(v) =>
                        dispatch({
                          type: "UPDATE_HISTORY",
                          field: "qtBaselineRiskAssessed",
                          value: v,
                        })
                      }
                      description="Document caution for clarithromycin: QT interval risk, assess baseline risk; avoid in high-risk patients. Required before supply"
                    />
                  )}
                  <Checkbox
                    label="Concurrent colchicine, ticagrelor, ranolazine, ivabradine, domperidone, pimozide, astemizole, cisapride, terfenadine, oral midazolam or lomitapide"
                    checked={state.history.clarithromycinInteractingMedicine}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_HISTORY",
                        field: "clarithromycinInteractingMedicine",
                        value: v,
                      })
                    }
                    description="SmPC contraindications. Exclusion"
                  />
                  <Checkbox
                    label="Severe hepatic impairment, or severe hepatic failure with renal impairment"
                    checked={state.history.severeHepaticImpairment}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_HISTORY",
                        field: "severeHepaticImpairment",
                        value: v,
                      })
                    }
                    description="Exclusion. Mild to moderate hepatic impairment: use with caution"
                  />
                  <Checkbox
                    label="Myasthenia gravis"
                    checked={state.history.myastheniaGravis}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_HISTORY",
                        field: "myastheniaGravis",
                        value: v,
                      })
                    }
                    description="Macrolides can worsen muscle weakness. Exclusion"
                  />
                  <Checkbox
                    label="Renal impairment (eGFR below 30 mL/min/1.73m2)"
                    checked={state.history.renalImpairmentEgfrUnder30}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_HISTORY",
                        field: "renalImpairmentEgfrUnder30",
                        value: v,
                      })
                    }
                    description="Caution: dose adjustment or alternative needed"
                  />
                  <Checkbox
                    label="Takes warfarin or another anticoagulant"
                    checked={state.history.warfarin}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_HISTORY",
                        field: "warfarin",
                        value: v,
                      })
                    }
                    description="Caution: possible increased anticoagulant effect; monitor INR if on warfarin"
                  />
                </div>
              )}

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
                label="Known allergies (record NKDA where none)"
                value={state.history.allergies}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_HISTORY",
                    field: "allergies",
                    value: v,
                  })
                }
                placeholder="List any drug or other allergies, or NKDA"
                rows={2}
                required
              />
            </div>
          </>
        );

      case 6:
        // Medicine Selection
        return (
          <>
            <AlertBanner alerts={allAlerts} />
            {exclusionBox}
            <div className="space-y-4">
              <div className={`border rounded-lg p-4 ${
                feverPainInterpretation.riskLevel === "very-low"
                  ? "bg-green-50 border-green-200"
                  : feverPainInterpretation.riskLevel === "moderate"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-blue-50 border-blue-200"
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
                  <div className="bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30 rounded-lg p-3">
                    <p className="text-xs text-[color:var(--tenant-primary)]">
                      <span className="font-semibold">Recommendation:</span>{" "}
                      {medicineRecommendation.recommendation}
                    </p>
                  </div>

                  <SelectInput
                    label="Medicine"
                    value={state.medicine.medicine}
                    onChange={(v) => {
                      dispatch({
                        type: "UPDATE_MEDICINE",
                        field: "medicine",
                        value: v,
                      });
                      const isClari = v === "clarithromycin";
                      dispatch({
                        type: "UPDATE_MEDICINE",
                        field: "dose",
                        value: isClari ? "250 mg (one tablet)" : "500 mg (one tablet)",
                      });
                      dispatch({
                        type: "UPDATE_MEDICINE",
                        field: "frequency",
                        value: isClari
                          ? "twice daily, with or without food"
                          : "four times daily on an empty stomach (1 hour before or 2 hours after meals)",
                      });
                      const duration = "5 days";
                      dispatch({
                        type: "UPDATE_MEDICINE",
                        field: "duration",
                        value: duration,
                      });
                      dispatch({
                        type: "UPDATE_MEDICINE",
                        field: "quantity",
                        value: expectedQuantity(v as "phenoxymethylpenicillin" | "clarithromycin", duration) ?? 0,
                      });
                    }}
                    options={
                      state.history.penicillinAllergy === "yes"
                        ? [{ value: "clarithromycin", label: "Clarithromycin 250mg tablets" }]
                        : [
                            {
                              value: "phenoxymethylpenicillin",
                              label: "Phenoxymethylpenicillin 500mg tablets (Pen V)",
                            },
                          ]
                    }
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
                    disabled
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
                    disabled
                    required
                  />

                  <SelectInput
                    label="Duration"
                    value={state.medicine.duration}
                    onChange={(v) => {
                      dispatch({
                        type: "UPDATE_MEDICINE",
                        field: "duration",
                        value: v,
                      });
                      dispatch({
                        type: "UPDATE_MEDICINE",
                        field: "quantity",
                        value: expectedQuantity(state.medicine.medicine, v) ?? 0,
                      });
                    }}
                    options={(state.medicine.medicine === "clarithromycin"
                      ? CLARI_DURATIONS
                      : PEN_V_DURATIONS
                    ).map((d) => ({ value: d, label: d }))}
                    required
                  />

                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-500">Quantity (from the document: phenoxymethylpenicillin 20 tablets for the 5 day course, clarithromycin 10 tablets for the 5 day course)</p>
                    <p className="text-sm font-semibold text-navy-900">{state.medicine.quantity ? `${state.medicine.quantity} tablets` : "Select the duration"}</p>
                  </div>

                  <TextInput
                    label="Brand / manufacturer supplied"
                    value={state.medicine.brand}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_MEDICINE",
                        field: "brand",
                        value: v,
                      })
                    }
                    placeholder="Record the name and brand of the medication supplied"
                  />

                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-green-700">
                      No antibiotic under this PGD
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Antibiotics may only be supplied with FeverPAIN 4 or more, or a positive
                      rapid Strep A test (RAST). Recommend self-care management and monitor symptoms.
                      Document the advice given; inform or refer to the GP as appropriate.
                      Select &quot;No antibiotic&quot; below to confirm the outcome.
                    </p>
                  </div>

                  <SelectInput
                    label="Outcome (select No antibiotic to confirm)"
                    value={state.medicine.medicine}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_MEDICINE",
                        field: "medicine",
                        value: v,
                      })
                    }
                    options={[{ value: "none", label: "No antibiotic" }]}
                    required
                  />
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
            {exclusionBox}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-700">
                  <span className="font-semibold">Counselling:</span> Tick each item as it is
                  given. Items under &quot;Required advice&quot; must all be ticked before Next;
                  the &quot;Additional advice&quot; items are optional.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-navy-900">Required advice <span className="text-red-400">*</span></p>
                {antibioticSupplied && (
                <>
                <Checkbox
                  label="Complete the full course of antibiotics, even if symptoms improve within 2-3 days"
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
                  label={
                    state.medicine.medicine === "clarithromycin"
                      ? "Take clarithromycin with or without food; if GI upset occurs, take with food"
                      : "Take phenoxymethylpenicillin (Penicillin V) on an empty stomach (1 hour before or 2 hours after food) for best absorption"
                  }
                  checked={state.counselling.howToTake}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_COUNSELLING",
                      field: "howToTake",
                      value: v,
                    })
                  }
                />

                <Checkbox
                  label={
                    state.history.oralContraceptive
                      ? "Patient uses oral contraception: use additional contraceptive methods during the antibiotic course and for 7 days afterwards (required)"
                      : "If using oral contraception, use additional contraceptive methods during the antibiotic course and for 7 days afterwards"
                  }
                  checked={state.counselling.contraceptionAdvice}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_COUNSELLING",
                      field: "contraceptionAdvice",
                      value: v,
                    })
                  }
                />
                </>
                )}

                <Checkbox
                  label="Pain relief: paracetamol or ibuprofen as directed; a sore throat should improve within 3-5 days"
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
                  label="Stay hydrated: drink plenty of water and other fluids to help soothe the throat"
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
                  label="Seek medical advice if symptoms worsen or do not improve after 3-5 days of treatment"
                  checked={state.counselling.returnIfWorsening}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_COUNSELLING",
                      field: "returnIfWorsening",
                      value: v,
                    })
                  }
                />

                {antibioticSupplied && (
                <>
                <Checkbox
                  label="Report any allergic reactions (rash, facial swelling, breathing difficulties) immediately"
                  checked={state.counselling.allergicReactionAdvice}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_COUNSELLING",
                      field: "allergicReactionAdvice",
                      value: v,
                    })
                  }
                />

                {state.medicine.medicine === "clarithromycin" && (
                  <Checkbox
                    label="Clarithromycin: inform your doctor if you develop persistent diarrhoea during or after the course (possible C. difficile infection); a metallic taste should resolve after stopping the medication"
                    checked={state.counselling.clarithromycinAdvice}
                    onChange={(v) =>
                      dispatch({
                        type: "UPDATE_COUNSELLING",
                        field: "clarithromycinAdvice",
                        value: v,
                      })
                    }
                  />
                )}

                <Checkbox
                  label="Do not share antibiotics with others; this course is for you alone"
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
                  label="Patient information leaflet (PIL) provided with the medication supplied"
                  checked={state.counselling.pilSupplied}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_COUNSELLING",
                      field: "pilSupplied",
                      value: v,
                    })
                  }
                />
                </>
                )}

                <p className="text-sm font-semibold text-navy-900 pt-2">Additional advice (optional)</p>
                <Checkbox
                  label="Throat lozenges or warm salt water gargles for comfort (not part of medical treatment)"
                  checked={state.counselling.lozengesGargles}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_COUNSELLING",
                      field: "lozengesGargles",
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

                <TextArea
                  label="Adverse drug reactions and actions taken (report via Yellow Card, https://yellowcard.mhra.gov.uk)"
                  value={state.counselling.adverseReactions}
                  onChange={(v) =>
                    dispatch({
                      type: "UPDATE_COUNSELLING",
                      field: "adverseReactions",
                      value: v,
                    })
                  }
                  placeholder="None known at the time of supply"
                  rows={2}
                />
              </div>
            </div>
          </>
        );

      case 8:
        // Summary & Print
        return (
          <>
            <div className="print:hidden">{exclusionBox}</div>
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
              isBlocked={isBlocked}
              onSummaryChange={(field, value) => {
                dispatch({ type: "UPDATE_SUMMARY", field, value });
              }}
            />
          </>
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
        isBlocked={isBlocked}
        getConsultationData={getConsultationData}
        onNewConsultation={handleNewConsultation}
      >
        {renderStepContent()}
      </StepWrapper>
    </div>
  );
}
