'use client';

import { ImpetigoData, IMPETIGO_PGD_VERSION } from './impetigo-types';
import { BaseSummary, ClinicalAlert } from '../shared/types';
import { TextInput, TextArea } from '../shared/components/FormInputs';
import { clarithromycinWeightBand } from './impetigo-clinical-logic';
import { drugSpecificAdviceLabel } from './CounsellingStep';
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from '../shared/components/SummaryReportShell';

interface SummaryStepProps {
  data: ImpetigoData;
  summary: BaseSummary;
  onSummaryChange: (summary: BaseSummary) => void;
  alerts: ClinicalAlert[];
}

const TREATMENT_LABEL: Record<string, string> = {
  'fusidic-acid': 'Fusidic acid 2% cream (topical arm)',
  'hydrogen-peroxide': 'Hydrogen peroxide 1% cream, P sale (not a PGD supply)',
  flucloxacillin: 'Flucloxacillin 250mg/5ml oral suspension (flucloxacillin arm)',
  clarithromycin: 'Clarithromycin (macrolide arm)',
  erythromycin: 'Erythromycin, pregnancy (macrolide arm)',
};

export function SummaryStep({ data, summary, onSummaryChange, alerts }: SummaryStepProps) {
  const handleSummaryChange = (field: keyof BaseSummary, value: unknown) => {
    onSummaryChange({
      ...summary,
      [field]: value,
    });
  };

  const counsellingItems: [string, boolean][] = [
    ['Hygiene advice: do not share towels, flannels or bedding', data.counselling.hygieneAdvice],
    ['Hand washing after touching lesions or applying cream', data.counselling.handwashing],
    ['School or nursery exclusion until crusted and dry, or 48 hours after starting an antibiotic', data.counselling.schoolExclusion],
    ['Keep covered, no picking or scratching, nails short', data.counselling.avoidTouching],
    ['Told topical and oral treatment are not combined', data.counselling.noCombination],
    [drugSpecificAdviceLabel(data.treatmentSelection.treatment), data.counselling.drugSpecificAdvice],
    ['Complete the course', data.counselling.completeCourse],
    ['Application technique for topical treatment', data.counselling.applicationAdvice],
    ['Return if no improvement, spreading, or unwell', data.counselling.returnIfWorsening],
    ['Contagion period explained', data.counselling.contagionPeriod],
  ];

  const age = data.patientDetails.age;
  const weight = parseFloat(data.medicalHistory.weightKg);
  const weightBand = !isNaN(weight) && weight > 0 ? clarithromycinWeightBand(weight).label : '';
  const isMacrolide = data.treatmentSelection.treatment === 'clarithromycin' || data.treatmentSelection.treatment === 'erythromycin';

  const consentText = (() => {
    const c = data.consentDetails;
    if (c.basis === 'parental-responsibility')
      return `From a person with parental responsibility: ${c.personName || 'name not recorded'} (${c.relationship || 'relationship not recorded'})`;
    if (c.basis === 'gillick-competent') return `From the young person, assessed as Gillick competent. Basis: ${c.gillickBasis || 'not recorded'}`;
    if (c.basis === 'patient') return 'From the patient';
    return data.consent.informedConsentGiven ? 'Informed consent given' : 'Not recorded';
  })();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded p-6">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">Impetigo Consultation Report</h2>
        <p className="text-sm text-blue-700">{IMPETIGO_PGD_VERSION}</p>
      </div>

      {/* Pharmacist Details */}
      <SectionHeader>Pharmacist Details</SectionHeader>
      <div className="space-y-4">
        <TextInput
          value={summary.pharmacistName}
          onChange={(value) => handleSummaryChange('pharmacistName', value)}
          placeholder="Enter your full name"
          label="Pharmacist Name *"
        />
        <TextInput
          value={summary.pharmacistGPhC}
          onChange={(value) => handleSummaryChange('pharmacistGPhC', value)}
          placeholder="GPhC registration number"
          label="GPhC registration number *"
        />
        <TextInput
          value={summary.consultationDate}
          onChange={(value) => handleSummaryChange('consultationDate', value)}
          placeholder="DD/MM/YYYY"
          label="Consultation Date *"
          type="date"
        />
        <TextInput
          value={summary.consultationTime}
          onChange={(value) => handleSummaryChange('consultationTime', value)}
          placeholder="HH:MM"
          label="Consultation Time *"
          type="time"
        />
      </div>

      {/* Patient Details Summary */}
      <SectionHeader>Patient Details</SectionHeader>
      <div className="space-y-2">
        <Row label="Name" value={`${data.patientDetails.firstName} ${data.patientDetails.lastName}`} />
        <Row label="NHS Number" value={data.patientDetails.nhsNumber} />
        <Row label="Date of Birth" value={`${data.patientDetails.dateOfBirth}${age !== null ? ` (age ${age})` : ''}`} />
        <Row label="Address" value={data.patientDetails.address} />
        <Row label="GP" value={`${data.patientDetails.gpName || ''} ${data.patientDetails.gpPractice || ''}`.trim()} />
        <Row label="Contact Number" value={data.patientDetails.phone} />
        <Row label="Consent" value={consentText} />
      </div>

      {/* Clinical Assessment */}
      <SectionHeader>Clinical Assessment</SectionHeader>
      <div className="space-y-2">
        <Row label="Type" value={data.lesionAssessment.lesionType || 'Not specified'} />
        <Row label="Extent" value={data.lesionAssessment.extent || 'Not specified'} />
        <Row
          label="Number and size of lesions"
          value={`${data.lesionAssessment.numberOfLesions || 'not recorded'}; area ${data.lesionAssessment.lesionSizeCm || 'not recorded'} cm`}
        />
        <Row label="Affected Areas" value={data.lesionAssessment.affectedAreas.join(', ') || 'None specified'} />
        <Row label="Duration" value={data.lesionAssessment.duration || 'Not specified'} />
        {data.lesionAssessment.hydrogenPeroxide && (
          <Row
            label="Hydrogen peroxide 1%"
            value={
              data.lesionAssessment.hydrogenPeroxide === 'offered-p-sale'
                ? 'Offered as a P sale first'
                : data.lesionAssessment.hydrogenPeroxide === 'unsuitable'
                  ? 'Unsuitable'
                  : 'Tried and ineffective'
            }
          />
        )}
        <Row
          label="Penicillin allergy history"
          value={`${data.medicalHistory.penicillinAllergy ? 'Penicillin-allergic' : 'Not penicillin-allergic'}. ${data.medicalHistory.penicillinAllergyHistory || ''}`.trim()}
        />
        {age !== null && age < 18 && isMacrolide && (
          <Row
            label="Weight (measured today)"
            value={
              data.medicalHistory.cannotBeWeighed
                ? 'Could not be weighed'
                : `${data.medicalHistory.weightKg || 'not recorded'} kg${weightBand ? `, band ${weightBand}` : ''}`
            }
          />
        )}
        {(data.medicalHistory.pregnant || data.medicalHistory.breastfeeding) && (
          <Row
            label="Pregnancy / breastfeeding"
            value={`${data.medicalHistory.pregnant ? `Pregnant (${data.medicalHistory.pregnancyEstablishedHow || 'how established: not recorded'})` : ''}${
              data.medicalHistory.breastfeeding
                ? `${data.medicalHistory.pregnant ? '; ' : ''}Breastfeeding${data.medicalHistory.breastfeedingDiscussed ? ', macrolide choice discussed and recorded' : ''}`
                : ''
            }`}
          />
        )}
        {data.lesionAssessment.additionalNotes && (
          <Row label="Additional Notes" value={data.lesionAssessment.additionalNotes} />
        )}
      </div>

      {/* Alerts Summary */}
      {alerts.length > 0 && (
        <>
          <SectionHeader>Clinical Alerts</SectionHeader>
          <AlertSummary alerts={alerts} />
        </>
      )}

      {/* Treatment Plan */}
      <SectionHeader>Treatment Plan</SectionHeader>
      <div className="space-y-2">
        <Row label="Treatment (arm)" value={TREATMENT_LABEL[data.treatmentSelection.treatment] || 'Not selected'} />
        <Row label="Dose" value={data.treatmentSelection.dose} />
        <Row label="Frequency" value={data.treatmentSelection.frequency} />
        <Row
          label="Duration"
          value={`${data.treatmentSelection.duration}${data.treatmentSelection.duration === '7 days' ? ` (extended: ${data.treatmentSelection.extensionReason || 'reason not recorded'})` : ''}`}
        />
        {data.treatmentSelection.severeDoseReason && (
          <Row label="500mg twice a day, reason" value={data.treatmentSelection.severeDoseReason} />
        )}
        <Row label="Quantity" value={String(data.treatmentSelection.quantity)} />
        <Row label="Date of supply" value={summary.consultationDate} />
        {data.treatmentSelection.pharmacistOverride && (
          <Row label="Override reason" value={data.treatmentSelection.overrideReason} />
        )}
      </div>

      {/* Counselling Provided */}
      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid items={counsellingItems} />

      {/* Clinical Notes */}
      <SectionHeader>Clinical Notes</SectionHeader>
      <TextArea
        value={summary.clinicalNotes}
        onChange={(value) => handleSummaryChange('clinicalNotes', value)}
        placeholder="Enter any additional clinical notes, treatment plan details, or patient education provided..."
        label="Clinical Notes"
        rows={4}
      />

      {/* Pharmacist Declaration */}
      <SectionHeader>Pharmacist Declaration</SectionHeader>
      <PharmacistDeclaration
        pgdName={IMPETIGO_PGD_VERSION}
        pharmacistName={summary.pharmacistName}
        pharmacistGPhC={summary.pharmacistGPhC || ''}
        pharmacyName={summary.pharmacyName || ''}
      />

      {/* Footer */}
      <ReportFooter pgdName={IMPETIGO_PGD_VERSION} />
    </div>
  );
}
