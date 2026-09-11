"use client";
import { useReducer, useMemo, useState, useCallback, useEffect } from "react";
import type { BVConsultationState, BVAction } from "./lib/bv-types";
import { STEP_LABELS, TOTAL_STEPS, createInitialConsultationState } from "./lib/bv-types";
import { getAllAlerts, hasHardStops, calculateDoseRecommendation, isOralChoice, quantitySupplied } from "./lib/bv-clinical-logic";
import { validateStep } from "./lib/bv-validation";
import { calculateAge } from "../shared/types";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import type { ConsultationRecordData } from "../shared/hooks/useConsultationTracking";
import { AlertBanner } from "../shared/components/AlertBanner";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TextInput, Checkbox, SelectInput, TextArea } from "../shared/components/FormInputs";
import { BVSummaryReport } from "./components/BVSummaryReport";

import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
function reducer(state: BVConsultationState, action: BVAction): BVConsultationState {
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
    case "UPDATE_EXCLUSION_OUTCOME":
      newState.exclusionOutcome = { ...newState.exclusionOutcome, [action.field]: action.value };
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

export default function BVClient() {
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
  // A stop anywhere disables Next (and Save & Print) everywhere. Stops used
  // to be waived from step 4 onwards (adversarial review, 11 Sep 2026).
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
  // Returns a record whether or not a medicine was chosen, so an excluded
  // patient can be saved as not supplied or referred from any step.
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    const supplied = !hasStops && doseRecommendation !== null;
    const referred = hasStops && state.exclusionOutcome.referredTo !== "";
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
      clinicalData: { ...(updatedState as unknown as Record<string, unknown>), quantitySupplied: supplied ? quantitySupplied(state) : null },
      outcome: hasStops ? (referred ? "referred" : "not_supplied") : "completed",
      medicine: supplied && doseRecommendation
        ? {
            name: doseRecommendation.medicine + (state.medicineSelection.brand ? ` (${state.medicineSelection.brand})` : ""),
            dose: `${doseRecommendation.dose} ${doseRecommendation.frequency ?? ""}`.trim(),
            duration: doseRecommendation.duration,
            quantity: quantitySupplied(state),
          }
        : undefined,
      summary: {
        pharmacistName: state.summary.pharmacistName || __pharmProfile?.name || "",
        pharmacistGPhC: state.summary.pharmacistGPhC || __pharmProfile?.gphcNumber || "",
        pharmacyName: state.summary.pharmacyName,
        pharmacyAddress: state.summary.pharmacyAddress,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
      consent: { notifyGp: state.consent.notifyGp },
    };
  }, [state, updatedState, hasStops, doseRecommendation, __pharmProfile]);

  // Shared props so every step enforces stops and can save an excluded
  // patient as not supplied.
  const stepProps = {
    currentStep: state.currentStep,
    totalSteps: TOTAL_STEPS,
    onNext: handleNext,
    onPrev: handlePrev,
    canProceed,
    validationError,
    isBlocked: hasStops,
    getConsultationData,
  };

  // Advice given and decision reached for an excluded patient (PGD v004:
  // Actions if patient is excluded or declines treatment).
  const exclusionOutcomeBlock = hasStops ? (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3 print:hidden">
      <p className="text-sm font-semibold text-red-800">
        Patient excluded: do not supply. Record the advice given and the decision reached, then use Save as not supplied.
      </p>
      <SelectInput
        label="Referred to"
        value={state.exclusionOutcome.referredTo}
        onChange={(v) => dispatch({ type: "UPDATE_EXCLUSION_OUTCOME", field: "referredTo", value: v })}
        options={[
          { value: "gp", label: "GP" },
          { value: "midwife", label: "Midwife or maternity service (pregnancy)" },
          { value: "sexual-health", label: "Sexual health service" },
          { value: "other", label: "Other (state in advice given)" },
        ]}
        required
      />
      <TextArea
        label="Advice given and decision reached"
        value={state.exclusionOutcome.adviceGiven}
        onChange={(v) => dispatch({ type: "UPDATE_EXCLUSION_OUTCOME", field: "adviceGiven", value: v })}
        placeholder="Alternative treatment options advised and how to access them; who the patient was referred to; whether the GP was informed"
        rows={3}
        required
      />
    </div>
  ) : null;

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
  }, []);

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <StepWrapper title="Patient Details" {...stepProps}>
            <PatientDetailsStep
              patient={state.patient}
              onChange={(field, value) => dispatch({ type: "UPDATE_PATIENT", field, value })}
              requireAdult={false}
              genderOption={{
                label: "Patient is female",
                description: "This PGD is for women aged 16 to 65 (vaginal gel arm 18 to 65).",
                checked: state.medicalHistory.femaleConfirmed,
                onToggle: (v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "femaleConfirmed", value: v }),
              }}
            />
            {state.patient.age !== null && (state.patient.age < 16 || state.patient.age > 65) && (
              <p className="mt-3 text-sm font-medium text-red-600">This PGD is for women aged 16 to 65. Refer to GP.</p>
            )}
          </StepWrapper>
        );
      case 1:
        return (
          <StepWrapper title="Consent & ID Verification" {...stepProps}>
            <ConsentStep consent={state.consent} onChange={(field, value) => dispatch({ type: "UPDATE_CONSENT", field, value })} />
          </StepWrapper>
        );
      case 2:
        return (
          <StepWrapper title="Symptom Assessment" description="Assess for typical bacterial vaginosis symptoms." {...stepProps}>
            <div className="space-y-4">
              <p className="text-sm text-navy-900 font-semibold">Typical BV symptoms:</p>
              <Checkbox label="Thin greyish-white discharge" checked={state.assessment.thinGrayishDischarge} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "thinGrayishDischarge", value: v })} />
              <Checkbox label="Fishy odour" checked={state.assessment.fishyOdour} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "fishyOdour", value: v })} />
              <Checkbox label="Odour worse after sex or menstruation" checked={state.assessment.odourWorseSexOrMenses} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "odourWorseSexOrMenses", value: v })} />
              <p className="text-sm text-navy-900 font-semibold mt-4">Associated symptoms (if present):</p>
              <Checkbox label="Itching (NOT typical of BV)" checked={state.assessment.itching} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "itching", value: v })} description="If significant itch, consider thrush instead" />
              <Checkbox label="Soreness (NOT typical of BV)" checked={state.assessment.soreness} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "soreness", value: v })} />
              <Checkbox label="Dysuria (pain passing urine)" checked={state.assessment.dysuria} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "dysuria", value: v })} />
              <Checkbox label="Dyspareunia (pain on intercourse)" checked={state.assessment.dyspareunia} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "dyspareunia", value: v })} />
              <p className="text-sm text-red-700 font-semibold mt-4">RED FLAGS - If any present, refer to GP:</p>
              <Checkbox label="Blood-stained discharge" checked={state.assessment.bloodStainedDischarge} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "bloodStainedDischarge", value: v })} />
              <Checkbox label="Fever" checked={state.assessment.fever} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "fever", value: v })} />
              <Checkbox label="Pelvic pain or lower abdominal pain" checked={state.assessment.pelvicPain} onChange={(v) => dispatch({ type: "UPDATE_ASSESSMENT", field: "pelvicPain", value: v })} />
            </div>
          </StepWrapper>
        );
      case 3:
        return (
          <StepWrapper title="Medical History" {...stepProps}>
            <div className="space-y-4">
              <Checkbox label="First episode of BV (not diagnosed before)" checked={state.medicalHistory.firstEpisode} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "firstEpisode", value: v })} description="Within the PGD: a presumptive diagnosis on clinical grounds is sufficient." />
              <Checkbox label="Recurrent BV" checked={state.medicalHistory.recurrentBV} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "recurrentBV", value: v })} />
              <Checkbox label="Pregnant, known or suspected" checked={state.medicalHistory.pregnancy} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "pregnancy", value: v })} description="This PGD is for non-pregnant women. Refer to GP or midwife." />
              <Checkbox label="Breastfeeding" checked={state.medicalHistory.breastfeeding} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "breastfeeding", value: v })} description="Oral: significant amounts in breast milk, consider alternatives or temporary cessation. Gel: minimal absorption, caution advised." />
              <Checkbox label="Active pelvic inflammatory disease" checked={state.medicalHistory.activePelvicInflammation} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "activePelvicInflammation", value: v })} />
              <Checkbox label="Known hypersensitivity to metronidazole or nitroimidazoles" checked={state.medicalHistory.hypersensitivity} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hypersensitivity", value: v })} description="Exclusion for both arms." />
              <Checkbox label="Active CNS disease or blood dyscrasia" checked={state.medicalHistory.cnsDiseaseOrBloodDyscrasia} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "cnsDiseaseOrBloodDyscrasia", value: v })} description="Exclusion for oral metronidazole." />
              <Checkbox label="Hepatic impairment (mild to moderate)" checked={state.medicalHistory.hepaticImpairment} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "hepaticImpairment", value: v })} description="Oral: adjust dose or frequency." />
              <Checkbox label="Renal impairment" checked={state.medicalHistory.renalImpairment} onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "renalImpairment", value: v })} description="Oral: may require dose reduction." />
              <Checkbox label="Current alcohol consumption" checked={state.medications.alcohol} onChange={(v) => dispatch({ type: "UPDATE_MEDICATIONS", field: "alcohol", value: v })} description="Exclusion for oral metronidazole (disulfiram-like reaction during or within 48 hours of treatment). Gel arm may be used." />
              <Checkbox label="Concurrent lithium therapy" checked={state.medications.lithium} onChange={(v) => dispatch({ type: "UPDATE_MEDICATIONS", field: "lithium", value: v })} description="Exclusion for oral metronidazole (increased lithium levels, risk of toxicity)." />
              <Checkbox label="Concurrent disulfiram therapy" checked={state.medications.disulfiram} onChange={(v) => dispatch({ type: "UPDATE_MEDICATIONS", field: "disulfiram", value: v })} description="Exclusion for oral metronidazole." />
              <Checkbox label="Taking warfarin" checked={state.medications.warfarin} onChange={(v) => dispatch({ type: "UPDATE_MEDICATIONS", field: "warfarin", value: v })} description="Increased anticoagulant effect; monitor INR." />
              <Checkbox label="Taking phenytoin" checked={state.medications.phenytoin} onChange={(v) => dispatch({ type: "UPDATE_MEDICATIONS", field: "phenytoin", value: v })} description="Increased phenytoin levels." />
              <div className="pt-2 border-t border-gray-200">
                <Checkbox
                  label="Every exclusion and caution question on this step was asked and answered by the patient"
                  checked={state.medicalHistory.exclusionsAskedAndAnswered}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICAL_HISTORY", field: "exclusionsAskedAndAnswered", value: v })}
                  description="An unticked box means the patient answered no, not that the question was skipped"
                  required
                />
              </div>
            </div>
          </StepWrapper>
        );
      case 4:
        return (
          <StepWrapper title="Contraindications Review" {...stepProps} validationError={hasStops ? "Hard stops present - cannot proceed" : null}>
            {alerts.length > 0 ? <AlertBanner alerts={alerts} /> : <p className="text-sm text-gray-600">No alerts identified.</p>}
          </StepWrapper>
        );
      case 5:
        return (
          <StepWrapper title="Medicine Selection" description="Choose treatment option." {...stepProps}>
            <div className="space-y-4">
              <SelectInput
                label="Treatment"
                value={state.medicineSelection.medicineChoice}
                onChange={(v) => {
                  dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "medicineChoice", value: v });
                  dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "abilityConfirmed", value: false });
                  dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "courseDays", value: "" });
                }}
                options={[
                  { value: "metronidazole-400", label: "Metronidazole 400mg tablets: 400 mg twice daily for 5 to 7 days (10 to 14 tablets), preferred" },
                  { value: "metronidazole-2g", label: "Metronidazole 400mg tablets: 2 g single oral dose (less effective than the 5 to 7 day course)" },
                  { value: "metronidazole-gel", label: "Metronidazole 0.75% vaginal gel (Zidoval): 5 g at bedtime for 5 nights (1 x 40 g tube), women 18 to 65" },
                ]}
                required
              />
              {state.medicineSelection.medicineChoice === "metronidazole-400" && (
                <SelectInput
                  label="Course length"
                  value={state.medicineSelection.courseDays}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "courseDays", value: v })}
                  options={[
                    { value: "5", label: "5 days (10 tablets)" },
                    { value: "6", label: "6 days (12 tablets)" },
                    { value: "7", label: "7 days (14 tablets)" },
                  ]}
                  required
                />
              )}
              {state.medicineSelection.medicineChoice && (
                <TextInput
                  label="Brand or manufacturer supplied"
                  value={state.medicineSelection.brand}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "brand", value: v })}
                  placeholder={state.medicineSelection.medicineChoice === "metronidazole-gel" ? "Zidoval" : "Manufacturer or brand on the pack"}
                />
              )}
              {state.medicineSelection.medicineChoice && (
                <Checkbox
                  label={isOralChoice(state.medicineSelection.medicineChoice) ? "Patient is able to swallow tablets" : "Patient is able to insert the gel intravaginally"}
                  checked={state.medicineSelection.abilityConfirmed}
                  onChange={(v) => dispatch({ type: "UPDATE_MEDICINE_SELECTION", field: "abilityConfirmed", value: v })}
                  required
                />
              )}
              {doseRecommendation && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                  <p className="font-semibold">{doseRecommendation.medicine}</p>
                  <p>{doseRecommendation.dosingRegimen}</p>
                  <p>Quantity supplied: {quantitySupplied(state)}</p>
                </div>
              )}
            </div>
          </StepWrapper>
        );
      case 6:
        return (
          <StepWrapper title="Counselling & Patient Education" {...stepProps}>
            <div className="space-y-3">
              <Checkbox label="BV symptoms explained (not thrush, not STI)" checked={state.counselling.symptomsExplained} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "symptomsExplained", value: v })} />
              <Checkbox label="Differentiated from thrush (itch indicates thrush)" checked={state.counselling.differentiateThrush} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "differentiateThrush", value: v })} />
              {isOralChoice(state.medicineSelection.medicineChoice) && (
                <Checkbox label="Avoid all alcohol during the course and for 48 hours after the last dose" checked={state.counselling.noAlcoholAdvice} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "noAlcoholAdvice", value: v })} description="Disulfiram-like reaction: flushing, nausea, vomiting, abdominal pain, headache" required />
              )}
              <Checkbox label="Avoid vaginal douching" checked={state.counselling.avoidDouching} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "avoidDouching", value: v })} />
              <Checkbox label="Complete the full course of treatment, even if symptoms resolve" checked={state.counselling.completesCourse} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "completesCourse", value: v })} required />
              <Checkbox label="BV is NOT an STI" checked={state.counselling.notSTI} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "notSTI", value: v })} description="Partner treatment not routinely recommended" required />
              <Checkbox label="BV may recur; if symptoms return within 3 months, contact the GP for reassessment" checked={state.counselling.recurrenceAdvice} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "recurrenceAdvice", value: v })} required />
              <Checkbox label="Sexual contacts/partner notification" checked={state.counselling.sexPartnerAdvice} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "sexPartnerAdvice", value: v })} description="Partners may not require treatment unless they develop symptoms" />
              <Checkbox label="Seek medical advice if symptoms do not resolve within 5 to 7 days of completing treatment, or if new symptoms develop (pelvic pain, fever)" checked={state.counselling.seekAdviceIfNotResolved} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "seekAdviceIfNotResolved", value: v })} required />
              {state.medicineSelection.medicineChoice === "metronidazole-gel" && (
                <Checkbox label="Gel may damage latex condoms and diaphragms: use alternative contraception during treatment and for 5 days after" checked={state.counselling.latexAdvice} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "latexAdvice", value: v })} required />
              )}
              <Checkbox label="Patient information leaflet supplied with the medication" checked={state.counselling.pilSupplied} onChange={(v) => dispatch({ type: "UPDATE_COUNSELLING", field: "pilSupplied", value: v })} required />
              <p className="text-xs text-gray-500">
                Report any adverse effects to your healthcare provider or via the Yellow Card scheme (https://yellowcard.mhra.gov.uk).
              </p>
            </div>
          </StepWrapper>
        );
      case 7:
        return (
          <StepWrapper
            title="Summary & Consultation Record"
            {...stepProps}
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
              <BVSummaryReport state={updatedState} />
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
      {alerts.length > 0 && state.currentStep !== 4 && <AlertBanner alerts={alerts} />}
      {exclusionOutcomeBlock}
      {renderStep()}
    </div>
  );
}
