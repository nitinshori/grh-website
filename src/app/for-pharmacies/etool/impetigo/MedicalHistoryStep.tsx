'use client';

import { ImpetigoMedicalHistory } from './impetigo-types';
import { Checkbox, TextArea } from '../shared/components/FormInputs';

interface MedicalHistoryStepProps {
  medicalHistory: ImpetigoMedicalHistory;
  onChange: (history: ImpetigoMedicalHistory) => void;
}

export function MedicalHistoryStep({ medicalHistory, onChange }: MedicalHistoryStepProps) {
  const handleChange = (field: keyof ImpetigoMedicalHistory, value: unknown) => {
    onChange({
      ...medicalHistory,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Immunosuppression */}
      <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded">
        <Checkbox
          label="Patient is immunosuppressed (HIV, on steroids, biologics, etc.)"
          checked={medicalHistory.immunosuppressed}
          onChange={(checked) => handleChange('immunosuppressed', checked)}
          description="Immunosuppressed patients require GP referral for specialist assessment"
        />
      </div>

      {/* MRSA Suspected */}
      <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
        <Checkbox
          label="MRSA suspected (previous infection or risk factors)"
          checked={medicalHistory.mrsaSuspected}
          onChange={(checked) => handleChange('mrsaSuspected', checked)}
          description="If suspected, refer to GP for confirmed diagnosis and appropriate treatment"
        />
      </div>

      {/* Diabetes */}
      <div>
        <Checkbox
          label="Patient has diabetes"
          checked={medicalHistory.diabetes}
          onChange={(checked) => handleChange('diabetes', checked)}
          description="Diabetes may slow wound healing. Monitor treatment response closely"
        />
      </div>

      {/* Eczema */}
      <div>
        <Checkbox
          label="Patient has eczema or atopic dermatitis"
          checked={medicalHistory.eczema}
          onChange={(checked) => handleChange('eczema', checked)}
          description="Impetigo commonly superinfects eczematous skin. Treat both conditions"
        />
      </div>

      {/* Recurrent Impetigo */}
      <div>
        <Checkbox
          label="History of recurrent impetigo"
          checked={medicalHistory.recurrentImpetigo}
          onChange={(checked) => handleChange('recurrentImpetigo', checked)}
          description="Consider MRSA screening and nasal decolonisation for prevention"
        />
      </div>

      {/* Penicillin Allergy */}
      <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
        <Checkbox
          label="Penicillin or beta-lactam allergy confirmed"
          checked={medicalHistory.penicillinAllergy}
          onChange={(checked) => handleChange('penicillinAllergy', checked)}
          description="Affects antibiotic choice. Alternative: clarithromycin"
        />
      </div>

      {/* Recent Antibiotic Use */}
      <div>
        <Checkbox
          label="Recent antibiotic use (last 3 months)"
          checked={medicalHistory.recentAntibioticUse}
          onChange={(checked) => handleChange('recentAntibioticUse', checked)}
          description="May affect resistance patterns and treatment choice"
        />
        {medicalHistory.recentAntibioticUse && (
          <div className="mt-3">
            <TextArea
              label="Details of Recent Antibiotics"
              value={medicalHistory.recentAntibioticDetails}
              onChange={(value) => handleChange('recentAntibioticDetails', value)}
              placeholder="E.g., Amoxicillin 500mg (2 weeks ago for UTI)..."
              rows={2}
            />
          </div>
        )}
      </div>

      {/* Current Medications */}
      <div>
        <TextArea
          label="Current Regular Medications"
          value={medicalHistory.currentMedications}
          onChange={(value) => handleChange('currentMedications', value)}
          placeholder="E.g., Metformin 500mg BD, Omeprazole 20mg OD, Vitamin D supplements..."
          rows={3}
        />
        <p className="text-xs text-gray-600 mt-1">Include relevant background medications that may affect treatment</p>
      </div>

      {/* Allergies */}
      <div>
        <TextArea
          label="Known Allergies (Drug and Other)"
          value={medicalHistory.allergies}
          onChange={(value) => handleChange('allergies', value)}
          placeholder="E.g., Penicillin (rash), Latex, Shellfish..."
          rows={3}
        />
        <p className="text-xs text-gray-600 mt-1">Record any drug or non-drug allergies relevant to treatment</p>
      </div>
    </div>
  );
}
