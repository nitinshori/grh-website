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
              label="High fever"
              checked={state.medicalHistory.feverAbove38_5C}
              onChange={(v) => handleMedicalChange('feverAbove38_5C', v)}
              description="Exclusion. Refer for medical assessment."
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
                  Regimen per the PGD ({TD_PGD_VERSION})
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
                  label="Azithromycin dose (PGD: 500 mg once daily for 1 to 3 days)"
                  value={state.medicineSelection.azithromycinDose}
                  onChange={(v) =>
                    handleMedicineChange('azithromycinDose', v)
                  }
                  placeholder="e.g. 500 mg once daily for up to 3 days, with food"
                  required
                />

                <NumberInput
                  label="Azithromycin quantity (500 mg tablets)"
                  value={state.medicineSelection.azithromycinQuantity}
                  onChange={(v) => handleMedicineChange('azithromycinQuantity', v)}
                  min={1}
                  max={3}
                  unit="tablets"
                  placeholder="1 to 3"
                  required
                />
                <p className="text-xs text-gray-600">
                  PGD: one to three 500 mg tablets depending on symptom severity. Maximum treatment course 3 days.
                </p>

                <TextInput
                  label="Brand supplied"
                  value={state.medicineSelection.brand}
                  onChange={(v) => handleMedicineChange('brand', v)}
                  placeholder="Name and brand of the azithromycin product supplied"
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

                <TextInput
                  label="Loperamide (OTC sale alongside, not supplied under this PGD; optional)"
                  value={state.medicineSelection.loperamideDose}
                  onChange={(v) =>
                    handleMedicineChange('loperamideDose', v)
                  }
                  placeholder="Guidance: 4 mg initially, then 2 mg after each loose stool, max 16 mg/day; not with blood in stool or fever"
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
              description="Oral rehydration is the key priority; maintain hydration"
            />
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
              description="500 mg once daily for 1 to 3 days depending on severity; maximum 3 days. Do not use for bloody diarrhoea or high fever: seek medical help instead"
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
              description="Seek local medical attention if symptoms worsen or persist: fever, bloody diarrhoea, severe abdominal pain, persistent vomiting or inability to stay hydrated, diarrhoea lasting more than 14 days, or becoming systemically very unwell"
            />
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
