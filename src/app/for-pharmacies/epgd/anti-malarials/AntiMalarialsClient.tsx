'use client';

import { useReducer, useMemo, useState, useCallback } from 'react';
import type {
  AMConsultationState,
  AMAction,
  AMPatientDetails,
  AMTravelAssessment,
  AMMedicalHistory,
  AMMedications,
  AMMedicineSelection,
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
  canProceedWithConsultation,
} from './anti-malarials-clinical-logic';
import { validateStep } from './anti-malarials-validation';
import { calculateAge } from '../shared/types';
import { ProgressBar } from '../shared/components/ProgressBar';
import { StepWrapper } from '../shared/components/StepWrapper';
import { AlertBanner } from '../shared/components/AlertBanner';
import { PatientDetailsStep } from '../shared/steps/PatientDetailsStep';
import { ConsentStep } from '../shared/steps/ConsentStep';
import { AntiMalarialsSummaryReport } from './components/AntiMalarialsSummaryReport';
import {
  TextInput,
  Checkbox,
  SelectInput,
  NumberInput,
  TextArea,
} from '../shared/components/FormInputs';

// ─── Reducer ───

function reducer(state: AMConsultationState, action: AMAction): AMConsultationState {
  const newState = { ...state };

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
      break;

    case 'UPDATE_MEDICAL_HISTORY':
      newState.medicalHistory = {
        ...newState.medicalHistory,
        [action.field]: action.value,
      };
      break;

    case 'UPDATE_MEDICATIONS':
      newState.medications = { ...newState.medications, [action.field]: action.value };
      break;

    case 'UPDATE_CONTRAINDICATIONS':
      newState.contraindications = {
        ...newState.contraindications,
        [action.field]: action.value,
      };
      break;

    case 'UPDATE_MEDICINE_SELECTION':
      newState.medicineSelection = {
        ...newState.medicineSelection,
        [action.field]: action.value,
      };
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
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showReport, setShowReport] = useState(false);

  // ─── Compute alerts and validation ───

  const alerts = useMemo(() => {
    return generateAMAlerts(
      state.patient,
      state.travelAssessment,
      state.medicalHistory,
      state.medications
    );
  }, [state.patient, state.travelAssessment, state.medicalHistory, state.medications]);

  const validationError = useMemo(() => {
    return validateStep(state.currentStep, state);
  }, [state, state.currentStep]);

  const isBlocked = !canProceedWithConsultation(alerts);

  // ─── Recommendation ───

  const recommendation = useMemo(() => {
    return recommendMedicine(
      state.medicalHistory,
      state.medications,
      state.travelAssessment
    );
  }, [state.medicalHistory, state.medications, state.travelAssessment]);

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

  const handleStepClick = useCallback((step: number) => {
    dispatch({ type: 'SET_STEP', step });
  }, []);

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

  // ─── Render ───

  if (showReport) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowReport(false)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ← Back to Consultation
        </button>
        <AntiMalarialsSummaryReport state={state} />
        <div className="flex gap-4 justify-center mt-6">
          <button
            onClick={() => window.print()}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Print Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <ProgressBar
        stepLabels={STEP_LABELS}
        currentStep={state.currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
        hasErrors={!!validationError}
      />

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <AlertBanner alerts={alerts} />
      )}

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
        >
          <PatientDetailsStep
            patient={state.patient}
            onChange={handlePatientChange}
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
              description="Is the patient currently pregnant?"
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
              description="Is the patient currently breastfeeding?"
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
        >
          <div className="space-y-4">
            <Checkbox
              label="Severe Renal Impairment"
              checked={state.medicalHistory.severeRenalImpairment}
              onChange={(v) =>
                handleMedicalChange('severeRenalImpairment', v)
              }
              description="eGFR <30 mL/min/1.73m² (affects Malarone)"
            />
            <Checkbox
              label="Severe Hepatic Impairment"
              checked={state.medicalHistory.severeHepaticImpairment}
              onChange={(v) =>
                handleMedicalChange('severeHepaticImpairment', v)
              }
              description="Cirrhosis or severe liver disease"
            />
            <Checkbox
              label="Epilepsy"
              checked={state.medicalHistory.epilepsy}
              onChange={(v) => handleMedicalChange('epilepsy', v)}
              description="Current or previous epilepsy (affects Mefloquine)"
            />
            <Checkbox
              label="Psychiatric History"
              checked={state.medicalHistory.psychiatricHistory}
              onChange={(v) =>
                handleMedicalChange('psychiatricHistory', v)
              }
              description="Previous or current psychiatric illness (affects Mefloquine)"
            />
            <Checkbox
              label="Photosensitivity"
              checked={state.medicalHistory.photosensitivity}
              onChange={(v) =>
                handleMedicalChange('photosensitivity', v)
              }
              description="History of photosensitive reactions (affects Doxycycline)"
            />
            <Checkbox
              label="G6PD Deficiency"
              checked={state.medicalHistory.g6pdDeficiency}
              onChange={(v) => handleMedicalChange('g6pdDeficiency', v)}
              description="Glucose-6-phosphate dehydrogenase deficiency"
            />
            <Checkbox
              label="QT Prolongation"
              checked={state.medicalHistory.qTprolongation}
              onChange={(v) => handleMedicalChange('qTprolongation', v)}
              description="History of QT prolongation on ECG"
            />
            <Checkbox
              label="Cardiac Arrhythmia"
              checked={state.medicalHistory.arrhythmia}
              onChange={(v) => handleMedicalChange('arrhythmia', v)}
              description="Current or previous cardiac arrhythmias"
            />
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
        >
          <div className="space-y-4">
            <Checkbox
              label="Warfarin (Anticoagulant)"
              checked={state.medications.takesWarfarin}
              onChange={(v) => handleMedicationsChange('takesWarfarin', v)}
              description="May interact with antimalarials"
            />
            <Checkbox
              label="Oral Contraception"
              checked={state.medications.takesOralContraception}
              onChange={(v) =>
                handleMedicationsChange('takesOralContraception', v)
              }
              description="May be reduced by doxycycline"
            />
            <Checkbox
              label="Antacids"
              checked={state.medications.takesAntacids}
              onChange={(v) => handleMedicationsChange('takesAntacids', v)}
              description="May reduce antimalarial absorption"
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
      {state.currentStep === 6 && !isBlocked && (
        <StepWrapper
          title="Medicine Selection"
          currentStep={state.currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={!validationError}
          validationError={validationError}
        >
          <div className="space-y-6">
            {recommendation && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium text-sm text-blue-900 mb-2">
                  Recommended Medicine
                </p>
                <p className="text-sm text-blue-800 mb-3">
                  <strong>{recommendation.medicine}</strong>
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>
                    <strong>Dose:</strong> {recommendation.dose}
                  </li>
                  <li>
                    <strong>Start:</strong> {recommendation.startTiming}
                  </li>
                  <li>
                    <strong>Continue:</strong>{' '}
                    {recommendation.continuationAfterReturn}
                  </li>
                </ul>
              </div>
            )}

            <SelectInput
              label="Selected Medicine"
              value={state.medicineSelection.selectedMedicine}
              onChange={(v) => handleMedicineChange('selectedMedicine', v)}
              options={[
                { value: '', label: 'Select a medicine...' },
                { value: 'malarone', label: 'Atovaquone/Proguanil (Malarone) 250/100mg' },
                { value: 'doxycycline', label: 'Doxycycline 100mg' },
                { value: 'mefloquine', label: 'Mefloquine 250mg' },
              ]}
            />

            <TextInput
              label="Dose"
              value={state.medicineSelection.dose}
              onChange={(v) => handleMedicineChange('dose', v)}
              placeholder="e.g. 1 tablet daily"
            />

            <TextInput
              label="Start Timing"
              value={state.medicineSelection.startTiming}
              onChange={(v) => handleMedicineChange('startTiming', v)}
              placeholder="e.g. 1–2 days before departure"
            />

            <TextInput
              label="Continuation After Return"
              value={state.medicineSelection.continuationAfterReturn}
              onChange={(v) =>
                handleMedicineChange('continuationAfterReturn', v)
              }
              placeholder="e.g. 7 days after returning"
            />

            <TextArea
              label="Clinical Reason for Selection"
              value={state.medicineSelection.reason}
              onChange={(v) => handleMedicineChange('reason', v)}
              placeholder="Explain why this medicine was selected for this patient..."
              rows={4}
            />
          </div>
        </StepWrapper>
      )}

      {/* Step 7: Counselling */}
      {state.currentStep === 7 && !isBlocked && (
        <StepWrapper
          title="Counselling & Follow-up"
          description="Confirm that all counselling points have been discussed:"
          currentStep={state.currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={handleNext}
          onPrev={handlePrev}
          canProceed={!validationError}
          validationError={validationError}
        >
          <div className="space-y-3">
            <Checkbox
              label="Take with food"
              checked={state.counselling.takeWithFood}
              onChange={(v) => handleCounsellingChange('takeWithFood', v)}
              description="Advised to take with food to reduce GI upset"
            />
            <Checkbox
              label="Sun protection advice"
              checked={state.counselling.sunProtectionAdvice}
              onChange={(v) =>
                handleCounsellingChange('sunProtectionAdvice', v)
              }
              description="Especially important for doxycycline; SPF 50+ sunscreen"
            />
            <Checkbox
              label="Bite prevention measures"
              checked={state.counselling.bitePrevention}
              onChange={(v) => handleCounsellingChange('bitePrevention', v)}
              description="Insect repellent, bed nets, protective clothing"
            />
            <Checkbox
              label="Pregnancy / breastfeeding implications"
              checked={state.counselling.pregnancyAdvice}
              onChange={(v) => handleCounsellingChange('pregnancyAdvice', v)}
              description="Discussed implications if patient becomes pregnant while taking"
            />
            <Checkbox
              label="Management of diarrhoea"
              checked={state.counselling.diarrhoeaManagement}
              onChange={(v) =>
                handleCounsellingChange('diarrhoeaManagement', v)
              }
              description="When diarrhoea may be a side effect vs. a sign of malaria"
            />
            <Checkbox
              label="Fever management"
              checked={state.counselling.feverManagement}
              onChange={(v) => handleCounsellingChange('feverManagement', v)}
              description="Advised that fever within 1 year of return requires urgent evaluation"
            />
            <Checkbox
              label="Side effects explained"
              checked={state.counselling.sideEffectsExplained}
              onChange={(v) =>
                handleCounsellingChange('sideEffectsExplained', v)
              }
              description="Common side effects and when to contact pharmacist/doctor"
            />
            <Checkbox
              label="When to seek help"
              checked={state.counselling.whenToSeekHelp}
              onChange={(v) => handleCounsellingChange('whenToSeekHelp', v)}
              description="Red flags requiring urgent medical attention"
            />
            <Checkbox
              label="Medicine card provided"
              checked={state.counselling.medicineCardProvided}
              onChange={(v) =>
                handleCounsellingChange('medicineCardProvided', v)
              }
              description="Patient given antimalarial medicine card or information leaflet"
            />
          </div>
        </StepWrapper>
      )}

      {/* Step 8: Summary */}
      {state.currentStep === 8 && !isBlocked && (
        <StepWrapper
          title="Summary & Print"
          currentStep={state.currentStep}
          totalSteps={TOTAL_STEPS}
          onNext={() => {
            setCompletedSteps((prev) => {
              const updated = new Set(prev);
              updated.add(state.currentStep);
              return updated;
            });
            setShowReport(true);
          }}
          onPrev={handlePrev}
          canProceed={!validationError}
          validationError={validationError}
        >
          <div className="space-y-6">
            <TextInput
              label="Pharmacist Name"
              value={state.summary.pharmacistName}
              onChange={(v) => handleSummaryChange('pharmacistName', v)}
              placeholder="Full name"
            />
            <TextInput
              label="GPhC Registration Number"
              value={state.summary.pharmacistGPhC}
              onChange={(v) => handleSummaryChange('pharmacistGPhC', v)}
              placeholder="e.g. 2123456"
            />
            <TextInput
              label="Pharmacy Name"
              value={state.summary.pharmacyName}
              onChange={(v) => handleSummaryChange('pharmacyName', v)}
              placeholder="Pharmacy name"
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
        </StepWrapper>
      )}
    </div>
  );
}
