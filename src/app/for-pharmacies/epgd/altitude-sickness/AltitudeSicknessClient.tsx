'use client';

import { useReducer, useMemo, useState, useCallback, useEffect } from 'react';
import type {
  ASConsultationState,
  ASAction,
  ASPatientDetails,
  ASTravelAssessment,
  ASMedicalHistory,
  ASMedications,
  ASMedicineSelection,
  ASCounselling,
  ASConsultationSummary,
} from './altitude-sickness-types';
import {
  STEP_LABELS,
  TOTAL_STEPS,
  createInitialASState,
} from './altitude-sickness-types';
import {
  generateASAlerts,
  recommendMedicine,
  canProceedWithConsultation,
  maxQuantityTablets,
  calculateASQuantity,
  AS_PGD_VERSION,
} from './altitude-sickness-clinical-logic';
import { validateStep } from './altitude-sickness-validation';
import { calculateAge } from '../shared/types';
import { ProgressBar } from '../shared/components/ProgressBar';
import { StepWrapper } from '../shared/components/StepWrapper';
import type { ConsultationRecordData } from '../shared/hooks/useConsultationTracking';
import { AlertBanner } from '../shared/components/AlertBanner';
import { PatientDetailsStep } from '../shared/steps/PatientDetailsStep';
import { ConsentStep } from '../shared/steps/ConsentStep';
import { AltitudeSicknessSummaryReport } from './components/AltitudeSicknessSummaryReport';
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
// chosen medicine, its regimen and quantity, because they were set against
// the old answers (adversarial review, 11 Sep 2026: 20 tablets saved against
// a treatment indication whose ceiling is 6).
function clearMedicineSelection(state: ASConsultationState): ASConsultationState {
  if (!state.medicineSelection.selectedMedicine && state.medicineSelection.quantityTablets === null) return state;
  return {
    ...state,
    medicineSelection: {
      ...state.medicineSelection,
      selectedMedicine: '',
      dose: '',
      startTiming: '',
      continuationTiming: '',
      includeTreatmentCourse: false,
      quantityTablets: null,
    },
  };
}

function reducer(state: ASConsultationState, action: ASAction): ASConsultationState {
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

    case 'UPDATE_MEDICINE_SELECTION': {
      newState.medicineSelection = {
        ...newState.medicineSelection,
        [action.field]: action.value,
      };
      // The regimen is the document's for the purpose, and the quantity is
      // calculated from the itinerary. Neither is typed by hand.
      if (action.field === 'selectedMedicine' || action.field === 'includeTreatmentCourse') {
        const regimen = newState.medicineSelection.selectedMedicine
          ? recommendMedicine(newState.medicalHistory, newState.medications, newState.travelAssessment)
          : null;
        const calc = calculateASQuantity(newState.travelAssessment, newState.medicineSelection.includeTreatmentCourse);
        newState.medicineSelection = {
          ...newState.medicineSelection,
          dose: regimen?.dose ?? '',
          startTiming: regimen?.startTiming ?? '',
          continuationTiming: regimen?.continuationTiming ?? '',
          quantityTablets: newState.medicineSelection.selectedMedicine ? calc.total : null,
        };
      }
      break;
    }

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
      return createInitialASState();
  }

  return newState;
}

// ─── Main Client Component ───

