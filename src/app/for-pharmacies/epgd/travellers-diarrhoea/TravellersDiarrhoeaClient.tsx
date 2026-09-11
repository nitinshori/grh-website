'use client';

import { useReducer, useMemo, useState, useCallback, useEffect } from 'react';
import type {
  TDConsultationState,
  TDAction,
  TDPatientDetails,
  TDTravelAssessment,
  TDMedicalHistory,
  TDMedications,
  TDMedicineSelection,
  TDCounselling,
  TDConsultationSummary,
} from './travellers-diarrhoea-types';
import {
  STEP_LABELS,
  TOTAL_STEPS,
  createInitialTDState,
} from './travellers-diarrhoea-types';
import {
  generateTDAlerts,
  recommendApproach,
  canProceedWithConsultation,
  azithromycinDoseText,
  TD_PGD_VERSION,
} from './travellers-diarrhoea-clinical-logic';
import { validateStep } from './travellers-diarrhoea-validation';
import { calculateAge } from '../shared/types';
import { ProgressBar } from '../shared/components/ProgressBar';
import { StepWrapper } from '../shared/components/StepWrapper';
import type { ConsultationRecordData } from '../shared/hooks/useConsultationTracking';
import { AlertBanner } from '../shared/components/AlertBanner';
import { PatientDetailsStep } from '../shared/steps/PatientDetailsStep';
import { ConsentStep } from '../shared/steps/ConsentStep';
import { TravellersDiarrhoeaSummaryReport } from './components/TravellersDiarrhoeaSummaryReport';
import { usePharmacistProfile } from "../shared/hooks/usePharmacistProfile";
import {
  TextInput,
  Checkbox,
  SelectInput,
  TextArea,
} from '../shared/components/FormInputs';

// ─── Reducer ───

// Any change to the travel, medical-history or medication answers clears the
// supply decision, because it was made against the old answers.
function clearMedicineSelection(state: TDConsultationState): TDConsultationState {
  if (!state.medicineSelection.selectedApproach) return state;
  return {
    ...state,
    medicineSelection: {
      ...state.medicineSelection,
      selectedApproach: '',
      azithromycinDays: null,
      azithromycinDose: '',
      azithromycinQuantity: null,
    },
  };
}

