"use client";

import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type {
  COPDConsultationState,
  COPDAction,
  COPDPatientDetails,
  COPDAssessment,
  COPDMedicalHistory,
  COPDCurrentMedications,
  COPDRedFlags,
  COPDMedicineSupply,
  COPDCounselling,
} from "./lib/copd-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState, PGD_STRAPLINE } from "./lib/copd-types";
import {
  getAllAlerts,
  hasHardStops,
  calculateDoseRecommendation,
  SALBUTAMOL_RECOMMENDATION,
  AMOXICILLIN_RECOMMENDATION,
} from "./lib/copd-clinical-logic";
import { validateStep } from "./lib/copd-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { COPDSummaryReport } from "./components/COPDSummaryReport";
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from "../shared/components/FormInputs";

function reducer(state: COPDConsultationState, action: COPDAction): COPDConsultationState {
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
    case "UPDATE_CURRENT_MEDICATIONS":
      newState.currentMedications = { ...newState.currentMedications, [action.field]: action.value };
      break;
    case "UPDATE_RED_FLAGS":
      newState.redFlags = { ...newState.redFlags, [action.field]: action.value };
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
  }

  return newState;
}

export default function COPDClient() {
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
  const canProceed = useMemo(() => {
    if (state.currentStep >= TOTAL_STEPS - 1) return true;
    if (state.currentStep <= 5 && hardStops) return false;
    return !validationError;
  }, [state, validationError, hardStops]);

  const handleNext = useCallback(() => {
    if (!validationError && state.currentStep < TOTAL_STEPS - 1) {
      const newCompleted = new Set(completedSteps);
      newCompleted.add(state.currentStep);
      setCompletedSteps(newCompleted);
      dispatch({ type: "SET_STEP", step: state.currentStep + 1 });
    }
  }, [state.currentStep, validationError, completedSteps]);

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
              dispatch({ type: "UPDATE_PATIENT", field: field as keyof COPDPatientDetails, value })
            }
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
            <Checkbox
              label="Confirmed diagnosis of COPD (documented spirometry and GOLD classification)"
              checked={state.assessment.hasExistingDiagnosis}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "hasExistingDiagnosis", value: v })
              }
              description="Inclusion criterion: spirometry FEV1/FVC below 0.70 with a GOLD classification documented"
              required
            />
            <SelectInput
              label="GOLD classification"
              value={state.assessment.goldClassification}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "goldClassification", value: v })
              }
              options={[
                { value: "1", label: "GOLD 1: FEV1 80% predicted or more (mild)" },
                { value: "2", label: "GOLD 2: FEV1 50 to 79% predicted (moderate)" },
                { value: "3", label: "GOLD 3: FEV1 30 to 49% predicted (severe)" },
                { value: "4", label: "GOLD 4: FEV1 below 30% predicted (very severe)" },
                { value: "unknown", label: "Documented, classification not to hand" },
              ]}
            />
            <SelectInput
              label="Presentation"
              value={state.assessment.presentation}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "presentation", value: v })
              }
              options={[
                { value: "exacerbation", label: "Acute exacerbation (increased dyspnoea, cough, change in sputum)" },
                { value: "breathlessness", label: "Episode of breathlessness requiring symptom relief" },
              ]}
              required
            />
            <Checkbox
              label="Purulent sputum (yellow/green), indicating bacterial infection"
              checked={state.assessment.purulentSputum}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "purulentSputum", value: v })
              }
              description="Required for the amoxicillin arm (infective exacerbation)"
            />
            <NumberInput
              label="Oxygen saturation (SpO2) on air"
              value={state.assessment.spo2}
              onChange={(v) => {
                dispatch({ type: "UPDATE_ASSESSMENT", field: "spo2", value: v });
                dispatch({ type: "UPDATE_RED_FLAGS", field: "severeHypoxia", value: v !== null && v < 88 });
              }}
              min={50}
              max={100}
              unit="% (below 88% is an exclusion: emergency referral)"
              required
            />
            <NumberInput
              label="Salbutamol supplies under this PGD in the last 12 months"
              value={state.assessment.salbutamolSuppliesLast12Months}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "salbutamolSuppliesLast12Months", value: v })
              }
              min={0}
              max={20}
              unit="(maximum 2 supplies in any 12 months; a third request is a GP review)"
              required
            />
            <Checkbox
              label="Capable of using an inhaler device, or willing to use a spacer"
              checked={state.assessment.canUseInhalerOrSpacer}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "canUseInhalerOrSpacer", value: v })
              }
              description="Inclusion criterion for the salbutamol arm"
            />
            <Checkbox
              label="Able to take oral medication"
              checked={state.assessment.ableToTakeOralMedication}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "ableToTakeOralMedication", value: v })
              }
              description="Inclusion criterion for the amoxicillin arm"
            />
            <NumberInput
              label="MRC breathlessness scale (1-5)"
              value={state.assessment.mrcBreathlessnessScale}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "mrcBreathlessnessScale", value: v })
              }
              min={1}
              max={5}
            />
            {state.assessment.mrcBreathlessnessScale === 5 && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-xs text-red-700 font-medium">
                  Grade 5: Housebound, breathless at rest. URGENT REFERRAL REQUIRED.
                </p>
              </div>
            )}
            <SelectInput
              label="Exacerbation frequency"
              value={state.assessment.exacerbationFrequency}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "exacerbationFrequency", value: v })
              }
              options={[
                { value: "none", label: "No recent exacerbations" },
                { value: "1-2", label: "1-2 exacerbations per year" },
                { value: "3-4", label: "3-4 exacerbations per year" },
                { value: "frequent", label: "Frequent exacerbations (&gt;4/year)" },
              ]}
              required
            />
            <TextInput
              label="Current inhaler regimen"
              value={state.assessment.currentInhalerRegimen}
              onChange={(v) =>
                dispatch({ type: "UPDATE_ASSESSMENT", field: "currentInhalerRegimen", value: v })
              }
              placeholder="e.g., LABA/ICS twice daily"
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Checkbox
              label="COPD documented in medical records"
              checked={state.medicalHistory.copdDocumented}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "copdDocumented", value: v })
              }
            />
            <SelectInput
              label="Current smoking status"
              value={state.medicalHistory.smokingStatus}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "smokingStatus", value: v })
              }
              options={[
                { value: "current", label: "Current smoker" },
                { value: "former", label: "Former smoker" },
                { value: "never", label: "Never smoked" },
              ]}
            />
            <TextInput
              label="Other respiratory conditions"
              value={state.medicalHistory.otherRespiratoryConditions}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "otherRespiratoryConditions", value: v })
              }
              placeholder="e.g., asthma, bronchiectasis"
            />
            <TextInput
              label="Other conditions"
              value={state.medicalHistory.otherConditions}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "otherConditions", value: v })
              }
              placeholder="e.g., CVD, diabetes, osteoporosis"
            />
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm font-medium text-navy-900 mb-2">Salbutamol cautions (PGD v002)</p>
              <div className="space-y-2">
                <Checkbox label="Cardiovascular disease" checked={state.medicalHistory.cardiovascularDisease} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "cardiovascularDisease", value: v })} description="Salbutamol can increase heart rate and blood pressure; assess cardiac risk" />
                <Checkbox label="Hypertension" checked={state.medicalHistory.hypertension} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hypertension", value: v })} description="Monitor blood pressure; beta-2 agonists may worsen" />
                <Checkbox label="Coronary artery disease or recent MI" checked={state.medicalHistory.coronaryDiseaseOrRecentMI} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "coronaryDiseaseOrRecentMI", value: v })} description="Assess risk/benefit; monitor for angina" />
                <Checkbox label="Diabetes mellitus" checked={state.medicalHistory.diabetes} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "diabetes", value: v })} description="Monitor blood glucose (hyperglycaemia possible)" />
                <Checkbox label="Hyperthyroidism" checked={state.medicalHistory.hyperthyroidism} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hyperthyroidism", value: v })} description="Beta-2 agonists can worsen symptoms" />
                <Checkbox label="Hypokalaemia" checked={state.medicalHistory.hypokalaemia} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hypokalaemia", value: v })} description="May be worsened; monitor potassium" />
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm font-medium text-navy-900 mb-2">Amoxicillin exclusions and cautions (PGD v002)</p>
              <div className="space-y-2">
                <Checkbox label="Infectious mononucleosis" checked={state.medicalHistory.infectiousMononucleosis} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "infectiousMononucleosis", value: v })} description="Exclusion for amoxicillin: can precipitate severe rash" />
                <Checkbox label="Severe renal impairment (eGFR below 30 mL/min/1.73m2)" checked={state.medicalHistory.severeRenalImpairment} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "severeRenalImpairment", value: v })} description="Exclusion for amoxicillin: dose adjustment needed" />
                <Checkbox label="Mild to moderate renal impairment" checked={state.medicalHistory.mildModerateRenalImpairment} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "mildModerateRenalImpairment", value: v })} description="Caution: monitor renal function; dose adjustment may be needed" />
                <Checkbox label="Hepatic impairment" checked={state.medicalHistory.hepaticImpairment} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hepaticImpairment", value: v })} description="Caution: generally safe but monitor liver function" />
                <Checkbox label="Antibiotic resistance suspected in local resistance patterns" checked={state.medicalHistory.localResistanceConcern} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "localResistanceConcern", value: v })} description="Exclusion for amoxicillin: check local microbiology guidance (Haemophilus influenzae, Moraxella catarrhalis, Streptococcus pneumoniae coverage)" />
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm font-medium text-navy-900 mb-2">Pregnancy and breastfeeding</p>
              <div className="space-y-2">
                <Checkbox label="Pregnant" checked={state.medicalHistory.pregnancy} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "pregnancy", value: v })} description="Caution: salbutamol and amoxicillin generally safe; ensure informed consent" />
                <Checkbox label="Breastfeeding" checked={state.medicalHistory.breastfeeding} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "breastfeeding", value: v })} description="Caution: amoxicillin generally safe; ensure informed consent" />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Checkbox
              label="Known hypersensitivity to salbutamol or other beta-2 agonists"
              checked={state.currentMedications.salbutamolAllergy}
              onChange={(v) =>
                dispatch({ type: "UPDATE_CURRENT_MEDICATIONS", field: "salbutamolAllergy", value: v })
              }
              description="Exclusion for the salbutamol arm"
            />
            <Checkbox
              label="Known penicillin or beta-lactam allergy"
              checked={state.currentMedications.penicillinAllergy}
              onChange={(v) =>
                dispatch({ type: "UPDATE_CURRENT_MEDICATIONS", field: "penicillinAllergy", value: v })
              }
              description="Exclusion for the amoxicillin arm"
            />
            <Checkbox
              label="Uses oral contraception"
              checked={state.currentMedications.oralContraceptive}
              onChange={(v) =>
                dispatch({ type: "UPDATE_CURRENT_MEDICATIONS", field: "oralContraceptive", value: v })
              }
              description="Caution: amoxicillin may reduce efficacy; advise additional contraception during and for 7 days after the course"
            />
            <TextArea
              label="Other current medicines (including LABA/LAMA/ICS regimen)"
              value={state.currentMedications.otherMedicines}
              onChange={(v) =>
                dispatch({ type: "UPDATE_CURRENT_MEDICATIONS", field: "otherMedicines", value: v })
              }
              placeholder="List current medicines"
              rows={3}
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-xs text-red-700 font-medium">
                Exclusions require emergency referral; red flags require urgent referral
              </p>
            </div>
            <Checkbox
              label="Severe exacerbation with hypoxia (SpO2 below 88%)"
              checked={state.redFlags.severeHypoxia}
              onChange={(v) =>
                dispatch({ type: "UPDATE_RED_FLAGS", field: "severeHypoxia", value: v })
              }
              description="Exclusion: requires emergency referral and oxygen therapy. Set automatically from the recorded SpO2."
            />
            <Checkbox
              label="Acute distress with inability to speak, cyanosis, or signs of respiratory failure"
              checked={state.redFlags.acuteDistress}
              onChange={(v) =>
                dispatch({ type: "UPDATE_RED_FLAGS", field: "acuteDistress", value: v })
              }
              description="Exclusion: emergency referral, call 999"
            />
            <Checkbox
              label="MRC Grade 5 (housebound, breathless at rest)"
              checked={state.redFlags.mrcGrade5}
              onChange={(v) =>
                dispatch({ type: "UPDATE_RED_FLAGS", field: "mrcGrade5", value: v })
              }
            />
            <Checkbox
              label="New haemoptysis"
              checked={state.redFlags.newHaemoptysis}
              onChange={(v) =>
                dispatch({ type: "UPDATE_RED_FLAGS", field: "newHaemoptysis", value: v })
              }
            />
            <Checkbox
              label="Unintentional weight loss"
              checked={state.redFlags.weightLoss}
              onChange={(v) =>
                dispatch({ type: "UPDATE_RED_FLAGS", field: "weightLoss", value: v })
              }
            />
            <Checkbox
              label="Recurrent respiratory infections"
              checked={state.redFlags.recurrentInfections}
              onChange={(v) =>
                dispatch({ type: "UPDATE_RED_FLAGS", field: "recurrentInfections", value: v })
              }
            />
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <Checkbox
              label="Medicine to supply confirmed"
              checked={state.medicineSupply.medicinePrescribed}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "medicinePrescribed", value: v })
              }
            />
            {state.medicineSupply.medicinePrescribed && (
              <>
                <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <Checkbox
                    label="Salbutamol 100mcg metered-dose inhaler (MDI), 1 inhaler (200 doses)"
                    checked={state.medicineSupply.supplySalbutamol}
                    onChange={(v) =>
                      dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "supplySalbutamol", value: v })
                    }
                    description="Acute symptom relief in an acute exacerbation or breathlessness. Inhalation via MDI, with or without spacer."
                  />
                  {state.medicineSupply.supplySalbutamol && (
                    <div className="ml-6 space-y-2">
                      <p className="text-xs text-gray-700">
                        <strong>Dose:</strong> {SALBUTAMOL_RECOMMENDATION.dose}. {SALBUTAMOL_RECOMMENDATION.frequency}
                      </p>
                      <p className="text-xs text-gray-700">
                        <strong>Supply:</strong> {SALBUTAMOL_RECOMMENDATION.duration} Use a spacer to optimise delivery if the patient is not experienced with an MDI.
                      </p>
                      <TextInput
                        label="Brand supplied (salbutamol)"
                        value={state.medicineSupply.salbutamolBrand}
                        onChange={(v) =>
                          dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "salbutamolBrand", value: v })
                        }
                        placeholder="e.g. Ventolin Evohaler, Salamol"
                      />
                    </div>
                  )}
                </div>
                <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <Checkbox
                    label="Amoxicillin 500mg capsules, 15 capsules (5-day course)"
                    checked={state.medicineSupply.supplyAmoxicillin}
                    onChange={(v) =>
                      dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "supplyAmoxicillin", value: v })
                    }
                    description="Infective acute exacerbation with purulent (yellow/green) sputum only. Oral."
                  />
                  {state.medicineSupply.supplyAmoxicillin && (
                    <div className="ml-6 space-y-2">
                      <p className="text-xs text-gray-700">
                        <strong>Dose:</strong> {AMOXICILLIN_RECOMMENDATION.dose}, {AMOXICILLIN_RECOMMENDATION.frequency}. {AMOXICILLIN_RECOMMENDATION.duration}
                      </p>
                      <TextInput
                        label="Brand supplied (amoxicillin)"
                        value={state.medicineSupply.amoxicillinBrand}
                        onChange={(v) =>
                          dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "amoxicillinBrand", value: v })
                        }
                        placeholder="Manufacturer or brand"
                      />
                    </div>
                  )}
                </div>
                <Checkbox
                  label="Dosage confirmed with patient"
                  checked={state.medicineSupply.dosageConfirmed}
                  onChange={(v) =>
                    dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "dosageConfirmed", value: v })
                  }
                />
              </>
            )}
            <Checkbox
              label="Patient understands not replacement for maintenance"
              checked={state.medicineSupply.notReplacementForMaintenance}
              onChange={(v) =>
                dispatch({ type: "UPDATE_MEDICINE_SUPPLY", field: "notReplacementForMaintenance", value: v })
              }
              description="Supply does not replace regular LABA/LAMA/ICS therapy"
            />
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <Checkbox
              label="Counselled: Not replacement for maintenance therapy"
              checked={state.counselling.notReplacementForMaintenance}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "notReplacementForMaintenance", value: v })
              }
            />
            <Checkbox
              label="GP review recommended"
              checked={state.counselling.gpReviewAdvised}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "gpReviewAdvised", value: v })
              }
              description="Advise GP review for COPD management optimisation"
            />
            <Checkbox
              label="Inhaler technique demonstrated"
              checked={state.counselling.inhalerTechniqueShown}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "inhalerTechniqueShown", value: v })
              }
            />
            <Checkbox
              label="Smoking cessation advice given"
              checked={state.counselling.smokingCessationAdvised}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "smokingCessationAdvised", value: v })
              }
              description="Mandatory counselling on smoking cessation"
            />
            <Checkbox
              label="Symptom management explained"
              checked={state.counselling.symptomMgmtExplained}
              onChange={(v) =>
                dispatch({ type: "UPDATE_COUNSELLING", field: "symptomMgmtExplained", value: v })
              }
            />
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm font-medium text-navy-900 mb-2">Follow-up advice (PGD v002)</p>
              <div className="space-y-2">
                {state.medicineSupply.supplySalbutamol && (
                  <>
                    <Checkbox
                      label="Use the rescue inhaler (salbutamol) as needed when you experience breathlessness: 1 to 2 puffs, up to 4 times in 24 hours, maximum 8 puffs in 24 hours. Needing more than this, relief more often than every 4 hours, or the reliever on most days: same-day GP or urgent care. Ten puffs through a spacer with no relief: call 999"
                      checked={state.counselling.relieverUseAndLimits}
                      onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "relieverUseAndLimits", value: v })}
                      required
                    />
                    <Checkbox
                      label="Use a spacer device if you have difficulty coordinating MDI actuation"
                      checked={state.counselling.spacerAdvice}
                      onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "spacerAdvice", value: v })}
                    />
                  </>
                )}
                {state.medicineSupply.supplyAmoxicillin && (
                  <>
                    <Checkbox
                      label="Complete the full course of amoxicillin even if symptoms improve"
                      checked={state.counselling.completeCourse}
                      onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "completeCourse", value: v })}
                      required
                    />
                    <Checkbox
                      label="Take amoxicillin at regular intervals, ideally 1 hour before or 2 hours after meals for best absorption (with food if GI upset occurs)"
                      checked={state.counselling.amoxicillinTiming}
                      onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "amoxicillinTiming", value: v })}
                    />
                    <Checkbox
                      label="If using oral contraception, use additional contraceptive methods during and for 7 days after the antibiotic course"
                      checked={state.counselling.contraceptionAdvice}
                      onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "contraceptionAdvice", value: v })}
                    />
                  </>
                )}
                <Checkbox
                  label="Monitor your sputum colour: purulent (yellow/green) sputum suggests continued infection"
                  checked={state.counselling.sputumColour}
                  onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "sputumColour", value: v })}
                />
                <Checkbox
                  label="Seek immediate medical attention if symptoms worsen despite treatment, or if you develop fever, persistent chest pain, or haemoptysis"
                  checked={state.counselling.seekImmediateAttention}
                  onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "seekImmediateAttention", value: v })}
                />
                <Checkbox
                  label="Seek urgent assessment if you experience worsening breathlessness, difficulty speaking in sentences, confusion, or cyanosis"
                  checked={state.counselling.seekUrgentAssessment}
                  onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "seekUrgentAssessment", value: v })}
                  required
                />
                <Checkbox
                  label="Monitor your oxygen saturation if you have a pulse oximeter at home; report any drop below 88%"
                  checked={state.counselling.oximeterAdvice}
                  onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "oximeterAdvice", value: v })}
                />
                <Checkbox
                  label="Report any allergic reactions (rash, facial swelling, difficulty breathing) immediately"
                  checked={state.counselling.allergicReactionAdvice}
                  onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "allergicReactionAdvice", value: v })}
                />
              </div>
            </div>
          </div>
        );

      case 8:
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

  const handlePrint = useCallback(() => {
    window.print();
  }, []);


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
      outcome: hardStops ? "not_supplied" : "completed",
      summary: {
        pharmacistName: state.summary.pharmacistName,
        pharmacistGPhC: state.summary.pharmacistGPhC,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
      },
    };
  }, [state, hardStops]);

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
          canProceed={true}
          validationError={null}
            getConsultationData={getConsultationData}
        >
          <COPDSummaryReport
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
      >
        {renderStep()}
      </StepWrapper>

      <div className="flex gap-3 justify-between">
        <button
          onClick={handlePrev}
          disabled={state.currentStep === 0}
          className="px-4 py-2 text-sm font-medium text-navy-900 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="px-4 py-2 text-sm font-medium text-white bg-[color:var(--tenant-primary)] hover:bg-[color:var(--tenant-primary)]/15 disabled:bg-gray-300 rounded-lg transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
