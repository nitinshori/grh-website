'use client';

import { useReducer, useMemo, useState, useCallback, useEffect } from 'react';
import type {
  AMConsultationState,
  AMAction,
  AMPatientDetails,
  AMTravelAssessment,
  AMMedicalHistory,
  AMMedications,
  AMMedicineSelection,
  AMMedicineChoice,
  AMCounselling,
  AMConsultationSummary,
} from './anti-malarials-types';
import {
  STEP_LABELS,
  TOTAL_STEPS,
  createInitialAMState,
} from './anti-malarials-types';
import {
  generateAMAlerts,
  recommendMedicine,
  describeArm,
  canProceedWithConsultation,
  calculateTripDuration,
  getEligibleMedicineOptions,
  getMefloquineBand,
  AM_PGD_VERSION,
  WEIGHT_BAND_CONVENTION,
  QUANTITY_PACK_ALLOWANCE,
} from './anti-malarials-clinical-logic';
import { validateStep } from './anti-malarials-validation';
import { calculateAge } from '../shared/types';
import { ProgressBar } from '../shared/components/ProgressBar';
import { StepWrapper } from '../shared/components/StepWrapper';
import type { ConsultationRecordData } from '../shared/hooks/useConsultationTracking';
import { AlertBanner } from '../shared/components/AlertBanner';
import { PatientDetailsStep } from '../shared/steps/PatientDetailsStep';
import { ConsentStep } from '../shared/steps/ConsentStep';
import { AntiMalarialsSummaryReport } from './components/AntiMalarialsSummaryReport';
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from '../shared/components/FormInputs';

// ─── Reducer ───

// Any change to the travel, medical-history or medication answers clears the
// chosen arm and its dose. The arm was chosen against the old answers; the
// selector only hides ineligible arms, so a stored choice survived a change
// that excluded it (adversarial review, 11 Sep 2026).
function clearMedicineSelection(state: AMConsultationState): AMConsultationState {
  if (!state.medicineSelection.selectedMedicine) return state;
  return {
    ...state,
    medicineSelection: {
      ...state.medicineSelection,
      selectedMedicine: '',
      dose: '',
      startTiming: '',
      continuationAfterReturn: '',
      quantity: null,
      courseCalculation: '',
      scoredTabletConfirmed: false,
    },
  };
}

function reducer(state: AMConsultationState, action: AMAction): AMConsultationState {
  let newState = { ...state };

  switch (action.type) {
    case 'UPDATE_PATIENT':
      newState.patient = { ...newState.patient, [action.field]: action.value };
      if (action.field === 'dateOfBirth') {
        newState.patient.age = calculateAge(action.value as string);
      }
      break;

    case 'UPDATE_CONSENT':
      newState.consent = { ...newState.consent, [action.field]: action.value };
      break;

    case 'UPDATE_TRAVEL':
      newState.travelAssessment = {
        ...newState.travelAssessment,
        [action.field]: action.value,
      };
      if (action.field === 'departureDate' || action.field === 'returnDate') {
        newState.travelAssessment.tripDuration = calculateTripDuration(
          newState.travelAssessment.departureDate,
          newState.travelAssessment.returnDate
        );
      }
      newState = clearMedicineSelection(newState);
      break;

    case 'UPDATE_MEDICAL_HISTORY':
      newState.medicalHistory = {
        ...newState.medicalHistory,
        [action.field]: action.value,
      };
      if (action.field !== 'allQuestionsAsked') newState = clearMedicineSelection(newState);
      break;

    case 'UPDATE_MEDICATIONS':
      newState.medications = { ...newState.medications, [action.field]: action.value };
      if (action.field !== 'allQuestionsAsked' && action.field !== 'otherDrugsDetails')
        newState = clearMedicineSelection(newState);
      break;

    case 'UPDATE_MEDICINE_SELECTION':
      newState.medicineSelection = {
        ...newState.medicineSelection,
        [action.field]: action.value,
      };
      if (action.field === 'selectedMedicine') {
        // Dose, timing, continuation and quantity are the document's for the
        // chosen arm, weight and itinerary. They are not typed by hand.
        const arm = describeArm(action.value as AMMedicineChoice, newState.travelAssessment);
        newState.medicineSelection = {
          ...newState.medicineSelection,
          dose: arm?.dose ?? '',
          startTiming: arm?.startTiming ?? '',
          continuationAfterReturn: arm?.continuationAfterReturn ?? '',
          quantity: arm?.total ?? null,
          courseCalculation: arm?.quantity ?? '',
          scoredTabletConfirmed: false,
        };
      }
      break;

    case 'UPDATE_COUNSELLING':
      newState.counselling = {
        ...newState.counselling,
        [action.field]: action.value,
      };
      break;

    case 'UPDATE_SUMMARY':
      newState.summary = { ...newState.summary, [action.field]: action.value };
      break;

    case 'SET_STEP':
      newState.currentStep = action.step;
      break;

    case 'NEXT_STEP':
      if (newState.currentStep < TOTAL_STEPS - 1) {
        newState.currentStep++;
      }
      break;

    case 'PREV_STEP':
      if (newState.currentStep > 0) {
        newState.currentStep--;
      }
      break;

    case 'RESET':
      return createInitialAMState();
  }

  return newState;
}