function reducer(state: TDConsultationState, action: TDAction): TDConsultationState {
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

    case 'UPDATE_MEDICINE_SELECTION':
      newState.medicineSelection = {
        ...newState.medicineSelection,
        [action.field]: action.value,
      };
      // The dose is the document's; only the course length (1 to 3 days) is
      // chosen, and the quantity is one tablet per day.
      if (action.field === 'azithromycinDays') {
        const days = action.value as TDMedicineSelection['azithromycinDays'];
        newState.medicineSelection = {
          ...newState.medicineSelection,
          azithromycinDose: days ? azithromycinDoseText(days) : '',
          azithromycinQuantity: days ?? null,
        };
      }
      if (action.field === 'selectedApproach' && action.value !== 'standby') {
        newState.medicineSelection = {
          ...newState.medicineSelection,
          azithromycinDays: null,
          azithromycinDose: '',
          azithromycinQuantity: null,
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
      return createInitialTDState();
  }

  return newState;
}

// ─── Main Client Component ───

export function TravellersDiarrhoeaClient() {
  const [state, dispatch] = useReducer(reducer, createInitialTDState());
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
    return generateTDAlerts(
      state.medicalHistory,
      state.medications,
      state.travelAssessment
    );
  }, [state.medicalHistory, state.medications, state.travelAssessment]);

  const isBlocked = !canProceedWithConsultation(alerts);

  // A stop anywhere disables Next on every step, not only the review step.
  const validationError = useMemo(() => {
    if (isBlocked) return 'Exclusion criteria met: azithromycin cannot be supplied under the PGD. Record the advice given and save as not supplied.';
    return validateStep(state.currentStep, state);
  }, [state, isBlocked]);

  // ─── Recommendation ───

  const recommendation = useMemo(() => {
    return recommendApproach(state.medicalHistory, state.medications);
  }, [state.medicalHistory, state.medications]);

  const supplied = state.medicineSelection.selectedApproach === 'standby';

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

  const handlePatientChange = (field: keyof TDPatientDetails, value: any) => {
    dispatch({ type: 'UPDATE_PATIENT', field, value });
  };

  const handleConsentChange = (field: string, value: any) => {
    dispatch({ type: 'UPDATE_CONSENT', field: field as any, value });
  };

  const handleTravelChange = (field: keyof TDTravelAssessment, value: any) => {
    dispatch({ type: 'UPDATE_TRAVEL', field, value });
  };

  const handleMedicalChange = (field: keyof TDMedicalHistory, value: any) => {
    dispatch({ type: 'UPDATE_MEDICAL_HISTORY', field, value });
  };

  const handleMedicationsChange = (field: keyof TDMedications, value: any) => {
    dispatch({ type: 'UPDATE_MEDICATIONS', field, value });
  };

  const handleMedicineChange = (field: keyof TDMedicineSelection, value: any) => {
    dispatch({ type: 'UPDATE_MEDICINE_SELECTION', field, value });
  };

  const handleCounsellingChange = (field: keyof TDCounselling, value: boolean) => {
    dispatch({ type: 'UPDATE_COUNSELLING', field, value });
  };

  const handleSummaryChange = (field: keyof TDConsultationSummary, value: any) => {
    dispatch({ type: 'UPDATE_SUMMARY', field, value });
  };

  // ─── Consultation Record Data (for saving to database) ───
  // Returns a record on every step, so an excluded or refused patient can be
  // saved from any step. A refusal ("Not supplied (refer patient)") used to
  // save as "completed" (adversarial review, 11 Sep 2026).
  const getConsultationData = useCallback((): ConsultationRecordData | null => {
    const ms = state.medicineSelection;
    const supplied = !isBlocked && ms.selectedApproach === 'standby';
    const outcome: ConsultationRecordData['outcome'] = isBlocked
      ? 'not_supplied'
      : ms.selectedApproach === 'not-supplied'
        ? 'referred'
        : 'completed';
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
        pgdVersion: TD_PGD_VERSION,
      },
      outcome,
      medicine: supplied
        ? {
            name: `Azithromycin 500 mg tablets${ms.brand ? `, ${ms.brand}` : ''}`,
            dose: ms.azithromycinDose,
            duration: ms.azithromycinDays ? `${ms.azithromycinDays} day${ms.azithromycinDays > 1 ? 's' : ''} (standby, self-start)` : undefined,
            quantity: ms.azithromycinQuantity ?? undefined,
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
              placeholder="e.g. India, Mexico, Morocco"
              required
            />
            <Checkbox
              label="High-risk region confirmed on TravelHealthPro"
              checked={state.travelAssessment.highRiskRegionConfirmed}
              onChange={(v) => handleTravelChange('highRiskRegionConfirmed', v)}
              description="PGD inclusion: recent or planned travel to a high-risk region for traveller's diarrhoea (for example South Asia, Sub-Saharan Africa, Latin America). Check the TravelHealthPro country page; do not work from memory. If the destination is not high risk, do not supply."
              required
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

            <SelectInput
              label="Travel Type"
              value={state.travelAssessment.travelType}
              onChange={(v) => handleTravelChange('travelType', v)}
              options={[
                { value: '', label: 'Select travel type...' },
                { value: 'backpacking', label: 'Backpacking' },
                { value: 'business', label: 'Business travel' },
                { value: 'cruise', label: 'Cruise' },
                { value: 'resort', label: 'Resort / all-inclusive' },
                { value: 'other', label: 'Other' },
              ]}
            />

            <TextInput
              label="Dietary Habits During Travel"
              value={state.travelAssessment.dietaryHabits}
              onChange={(v) => handleTravelChange('dietaryHabits', v)}
              placeholder="e.g. street food, local restaurants, packaged food"
            />

            <Checkbox
              label="Previous Travellers' Diarrhoea"
              checked={state.travelAssessment.previousDiarrhoeaEpisodes}
              onChange={(v) =>
                handleTravelChange('previousDiarrhoeaEpisodes', v)
              }
              description="Has the patient had travellers' diarrhoea before?"
            />

            {state.travelAssessment.previousDiarrhoeaEpisodes && (
              <TextInput
                label="Details of Previous Episode"
                value={state.travelAssessment.previousEpisodeDetails}
                onChange={(v) =>
                  handleTravelChange('previousEpisodeDetails', v)
                }
                placeholder="e.g. when, how long, severity, treatment"
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
              label="Currently Pregnant"
              checked={state.medicalHistory.currentlyPregnant}
              onChange={(v) => handleMedicalChange('currentlyPregnant', v)}
              description="Affects antibiotic choice"
            />
            <Checkbox
              label="Currently Breastfeeding"
              checked={state.medicalHistory.breastfeeding}
              onChange={(v) => handleMedicalChange('breastfeeding', v)}
              description="Both agents enter breast milk"
            />
            <Checkbox
              label="Severe liver disease"
              checked={state.medicalHistory.severeHepaticImpairment}
              onChange={(v) =>
                handleMedicalChange('severeHepaticImpairment', v)
              }
              description="Exclusion under this PGD"
            />
            <Checkbox
              label="Severe Renal Impairment"
              checked={state.medicalHistory.severeRenalImpairment}
              onChange={(v) =>
                handleMedicalChange('severeRenalImpairment', v)
              }
              description="eGFR <30 mL/min/1.73m²"
            />
            <Checkbox
              label="Significant hepatic dysfunction"
              checked={state.medicalHistory.liverDisease}
              onChange={(v) => handleMedicalChange('liverDisease', v)}
              description="Exclusion under this PGD"
            />
            <Checkbox
              label="Allergy to azithromycin or other macrolide antibiotics"
              checked={state.medicalHistory.macrolideAllergy}
              onChange={(v) => handleMedicalChange('macrolideAllergy', v)}
              description="Exclusion. Azithromycin is a macrolide."
            />
            <Checkbox
              label="Bloody diarrhoea"
              checked={state.medicalHistory.bloodInStool}
              onChange={(v) => handleMedicalChange('bloodInStool', v)}
              description="Exclusion. Refer for medical assessment."
            />
            <Checkbox
              label="High fever (temperature 38 C or above)"
              checked={state.medicalHistory.feverAtOrAbove38C}
              onChange={(v) => handleMedicalChange('feverAtOrAbove38C', v)}
              description="Exclusion. The PGD defines high fever as a temperature of 38 C or above. Refer for medical assessment."
            />
            <Checkbox
              label="Signs of systemic illness"
              checked={state.medicalHistory.systemicallyUnwell}
              onChange={(v) => handleMedicalChange('systemicallyUnwell', v)}
              description="Exclusion. Refer for medical assessment."
            />
            <Checkbox
              label="Symptoms lasting more than 72 hours without improvement"
              checked={state.medicalHistory.symptomsOver72Hours}
              onChange={(v) => handleMedicalChange('symptomsOver72Hours', v)}
              description="Exclusion. Refer for investigation."
            />
            <Checkbox
              label="Crohn's Disease"
              checked={state.medicalHistory.crohnsDisease}
              onChange={(v) => handleMedicalChange('crohnsDisease', v)}
              description="IBD: caution with antimotility agents"
            />
            <Checkbox
              label="Ulcerative Colitis"
              checked={state.medicalHistory.ulcerativeColitis}
              onChange={(v) => handleMedicalChange('ulcerativeColitis', v)}
              description="IBD: caution with antimotility agents"
            />
            <Checkbox
              label="Inflammatory Bowel Disease"
              checked={state.medicalHistory.ibd}
              onChange={(v) => handleMedicalChange('ibd', v)}
              description="Other IBD diagnosis"
            />
            <Checkbox
              label="Immunocompromised"
              checked={state.medicalHistory.immunocompromised}
              onChange={(v) => handleMedicalChange('immunocompromised', v)}
              description="HIV, chemotherapy, immunosuppressants"
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
              label="Medicines known to prolong the QT interval"
              checked={state.medications.takesQTprolongingDrugs}
              onChange={(v) =>
                handleMedicationsChange('takesQTprolongingDrugs', v)
              }
              description="Exclusion under this PGD (e.g. amiodarone, sotalol, some antipsychotics, citalopram, ondansetron, hydroxychloroquine). Refer."
            />
            <Checkbox
              label="Warfarin"
              checked={state.medications.takesWarfarin}
              onChange={(v) => handleMedicationsChange('takesWarfarin', v)}
              description="Azithromycin may increase warfarin effect"
            />
            <Checkbox
              label="Methadone"
              checked={state.medications.takesMethadone}
              onChange={(v) => handleMedicationsChange('takesMethadone', v)}
              description="Azithromycin may increase methadone levels"
            />
            <Checkbox
              label="Digoxin"
              checked={state.medications.takesDigoxin}
              onChange={(v) => handleMedicationsChange('takesDigoxin', v)}
              description="Azithromycin may increase digoxin absorption"
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
                placeholder="e.g. metformin, levothyroxine"
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
          description="Based on clinical assessment, the following have been identified:"
          currentStep={state.currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={!isBlocked}
          validationError={isBlocked ? 'Hard stop alerts present. Cannot supply standby treatment.' : null}
          isBlocked={isBlocked}
        >
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✓ No contraindications identified. Standby treatment can be considered.
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
            {recommendation && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium text-sm text-blue-900 mb-2">
                  Regimen per the PGD ({TD_PGD_VERSION})
                </p>
                <p className="text-sm text-blue-800 mb-3">
                  <strong>{recommendation.approach}</strong>
                </p>
                <p className="text-xs text-blue-700 mb-2">{recommendation.treatment}</p>
              </div>
            )}

            <SelectInput
              label="Standby Treatment Supply"
              value={state.medicineSelection.selectedApproach}
              onChange={(v) => handleMedicineChange('selectedApproach', v)}
              options={[
                { value: '', label: 'Select...' },
                { value: 'standby', label: 'Supply standby treatment' },
                { value: 'not-supplied', label: 'Not supplied (refer patient)' },
              ]}
              required
            />

            {state.medicineSelection.selectedApproach === 'standby' && (
              <>
                <SelectInput
                  label="Course length (PGD: 500 mg once daily for 1 to 3 days, depending on clinical severity)"
                  value={state.medicineSelection.azithromycinDays === null ? '' : String(state.medicineSelection.azithromycinDays)}
                  onChange={(v) => handleMedicineChange('azithromycinDays', v === '' ? null : (Number(v) as 1 | 2 | 3))}
                  options={[
                    { value: '1', label: '1 day: one 500 mg tablet' },
                    { value: '2', label: '2 days: two 500 mg tablets' },
                    { value: '3', label: '3 days: three 500 mg tablets (maximum course)' },
                  ]}
                  required
                />
                {state.medicineSelection.azithromycinDays !== null && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 space-y-1">
                    <p>
                      <strong>Dose:</strong> {state.medicineSelection.azithromycinDose}
                    </p>
                    <p>
                      <strong>Quantity:</strong> {state.medicineSelection.azithromycinQuantity} x azithromycin 500 mg tablet
                      {(state.medicineSelection.azithromycinQuantity ?? 0) > 1 ? 's' : ''}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      The dose is the document&apos;s and is recorded as shown. Loperamide is not supplied under this
                      PGD; OTC advice is covered on the counselling step.
                    </p>
                  </div>
                )}

                <TextInput
                  label="Brand supplied"
                  value={state.medicineSelection.brand}
                  onChange={(v) => handleMedicineChange('brand', v)}
                  placeholder="Name and brand of the azithromycin product supplied"
                  required
                />

                <SelectInput
                  label="Indication confirmed"
                  value={state.medicineSelection.selectedForCriteria}
                  onChange={(v) =>
                    handleMedicineChange('selectedForCriteria', v)
                  }
                  options={[
                    { value: '', label: 'Select...' },
                    { value: 'moderate-severe', label: 'Self-start for moderate to severe traveller\'s diarrhoea (PGD indication)' },
                  ]}
                  required
                />
              </>
            )}

            <TextArea
              label="Clinical Reason"
              value={state.medicineSelection.reason}
              onChange={(v) => handleMedicineChange('reason', v)}
              placeholder="Explain approach and why supplies are/are not suitable for this patient..."
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
            {!supplied && (
              <p className="text-xs text-gray-600 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                No azithromycin was supplied. Only the general advice items apply; the medicine items are not shown.
              </p>
            )}
            <Checkbox
              label="Oral rehydration is first-line"
              checked={state.counselling.orCrsAdvice}
              onChange={(v) => handleCounsellingChange('orCrsAdvice', v)}
              description="Oral rehydration is the key priority; maintain hydration"
            />
            {supplied && (
              <>
                <Checkbox
                  label="When to start treatment"
                  checked={state.counselling.whenToStartTreatment}
                  onChange={(v) =>
                    handleCounsellingChange('whenToStartTreatment', v)
                  }
                  description="Self-start azithromycin only for moderate to severe symptoms (3 or more loose stools in 24 hours with cramps, nausea or vomiting, or essential plans disrupted); take with food to reduce GI upset"
                />
                <Checkbox
                  label="Loperamide use"
                  checked={state.counselling.loperamideAdvice}
                  onChange={(v) => handleCounsellingChange('loperamideAdvice', v)}
                  description="If bought OTC: 4 mg initially then 2 mg after each loose stool, max 16 mg/day; not with blood in stool or fever. Not supplied under this PGD."
                />
                <Checkbox
                  label="Azithromycin use"
                  checked={state.counselling.azithromycinAdvice}
                  onChange={(v) =>
                    handleCounsellingChange('azithromycinAdvice', v)
                  }
                  description="500 mg once daily for 1 to 3 days depending on severity; maximum 3 days. Do not use for bloody diarrhoea or high fever (temperature 38 C or above): seek medical help instead"
                />
              </>
            )}
            <div className="rounded-lg border border-gray-200 p-3 space-y-1">
              <Checkbox
                label="Pregnancy implications discussed"
                checked={state.counselling.pregnancyAdvice}
                onChange={(v) => {
                  handleCounsellingChange('pregnancyAdvice', v);
                  if (v) handleCounsellingChange('pregnancyAdviceNotApplicable', false);
                }}
                description="If the patient becomes pregnant during travel: azithromycin with caution, seek advice before self-starting"
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
              label="Food & water hygiene"
              checked={state.counselling.foodHygiene}
              onChange={(v) => handleCounsellingChange('foodHygiene', v)}
              description="Boil it, cook it, peel it, or forget it"
            />
            <Checkbox
              label="Water safety"
              checked={state.counselling.waterSafety}
              onChange={(v) => handleCounsellingChange('waterSafety', v)}
              description="Bottled water, avoid ice, tap water risk"
            />
            <Checkbox
              label="When to seek help"
              checked={state.counselling.whenToSeekHelp}
              onChange={(v) => handleCounsellingChange('whenToSeekHelp', v)}
              description="Seek local medical attention if symptoms worsen or persist: fever, bloody diarrhoea, severe abdominal pain, persistent vomiting or inability to stay hydrated, diarrhoea lasting more than 14 days, or becoming systemically very unwell"
            />
            {supplied && (
              <>
                <Checkbox
                  label="Stop treatment if hypersensitivity or serious side effects occur"
                  checked={state.counselling.childrenUnderWarning}
                  onChange={(v) =>
                    handleCounsellingChange('childrenUnderWarning', v)
                  }
                  description="Nausea, abdominal pain, diarrhoea and headache are common; stop and seek advice for rash, allergic reaction or palpitations. Report via Yellow Card."
                />
                <Checkbox
                  label="Patient information leaflet supplied"
                  checked={state.counselling.medicineCardProvided}
                  onChange={(v) =>
                    handleCounsellingChange('medicineCardProvided', v)
                  }
                  description="Patient information leaflet (PIL) provided with the medication"
                />
              </>
            )}
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
            <TravellersDiarrhoeaSummaryReport state={state} alerts={alerts} />
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
        Exclusion criteria met: azithromycin cannot be supplied under this PGD.
      </p>
      <p className="text-xs text-red-700">
        Go back to the Contraindications Review to see the reason. Give hydration, food and water advice
        regardless, refer as the alert directs, and use &quot;Save as not supplied&quot; to record the consultation
        and the advice given.
      </p>
    </div>
  );
}
