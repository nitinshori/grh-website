"use client";

import { useState, useCallback } from "react";
import { ProgressBar } from "../shared/components/ProgressBar";
import { StepWrapper } from "../shared/components/StepWrapper";
import { PatientDetailsStep } from "../shared/steps/PatientDetailsStep";
import { ConsentStep } from "../shared/steps/ConsentStep";
import { TextInput, TextArea } from "../shared/components/FormInputs";

export default function HepBOccupationalClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState({
    patient: { firstName: "", lastName: "", dateOfBirth: "", age: null, gpName: "", gpPractice: "", nhsNumber: "", address: "", phone: "", email: "" },
    consent: { informedConsentGiven: false, idVerified: false, idType: "", patientAwarePrivateService: false },
    summary: { pharmacistName: "", pharmacistGPhC: "", pharmacyName: "", pharmacyAddress: "", consultationDate: new Date().toISOString().split("T")[0], consultationTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), clinicalNotes: "" },
  });
  const handleNext = useCallback(() => setCurrentStep(prev => Math.min(prev + 1, 6)), []);
  const handlePrev = useCallback(() => setCurrentStep(prev => Math.max(prev - 1, 0)), []);
  return (
    <div className="space-y-6">
      <ProgressBar current={currentStep + 1} total={7} />
      <StepWrapper title={["Patient Details", "Consent", "Assessment", "Treatment", "Counselling", "Summary", "Consultation Complete"][currentStep]} currentStep={currentStep} totalSteps={7} onNext={handleNext} onPrev={handlePrev} canProceed={true} validationError={null}>
        {currentStep === 0 && <PatientDetailsStep patient={state.patient} onChange={(field, value) => setState(prev => ({ ...prev, patient: { ...prev.patient, [field]: value } }))} />}
        {currentStep === 1 && <ConsentStep consent={state.consent} onChange={(field, value) => setState(prev => ({ ...prev, consent: { ...prev.consent, [field]: value } }))} />}
        {currentStep === 5 && (
          <div className="space-y-4">
            <TextInput label="Pharmacist name" value={state.summary.pharmacistName} onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, pharmacistName: v } }))} required />
            <TextInput label="GPhC registration" value={state.summary.pharmacistGPhC} onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, pharmacistGPhC: v } }))} required />
            <TextInput label="Pharmacy name" value={state.summary.pharmacyName} onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, pharmacyName: v } }))} />
            <TextArea label="Clinical notes" value={state.summary.clinicalNotes} onChange={v => setState(prev => ({ ...prev, summary: { ...prev.summary, clinicalNotes: v } }))} rows={3} />
          </div>
        )}
        {currentStep === 6 && <div className="p-4 bg-green-50 border border-green-200 rounded-lg"><p className="text-sm font-semibold text-green-900">Consultation Record Complete</p></div>}
      </StepWrapper>
    </div>
  );
}
