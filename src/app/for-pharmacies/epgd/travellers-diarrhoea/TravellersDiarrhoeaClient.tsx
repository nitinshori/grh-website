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
  NumberInput,
  TextArea,
} from '../shared/components/FormInputs';

// ─── Reducer ───

function reducer(state: TDConsultationState, action: TDAction): TDConsultationState {
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
  const [showReport, setShowReport] = useState(false);

  // ─── Compute alerts and validation ───

  const alerts = useMemo(() => {
    return generateTDAlerts(
      state.medicalHistory,
      state.medications,
      state.travelAssessment
    );
  }, [state.medicalHistory, state.medications, state.travelAssessment]);

  const validationError = useMemo(() => {
    return validateStep(state.currentStep, state);
  }, [state, state.currentStep]);

  const isBlocked = !canProceedWithConsultation(alerts);

  // ─── Recommendation ───

  const recommendation = useMemo(() => {
    return recommendApproach(state.medicalHistory, state.medications);
  }, [state.medicalHistory, state.medications]);

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
    if (completedSteps.has(step) || step <= state.currentStep) {
      dispatch({ type: 'SET_STEP', step });
    }
  }, [completedSteps, state.currentStep]);

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

  const handleNewConsultation = useCallback(() => {
    dispatch({ type: "RESET" });
    setCompletedSteps(new Set());
  }, []);


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
        <TravellersDiarrhoeaSummaryReport state={state} />
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
              placeholder="e.g. India, Mexico, Morocco"
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
              label="Severe Hepatic Impairment"
              checked={state.medicalHistory.severeHepaticImpairment}
              onChange={(v) =>
                handleMedicalChange('severeHepaticImpairment', v)
              }
              description="Affects azithromycin metabolism"
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
              label="Liver Disease"
              checked={state.medicalHistory.liverDisease}
              onChange={(v) => handleMedicalChange('liverDisease', v)}
              description="Caution with azithromycin"
            />
            <Checkbox
              label="Macrolide (e.g. Erythromycin) Allergy"
              checked={state.medicalHistory.macrolideAllergy}
              onChange={(v) => handleMedicalChange('macrolideAllergy', v)}
              description="Azithromycin is a macrolide"
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
          </div>
        </StepWrapper>
      )}

      {/* Step 4: Contraindications Review */}
      {state.currentStep === 4 && (
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

      {/* Step 5: Medications (moved here for logical flow) */}
      {state.currentStep === 5 && !isBlocked && (
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
              label="QT-prolonging Drugs"
              checked={state.medications.takesQTprolongingDrugs}
              onChange={(v) =>
                handleMedicationsChange('takesQTprolongingDrugs', v)
              }
              description="Risk of QT prolongation with azithromycin"
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
            {recommendation ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium text-sm text-blue-900 mb-2">
                  Recommended Approach
                </p>
                <p className="text-sm text-blue-800 mb-3">
                  <strong>{recommendation.approach}</strong>
                </p>
                <p className="text-xs text-blue-700 mb-2">{recommendation.treatment}</p>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  Cannot supply standby treatment due to contraindications. Refer patient to GP/travel clinic.
                </p>
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
            />

            {state.medicineSelection.selectedApproach === 'standby' && (
              <>
                <TextInput
                  label="Loperamide Dose"
                  value={state.medicineSelection.loperamideDose}
                  onChange={(v) =>
                    handleMedicineChange('loperamideDose', v)
                  }
                  placeholder="e.g. 2mg initial, then 2mg after each loose stool, max 16mg/day"
                />

                <TextInput
                  label="Azithromycin Dose"
                  value={state.medicineSelection.azithromycinDose}
                  onChange={(v) =>
                    handleMedicineChange('azithromycinDose', v)
                  }
                  placeholder="e.g. 500mg once daily for 3 days"
                />

                <SelectInput
                  label="Supply for..."
                  value={state.medicineSelection.selectedForCriteria}
                  onChange={(v) =>
                    handleMedicineChange('selectedForCriteria', v)
                  }
                  options={[
                    { value: '', label: 'Select...' },
                    { value: 'mild', label: 'Mild diarrhoea (ORS first, antimotility if needed)' },
                    { value: 'moderate-severe', label: 'Moderate-severe diarrhoea (add antibiotic)' },
                  ]}
                />
              </>
            )}

            <TextArea
              label="Clinical Reason"
              value={state.medicineSelection.reason}
              onChange={(v) => handleMedicineChange('reason', v)}
              placeholder="Explain approach and why supplies are/are not suitable for this patient..."
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
              label="Oral rehydration is first-line"
              checked={state.counselling.orCrsAdvice}
              onChange={(v) => handleCounsellingChange('orCrsAdvice', v)}
              description="Advised on ORS sachets and fluid replacement"
            />
            <Checkbox
              label="When to start treatment"
              checked={state.counselling.whenToStartTreatment}
              onChange={(v) =>
                handleCounsellingChange('whenToStartTreatment', v)
              }
              description="Start when diarrhoea develops, following symptoms/criteria"
            />
            <Checkbox
              label="Loperamide use"
              checked={state.counselling.loperamideAdvice}
              onChange={(v) => handleCounsellingChange('loperamideAdvice', v)}
              description="Only if no fever or blood in stool"
            />
            <Checkbox
              label="Azithromycin use"
              checked={state.counselling.azithromycinAdvice}
              onChange={(v) =>
                handleCounsellingChange('azithromycinAdvice', v)
              }
              description="For moderate-severe diarrhoea (>6 stools/day or bloody)"
            />
            <Checkbox
              label="Pregnancy implications"
              checked={state.counselling.pregnancyAdvice}
              onChange={(v) => handleCounsellingChange('pregnancyAdvice', v)}
              description="If patient becomes pregnant during travel"
            />
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
              description="Red flags: severe dehydration, blood, fever, >7 days"
            />
            <Checkbox
              label="Not suitable for <12"
              checked={state.counselling.childrenUnderWarning}
              onChange={(v) =>
                handleCounsellingChange('childrenUnderWarning', v)
              }
              description="Warning that children <12 need specialist medical advice"
            />
            <Checkbox
              label="Medicine card provided"
              checked={state.counselling.medicineCardProvided}
              onChange={(v) =>
                handleCounsellingChange('medicineCardProvided', v)
              }
              description="Patient given loperamide/azithromycin information"
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
        getConsultationData={getConsultationData}
        onNewConsultation={handleNewConsultation}
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
