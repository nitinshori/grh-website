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

function reducer(state: ASConsultationState, action: ASAction): ASConsultationState {
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
  const [showReport, setShowReport] = useState(false);

  // ─── Compute alerts and validation ───

  const alerts = useMemo(() => {
    return generateASAlerts(
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
    if (completedSteps.has(step) || step <= state.currentStep) {
      dispatch({ type: 'SET_STEP', step });
    }
  }, [completedSteps, state.currentStep]);

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
        <AltitudeSicknessSummaryReport state={state} />
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
          title="Travel & Altitude Assessment"
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
              placeholder="e.g. Peru, Nepal, Ecuador"
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
                { value: '', label: 'Select...' },
                { value: 'prevention', label: 'Prevention of AMS (started before ascent)' },
                { value: 'treatment', label: 'Symptomatic treatment of AMS (started at symptom onset)' },
              ]}
              required
            />
            <NumberInput
              label="Current Altitude (meters)"
              value={state.travelAssessment.currentAltitude}
              onChange={(v) => handleTravelChange('currentAltitude', v)}
              placeholder="e.g. sea level = 0"
            />
            <TextInput
              label="Departure Date"
              type="date"
              value={state.travelAssessment.departureDate}
              onChange={(v) => handleTravelChange('departureDate', v)}
            />

            <SelectInput
              label="Ascent Rate"
              value={state.travelAssessment.ascentRate}
              onChange={(v) => handleTravelChange('ascentRate', v)}
              options={[
                { value: '', label: 'Select ascent rate...' },
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
                  Regimen per the PGD ({AS_PGD_VERSION})
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
                    <strong>Continue:</strong> {recommendation.continuationTiming}
                  </li>
                  <li>{recommendation.reason}</li>
                </ul>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  Acetazolamide is contraindicated. Pharmacological prevention cannot be
                  offered. Advise non-pharmacological prevention (slow ascent, hydration).
                </p>
              </div>
            )}

            <SelectInput
              label="Medicine Choice"
              value={state.medicineSelection.selectedMedicine}
              onChange={(v) => handleMedicineChange('selectedMedicine', v)}
              options={[
                { value: '', label: 'Select...' },
                { value: 'acetazolamide', label: 'Acetazolamide 250 mg tablets (scored)' },
              ]}
            />

            <TextInput
              label="Brand supplied"
              value={state.medicineSelection.brand}
              onChange={(v) => handleMedicineChange('brand', v)}
              placeholder="Name and brand of the product supplied"
            />

            <TextInput
              label="Dose"
              value={state.medicineSelection.dose}
              onChange={(v) => handleMedicineChange('dose', v)}
              placeholder={state.travelAssessment.purpose === 'treatment' ? 'e.g. 250 mg twice daily for up to 3 days' : 'e.g. 125 mg (half a tablet) twice daily'}
            />

            <TextInput
              label="Start Timing"
              value={state.medicineSelection.startTiming}
              onChange={(v) => handleMedicineChange('startTiming', v)}
              placeholder={state.travelAssessment.purpose === 'treatment' ? 'At symptom onset' : 'e.g. 1 to 2 days before ascent'}
            />

            <TextInput
              label="Continuation Timing"
              value={state.medicineSelection.continuationTiming}
              onChange={(v) =>
                handleMedicineChange('continuationTiming', v)
              }
              placeholder={state.travelAssessment.purpose === 'treatment' ? 'Maximum 3 days' : 'e.g. 2 days after reaching highest altitude, or until descent begins'}
            />

            {state.travelAssessment.purpose === 'prevention' && (
              <Checkbox
                label="Also supply a treatment course (6 tablets, 250 mg twice daily for 3 days)"
                checked={state.medicineSelection.includeTreatmentCourse}
                onChange={(v) => handleMedicineChange('includeTreatmentCourse', v)}
                description="Only where the itinerary makes descent difficult. Maximum total 20 tablets per supply."
              />
            )}

            <NumberInput
              label="Quantity supplied (tablets)"
              value={state.medicineSelection.quantityTablets}
              onChange={(v) => handleMedicineChange('quantityTablets', v)}
              min={1}
              max={maxQuantityTablets(state.travelAssessment.purpose, state.medicineSelection.includeTreatmentCourse)}
              unit="tablets"
              placeholder="Rounded up to whole tablets"
              required
            />
            <p className="text-xs text-gray-600">
              PGD maximum for this regimen: {maxQuantityTablets(state.travelAssessment.purpose, state.medicineSelection.includeTreatmentCourse)} tablets
              (prevention 14 = 28 doses over 14 days; treatment 6; total 20). Prevention: maximum 14 days per supply without review.
            </p>

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