// ─── Main Client Component ───

export function AntiMalarialsClient() {
  const [state, dispatch] = useReducer(reducer, createInitialAMState());
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

  // ─── Compute alerts and validation ───

  const alerts = useMemo(() => {
    return generateAMAlerts(
      state.patient,
      state.travelAssessment,
      state.medicalHistory,
      state.medications
    );
  }, [state.patient, state.travelAssessment, state.medicalHistory, state.medications]);

  const isBlocked = !canProceedWithConsultation(alerts);

  // A stop anywhere disables Next on every step, not only the review step.
  const validationError = useMemo(() => {
    if (isBlocked) return 'Exclusion criteria met: this consultation cannot proceed under the PGD. Record the advice given and save as not supplied.';
    return validateStep(state.currentStep, state);
  }, [state, isBlocked]);

  // ─── Recommendation ───

  const recommendation = useMemo(() => {
    return recommendMedicine(
      state.medicalHistory,
      state.medications,
      state.travelAssessment,
      state.medicineSelection.selectedMedicine
    );
  }, [state.medicalHistory, state.medications, state.travelAssessment, state.medicineSelection.selectedMedicine]);

  // PGD v008: only arms that are not excluded for this patient can be selected.
  const eligibleOptions = useMemo(() => {
    return getEligibleMedicineOptions(
      state.medicalHistory,
      state.medications,
      state.travelAssessment
    );
  }, [state.medicalHistory, state.medications, state.travelAssessment]);

  const mefloquineBand = getMefloquineBand(state.travelAssessment.weightKg);
  const mefloquineDividedDose =
    state.medicineSelection.selectedMedicine === 'mefloquine' &&
    mefloquineBand !== null &&
    mefloquineBand.tabletFraction < 1;
  const selectedArm = state.medicineSelection.selectedMedicine;
  const isAP = selectedArm === 'malarone' || selectedArm === 'malarone-paediatric';
  const isDoxy = selectedArm === 'doxycycline';
  const isMefloquine = selectedArm === 'mefloquine';

  // ─── Navigation handlers ───

  const handleNext = useCallback(() => {
    if (!validationError) {
      setCompletedSteps((prev) => {
        const updated = new Set(prev);
        updated.add(state.currentStep);
        return updated;
      });
      dispatch({ type: 'NEXT_STEP' });
    }
  }, [validationError, state.currentStep]);

  const handlePrev = useCallback(() => {
    dispatch({ type: 'PREV_STEP' });
  }, []);

  // Backwards only; going forward always means pressing Next.
  const handleStepClick = useCallback((step: number) => {
    if (step < state.currentStep) {
      dispatch({ type: 'SET_STEP', step });
    }
  }, [state.currentStep]);

  // ─── Handlers by step ───

  const handlePatientChange = (field: keyof AMPatientDetails, value: any) => {
    dispatch({ type: 'UPDATE_PATIENT', field, value });
  };

  const handleConsentChange = (field: string, value: any) => {
    dispatch({ type: 'UPDATE_CONSENT', field: field as any, value });
  };

  const handleTravelChange = (field: keyof AMTravelAssessment, value: any) => {
    dispatch({ type: 'UPDATE_TRAVEL', field, value });
  };

  const handleMedicalChange = (field: keyof AMMedicalHistory, value: any) => {
    dispatch({ type: 'UPDATE_MEDICAL_HISTORY', field, value });
  };

  const handleMedicationsChange = (field: keyof AMMedications, value: any) => {
    dispatch({ type: 'UPDATE_MEDICATIONS', field, value });
  };

  const handleMedicineChange = (field: keyof AMMedicineSelection, value: any) => {
    dispatch({ type: 'UPDATE_MEDICINE_SELECTION', field, value });
  };

  const handleCounsellingChange = (field: keyof AMCounselling, value: boolean) => {
    dispatch({ type: 'UPDATE_COUNSELLING', field, value });
  };

  const handleSummaryChange = (field: keyof AMConsultationSummary, value: any) => {
    dispatch({ type: 'UPDATE_SUMMARY', field, value });
  };

  // ─── Consultation Record Data (for saving to database) ───
  // Returns a record on every step, including before a medicine is chosen,
  // so an excluded patient can be saved as "not supplied" from any step.
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    const arm = state.medicineSelection.selectedMedicine
      ? describeArm(state.medicineSelection.selectedMedicine, state.travelAssessment)
      : null;
    const supplied = !isBlocked && !!arm;
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
      clinicalData: {
        ...(state as unknown as Record<string, unknown>),
        alerts,
        pgdVersion: AM_PGD_VERSION,
      },
      outcome: isBlocked ? 'not_supplied' : 'completed',
      medicine: supplied && arm
        ? {
            name: arm.medicine,
            dose: arm.dose,
            duration: `${arm.startTiming}; ${arm.continuationAfterReturn}`,
            quantity: state.medicineSelection.quantity ?? undefined,
          }
        : undefined,
      summary: {
        pharmacistName: state.summary.pharmacistName || __pharmProfile?.name || '',
        pharmacistGPhC: state.summary.pharmacistGPhC || __pharmProfile?.gphcNumber || '',
        pharmacyName: state.summary.pharmacyName || __pharmProfile?.pharmacyName,
        pharmacyAddress: state.summary.pharmacyAddress || __pharmProfile?.pharmacyAddress,
        consultationDate: state.summary.consultationDate,
        consultationTime: state.summary.consultationTime,
        clinicalNotes: state.summary.clinicalNotes,
      },
      consent: { notifyGp: state.consent.notifyGp },
    };
  }, [state, isBlocked, alerts, __pharmProfile]);

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
  }, []);


  // ─── Render ───

  return (
    <div className="space-y-8">
      {/* Progress Bar and live alerts: screen only; the printed record is the summary report on the last step */}
      <div className="space-y-8 print:hidden">
        <ProgressBar
          stepLabels={STEP_LABELS}
          currentStep={state.currentStep}
          onStepClick={handleStepClick}
          completedSteps={completedSteps}
          hasErrors={!!validationError}
        />
        {alerts.length > 0 && (
          <AlertBanner alerts={alerts} />
        )}
      </div>

      {/* Step 0: Patient Details */}
      {state.currentStep === 0 && (
        <StepWrapper
          title="Patient Details"
          currentStep={state.currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={!validationError}
          validationError={validationError}
          isBlocked={isBlocked}
          getConsultationData={getConsultationData}
        >
          <PatientDetailsStep
            patient={state.patient}
            onChange={handlePatientChange}
            requireAdult={false}
          />
        </StepWrapper>
      )}

      {/* Step 1: Consent */}
      {state.currentStep === 1 && (
        <StepWrapper
          title="Consent & ID Verification"
          currentStep={state.currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={!validationError}
          validationError={validationError}
          isBlocked={isBlocked}
          getConsultationData={getConsultationData}
        >
          <ConsentStep
            consent={state.consent}
            onChange={handleConsentChange}
          />
        </StepWrapper>
      )}

      {/* Step 2: Travel Assessment */}
      {state.currentStep === 2 && (
        <StepWrapper
          title="Travel Assessment"
          currentStep={state.currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={!validationError}
          validationError={validationError}
          isBlocked={isBlocked}
          getConsultationData={getConsultationData}
        >
          <div className="space-y-6">
            <TextInput
              label="Destination Country"
              value={state.travelAssessment.destinationCountry}
              onChange={(v) => handleTravelChange('destinationCountry', v)}
              placeholder="e.g. Kenya, Thailand"
            />
            <TextInput
              label="Departure Date"
              type="date"
              value={state.travelAssessment.departureDate}
              onChange={(v) => handleTravelChange('departureDate', v)}
            />
            <TextInput
              label="Return Date"
              type="date"
              value={state.travelAssessment.returnDate}
              onChange={(v) => handleTravelChange('returnDate', v)}
            />
            {state.travelAssessment.tripDuration !== null && (
              <p className="text-xs text-gray-600">
                Days in the malarious area: {state.travelAssessment.tripDuration} (counted inclusively: the day of
                arrival and the day of departure both count, because a dose is due on each)
              </p>
            )}

            <Checkbox
              label="Destination risk assessment completed"
              checked={state.travelAssessment.riskAssessmentCompleted}
              onChange={(v) => handleTravelChange('riskAssessmentCompleted', v)}
              description="Checked current NaTHNaC / TravelHealthPro country guidance for this itinerary and chemoprophylaxis is recommended. Do not work from memory. If the destination does not require chemoprophylaxis, do not supply."
              required
            />
            <TextInput
              label="Source consulted for the destination recommendation"
              value={state.travelAssessment.riskAssessmentSource}
              onChange={(v) => handleTravelChange('riskAssessmentSource', v)}
              placeholder="e.g. TravelHealthPro country page, date checked, agent recommended"
              required
            />

            <NumberInput
              label="Body weight (kg), measured and recorded"
              value={state.travelAssessment.weightKg}
              onChange={(v) => handleTravelChange('weightKg', v)}
              min={1}
              max={300}
              unit="kg"
              placeholder="e.g. 70"
              required
            />
            <p className="text-xs text-gray-600">
              Weight determines the product strength and dose: atovaquone/proguanil adult tablet only over 40kg
              (paediatric 62.5mg/25mg tablets from 11 to 40kg); mefloquine one tablet weekly over 45kg, with divided
              doses below that. Decimals are accepted (for example 40.5). {WEIGHT_BAND_CONVENTION}
            </p>

            <Checkbox
              label="Able and willing to complete the full course"
              checked={state.travelAssessment.willingToCompleteCourse}
              onChange={(v) => handleTravelChange('willingToCompleteCourse', v)}
              description="Able to take the dose for the whole course including the post-travel tail (7 days after leaving for atovaquone/proguanil; 4 weeks for doxycycline and mefloquine)."
              required
            />

            <Checkbox
              label="Previous Malaria Prophylaxis"
              checked={state.travelAssessment.previousMalariaProphylaxis}
              onChange={(v) =>
                handleTravelChange('previousMalariaProphylaxis', v)
              }
              description="Has the patient used antimalarial prophylaxis before?"
            />

            {state.travelAssessment.previousMalariaProphylaxis && (
              <TextInput
                label="Which Prophylaxis Was Used?"
                value={state.travelAssessment.previousProphylaxisType}
                onChange={(v) =>
                  handleTravelChange('previousProphylaxisType', v)
                }
                placeholder="e.g. Malarone, Doxycycline, Mefloquine"
              />
            )}

            <Checkbox
              label="Currently Pregnant"
              checked={state.travelAssessment.currentlyPregnant}
              onChange={(v) => handleTravelChange('currentlyPregnant', v)}
              description="Exclusion for every arm of this PGD. Refer for individual specialist assessment."
            />

            <Checkbox
              label="Planning Pregnancy"
              checked={state.travelAssessment.planningPregnancy}
              onChange={(v) => handleTravelChange('planningPregnancy', v)}
              description="Is the patient planning to become pregnant soon?"
            />

            <Checkbox
              label="Currently Breastfeeding"
              checked={state.travelAssessment.breastfeeding}
              onChange={(v) => handleTravelChange('breastfeeding', v)}
              description="Exclusion for every arm of this PGD. Refer for individual specialist assessment."
            />
          </div>
        </StepWrapper>
      )}

      {/* Step 3: Medical History */}
      {state.currentStep === 3 && (
        <StepWrapper
          title="Medical History"
          currentStep={state.currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={!validationError}
          validationError={validationError}
          isBlocked={isBlocked}
          getConsultationData={getConsultationData}
        >
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Fever and malaria (exclusion for every arm)
            </p>
            <Checkbox
              label="Febrile illness now, or suspected or confirmed malaria"
              checked={state.medicalHistory.currentFeverOrSuspectedMalaria}
              onChange={(v) => handleMedicalChange('currentFeverOrSuspectedMalaria', v)}
              description="This PGD covers PROPHYLAXIS ONLY. Malaria is a medical emergency: refer the same day for a blood film."
            />
            <Checkbox
              label="Fever in the last 12 months after travel to a malarious area, not investigated with a malaria blood film"
              checked={state.medicalHistory.uninvestigatedPostTravelFever}
              onChange={(v) => handleMedicalChange('uninvestigatedPostTravelFever', v)}
              description="Excludes and refers the same day."
            />

            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide pt-2">
              Organ function
            </p>
            <Checkbox
              label="Renal impairment, kidney disease or dialysis"
              checked={state.medicalHistory.severeRenalImpairment}
              onChange={(v) =>
                handleMedicalChange('severeRenalImpairment', v)
              }
              description="Known severe renal impairment (eGFR below 30), or the patient reports kidney disease or dialysis. Excludes atovaquone/proguanil; refer for that agent."
            />
            <Checkbox
              label="Severe Hepatic Impairment"
              checked={state.medicalHistory.severeHepaticImpairment}
              onChange={(v) =>
                handleMedicalChange('severeHepaticImpairment', v)
              }
              description="Cirrhosis or severe liver disease. Excludes doxycycline and mefloquine."
            />

            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide pt-2">
              Neurological and psychiatric (mefloquine)
            </p>
            <Checkbox
              label="Epilepsy or any seizure disorder"
              checked={state.medicalHistory.epilepsy}
              onChange={(v) => handleMedicalChange('epilepsy', v)}
              description="Epilepsy, convulsions of any origin or any seizure disorder. Absolute exclusion for mefloquine."
            />
            <Checkbox
              label="Any current or previous psychiatric disorder"
              checked={state.medicalHistory.psychiatricHistory}
              onChange={(v) =>
                handleMedicalChange('psychiatricHistory', v)
              }
              description="Including depression, anxiety, psychosis, or a suicide attempt at any time. Absolute exclusion for mefloquine."
            />
            <Checkbox
              label="Occupation requiring fine coordination or spatial discrimination"
              checked={state.medicalHistory.pilotOrDiver}
              onChange={(v) => handleMedicalChange('pilotOrDiver', v)}
              description="Such as pilots and divers. Excludes mefloquine; refer for that agent."
            />

            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide pt-2">
              Cardiac (mefloquine)
            </p>
            <Checkbox
              label="QT prolongation, family history of it, or taking QT-prolonging medicines"
              checked={state.medicalHistory.qTprolongation}
              onChange={(v) => handleMedicalChange('qTprolongation', v)}
              description="Known QT prolongation, a family history of it, or concurrent QT-prolonging medicines. Excludes mefloquine."
            />
            <Checkbox
              label="Cardiac conduction disorder or arrhythmia, or family history of one"
              checked={state.medicalHistory.arrhythmia}
              onChange={(v) => handleMedicalChange('arrhythmia', v)}
              description="Known cardiac conduction disorder, or a family history of one. Excludes mefloquine."
            />

            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide pt-2">
              Allergy and other conditions
            </p>
            <Checkbox
              label="Hypersensitivity to atovaquone or proguanil"
              checked={state.medicalHistory.atovaquoneProguanilAllergy}
              onChange={(v) => handleMedicalChange('atovaquoneProguanilAllergy', v)}
              description="Excludes atovaquone/proguanil."
            />
            <Checkbox
              label="Hypersensitivity to doxycycline or other tetracyclines"
              checked={state.medicalHistory.tetracyclineAllergy}
              onChange={(v) => handleMedicalChange('tetracyclineAllergy', v)}
              description="Excludes doxycycline."
            />
            <Checkbox
              label="Hypersensitivity to mefloquine, quinine or quinidine"
              checked={state.medicalHistory.mefloquineQuinineAllergy}
              onChange={(v) => handleMedicalChange('mefloquineQuinineAllergy', v)}
              description="Excludes mefloquine."
            />
            <Checkbox
              label="History of Blackwater fever"
              checked={state.medicalHistory.blackwaterFever}
              onChange={(v) => handleMedicalChange('blackwaterFever', v)}
              description="Excludes mefloquine."
            />
            <Checkbox
              label="Systemic lupus erythematosus, myasthenia gravis or porphyria"
              checked={state.medicalHistory.lupusMyastheniaPorphyria}
              onChange={(v) => handleMedicalChange('lupusMyastheniaPorphyria', v)}
              description="Excludes doxycycline."
            />
            <Checkbox
              label="Photosensitivity"
              checked={state.medicalHistory.photosensitivity}
              onChange={(v) =>
                handleMedicalChange('photosensitivity', v)
              }
              description="History of photosensitive reactions (caution with doxycycline)"
            />
            <Checkbox
              label="G6PD Deficiency"
              checked={state.medicalHistory.g6pdDeficiency}
              onChange={(v) => handleMedicalChange('g6pdDeficiency', v)}
              description="Glucose-6-phosphate dehydrogenase deficiency (all three agents can be used; record it)"
            />

            <div className="pt-3 border-t border-gray-200">
              <Checkbox
                label="I have asked the patient every question on this page, and none applies unless ticked above"
                checked={state.medicalHistory.allQuestionsAsked}
                onChange={(v) => handleMedicalChange('allQuestionsAsked', v)}
                description="Every exclusion on this page defaults to absent. This confirmation is what makes the record's negative answers true."
                required
              />
            </div>
          </div>
        </StepWrapper>
      )}

      {/* Step 4: Current Medications */}
      {state.currentStep === 4 && (
        <StepWrapper
          title="Current Medications"
          currentStep={state.currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={!validationError}
          validationError={validationError}
          isBlocked={isBlocked}
          getConsultationData={getConsultationData}
        >
          <div className="space-y-4">
            <Checkbox
              label="Warfarin (Anticoagulant)"
              checked={state.medications.takesWarfarin}
              onChange={(v) => handleMedicationsChange('takesWarfarin', v)}
              description="Excludes atovaquone/proguanil and doxycycline: refer for INR monitoring rather than supplying."
            />
            <Checkbox
              label="Rifampicin or rifabutin"
              checked={state.medications.takesRifampicinOrRifabutin}
              onChange={(v) => handleMedicationsChange('takesRifampicinOrRifabutin', v)}
              description="Reduce atovaquone concentrations (excludes atovaquone/proguanil); rifampicin also reduces doxycycline (excludes doxycycline). Refer."
            />
            <Checkbox
              label="Metoclopramide or tetracycline"
              checked={state.medications.takesMetoclopramideOrTetracycline}
              onChange={(v) => handleMedicationsChange('takesMetoclopramideOrTetracycline', v)}
              description="Reduce atovaquone concentrations. Excludes atovaquone/proguanil; refer."
            />
            <Checkbox
              label="Antiretroviral therapy or pyrimethamine"
              checked={state.medications.takesAntiretroviralsOrPyrimethamine}
              onChange={(v) => handleMedicationsChange('takesAntiretroviralsOrPyrimethamine', v)}
              description="Efavirenz, other NNRTIs or boosted protease inhibitors, or pyrimethamine. Excludes atovaquone/proguanil; refer."
            />
            <Checkbox
              label="Carbamazepine, phenytoin or phenobarbital"
              checked={state.medications.takesCarbamazepinePhenytoinPhenobarbital}
              onChange={(v) => handleMedicationsChange('takesCarbamazepinePhenytoinPhenobarbital', v)}
              description="Reduce doxycycline concentrations (excludes doxycycline) and are anticonvulsants (excludes mefloquine). Refer."
            />
            <Checkbox
              label="Any other anticonvulsant"
              checked={state.medications.takesOtherAnticonvulsant}
              onChange={(v) => handleMedicationsChange('takesOtherAnticonvulsant', v)}
              description="Excludes mefloquine."
            />
            <Checkbox
              label="Bupropion, or any other medicine that lowers the seizure threshold"
              checked={state.medications.takesBupropionOrSeizureLowering}
              onChange={(v) => handleMedicationsChange('takesBupropionOrSeizureLowering', v)}
              description="Excludes mefloquine; refer."
            />
            <Checkbox
              label="Halofantrine or ketoconazole (taking or planning to take)"
              checked={state.medications.takesHalofantrineOrKetoconazole}
              onChange={(v) => handleMedicationsChange('takesHalofantrineOrKetoconazole', v)}
              description="Excludes mefloquine."
            />
            <Checkbox
              label="Isotretinoin"
              checked={state.medications.takesIsotretinoin}
              onChange={(v) => handleMedicationsChange('takesIsotretinoin', v)}
              description="Excludes doxycycline; refer."
            />
            <Checkbox
              label="Oral Contraception"
              checked={state.medications.takesOralContraception}
              onChange={(v) =>
                handleMedicationsChange('takesOralContraception', v)
              }
              description="Doxycycline is non-enzyme-inducing: no extra precautions unless vomiting or diarrhoea occur"
            />
            <Checkbox
              label="Antacids, iron, zinc or bismuth preparations"
              checked={state.medications.takesAntacids}
              onChange={(v) => handleMedicationsChange('takesAntacids', v)}
              description="Separate from doxycycline by at least 2 hours"
            />
            <Checkbox
              label="Other Medications"
              checked={state.medications.takesOtherDrugs}
              onChange={(v) => handleMedicationsChange('takesOtherDrugs', v)}
              description="Any other regular medications?"
            />

            {state.medications.takesOtherDrugs && (
              <TextInput
                label="Please Specify Other Medications"
                value={state.medications.otherDrugsDetails}
                onChange={(v) =>
                  handleMedicationsChange('otherDrugsDetails', v)
                }
                placeholder="e.g. metformin, atorvastatin"
              />
            )}

            <div className="pt-3 border-t border-gray-200">
              <Checkbox
                label="I have asked about every medicine on this page, and none applies unless ticked above"
                checked={state.medications.allQuestionsAsked}
                onChange={(v) => handleMedicationsChange('allQuestionsAsked', v)}
                description="Every interaction on this page defaults to absent. This confirmation is what makes the record's negative answers true."
                required
              />
            </div>
          </div>
        </StepWrapper>
      )}

      {/* Step 5: Contraindications Review */}
      {state.currentStep === 5 && (
        <StepWrapper
          title="Contraindications Review"
          description="Based on clinical assessment, the following contraindications have been identified:"
          currentStep={state.currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={!isBlocked}
          validationError={isBlocked ? 'Hard stop alerts present. Consultation cannot proceed.' : null}
          isBlocked={isBlocked}
          getConsultationData={getConsultationData}
        >
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✓ No contraindications identified. Proceed with medicine selection.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      alert.severity === 'stop'
                        ? 'bg-red-50 border-red-200'
                        : alert.severity === 'caution'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-orange-50 border-orange-200'
                    }`}
                  >
                    <p className="font-medium text-sm mb-1">
                      {alert.severity === 'stop' && '🛑 '}
                      {alert.severity === 'caution' && '⚠️ '}
                      {alert.severity === 'red-flag' && '🚩 '}
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-700">{alert.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </StepWrapper>
      )}

      {/* Step 6: Medicine Selection */}
      {state.currentStep === 6 && (
        <StepWrapper
          title="Medicine Selection"
          currentStep={state.currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={!validationError}
          validationError={validationError}
          isBlocked={isBlocked}
          getConsultationData={getConsultationData}
        >
          {isBlocked ? (
            <BlockedPanel />
          ) : (
          <div className="space-y-6">
            <p className="text-xs text-gray-600">
              {AM_PGD_VERSION}. Only arms not excluded for this patient are offered. Use current
              NaTHNaC / TravelHealthPro guidance to choose between them. Dose, timing and the calculated
              course are the PGD&apos;s for the chosen arm, weight and itinerary and are not edited here.
            </p>

            <SelectInput
              label="Selected Medicine (name, form and strength)"
              value={state.medicineSelection.selectedMedicine}
              onChange={(v) => handleMedicineChange('selectedMedicine', v as AMMedicineSelection['selectedMedicine'])}
              options={[
                { value: '', label: 'Select a medicine...' },
                ...eligibleOptions,
              ]}
              required
            />

            {state.medicineSelection.selectedMedicine && recommendation && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium text-sm text-blue-900 mb-2">
                  Regimen per the PGD for this arm, weight band and itinerary
                </p>
                <p className="text-sm text-blue-800 mb-3">
                  <strong>{recommendation.medicine}</strong>
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>
                    <strong>Dose:</strong> {state.medicineSelection.dose}
                  </li>
                  <li>
                    <strong>Start:</strong> {state.medicineSelection.startTiming}
                  </li>
                  <li>
                    <strong>Continue:</strong>{' '}
                    {state.medicineSelection.continuationAfterReturn}
                  </li>
                  <li>
                    <strong>Calculated course:</strong> {state.medicineSelection.courseCalculation}
                  </li>
                  <li>
                    <strong>Maximum treatment period:</strong> {recommendation.maxPeriod}
                  </li>
                  <li>{recommendation.reason}</li>
                </ul>
              </div>
            )}

            {state.medicineSelection.selectedMedicine && recommendation && (
              <div>
                <NumberInput
                  label={`Quantity supplied (${recommendation.unit})`}
                  value={state.medicineSelection.quantity}
                  onChange={(v) => handleMedicineChange('quantity', v)}
                  min={recommendation.total ?? 1}
                  max={(recommendation.total ?? 0) + QUANTITY_PACK_ALLOWANCE}
                  unit={recommendation.unit}
                  required
                />
                <p className="text-xs text-gray-600 mt-1">
                  Pre-filled with the calculated course
                  {recommendation.total !== null ? ` of ${recommendation.total} ${recommendation.unit}` : ''}. A
                  smaller quantity is refused; up to one extra pack ({QUANTITY_PACK_ALLOWANCE}) above it is accepted
                  for pack rounding.
                </p>
              </div>
            )}

            {mefloquineDividedDose && (
              <Checkbox
                label="Product held is a scored tablet"
                checked={state.medicineSelection.scoredTabletConfirmed}
                onChange={(v) => handleMedicineChange('scoredTabletConfirmed', v)}
                description="A divided mefloquine dose may only be supplied from a scored tablet. If it is not scored, refer."
                required
              />
            )}

            <TextInput
              label="Batch number"
              value={state.medicineSelection.batchNumber}
              onChange={(v) => handleMedicineChange('batchNumber', v)}
              placeholder="From the pack supplied"
              required
            />
            <TextInput
              label="Expiry date"
              type="date"
              value={state.medicineSelection.expiryDate}
              onChange={(v) => handleMedicineChange('expiryDate', v)}
              required
            />

            <TextArea
              label="Clinical Reason for Selection"
              value={state.medicineSelection.reason}
              onChange={(v) => handleMedicineChange('reason', v)}
              placeholder="Which agent was chosen and why, including why any alternative was unsuitable..."
              rows={4}
              required
            />
          </div>
          )}
        </StepWrapper>
      )}

      {/* Step 7: Counselling */}
      {state.currentStep === 7 && (
        <StepWrapper
          title="Counselling & Follow-up"
          description="Confirm that all counselling points have been discussed:"
          currentStep={state.currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={!validationError}
          validationError={validationError}
          isBlocked={isBlocked}
          getConsultationData={getConsultationData}
        >
          {isBlocked ? (
            <BlockedPanel />
          ) : (
          <div className="space-y-3">
            <Checkbox
              label="How to take it"
              checked={state.counselling.takeWithFood}
              onChange={(v) => handleCounsellingChange('takeWithFood', v)}
              description={
                isAP
                  ? 'Every day at the same time, with food or a milky drink; missing doses or an empty stomach reduces protection.'
                  : isDoxy
                    ? 'With plenty of water, sitting or standing, not just before bed.'
                    : 'On the SAME DAY each week, with food and plenty of water.'
              }
            />
            <Checkbox
              label="Keep taking it after leaving the malaria area"
              checked={state.counselling.completeCourseAdvised}
              onChange={(v) => handleCounsellingChange('completeCourseAdvised', v)}
              description={
                (isAP ? '7 DAYS after leaving. ' : 'FOUR WEEKS after leaving. ') +
                'Stopping when you get home is the commonest reason prophylaxis fails.'
              }
            />
            {isDoxy && (
              <Checkbox
                label="Sun protection advice (doxycycline)"
                checked={state.counselling.sunProtectionAdvice}
                onChange={(v) =>
                  handleCounsellingChange('sunProtectionAdvice', v)
                }
                description="You will burn much more easily in the sun. Use high-factor sunscreen, cover up and avoid midday sun. Apply sunscreen first, then repellent."
                required
              />
            )}
            <Checkbox
              label="Bite avoidance (given and recorded in every case)"
              checked={state.counselling.bitePrevention}
              onChange={(v) => handleCounsellingChange('bitePrevention', v)}
              description="No tablet is completely effective. Repellent containing 20 to 30% DEET or 20% picaridin, cover arms and legs from dusk onwards, sleep under an insecticide-treated net where accommodation is not screened or air-conditioned."
            />
            <div className="rounded-lg border border-gray-200 p-3 space-y-1">
              <Checkbox
                label="Pregnancy / breastfeeding implications discussed"
                checked={state.counselling.pregnancyAdvice}
                onChange={(v) => {
                  handleCounsellingChange('pregnancyAdvice', v);
                  if (v) handleCounsellingChange('pregnancyAdviceNotApplicable', false);
                }}
                description="Implications if the patient becomes pregnant while taking it, and that pregnancy or breastfeeding would take them outside this PGD."
              />
              <Checkbox
                label="Not applicable to this patient"
                checked={state.counselling.pregnancyAdviceNotApplicable}
                onChange={(v) => {
                  handleCounsellingChange('pregnancyAdviceNotApplicable', v);
                  if (v) handleCounsellingChange('pregnancyAdvice', false);
                }}
                description="For example a male patient. One of the two boxes must be ticked."
              />
            </div>
            <Checkbox
              label={isAP ? 'Vomited dose and food' : isDoxy ? 'Antacids, iron, milk and candidiasis' : 'Vomiting and diarrhoea'}
              checked={state.counselling.diarrhoeaManagement}
              onChange={(v) =>
                handleCounsellingChange('diarrhoeaManagement', v)
              }
              description={
                isAP
                  ? 'If you are sick within an hour of a dose, take another one.'
                  : isDoxy
                    ? 'Avoid indigestion remedies, iron tablets and milk within 2 hours of a dose; may increase vaginal candidiasis, consider advising women to carry treatment.'
                    : 'Vomiting or diarrhoea may reduce absorption; seek advice if a weekly dose is vomited within an hour.'
              }
            />
            <Checkbox
              label="Post-travel fever warning (verbal and written)"
              checked={state.counselling.feverManagement}
              onChange={(v) => handleCounsellingChange('feverManagement', v)}
              description="If you develop a fever at any time up to a YEAR after returning, seek medical help immediately and say you have been to a malaria area. Malaria can kill within 24 hours. A traveller who took their tablets correctly can still develop malaria."
            />
            <Checkbox
              label="Side effects explained"
              checked={state.counselling.sideEffectsExplained}
              onChange={(v) =>
                handleCounsellingChange('sideEffectsExplained', v)
              }
              description="Common side effects for the agent supplied and when to contact pharmacist/doctor. Report suspected side effects via Yellow Card."
            />
            {isMefloquine && (
              <Checkbox
                label="Mefloquine: STOP at the first neuropsychiatric symptom"
                checked={state.counselling.mefloquineStopAdvice}
                onChange={(v) => handleCounsellingChange('mefloquineStopAdvice', v)}
                description="STOP TAKING IT and seek advice if you become anxious, low in mood, restless, confused, or feel not yourself, or if you develop insomnia, vivid or abnormal dreams or nightmares. Do not wait to see if it settles. Contact the pharmacy if any symptom develops before travel so an alternative can be arranged in time."
                required
              />
            )}
            <Checkbox
              label="When to seek help"
              checked={state.counselling.whenToSeekHelp}
              onChange={(v) => handleCounsellingChange('whenToSeekHelp', v)}
              description="Any fever during or after travel: seek urgent medical attention and say where you have been. No routine follow-up otherwise."
            />
            <Checkbox
              label="Written information provided"
              checked={state.counselling.medicineCardProvided}
              onChange={(v) =>
                handleCounsellingChange('medicineCardProvided', v)
              }
              description="Patient information leaflet for the product and strength given, the Get Real Health bite avoidance and post-travel fever sheet, and for mefloquine the manufacturer alert card where provided."
            />
          </div>
          )}
        </StepWrapper>
      )}

      {/* Step 8: Summary */}
      {state.currentStep === 8 && (
        <StepWrapper
          title="Summary & Print"
          currentStep={state.currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={!validationError}
          validationError={validationError}
          isBlocked={isBlocked}
          getConsultationData={getConsultationData}
          onNewConsultation={handleNewConsultation}
        >
          {isBlocked ? (
            <BlockedPanel />
          ) : (
          <div className="space-y-6">
            <div className="space-y-6 print:hidden">
              <TextInput
                label="Pharmacist Name"
                value={state.summary.pharmacistName}
                onChange={(v) => handleSummaryChange('pharmacistName', v)}
                placeholder="Full name"
                required
              />
              <TextInput
                label="GPhC Registration Number"
                value={state.summary.pharmacistGPhC}
                onChange={(v) => handleSummaryChange('pharmacistGPhC', v)}
                placeholder="e.g. 2123456"
                required
              />
              <TextInput
                label="Pharmacy Name"
                value={state.summary.pharmacyName}
                onChange={(v) => handleSummaryChange('pharmacyName', v)}
                placeholder="Pharmacy name"
                required
              />
              <TextInput
                label="Pharmacy Address"
                value={state.summary.pharmacyAddress}
                onChange={(v) => handleSummaryChange('pharmacyAddress', v)}
                placeholder="Full address"
              />
              <TextArea
                label="Clinical Notes"
                value={state.summary.clinicalNotes}
                onChange={(v) => handleSummaryChange('clinicalNotes', v)}
                placeholder="Any additional clinical notes or observations..."
                rows={4}
              />
            </div>

            {/* The printed record. This is what Save & Print prints; the form above is print:hidden. */}
            <AntiMalarialsSummaryReport state={state} alerts={alerts} />
          </div>
          )}
        </StepWrapper>
      )}
    </div>
  );
}

// Shown in place of the form on any step reached with a stop on screen.
function BlockedPanel() {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
      <p className="text-sm font-semibold text-red-800">
        Exclusion criteria met: no medicine can be supplied under this PGD.
      </p>
      <p className="text-xs text-red-700">
        Go back to the Contraindications Review to see the reason. Give bite avoidance and post-travel fever
        advice regardless, refer as the alert directs, and use &quot;Save as not supplied&quot; to record the
        consultation and the advice given.
      </p>
    </div>
  );
}
