"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  PEConsultationState,
  PEAction,
  PEPatientDetails,
  PEClinicalAssessment,
  PEMedicalHistory,
  PECurrentMedications,
  PEContraindications,
  PEMedicineSupply,
  PECounselling,
} from "./lib/pe-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/pe-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
} from "./lib/pe-clinical-logic";
import { validateStep } from "./lib/pe-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { PESummaryReport } from "./components/PESummaryReport";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

// ─── Reducer ───

function reducer(state: PEConsultationState, action: PEAction): PEConsultationState {
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
      break;

    case "UPDATE_MEDICAL_HISTORY":
      newState.medicalHistory = {
        ...newState.medicalHistory,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_CURRENT_MEDICATIONS":
      newState.currentMedications = {
        ...newState.currentMedications,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_CONTRAINDICATIONS":
      newState.contraindications = {
        ...newState.contraindications,
        [action.field]: action.value,
      };
      break;

    case "UPDATE_MEDICINE_SUPPLY":
      newState.medicineSupply = {
        ...newState.medicineSupply,
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

    case "RESET":
      return createInitialConsultationState();
  }

  return newState;
}

// ─── Main Client Component ───

export default function PEClient() {
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

  // ─── Computed values ───

  const alerts = useMemo(() => getAllAlerts(state), [state]);
  const hardStops = useMemo(() => hasHardStops(state), [state]);
  const doseRecommendation = useMemo(() => calculateDoseRecommendation(state), [state]);

  const validationError = useMemo(() => {
    return validateStep(state, state.currentStep);
  }, [state]);

  // A stop anywhere blocks Next and Save & Print on every step, and the last
  // step's Save applies its own validation (adversarial review, 11 Sep 2026).
  const canProceed = useMemo(() => {
    if (hardStops) return false;
    return !validationError;
  }, [validationError, hardStops]);

  // ─── Handlers ───

  const handleNext = useCallback(() => {
    if (!validationError && !hardStops && state.currentStep < TOTAL_STEPS - 1) {
      const newCompleted = new Set(completedSteps);
      newCompleted.add(state.currentStep);
      setCompletedSteps(newCompleted);
      dispatch({ type: "SET_STEP", step: state.currentStep + 1 });
    }
  }, [state.currentStep, validationError, hardStops, completedSteps]);

  const handlePrev = useCallback(() => {
    if (state.currentStep > 0) {
      dispatch({ type: "SET_STEP", step: state.currentStep - 1 });
    }
  }, [state.currentStep]);

  // Backwards only. Forward always means Next, where the stops are enforced.
  const handleStepClick = useCallback((step: number) => {
    if (step < state.currentStep) {
      dispatch({ type: "SET_STEP", step });
    }
  }, [state.currentStep]);

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
  }, []);

  // ─── Step content rendering ───


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
      clinicalData: { ...(state as unknown as Record<string, unknown>), alerts },
      outcome: hardStops ? "not_supplied" : "completed",
      medicine:
        !hardStops && state.medicineSupply.dapoxetine30mgSupplied && state.medicineSupply.strengthSupplied
          ? {
              name: "Dapoxetine",
              medicine: `Dapoxetine ${state.medicineSupply.strengthSupplied} tablets${state.medicineSupply.brand ? ` (${state.medicineSupply.brand})` : ""}`,
              dose: `${state.medicineSupply.strengthSupplied} 1 to 3 hours before sexual activity, maximum one dose in 24 hours`,
              duration: "As required, review after 4 weeks",
              quantity: state.medicineSupply.quantity ?? undefined,
            }
          : undefined,
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        pharmacyName: state.summary.pharmacyName,
        pharmacyAddress: state.summary.pharmacyAddress,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
      consent: { notifyGp: state.consent.notifyGp },
    };
  }, [state, hardStops, alerts]);

  const renderStep = () => {
    switch (state.currentStep) {
      case 0: // Patient Details
        return (
          <PatientDetailsStep
            patient={state.patient}
            onChange={(field, value) =>
              dispatch({ type: "UPDATE_PATIENT", field: field as keyof PEPatientDetails, value })
            }
            genderOption={{
              label: "Confirm patient is male",
              description: "This PGD is for male patients only.",
              checked: state.patient.maleConfirmed,
              onToggle: (v) =>
                dispatch({ type: "UPDATE_PATIENT", field: "maleConfirmed", value: v }),
            }}
          />
        );

      case 1: // Consent
        return (
          <div className="space-y-4">
            <ConsentStep
              consent={state.consent}
              onChange={(field, value) =>
                dispatch({ type: "UPDATE_CONSENT", field, value })
              }
            />
            <Checkbox
              label="Informed WRITTEN consent obtained and filed"
              checked={state.consent.writtenConsentObtained}
              onChange={(v) =>
                dispatch({ type: "UPDATE_CONSENT", field: "writtenConsentObtained", value: v })
              }
              description="PGD v005 inclusion criterion: the patient has provided informed written consent. Verbal consent alone does not meet it."
            />
          </div>
        );

      case 2: // Assessment
        return (
          <div className="space-y-4">
            <SelectInput
              label="PE type"
              value={state.clinicalAssessment.peType}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "peType",
                  value: v,
                })
              }
              options={[
                { value: "lifelong", label: "Lifelong (present since first sexual experience)" },
                {
                  value: "acquired",
                  label: "Acquired (developed after period of normal function)",
                },
              ]}
              required
            />
            <NumberInput
              label="IELT, Intravaginal Ejaculation Latency Time (minutes). Inclusion: under 2 minutes"
              value={state.clinicalAssessment.ieltMinutes}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "ieltMinutes",
                  value: v,
                })
              }
              min={0}
              placeholder="Enter time in minutes"
              required
            />
            {state.clinicalAssessment.ieltMinutes !== null && state.clinicalAssessment.ieltMinutes >= 2 && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3">
                <p className="text-sm text-amber-800">
                  PE diagnosis requires IELT &lt;2 minutes. Current value does not meet diagnostic criteria.
                </p>
              </div>
            )}
            <Checkbox
              label="Patient reports relationship distress due to PE"
              checked={state.clinicalAssessment.relationshipDistress}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "relationshipDistress",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Premature ejaculation causes significant personal distress (inclusion criterion)"
              checked={state.clinicalAssessment.psychologicalDistress}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CLINICAL_ASSESSMENT",
                  field: "psychologicalDistress",
                  value: v,
                })
              }
            />
          </div>
        );

      case 3: // Medical History
        return (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-red-700">Exclusions (PGD v005). Any one excludes; refer.</p>
            <Checkbox
              label="Significant cardiac disorder: NYHA class II to IV heart failure, or significant valvular disease"
              checked={state.medicalHistory.cardiacDisorder}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "cardiacDisorder",
                  value: v,
                })
              }
              description="Dapoxetine can reduce blood pressure"
            />
            {state.medicalHistory.cardiacDisorder && (
              <TextInput
                label="Details"
                value={state.medicalHistory.cardiacDisorderDetail}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICAL_HISTORY",
                    field: "cardiacDisorderDetail",
                    value: v,
                  })
                }
                placeholder="Type of disorder, NYHA class, treatment"
              />
            )}
            <Checkbox
              label="Conduction abnormality, or a condition that prolongs the QT interval"
              checked={state.medicalHistory.conductionOrQT}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "conductionOrQT", value: v })}
            />
            <Checkbox
              label="History of ischaemic heart disease"
              checked={state.medicalHistory.ischaemicHeartDisease}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "ischaemicHeartDisease", value: v })}
            />
            <Checkbox
              label="History of syncope (fainting) or orthostatic hypotension"
              checked={state.medicalHistory.syncope}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "syncope",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Moderate or severe hepatic impairment (Child-Pugh class B or C)"
              checked={state.medicalHistory.severeHepaticImpairment}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "severeHepaticImpairment",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Moderate or severe renal impairment"
              checked={state.medicalHistory.renalImpairment}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "renalImpairment", value: v })}
            />
            <Checkbox
              label="History of bipolar disorder or mania"
              checked={state.medicalHistory.bipolarOrMania}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "bipolarOrMania", value: v })}
            />
            <p className="text-sm font-semibold text-red-700 pt-2">Red flags needing a diagnosis before an SSRI. Any one excludes; refer.</p>
            <Checkbox
              label="Symptoms suggesting prostatitis (perineal, pelvic or genital pain, painful ejaculation, dysuria or lower urinary tract symptoms)"
              checked={state.medicalHistory.prostatitisSymptoms}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "prostatitisSymptoms", value: v })}
            />
            <Checkbox
              label="Symptoms suggesting thyroid dysfunction (weight change, heat or cold intolerance, palpitations, tremor, marked fatigue)"
              checked={state.medicalHistory.thyroidSymptoms}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "thyroidSymptoms", value: v })}
            />
            <Checkbox
              label="Symptoms suggesting a neurological cause (new numbness, weakness, or bladder or bowel symptoms)"
              checked={state.medicalHistory.neurologicalSymptoms}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "neurologicalSymptoms", value: v })}
            />
            <Checkbox
              label="Premature ejaculation of recent onset together with another new symptom"
              checked={state.medicalHistory.recentOnsetWithNewSymptom}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "recentOnsetWithNewSymptom", value: v })}
            />
            <Checkbox
              label="Uncontrolled epilepsy"
              checked={state.medicalHistory.uncontrolledEpilepsy}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "uncontrolledEpilepsy",
                  value: v,
                })
              }
            />
            <p className="text-sm font-semibold text-amber-700 pt-2">Cautions (PGD v005)</p>
            <Checkbox
              label="Mild hepatic impairment (Child-Pugh class A)"
              checked={state.medicalHistory.mildHepaticImpairment}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "mildHepaticImpairment", value: v })}
              description="Use with caution"
            />
            <Checkbox
              label="History of seizures"
              checked={state.medicalHistory.seizureHistory}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "seizureHistory", value: v })}
              description="Dapoxetine may lower the seizure threshold"
            />
            <Checkbox
              label="Bleeding disorder or concurrent anticoagulant therapy"
              checked={state.medicalHistory.bleedingDisorderOrAnticoagulant}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "bleedingDisorderOrAnticoagulant", value: v })}
              description="Increased bleeding risk"
            />
            <Checkbox
              label="Risk factors for orthostatic hypotension"
              checked={state.medicalHistory.orthostaticRiskFactors}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "orthostaticRiskFactors", value: v })}
              description="Advise to stand slowly"
            />
            <Checkbox
              label="Known or suspected CYP2D6 poor metaboliser"
              checked={state.medicalHistory.cyp2d6PoorMetaboliser}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "cyp2d6PoorMetaboliser", value: v })}
              description="May require dose adjustment"
            />
            <Checkbox
              label="Hyponatraemia, or at risk of it"
              checked={state.medicalHistory.hyponatraemiaRisk}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hyponatraemiaRisk", value: v })}
              description="Monitor sodium levels, particularly during the first 2 weeks"
            />
            <TextInput
              label="Other conditions (optional)"
              value={state.medicalHistory.otherConditions}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICAL_HISTORY",
                  field: "otherConditions",
                  value: v,
                })
              }
              placeholder="e.g. diabetes, hypertension"
            />
          </div>
        );

      case 4: // Current Medications
        return (
          <div className="space-y-4">
            <Checkbox
              label="Taking, or has taken within the last 14 days: an MAOI, SSRI, SNRI, tricyclic antidepressant, or any other serotonergic medicine (tramadol, triptans, linezolid, lithium, L-tryptophan, St John's wort)"
              checked={state.currentMedications.maoisOrSsrisOrSnris}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CURRENT_MEDICATIONS",
                  field: "maoisOrSsrisOrSnris",
                  value: v,
                })
              }
              description="Exclusion. Serotonin syndrome risk; the 14 day washout applies."
            />
            <Checkbox
              label="Taking thioridazine"
              checked={state.currentMedications.thioridazine}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CURRENT_MEDICATIONS",
                  field: "thioridazine",
                  value: v,
                })
              }
              description="Risk of QT prolongation and arrhythmias. Exclusion."
            />
            <Checkbox
              label="Taking a potent CYP3A4 inhibitor (ketoconazole, itraconazole, ritonavir, clarithromycin, etc.)"
              checked={state.currentMedications.potentCyp3a4Inhibitor}
              onChange={(v) => dispatch({ type: "UPDATE_CURRENT_MEDICATIONS", field: "potentCyp3a4Inhibitor", value: v })}
              description="Exclusion."
            />
            <Checkbox
              label="Taking a moderate CYP3A4 inhibitor (e.g. erythromycin, fluconazole, diltiazem, verapamil)"
              checked={state.currentMedications.moderateCyp3a4Inhibitor}
              onChange={(v) => dispatch({ type: "UPDATE_CURRENT_MEDICATIONS", field: "moderateCyp3a4Inhibitor", value: v })}
              description="Caution: may increase dapoxetine concentrations."
            />
            <Checkbox
              label="Taking a PDE5 inhibitor (sildenafil, tadalafil)"
              checked={state.currentMedications.pde5Inhibitor}
              onChange={(v) => dispatch({ type: "UPDATE_CURRENT_MEDICATIONS", field: "pde5Inhibitor", value: v })}
              description="Caution: increased hypotension risk."
            />
            <TextInput
              label="Other medications (optional)"
              value={state.currentMedications.otherMedications}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CURRENT_MEDICATIONS",
                  field: "otherMedications",
                  value: v,
                })
              }
              placeholder="List other current medications"
            />
          </div>
        );

      case 5: // Contraindications
        return (
          <div className="space-y-4">
            <Checkbox
              label="History of severe or sudden adverse events"
              checked={state.contraindications.hadSevereOrSuddenAE}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_CONTRAINDICATIONS",
                  field: "hadSevereOrSuddenAE",
                  value: v,
                })
              }
              description="Any previous severe reactions to medications"
            />
            {state.contraindications.hadSevereOrSuddenAE && (
              <TextInput
                label="Details"
                value={state.contraindications.aeDetail}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_CONTRAINDICATIONS",
                    field: "aeDetail",
                    value: v,
                  })
                }
                placeholder="Reaction, medication, date, management"
              />
            )}
          </div>
        );

      case 6: // Medicine Supply
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-900">
              <p className="font-semibold">Dapoxetine 30mg and 60mg tablets (Priligy). PGD v005, 11 September 2026.</p>
              <p>Starting dose 30mg orally, 1 to 3 hours before anticipated sexual activity. May be increased to 60mg if 30mg is insufficient and well tolerated. Maximum one dose per 24 hours. Not daily. Swallow whole with water, with or without food.</p>
              <p>Up to 6 tablets per supply. Review efficacy and tolerability after 4 weeks (about 6 doses); reassess every 6 months if continuing. Inadequate response after 6 doses at the recommended dose: consider referral to GP or specialist.</p>
            </div>
            <Checkbox
              label="Dapoxetine supplied under this PGD"
              checked={state.medicineSupply.dapoxetine30mgSupplied}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "dapoxetine30mgSupplied",
                  value: v,
                })
              }
              description="Starting dose 30mg"
            />
            {(state.currentMedications.moderateCyp3a4Inhibitor || state.medicalHistory.cyp2d6PoorMetaboliser) && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Moderate CYP3A4 inhibitor or CYP2D6 poor metaboliser: maximum 30mg. 60mg is not available for this patient.
              </div>
            )}
            <Checkbox
              label="30mg dose previously insufficient and well tolerated: 60mg may be supplied"
              checked={state.medicineSupply.mayIncreaseTo60mg}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "mayIncreaseTo60mg",
                  value: v,
                })
              }
              description="Only after a trial of 30mg. Not for a first supply."
            />
            <SelectInput
              label="Strength supplied"
              value={state.medicineSupply.strengthSupplied}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "strengthSupplied", value: v })}
              required
              options={
                state.currentMedications.moderateCyp3a4Inhibitor || state.medicalHistory.cyp2d6PoorMetaboliser
                  ? [{ value: "30mg", label: "Dapoxetine 30mg tablets (maximum for this patient)" }]
                  : [
                      { value: "30mg", label: "Dapoxetine 30mg tablets (starting dose)" },
                      { value: "60mg", label: "Dapoxetine 60mg tablets (30mg insufficient and well tolerated)" },
                    ]
              }
            />
            <NumberInput
              label="Quantity supplied (tablets, maximum 6 per supply)"
              value={state.medicineSupply.quantity}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "quantity", value: v })}
              min={1}
              max={6}
              unit="tablets"
              required
            />
            <TextInput
              label="Brand supplied"
              value={state.medicineSupply.brand}
              onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "brand", value: v })}
              placeholder="e.g. Priligy, or generic manufacturer"
              required
            />
            <Checkbox
              label="Patient understands usage (1 to 3 hours before, maximum once per 24 hours, swallow whole with water, not daily)"
              checked={state.medicineSupply.understandsUsage}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_MEDICINE_SUPPLY",
                  field: "understandsUsage",
                  value: v,
                })
              }
              description="PRN dosing instructions understood"
            />
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-navy-900 mb-3">
                Orthostatic Hypotension Assessment
              </h4>
              <div className="grid sm:grid-cols-2 gap-4 mb-3">
                <TextInput
                  label="Lying BP (e.g. 120/80)"
                  value={state.summary.lyingBP}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_SUMMARY", field: "lyingBP", value: v })
                  }
                  placeholder="mmHg"
                  required
                />
                <TextInput
                  label="Standing BP (e.g. 118/78)"
                  value={state.summary.standingBP}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_SUMMARY", field: "standingBP", value: v })
                  }
                  placeholder="mmHg"
                  required
                />
              </div>
              <Checkbox
                label="Orthostatic hypotension assessment completed"
                checked={state.medicineSupply.understandsOrthostatic}
                onChange={(v) =>
                  dispatch({
                    type: "UPDATE_MEDICINE_SUPPLY",
                    field: "understandsOrthostatic",
                    value: v,
                  })
                }
                description="Lying and standing BP measured before first dose"
              />
            </div>
            <Checkbox
              label="Patient information leaflet (PIL) supplied with Priligy"
              checked={state.medicineSupply.pilSupplied}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "pilSupplied", value: v })
              }
              description="Written information row of PGD v005. Required."
            />
          </div>
        );

      case 7: // Counselling
        return (
          <div className="space-y-4">
            <Checkbox
              label="Take the tablet 1 to 3 hours before sexual activity as directed, swallowed whole with water"
              checked={state.counselling.takeWithWater}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "takeWithWater",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Do not exceed one dose per 24 hour period"
              checked={state.counselling.maxOnePer24h}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "maxOnePer24h", value: v })}
            />
            <Checkbox
              label="Avoid alcohol while using it"
              checked={state.counselling.avoidAlcohol}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "avoidAlcohol",
                  value: v,
                })
              }
              description="Increases the risk of dizziness and syncope"
            />
            <Checkbox
              label="Stand up slowly from sitting or lying down, particularly after the first dose, to minimise dizziness"
              checked={state.counselling.standSlowly}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "standSlowly", value: v })}
            />
            <Checkbox
              label="Maintain adequate hydration, especially in warm weather"
              checked={state.counselling.hydration}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "hydration", value: v })}
            />
            <Checkbox
              label="Do not drive or operate machinery if experiencing dizziness or somnolence"
              checked={state.counselling.noDrive2hrs}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "noDrive2hrs",
                  value: v,
                })
              }
            />
            <Checkbox
              label="Report any chest pain, severe headache or fainting immediately to your GP"
              checked={state.counselling.reportChestPainHeadacheFainting}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "reportChestPainHeadacheFainting", value: v })}
            />
            <Checkbox
              label="An erection lasting longer than 4 hours (priapism): seek immediate medical attention"
              checked={state.counselling.priapismWarning}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "priapismWarning", value: v })}
            />
            <Checkbox
              label="Inform your GP that you are using this medicine, particularly before starting any new medicine"
              checked={state.counselling.informGp}
              onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "informGp", value: v })}
            />
            <Checkbox
              label="Avoid grapefruit juice"
              checked={state.counselling.avoidGrapefruit}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "avoidGrapefruit",
                  value: v,
                })
              }
              description="Inhibits metabolism; increases blood levels"
            />
            <Checkbox
              label="May cause headache, dizziness, nausea (very common); somnolence, insomnia, fatigue, anxiety, diarrhoea, dry mouth, erectile dysfunction, nasal congestion (common)"
              checked={state.counselling.mayHaveSideEffects}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "mayHaveSideEffects",
                  value: v,
                })
              }
              description="Common side effects; usually mild and transient"
            />
            <Checkbox
              label="Do not take on a daily basis; use only as needed before sexual activity"
              checked={state.counselling.notForDaily}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "notForDaily",
                  value: v,
                })
              }
              description="Use only when needed before sexual activity"
            />
            <Checkbox
              label="Review efficacy and tolerability after 4 weeks (about 6 doses); if no improvement after 6 doses, discuss with the pharmacist or GP for further assessment; reassess every 6 months if continuing"
              checked={state.counselling.review4weeks}
              onChange={(v) =>
                dispatch({
                  type: "UPDATE_COUNSELLING",
                  field: "review4weeks",
                  value: v,
                })
              }
              description="Follow-up consultation to assess response"
            />
          </div>
        );

      case 8: // Summary
        return (
          <div className="space-y-4">
            <TextInput
              label="Pharmacist name"
              value={state.summary.pharmacistName}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })
              }
              placeholder="John Smith"
              required
            />
            <TextInput
              label="GPhC registration number"
              value={state.summary.pharmacistGPhC}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })
              }
              placeholder="e.g. 2123456"
              required
            />
            <TextInput
              label="Pharmacy name"
              value={state.summary.pharmacyName}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })
              }
              placeholder="High Street Pharmacy"
            />
            <TextInput
              label="Pharmacy address"
              value={state.summary.pharmacyAddress}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyAddress", value: v })
              }
              placeholder="123 High Street, London"
            />
            <TextArea
              label="Clinical notes (optional)"
              value={state.summary.clinicalNotes}
              onChange={(v) =>
                dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })
              }
              placeholder="Any additional clinical observations..."
              rows={4}
            />
            <PESummaryReport state={state} alerts={alerts} />
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Render ───

  return (
    <div className="space-y-6">
      <ProgressBar
        stepLabels={STEP_LABELS}
        currentStep={state.currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
        hasErrors={!!validationError}
      />

      {alerts.length > 0 && (
        <AlertBanner
          alerts={alerts.filter((a) => a.severity === "stop")}
        />
      )}

      <StepWrapper
        title={STEP_LABELS[state.currentStep]}
        currentStep={state.currentStep}
        totalSteps={TOTAL_STEPS}
        onNext={handleNext}
        onPrev={handlePrev}
        canProceed={canProceed}
        validationError={validationError}
        isBlocked={hardStops}
        getConsultationData={getConsultationData}
        onNewConsultation={handleNewConsultation}
      >
        {renderStep()}
      </StepWrapper>

      {doseRecommendation && state.currentStep >= 6 && (
        <div className="bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30 rounded-lg p-4">
          <h3 className="font-semibold text-[color:var(--tenant-primary)] mb-2">Medicine Recommendation</h3>
          <div className="space-y-1 text-sm text-[color:var(--tenant-primary)]">
            <p>
              <span className="font-medium">Medicine:</span> {doseRecommendation.medicine}
            </p>
            <p>
              <span className="font-medium">Dose:</span> {doseRecommendation.dose}
            </p>
            <p>
              <span className="font-medium">Dosing:</span> {doseRecommendation.dosingRegimen}
            </p>
            <p>
              <span className="font-medium">Reason:</span> {doseRecommendation.reason}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
