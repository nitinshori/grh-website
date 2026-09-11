'use client';

import { ImpetigoMedicalHistory } from './impetigo-types';
import { Checkbox, TextArea, TextInput } from '../shared/components/FormInputs';

interface MedicalHistoryStepProps {
  medicalHistory: ImpetigoMedicalHistory;
  onChange: (history: ImpetigoMedicalHistory) => void;
  /** Patient age in whole years, for the child-only questions (weight, suspension). */
  age: number | null;
  /** True where the lesion assessment sends the patient to an oral arm. */
  oralRoute: boolean;
}

export function MedicalHistoryStep({ medicalHistory, onChange, age, oralRoute }: MedicalHistoryStepProps) {
  const handleChange = (field: keyof ImpetigoMedicalHistory, value: unknown) => {
    onChange({
      ...medicalHistory,
      [field]: value,
    });
  };

  const isChild = age !== null && age < 18;

  return (
    <div className="space-y-6">
      {/* Immunosuppression */}
      <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded">
        <Checkbox
          label="Immunocompromised (HIV, chemotherapy, biologics, long-term steroids, etc.)"
          checked={medicalHistory.immunosuppressed}
          onChange={(checked) => handleChange('immunosuppressed', checked)}
          description="NICE advises hospital referral where impetigo is widespread in an immunocompromised patient. This tool refers in all cases."
        />
      </div>

      {/* MRSA Suspected */}
      <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
        <Checkbox
          label="MRSA suspected or confirmed (previous infection or risk factors)"
          checked={medicalHistory.mrsaSuspected}
          onChange={(checked) => handleChange('mrsaSuspected', checked)}
          description="Consult a local microbiologist. Not for supply under this PGD."
        />
      </div>

      <div className="space-y-3">
        <Checkbox
          label="Recurrent impetigo (frequent repeated episodes)"
          checked={medicalHistory.recurrentImpetigo}
          onChange={(checked) => handleChange('recurrentImpetigo', checked)}
          description="Refer for swabbing and consideration of decolonisation, rather than treating again."
        />
        <Checkbox
          label="A course of antibiotic already supplied for this episode under this PGD"
          checked={medicalHistory.antibioticAlreadyThisEpisode}
          onChange={(checked) => handleChange('antibioticAlreadyThisEpisode', checked)}
          description="One course per episode. Treatment failure needs reassessment and a swab, not a second guess."
        />
        <Checkbox
          label="Patient has diabetes"
          checked={medicalHistory.diabetes}
          onChange={(checked) => handleChange('diabetes', checked)}
          description="Diabetes may slow healing. Monitor treatment response closely."
        />
        <Checkbox
          label="Patient has eczema or atopic dermatitis"
          checked={medicalHistory.eczema}
          onChange={(checked) => handleChange('eczema', checked)}
          description="Impetigo commonly superinfects eczematous skin. Exclude eczema herpeticum."
        />
      </div>

      {/* Penicillin Allergy */}
      <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded space-y-3">
        <Checkbox
          label="Penicillin-allergic (true allergy or documented intolerance)"
          checked={medicalHistory.penicillinAllergy}
          onChange={(checked) => handleChange('penicillinAllergy', checked)}
          description="Take a proper penicillin allergy history and distinguish a true allergy from an intolerance. Record what the patient describes; this is not the consultation in which to unpick a childhood label. A penicillin-allergic patient needing an oral antibiotic uses the macrolide arm."
        />
        <TextArea
          label="Penicillin allergy history, in the patient's own terms"
          value={medicalHistory.penicillinAllergyHistory}
          onChange={(value) => handleChange('penicillinAllergyHistory', value)}
          placeholder="E.g. 'rash all over after amoxicillin as a child', 'none known'"
          rows={2}
          required={medicalHistory.penicillinAllergy}
        />
        <Checkbox
          label="Cephalosporin allergy with a high risk of cross-reactivity to penicillins"
          checked={medicalHistory.cephalosporinAllergyHighRisk}
          onChange={(checked) => handleChange('cephalosporinAllergyHighRisk', checked)}
          description="Excludes the flucloxacillin arm."
        />
        <Checkbox
          label="Known hypersensitivity to fusidic acid or to any excipient of the cream"
          checked={medicalHistory.fusidicAcidAllergy}
          onChange={(checked) => handleChange('fusidicAcidAllergy', checked)}
        />
        <Checkbox
          label="Known hypersensitivity to clarithromycin or to any macrolide"
          checked={medicalHistory.macrolideAllergy}
          onChange={(checked) => handleChange('macrolideAllergy', checked)}
        />
      </div>

      {/* Flucloxacillin arm exclusions */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-900">Hepatic, renal and flucloxacillin history</p>
        <Checkbox
          label="Previous cholestasis or jaundice associated with flucloxacillin"
          checked={medicalHistory.flucloxCholestasisHistory}
          onChange={(checked) => handleChange('flucloxCholestasisHistory', checked)}
        />
        <Checkbox
          label="Severe hepatic impairment"
          checked={medicalHistory.severeHepaticImpairment}
          onChange={(checked) => handleChange('severeHepaticImpairment', checked)}
        />
        <Checkbox
          label="Severe renal impairment (eGFR below 30 mL/min/1.73m2)"
          checked={medicalHistory.severeRenalImpairment}
          onChange={(checked) => handleChange('severeRenalImpairment', checked)}
        />
        {isChild && oralRoute && !medicalHistory.penicillinAllergy && (
          <Checkbox
            label="The child will not take the flucloxacillin suspension (unpalatable): use the macrolide arm on grounds of unsuitability"
            checked={medicalHistory.flucloxSuspensionRefused}
            onChange={(checked) => handleChange('flucloxSuspensionRefused', checked)}
            description="NICE allows a macrolide where flucloxacillin is unsuitable. Record which applies."
          />
        )}
      </div>

      {/* Pregnancy and breastfeeding */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-900">Pregnancy and breastfeeding (where relevant)</p>
        <Checkbox
          label="Pregnant"
          checked={medicalHistory.pregnant}
          onChange={(checked) => handleChange('pregnant', checked)}
          description="Penicillin-allergic and pregnant: erythromycin, not clarithromycin."
        />
        {medicalHistory.pregnant && (
          <TextInput
            label="How pregnancy status was established"
            value={medicalHistory.pregnancyEstablishedHow}
            onChange={(value) => handleChange('pregnancyEstablishedHow', value)}
            placeholder="e.g. patient report, 24 weeks; positive test"
            required
          />
        )}
        <Checkbox
          label="Breastfeeding"
          checked={medicalHistory.breastfeeding}
          onChange={(checked) => handleChange('breastfeeding', checked)}
        />
        {medicalHistory.breastfeeding && (
          <Checkbox
            label="Macrolide in breastfeeding: the choice has been discussed with the patient and is recorded in the notes"
            checked={medicalHistory.breastfeedingDiscussed}
            onChange={(checked) => handleChange('breastfeedingDiscussed', checked)}
            description="Breastfeeding excludes the macrolide arm unless the choice has been discussed and recorded."
          />
        )}
      </div>

      {/* Weight, children */}
      {isChild && (
        <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded space-y-3">
          <p className="text-sm font-medium text-gray-900">Child: weight, measured today</p>
          <TextInput
            label="Weight in kilograms, measured today"
            value={medicalHistory.weightKg}
            onChange={(value) => handleChange('weightKg', value)}
            placeholder="e.g. 14.5"
            type="number"
            required={oralRoute && !medicalHistory.cannotBeWeighed}
          />
          <Checkbox
            label="The child cannot be weighed today"
            checked={medicalHistory.cannotBeWeighed}
            onChange={(checked) => handleChange('cannotBeWeighed', checked)}
            description="Do not estimate from age. A child who cannot be weighed cannot receive a macrolide under this PGD."
          />
        </div>
      )}

      {/* Clarithromycin contraindications */}
      <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded space-y-3">
        <p className="text-sm font-medium text-red-900">Clarithromycin contraindications (SPC): these are exclusions, not cautions</p>
        <Checkbox
          label="Taking simvastatin or lovastatin"
          checked={medicalHistory.takesSimvastatinOrLovastatin}
          onChange={(checked) => handleChange('takesSimvastatinOrLovastatin', checked)}
          description="Do not supply, and do not advise the patient to stop their statin; that is a prescriber decision."
        />
        <Checkbox
          label="Taking colchicine"
          checked={medicalHistory.takesColchicine}
          onChange={(checked) => handleChange('takesColchicine', checked)}
        />
        <Checkbox
          label="Taking an ergot alkaloid (ergotamine or dihydroergotamine)"
          checked={medicalHistory.takesErgotAlkaloid}
          onChange={(checked) => handleChange('takesErgotAlkaloid', checked)}
        />
        <Checkbox
          label="Taking ticagrelor"
          checked={medicalHistory.takesTicagrelor}
          onChange={(checked) => handleChange('takesTicagrelor', checked)}
        />
        <Checkbox
          label="Taking oral midazolam, lomitapide, ivabradine, ranolazine, domperidone or pimozide"
          checked={medicalHistory.takesClariSpcContraindicated}
          onChange={(checked) => handleChange('takesClariSpcContraindicated', checked)}
        />
        <Checkbox
          label="History of QT prolongation (congenital or acquired) or of ventricular arrhythmia including torsades de pointes"
          checked={medicalHistory.qtProlongationHistory}
          onChange={(checked) => handleChange('qtProlongationHistory', checked)}
        />
        <Checkbox
          label="Taking any other medicine known to prolong the QT interval, or hypokalaemia or hypomagnesaemia"
          checked={medicalHistory.qtMedicinesOrElectrolytes}
          onChange={(checked) => handleChange('qtMedicinesOrElectrolytes', checked)}
        />
        <Checkbox
          label="Taking any other statin, or warfarin (caution: check the current BNF)"
          checked={medicalHistory.takesOtherStatinOrWarfarin}
          onChange={(checked) => handleChange('takesOtherStatinOrWarfarin', checked)}
          description="Dose adjustment or monitoring may be needed and referral may be the safer course."
        />
      </div>

      {/* Recent Antibiotic Use */}
      <div>
        <Checkbox
          label="Recent antibiotic use (last 3 months)"
          checked={medicalHistory.recentAntibioticUse}
          onChange={(checked) => handleChange('recentAntibioticUse', checked)}
          description="Previous antibiotic use may have led to resistant bacteria"
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
        <p className="text-xs text-gray-600 mt-1">Also check digoxin, midazolam, ciclosporin, tacrolimus and antiepileptics against the BNF and SPC before a macrolide.</p>
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
