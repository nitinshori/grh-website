"use client";
import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type { ThrushConsultationState, ThrushAction } from "./lib/thrush-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/thrush-types";
import { getAllAlerts, hasHardStops, calculateDoseRecommendation, getSupplyDetails } from "./lib/thrush-clinical-logic";
import { validateStep } from "./lib/thrush-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TextInput, Checkbox, SelectInput, NumberInput, TextArea } from "../shared/components/FormInputs";
import { ThrushSummaryReport } from "./components/ThrushSummaryReport";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
function reducer(state: ThrushConsultationState, action: ThrushAction): ThrushConsultationState {
  const newState = { ...state };
  switch (action.type) {
    case "UPDATE_PATIENT":
      newState.patient = { ...newState.patient, [action.field]: action.value };
      if (action.field === "dateOfBirth") newState.patient.age = calculateAge(action.value as string);
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
    case "UPDATE_MEDICATIONS":
      newState.medications = { ...newState.medications, [action.field]: action.value };
      break;
    case "UPDATE_MEDICINE_SELECTION":
      newState.medicineSelection = { ...newState.medicineSelection, [action.field]: action.value };
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

export default function ThrushClient() {
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
  const doseRecommendation = useMemo(() => calculateDoseRecommendation(state), [state]);
  const hasStops = useMemo(() => hasHardStops(alerts), [alerts]);

  const updatedState = useMemo(() => {
    const newState = { ...state };
    newState.alerts = alerts;
    newState.doseRecommendation = doseRecommendation;
    return newState;
  }, [state, alerts, doseRecommendation]);

  const validationError = useMemo(() => validateStep(state.currentStep, state), [state.currentStep, state]);
  // A stop anywhere disables Next on every step. The progress bar only
  // moves backwards, so there is no route past a stop except "Save as not
  // supplied" (StepWrapper), which records the exclusion and the advice.
  const canProceed = !validationError && !hasStops;

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
    if (step < state.currentStep) dispatch({ type: "SET_STEP", step });
  };


  // ─── Consultation Record Data (for saving to database) ───
  // Returns a record on every step, with or without a medicine, so an
  // excluded patient can be saved as not supplied from the step the stop
  // was raised. Saves updatedState so alerts and the dose recommendation
  // reach the database, not only the printed report.
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    const supply = getSupplyDetails(state.medicineSelection.medicineChoice);
    const medicine = !hasStops && doseRecommendation && supply
      ? {
          name: doseRecommendation.medicine,
          medicine: doseRecommendation.medicine,
          dose: doseRecommendation.dose,
          duration: doseRecommendation.duration,
          quantity: supply.quantity,
        }
      : undefined;
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
      clinicalData: updatedState as unknown as Record<string, unknown>,
      outcome: hasStops ? "not_supplied" : "completed",
      medicine,
      summary: {
        pharmacistName: state.summary.pharmacistName || __pharmProfile?.name || "",
        pharmacistGPhC: state.summary.pharmacistGPhC || __pharmProfile?.gphcNumber || "",
        pharmacyName: state.summary.pharmacyName || __pharmProfile?.pharmacyName || "",
        pharmacyAddress: state.summary.pharmacyAddress || __pharmProfile?.pharmacyAddress || "",
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
      consent: { notifyGp: state.consent.notifyGp },
    };
  }, [state, updatedState, hasStops, doseRecommendation, __pharmProfile]);

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
  }, []);

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <StepWrapper title="Patient Details" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError} isBlocked={hasStops} getConsultationData={getConsultationData}>
            <PatientDetailsStep
              patient={state.patient}
              onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value })}
              requireAdult={false}
              genderOption={{
                label: "Patient is female",
                description: "This PGD is for women aged 16 to 60.",
                checked: state.medicalHistory.femaleConfirmed,
                onToggle: (v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "femaleConfirmed", value: v }),
              }}
            />
            {state.patient.age !== null && (state.patient.age < 16 || state.patient.age > 60) && (
              <p className="mt-3 text-sm font-medium text-red-600">Aged under 16 or over 60 is an exclusion. Refer to GP.</p>
            )}
            <p className="mt-3 text-xs text-amber-700">
              Document note: the PGD indication and inclusion rows say 16 to 65 while the exclusion row excludes over 60. This tool applies the narrower rule (16 to 60) until the document is reissued.
            </p>
          </StepWrapper>
        );
      case 1:
        return (
          <StepWrapper title="Consent & ID Verification" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError} isBlocked={hasStops} getConsultationData={getConsultationData}>
            <ConsentStep consent={state.consent} onChange={(field, value) => dispatch({ type: "UPDATE_CONSENT", field, value })} />
          </StepWrapper>
        );
      case 2:
        return (
          <StepWrapper title="Symptom Assessment" description="Assess for typical vulvovaginal candidiasis symptoms." currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError} isBlocked={hasStops} getConsultationData={getConsultationData}>
            <div className="space-y-3">
              <Checkbox label="Vulval itching" checked={state.assessment.vulvalItching} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "vulvalItching", value: v })} />
              <Checkbox label="Vulval soreness" checked={state.assessment.vulvalSoreness} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "vulvalSoreness", value: v })} />
              <Checkbox label="Thick white discharge" checked={state.assessment.thickWhiteDischarge} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "thickWhiteDischarge", value: v })} />
              <Checkbox label="Dyspareunia (pain on intercourse)" checked={state.assessment.dyspareunia} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "dyspareunia", value: v })} />
              <div className="border-t pt-4"><p className="text-sm font-semibold text-red-700 mb-3">EXCLUSIONS - If any present, refer to GP:</p></div>
              <Checkbox label="Abnormal or blood-stained vaginal bleeding" checked={state.assessment.bloodStainedDischarge} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "bloodStainedDischarge", value: v })} description="Exclusion" />
              <Checkbox label="Vulval ulcers, sores or blisters" checked={state.assessment.vulvalUlcers} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "vulvalUlcers", value: v })} description="Exclusion" />
              <Checkbox label="Foul-smelling discharge" checked={state.assessment.offensiveSmell} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "offensiveSmell", value: v })} description="Exclusion; may indicate BV or STI" />
              <Checkbox label="Dysuria (pain passing urine)" checked={state.assessment.dysuria} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "dysuria", value: v })} description="Exclusion under this PGD" />
              <Checkbox label="Lower abdominal pain" checked={state.assessment.pelvicPain} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "pelvicPain", value: v })} description="Exclusion" />
              <Checkbox label="Fever" checked={state.assessment.fever} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "fever", value: v })} description="Exclusion" />
              <Checkbox label="Systemic upset" checked={state.assessment.systemicUpset} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "systemicUpset", value: v })} description="Exclusion" />
              <NumberInput label="Number of episodes in the last 12 months" value={state.assessment.recurrentEpisodes} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "recurrentEpisodes", value: v })} min={0} max={20} />
              <div className="border-t pt-4">
                <Checkbox label="I have asked the patient about every exclusion listed above and recorded the answers" checked={state.assessment.exclusionsAsked} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "exclusionsAsked", value: v })} required />
              </div>
            </div>
          </StepWrapper>
        );
      case 3:
        return (
          <StepWrapper title="Medical History" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError} isBlocked={hasStops} getConsultationData={getConsultationData}>
            <div className="space-y-4">
              <p className="text-sm font-semibold text-red-700">Exclusions (both arms)</p>
              <Checkbox label="First episode of symptoms" checked={state.medicalHistory.firstEpisode} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "firstEpisode", value: v })} description="Needs a diagnosis; refer" />
              <Checkbox label="Recurrent candidiasis: 4 or more episodes in 12 months, or 2 in the last 6 months" checked={state.medicalHistory.recurrentThrush} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "recurrentThrush", value: v })} description="Refer" />
              <Checkbox label="Immunosuppression" checked={state.medicalHistory.immunocompromised} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "immunocompromised", value: v })} description="Exclusion" />
              <Checkbox label="Diabetes" checked={state.medicalHistory.diabetes} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "diabetes", value: v })} description="Increased thrush risk" />
              {state.medicalHistory.diabetes && (
                <Checkbox label="Diabetes is poorly controlled" checked={state.medicalHistory.diabetesPoorlyControlled} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "diabetesPoorlyControlled", value: v })} description="Exclusion" />
              )}
              <Checkbox label="Possible exposure to a sexually transmitted infection, or a partner with an STI" checked={state.medicalHistory.stiExposure} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "stiExposure", value: v })} description="Exclusion" />
              <Checkbox label="Currently pregnant" checked={state.medicalHistory.pregnancy} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "pregnancy", value: v })} description="Exclusion: the PGD indication for both arms is non-pregnant women. Refer to the GP." />
              <p className="text-sm font-semibold text-navy-900 mt-2">Fluconazole arm exclusions (pessary may still be used)</p>
              <Checkbox label="Currently breastfeeding" checked={state.medicalHistory.breastfeeding} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "breastfeeding", value: v })} description="Fluconazole excluded (insufficient data)" />
              <Checkbox label="Known hypersensitivity to fluconazole or azoles" checked={state.medicalHistory.azoleHypersensitivity} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "azoleHypersensitivity", value: v })} />
              <Checkbox label="Taking terfenadine, astemizole, cisapride, pimozide, quinidine or erythromycin" checked={state.medications.qtDrugs} onChange={(v) => dispatch({ type: "UPDATE_MEDICATIONS", field: "qtDrugs", value: v })} description="Risk of QT prolongation and torsades de pointes" />
              <Checkbox label="History of QT prolongation or cardiac arrhythmias" checked={state.medicalHistory.qtHistory} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "qtHistory", value: v })} />
              <Checkbox label="Severe hepatic impairment (Child-Pugh score over 9)" checked={state.medicalHistory.severeHepatic} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "severeHepatic", value: v })} />
              <Checkbox label="Severe renal impairment (eGFR under 20 mL/min)" checked={state.medicalHistory.severeRenal} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "severeRenal", value: v })} />
              <p className="text-sm font-semibold text-navy-900 mt-2">Pessary arm</p>
              <Checkbox label="Known hypersensitivity to clotrimazole or imidazoles" checked={state.medicalHistory.imidazoleHypersensitivity} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "imidazoleHypersensitivity", value: v })} description="Pessary excluded" />
              <Checkbox label="May not retain a pessary (abnormal anatomy, severe prolapse)" checked={state.medicalHistory.cannotRetainPessary} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "cannotRetainPessary", value: v })} description="Caution" />
              <p className="text-sm font-semibold text-navy-900 mt-2">Cautions (fluconazole)</p>
              <Checkbox label="Hepatic impairment (mild to moderate)" checked={state.medicalHistory.mildModerateHepatic} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "mildModerateHepatic", value: v })} description="Monitor closely" />
              <Checkbox label="Renal impairment (mild to moderate)" checked={state.medicalHistory.mildModerateRenal} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "mildModerateRenal", value: v })} description="Dose adjustment may be needed" />
              <Checkbox label="Warfarin or other oral anticoagulant" checked={state.medications.warfarin} onChange={(v) => dispatch({ type: "UPDATE_MEDICATIONS", field: "warfarin", value: v })} description="Increased anticoagulant effect" />
              <Checkbox label="Statins" checked={state.medications.statins} onChange={(v) => dispatch({ type: "UPDATE_MEDICATIONS", field: "statins", value: v })} description="Increased statin levels" />
              <Checkbox label="Phenytoin" checked={state.medications.phenytoin} onChange={(v) => dispatch({ type: "UPDATE_MEDICATIONS", field: "phenytoin", value: v })} description="Increased phenytoin levels" />
              <Checkbox label="Rifampicin" checked={state.medications.rifampicin} onChange={(v) => dispatch({ type: "UPDATE_MEDICATIONS", field: "rifampicin", value: v })} description="Reduced fluconazole levels" />
              <TextArea label="Other relevant medical history and medicines (check interactions via BNF)" value={state.medications.otherMedications} onChange={(v) => dispatch({ type: "UPDATE_MEDICATIONS", field: "otherMedications", value: v })} placeholder="e.g., recent antibiotic use, treatment history, other medicines" />
              <div className="border-t pt-4">
                <Checkbox label="I have asked the patient about every exclusion and caution listed above and recorded the answers" checked={state.medicalHistory.exclusionsAsked} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "exclusionsAsked", value: v })} required />
              </div>
            </div>
          </StepWrapper>
        );
      case 4:
        return (
          <StepWrapper title="Contraindications Review" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={!hasStops} validationError={hasStops ? "Exclusion present: cannot proceed. Give the advice in the PGD, refer as appropriate, and save as not supplied." : null} isBlocked={hasStops} getConsultationData={getConsultationData}>
            {alerts.length > 0 ? <AlertBanner alerts={alerts} /> : <p className="text-sm text-gray-600">No alerts identified.</p>}
          </StepWrapper>
        );
      case 5:
        return (
          <StepWrapper title="Medicine Selection" description="Choose one of the two products the PGD authorises." currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError} isBlocked={hasStops} getConsultationData={getConsultationData}>
            <div className="space-y-4">
              <SelectInput label="Treatment" value={state.medicineSelection.medicineChoice} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "medicineChoice", value: v })} options={[{ value: "fluconazole-oral", label: "Fluconazole 150mg capsule, single oral dose (1 capsule)" }, { value: "clotrimazole-pessary", label: "Clotrimazole 500mg vaginal pessary, single dose at night (1 pessary)" }]} required />
              {state.medicineSelection.medicineChoice === "clotrimazole-pessary" && (
                <Checkbox label="Patient is able to insert the pessary intravaginally" checked={state.medicineSelection.abilityConfirmed} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "abilityConfirmed", value: v })} required />
              )}
              {doseRecommendation && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                  <p className="font-semibold">{doseRecommendation.medicine}</p>
                  <p>{doseRecommendation.dosingRegimen}</p>
                </div>
              )}
              {state.medicineSelection.medicineChoice && (
                <TextInput label="Brand or manufacturer of the product supplied" value={state.medicineSelection.brand} onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "brand", value: v })} placeholder="e.g. Canesten, or the generic manufacturer" required />
              )}
            </div>
          </StepWrapper>
        );
      case 6:
        return (
          <StepWrapper title="Counselling & Patient Education" currentStep={state.currentStep} totalSteps={TOTAL_STEPS} onNext={handleNext} onPrev={handlePrev} canProceed={canProceed} validationError={validationError} isBlocked={hasStops} getConsultationData={getConsultationData}>
            <div className="space-y-3">
              <Checkbox label="Typical symptoms of thrush explained" checked={state.counselling.typicalSymptoms} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "typicalSymptoms", value: v })} />
              <Checkbox label="Avoid irritants such as douches, scented products and tight clothing" checked={state.counselling.avoidPerfumedProducts} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "avoidPerfumedProducts", value: v })} />
              <Checkbox label="Wear cotton underwear" checked={state.counselling.cottonUnderwear} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "cottonUnderwear", value: v })} />
              <Checkbox label="Complete the full course of treatment as prescribed" checked={state.counselling.completesTreatment} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "completesTreatment", value: v })} />
              <Checkbox label="Symptoms should resolve within 5 to 7 days; if symptoms persist or worsen, contact your GP" checked={state.counselling.timelineToRelief} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "timelineToRelief", value: v })} />
              <Checkbox label="Avoid sexual intercourse for at least 5 days after treatment (pessary may damage condoms and diaphragms)" checked={state.counselling.avoidIntercourse} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "avoidIntercourse", value: v })} />
              {state.medicineSelection.medicineChoice === "clotrimazole-pessary" && (
                <Checkbox label="Insert the pessary with fingers rather than the applicator to minimise damage to barriers" checked={state.counselling.insertWithFingers} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "insertWithFingers", value: v })} description={state.medicalHistory.pregnancy ? "Pregnancy: the applicator should not be used" : undefined} />
              )}
              <Checkbox label="Recurrent infections (4 or more per year): contact your GP for investigation" checked={state.counselling.recurrenceAdvice} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "recurrenceAdvice", value: v })} />
              <Checkbox label="Report any adverse effects to your healthcare provider or via the Yellow Card scheme" checked={state.counselling.yellowCardAdvice} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "yellowCardAdvice", value: v })} />
              <Checkbox label="Patient information leaflet (PIL) supplied with the medication" checked={state.counselling.pilSupplied} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "pilSupplied", value: v })} required />
            </div>
          </StepWrapper>
        );
      case 7:
        return (
          <StepWrapper
            title="Summary & Consultation Record"
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            canProceed={canProceed}
            validationError={validationError}
            isBlocked={hasStops}
            getConsultationData={getConsultationData}
            onNewConsultation={handleNewConsultation}
          >
            <div className="space-y-4 mb-6">
              <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistName", value: v })} required />
              <TextInput label="GPhC registration number" value={state.summary.pharmacistGPhC} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacistGPhC", value: v })} required />
              <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "pharmacyName", value: v })} />
              <TextArea label="Additional clinical notes" value={state.summary.clinicalNotes} onChange={(v) => dispatch({ type: "UPDATE_SUMMARY", field: "clinicalNotes", value: v })} />
            </div>
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-4">Review the summary below before printing.</p>
              <ThrushSummaryReport state={updatedState} />
            </div>
          </StepWrapper>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <ProgressBar stepLabels={STEP_LABELS} currentStep={state.currentStep} onStepClick={handleStepClick} completedSteps={completedSteps} hasErrors={Boolean(validationError)} />
      {alerts.length > 0 && state.currentStep < 4 && <AlertBanner alerts={alerts} />}
      {renderStep()}
    </div>
  );
}