export function AltitudeSicknessClient() {
  const [state, dispatch] = useReducer(reducer, createInitialASState());
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
    return generateASAlerts(
      state.medicalHistory,
      state.medications,
      state.travelAssessment
    );
  }, [state.medicalHistory, state.medications, state.travelAssessment]);

  const isBlocked = !canProceedWithConsultation(alerts);

  // A stop anywhere disables Next on every step, not only the review step.
  const validationError = useMemo(() => {
    if (isBlocked) return 'Exclusion criteria met: acetazolamide cannot be supplied under the PGD. Record the advice given and save as not supplied.';
    return validateStep(state.currentStep, state);
  }, [state, isBlocked]);

  // ─── Recommendation ───

  const recommendation = useMemo(() => {
    return recommendMedicine(
      state.medicalHistory,
      state.medications,
      state.travelAssessment
    );
  }, [state.medicalHistory, state.medications, state.travelAssessment]);

  const quantityCalc = useMemo(
    () => calculateASQuantity(state.travelAssessment, state.medicineSelection.includeTreatmentCourse),
    [state.travelAssessment, state.medicineSelection.includeTreatmentCourse]
  );

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

  const handlePatientChange = (field: keyof ASPatientDetails, value: any) => {
    dispatch({ type: 'UPDATE_PATIENT', field, value });
  };

  const handleConsentChange = (field: string, value: any) => {
    dispatch({ type: 'UPDATE_CONSENT', field: field as any, value });
  };

  const handleTravelChange = (field: keyof ASTravelAssessment, value: any) => {
    dispatch({ type: 'UPDATE_TRAVEL', field, value });
  };

  const handleMedicalChange = (field: keyof ASMedicalHistory, value: any) => {
    dispatch({ type: 'UPDATE_MEDICAL_HISTORY', field, value });
  };

  const handleMedicationsChange = (field: keyof ASMedications, value: any) => {
    dispatch({ type: 'UPDATE_MEDICATIONS', field, value });
  };

  const handleMedicineChange = (field: keyof ASMedicineSelection, value: any) => {
    dispatch({ type: 'UPDATE_MEDICINE_SELECTION', field, value });
  };

  const handleCounsellingChange = (field: keyof ASCounselling, value: boolean) => {
    dispatch({ type: 'UPDATE_COUNSELLING', field, value });
  };

  const handleSummaryChange = (field: keyof ASConsultationSummary, value: any) => {
    dispatch({ type: 'UPDATE_SUMMARY', field, value });
  };

  // ─── Consultation Record Data (for saving to database) ───
  // Returns a record on every step, including before a medicine is chosen,
  // so an excluded patient can be saved as "not supplied" from any step.
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    const ms = state.medicineSelection;
    const supplied = !isBlocked && ms.selectedMedicine === 'acetazolamide';
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
        pgdVersion: AS_PGD_VERSION,
      },
      outcome: isBlocked ? 'not_supplied' : 'completed',
      medicine: supplied
        ? {
            name: `Acetazolamide 250 mg tablets (scored)${ms.brand ? `, ${ms.brand}` : ''}`,
            dose: ms.dose,
            duration: `${ms.startTiming}; ${ms.continuationTiming}`,
            quantity: ms.quantityTablets ?? undefined,
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
          hasErrors={isBlocked}
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
          title="Travel & Altitude Assessment"
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
              placeholder="e.g. Peru, Nepal, Ecuador"
              required
            />
            <NumberInput
              label="Destination Altitude (metres)"
              value={state.travelAssessment.destinationAltitude}
              onChange={(v) => handleTravelChange('destinationAltitude', v)}
              placeholder="e.g. 3000"
              unit="m"
              required
            />
            <p className="text-xs text-gray-600">
              PGD inclusion: travelling to, or currently at, altitudes above 2,500 metres.
            </p>
            <SelectInput
              label="Reason for request"
              value={state.travelAssessment.purpose}
              onChange={(v) => handleTravelChange('purpose', v)}
              options={[
                { value: 'prevention', label: 'Prevention of AMS (started before ascent)' },
                { value: 'treatment', label: 'Symptomatic treatment of AMS (started at symptom onset)' },
              ]}
              required
            />
            {state.travelAssessment.purpose === 'prevention' && (
              <div className="grid sm:grid-cols-2 gap-4">
                <SelectInput
                  label="Lead-in days before ascent"
                  value={state.travelAssessment.leadInDays === null ? '' : String(state.travelAssessment.leadInDays)}
                  onChange={(v) => handleTravelChange('leadInDays', v === '' ? null : (Number(v) as 1 | 2))}
                  options={[
                    { value: '1', label: '1 day before ascent' },
                    { value: '2', label: '2 days before ascent' },
                  ]}
                  required
                />
                <NumberInput
                  label="Days ascending"
                  value={state.travelAssessment.daysAscending}
                  onChange={(v) => handleTravelChange('daysAscending', v === null ? null : Math.ceil(v))}
                  min={1}
                  max={14}
                  unit="days"
                  placeholder="e.g. 5"
                  required
                />
                <p className="text-xs text-gray-600 sm:col-span-2">
                  PGD quantity: half a tablet twice daily for (lead-in days + days ascending + 2 days), rounded up to
                  whole tablets, maximum 14 tablets (14 days) per supply without review. The quantity is calculated
                  from these two figures.
                </p>
              </div>
            )}
            <NumberInput
              label="Current Altitude (metres, optional)"
              value={state.travelAssessment.currentAltitude}
              onChange={(v) => handleTravelChange('currentAltitude', v)}
              placeholder="e.g. sea level = 0"
              unit="m"
            />
            <TextInput
              label="Departure Date"
              type="date"
              value={state.travelAssessment.departureDate}
              onChange={(v) => handleTravelChange('departureDate', v)}
              required
            />

            <SelectInput
              label="Ascent Rate"
              value={state.travelAssessment.ascentRate}
              onChange={(v) => handleTravelChange('ascentRate', v)}
              required
              options={[
                { value: 'slow', label: 'Slow (gradual, allow acclimatisation)' },
                { value: 'moderate', label: 'Moderate (some acclimatisation planned)' },
                { value: 'rapid', label: 'Rapid (fast ascent, high AMS risk)' },
              ]}
            />

            <Checkbox
              label="Acclimatisation Plan"
              checked={state.travelAssessment.acclimatisationPlan}
              onChange={(v) => handleTravelChange('acclimatisationPlan', v)}
              description="Does the patient have an acclimatisation plan (staying at intermediate altitude)?"
            />

            {state.travelAssessment.acclimatisationPlan && (
              <NumberInput
                label="Days at Intermediate Altitude"
                value={state.travelAssessment.acclimatisationDays}
                onChange={(v) => handleTravelChange('acclimatisationDays', v)}
                placeholder="e.g. 2"
              />
            )}

            <Checkbox
              label="Previous High Altitude Experience"
              checked={state.travelAssessment.previousAltitudeExperience}
              onChange={(v) =>
                handleTravelChange('previousAltitudeExperience', v)
              }
              description="Has the patient been to high altitude before?"
            />

            <Checkbox
              label="Previous Altitude Sickness"
              checked={state.travelAssessment.previousAltitudeSickness}
              onChange={(v) =>
                handleTravelChange('previousAltitudeSickness', v)
              }
              description="Has the patient had altitude sickness before?"
            />

            {state.travelAssessment.previousAltitudeSickness && (
              <TextInput
                label="Details of Previous Illness"
                value={state.travelAssessment.previousSicknessDetails}
                onChange={(v) =>
                  handleTravelChange('previousSicknessDetails', v)
                }
                placeholder="e.g. mild headache, moderate AMS, HAPE, HACE"
              />
            )}
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
            <Checkbox
              label="Hypersensitivity to acetazolamide or sulfonamides"
              checked={state.medicalHistory.sulfonamideAllergy}
              onChange={(v) =>
                handleMedicalChange('sulfonamideAllergy', v)
              }
              description="Exclusion. Acetazolamide is a sulfonamide derivative."
            />
            <Checkbox
              label="Severe hepatic impairment or hepatic cirrhosis"
              checked={state.medicalHistory.severeHepaticImpairment}
              onChange={(v) =>
                handleMedicalChange('severeHepaticImpairment', v)
              }
              description="Exclusion."
            />
            <Checkbox
              label="Severe Renal Impairment"
              checked={state.medicalHistory.severeRenalImpairment}
              onChange={(v) =>
                handleMedicalChange('severeRenalImpairment', v)
              }
              description="eGFR <30 mL/min/1.73m². Exclusion."
            />
            <Checkbox
              label="Mild renal impairment"
              checked={state.medicalHistory.mildRenalImpairment}
              onChange={(v) =>
                handleMedicalChange('mildRenalImpairment', v)
              }
              description="Caution: use with care, monitor for electrolyte imbalance and dehydration."
            />
            <Checkbox
              label="Adrenocortical Insufficiency"
              checked={state.medicalHistory.adrenalInsufficiency}
              onChange={(v) =>
                handleMedicalChange('adrenalInsufficiency', v)
              }
              description="Addison's disease or similar"
            />
            <Checkbox
              label="Hypokalaemia"
              checked={state.medicalHistory.hypokalaemia}
              onChange={(v) => handleMedicalChange('hypokalaemia', v)}
              description="Low potassium (affects acetazolamide)"
            />
            <Checkbox
              label="Hyponatraemia"
              checked={state.medicalHistory.hyponatraemia}
              onChange={(v) => handleMedicalChange('hyponatraemia', v)}
              description="Low sodium"
            />
            <Checkbox
              label="Hyperchloraemic (metabolic) acidosis, or a history of electrolyte imbalance"
              checked={state.medicalHistory.metabolicAcidosisOrElectrolyteImbalance}
              onChange={(v) => handleMedicalChange('metabolicAcidosisOrElectrolyteImbalance', v)}
              description="Exclusion."
            />
            <Checkbox
              label="Previous non-cardiogenic pulmonary oedema after acetazolamide"
              checked={state.medicalHistory.pulmonaryOedemaAfterAcetazolamide}
              onChange={(v) => handleMedicalChange('pulmonaryOedemaAfterAcetazolamide', v)}
              description="Exclusion."
            />
            <Checkbox
              label="Renal Stone History"
              checked={state.medicalHistory.renalStoneHistory}
              onChange={(v) =>
                handleMedicalChange('renalStoneHistory', v)
              }
              description="Previous kidney stones (caution: increase fluid intake)"
            />
            <Checkbox
              label="Previous Pulmonary Edema at High Altitude"
              checked={state.medicalHistory.pulmonaryOedema}
              onChange={(v) =>
                handleMedicalChange('pulmonaryOedema', v)
              }
              description="High-altitude pulmonary edema (HAPE)"
            />
            <Checkbox
              label="Previous Cerebral Edema at High Altitude"
              checked={state.medicalHistory.cerebralOedema}
              onChange={(v) =>
                handleMedicalChange('cerebralOedema', v)
              }
              description="High-altitude cerebral edema (HACE)"
            />
            <Checkbox
              label="High Altitude Arrhythmia"
              checked={state.medicalHistory.highAltitudeArrhythmia}
              onChange={(v) =>
                handleMedicalChange('highAltitudeArrhythmia', v)
              }
              description="Previous cardiac arrhythmias triggered by altitude"
            />
            <Checkbox
              label="Pregnant or Breastfeeding"
              checked={state.medicalHistory.pregnantOrBreastfeeding}
              onChange={(v) =>
                handleMedicalChange('pregnantOrBreastfeeding', v)
              }
              description="Exclusion under this PGD."
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
              label="Potassium-depleting diuretic (thiazide or loop)"
              checked={state.medications.takesThiazideDiuretics}
              onChange={(v) =>
                handleMedicationsChange('takesThiazideDiuretics', v)
              }
              description="Exclusion. Refer."
            />
            <Checkbox
              label="Lithium"
              checked={state.medications.takesLithium}
              onChange={(v) => handleMedicationsChange('takesLithium', v)}
              description="Exclusion. Refer."
            />
            <Checkbox
              label="Phenytoin"
              checked={state.medications.takesPhenytoin}
              onChange={(v) => handleMedicationsChange('takesPhenytoin', v)}
              description="Exclusion. Refer."
            />
            <Checkbox
              label="High-dose aspirin"
              checked={state.medications.takesHighDoseAspirin}
              onChange={(v) => handleMedicationsChange('takesHighDoseAspirin', v)}
              description="Exclusion. Refer. (Low-dose antiplatelet aspirin is not high-dose.)"
            />
            <Checkbox
              label="ACE Inhibitors"
              checked={state.medications.takesACEInhibitors}
              onChange={(v) =>
                handleMedicationsChange('takesACEInhibitors', v)
              }
              description="May increase potassium; monitor K+ and renal function"
            />
            <Checkbox
              label="Topiramate"
              checked={state.medications.takesTopiramate}
              onChange={(v) => handleMedicationsChange('takesTopiramate', v)}
              description="Both are carbonic anhydrase inhibitors; avoid combined use"
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
                placeholder="e.g. metformin, amlodipine"
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
          description="Based on clinical assessment, the following alerts have been identified:"
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
                  ✓ No contraindications identified. Acetazolamide can be considered.
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
            <SelectInput
              label="Medicine Choice"
              value={state.medicineSelection.selectedMedicine}
              onChange={(v) => handleMedicineChange('selectedMedicine', v)}
              options={[
                { value: 'acetazolamide', label: 'Acetazolamide 250 mg tablets (scored)' },
              ]}
              required
            />

            {recommendation && state.medicineSelection.selectedMedicine && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium text-sm text-blue-900 mb-2">
                  Regimen per the PGD ({AS_PGD_VERSION}) for{' '}
                  {state.travelAssessment.purpose === 'treatment' ? 'symptomatic treatment' : 'prevention'}
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
                    <strong>Continue:</strong> {state.medicineSelection.continuationTiming}
                  </li>
                  <li>{recommendation.reason}</li>
                </ul>
                <p className="text-[11px] text-blue-700 mt-2">
                  Dose, start and continuation are the document&apos;s for this purpose and are recorded as shown.
                  To change the purpose, go back to the Travel Assessment.
                </p>
              </div>
            )}

            <TextInput
              label="Brand supplied"
              value={state.medicineSelection.brand}
              onChange={(v) => handleMedicineChange('brand', v)}
              placeholder="Name and brand of the product supplied"
              required
            />

            {state.travelAssessment.purpose === 'prevention' && (
              <Checkbox
                label="Also supply a treatment course (6 tablets, 250 mg twice daily for 3 days)"
                checked={state.medicineSelection.includeTreatmentCourse}
                onChange={(v) => handleMedicineChange('includeTreatmentCourse', v)}
                description="Only where the itinerary makes descent difficult. Maximum total 20 tablets per supply."
              />
            )}

            <div>
              <NumberInput
                label="Quantity supplied (tablets)"
                value={state.medicineSelection.quantityTablets}
                onChange={(v) => handleMedicineChange('quantityTablets', v === null ? null : Math.round(v))}
                min={quantityCalc.total ?? 1}
                max={maxQuantityTablets(state.travelAssessment.purpose, state.medicineSelection.includeTreatmentCourse)}
                unit="tablets"
                required
              />
              <p className="text-xs text-gray-600 mt-1">
                {quantityCalc.text}. PGD maximum for this regimen:{' '}
                {maxQuantityTablets(state.travelAssessment.purpose, state.medicineSelection.includeTreatmentCourse)} tablets
                (prevention 14 = 28 doses over 14 days; treatment 6; total 20). The field is pre-filled with the
                calculated course; a smaller quantity is refused.
              </p>
            </div>

            <Checkbox
              label="Off-label use explained and consented"
              checked={state.medicineSelection.offLabelExplained}
              onChange={(v) => handleMedicineChange('offLabelExplained', v)}
              description="Patient told that acetazolamide is not licensed for AMS (SmPC indications are glaucoma, fluid retention and epilepsy) and that it is supplied off-label under this PGD, supported by BNF and Wilderness Medical Society guidance."
              required
            />

            <TextArea
              label="Clinical Reason for Selection"
              value={state.medicineSelection.reason}
              onChange={(v) => handleMedicineChange('reason', v)}
              placeholder="Explain why this approach was chosen..."
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
              label="Paraesthesia is common and harmless"
              checked={state.counselling.paraesthesiaExplained}
              onChange={(v) =>
                handleCounsellingChange('paraesthesiaExplained', v)
              }
              description="Tingling, passing more urine, taste change, nausea and drowsiness are common. Discontinue and seek advice if severe side effects develop. Report via Yellow Card."
            />
            <Checkbox
              label="Avoid alcohol at altitude"
              checked={state.counselling.avoidAlcoholAdvice}
              onChange={(v) => handleCounsellingChange('avoidAlcoholAdvice', v)}
              description="Alcohol worsens dehydration and AMS risk"
            />
            <Checkbox
              label="Hydrate well"
              checked={state.counselling.hydrateWellAdvice}
              onChange={(v) => handleCounsellingChange('hydrateWellAdvice', v)}
              description="Maintain adequate hydration; watch for signs of dehydration or electrolyte imbalance. Extra fluids if renal stone history."
            />
            <Checkbox
              label="Ascend gradually"
              checked={state.counselling.ascentAdvice}
              onChange={(v) => handleCounsellingChange('ascentAdvice', v)}
              description="No more than 300 to 500 metres per day above 2,500 m, with a rest day every 3 to 4 days. Do not ascend further while symptomatic."
            />
            <Checkbox
              label="AMS symptoms"
              checked={state.counselling.amsSymptomAdvice}
              onChange={(v) => handleCounsellingChange('amsSymptomAdvice', v)}
              description="Headache plus nausea, dizziness, fatigue, poor sleep or loss of appetite, within 6 to 12 hours of ascent"
            />
            <Checkbox
              label="HACE warning signs"
              checked={state.counselling.haceSymptomAdvice}
              onChange={(v) => handleCounsellingChange('haceSymptomAdvice', v)}
              description="Confusion, unsteadiness, severe headache, reduced consciousness: descend and seek help urgently"
            />
            <Checkbox
              label="HAPE warning signs"
              checked={state.counselling.hapeSymptomAdvice}
              onChange={(v) => handleCounsellingChange('hapeSymptomAdvice', v)}
              description="Breathlessness at rest, cough with frothy sputum: descend and seek help urgently"
            />
            <Checkbox
              label="Descend and seek help urgently; acetazolamide is not a substitute for descent"
              checked={state.counselling.descentAdvice}
              onChange={(v) => handleCounsellingChange('descentAdvice', v)}
              description="Symptoms not improving within 24 hours, or any sign of HACE or HAPE: descend and seek help urgently. Acetazolamide is not a substitute for descent."
            />
            <Checkbox
              label="Patient information leaflet supplied"
              checked={state.counselling.medicineCardProvided}
              onChange={(v) =>
                handleCounsellingChange('medicineCardProvided', v)
              }
              description="Patient information leaflet (PIL) provided with the medication"
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
            <AltitudeSicknessSummaryReport state={state} alerts={alerts} />
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
        Exclusion criteria met: acetazolamide cannot be supplied under this PGD.
      </p>
      <p className="text-xs text-red-700">
        Go back to the Contraindications Review to see the reason. Advise on alternative options (gradual ascent,
        hydration), refer to the GP as appropriate, and use &quot;Save as not supplied&quot; to record the
        consultation and the advice given.
      </p>
    </div>
  );
}
