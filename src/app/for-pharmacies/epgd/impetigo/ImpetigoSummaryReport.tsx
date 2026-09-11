'use client';

import { ImpetigoData, IMPETIGO_PGD_VERSION } from './impetigo-types';
import type { ClinicalAlert } from '../shared/types';
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

interface ImpetigoSummaryReportProps {
  data: ImpetigoData;
  alerts: ClinicalAlert[];
  referralReasons: string[];
  stopped: boolean;
}

const PGD_NAME = 'Impetigo (fusidic acid, flucloxacillin, clarithromycin or erythromycin)';

const TREATMENT_LABEL: Record<string, string> = {
  'fusidic-acid': 'Fusidic acid 2% cream (topical arm)',
  'hydrogen-peroxide': 'Hydrogen peroxide 1% cream, P sale (not a PGD supply)',
  flucloxacillin: 'Flucloxacillin 250mg/5ml oral suspension (flucloxacillin arm)',
  clarithromycin: 'Clarithromycin (macrolide arm)',
  erythromycin: 'Erythromycin, pregnancy (macrolide arm)',
};

/**
 * Print-only consultation record. Until this existed the printed "record"
 * was the live SummaryStep form with its editable inputs, progress bar and
 * alert banner (adversarial review, 11 Sep 2026).
 */
export function ImpetigoSummaryReport({ data, alerts, referralReasons, stopped }: ImpetigoSummaryReportProps) {
  const { patientDetails, consent, consentDetails, lesionAssessment, medicalHistory, treatmentSelection, counselling, summary } = data;
  const age = patientDetails.age;
  const weight = parseFloat(medicalHistory.weightKg);
  const weightBand = !isNaN(weight) && weight > 0 ? clarithromycinWeightBand(weight).label : '';
  const isMacrolide = treatmentSelection.treatment === 'clarithromycin' || treatmentSelection.treatment === 'erythromycin';
  const pSale = !stopped && treatmentSelection.treatment === 'hydrogen-peroxide';
  const supplied = !stopped && !pSale && !!treatmentSelection.treatment;

  const consentText = (() => {
    const c = consentDetails;
    if (c.basis === 'parental-responsibility')
      return `From a person with parental responsibility: ${c.personName || 'name not recorded'} (${c.relationship || 'relationship not recorded'})`;
    if (c.basis === 'gillick-competent') return `From the young person, assessed as Gillick competent. Basis: ${c.gillickBasis || 'not recorded'}`;
    return consent.informedConsentGiven ? 'Informed consent given by the patient' : 'Not recorded';
  })();

  const counsellingItems: [string, boolean][] = [
    ['Hygiene advice: do not share towels, flannels or bedding', counselling.hygieneAdvice],
    ['Hand washing after touching lesions or applying cream', counselling.handwashing],
    ['School or nursery exclusion until crusted and dry, or 48 hours after starting an antibiotic', counselling.schoolExclusion],
    ['Keep covered, no picking or scratching, nails short', counselling.avoidTouching],
    ['Told topical and oral treatment are not combined', counselling.noCombination],
    [drugSpecificAdviceLabel(treatmentSelection.treatment), counselling.drugSpecificAdvice],
    ['Complete the course', counselling.completeCourse],
    // Topical arms only: an oral arm has no application technique to record.
    ...((treatmentSelection.treatment === 'fusidic-acid' || treatmentSelection.treatment === 'hydrogen-peroxide')
      ? [['Application technique for topical treatment', counselling.applicationAdvice] as [string, boolean]]
      : []),
    ['Return if no improvement, spreading, or unwell', counselling.returnIfWorsening],
    ['Contagion period explained', counselling.contagionPeriod],
  ];

  return (
    <div className="print:p-0 space-y-0">
      <div className="bg-navy-900 text-white px-6 py-4 mb-6 print:mb-4 print:px-4 print:py-3">
        <h1 className="text-2xl font-bold print:text-lg">Impetigo ePGD</h1>
        <p className="text-sm text-gray-100 mt-1 print:text-xs">
          Patient Group Direction Consultation Record.{' '}
          {stopped ? 'NOT SUPPLIED: referred.' : pSale ? 'No PGD supply: hydrogen peroxide 1% sold as a pharmacy medicine.' : 'Supplied under the'} {IMPETIGO_PGD_VERSION}.
        </p>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Patient Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Name" value={`${patientDetails.firstName} ${patientDetails.lastName}`} />
          <Row label="DOB" value={`${patientDetails.dateOfBirth}${age !== null ? ` (age ${age})` : ''}`} />
          <Row label="NHS Number" value={patientDetails.nhsNumber || 'Not recorded'} />
          <Row label="Address" value={patientDetails.address || 'Not recorded'} />
          <Row label="GP" value={`${patientDetails.gpName || ''} ${patientDetails.gpPractice || ''}`.trim() || 'Not recorded'} />
          <Row label="Contact" value={patientDetails.phone || 'Not recorded'} />
          <Row label="Consent" value={consentText} />
          <Row label="ID verified" value={consent.idVerified ? `Yes${consent.idType ? ` (${consent.idType})` : ''}` : 'Not recorded'} />
          <Row label="Private service" value={consent.patientAwarePrivateService ? 'Patient aware' : 'Not recorded'} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Consultation Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4 text-xs print:gap-2">
          <Row label="Date" value={summary.consultationDate} />
          <Row label="Time" value={summary.consultationTime} />
          <Row label="Pharmacy" value={summary.pharmacyName || 'Not recorded'} />
          <Row label="Pharmacy address" value={summary.pharmacyAddress || 'Not recorded'} />
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Assessment</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row label="Type" value={lesionAssessment.lesionType || 'Not specified'} />
          <Row label="Extent" value={lesionAssessment.extent || 'Not specified'} />
          <Row label="Number and size of lesions" value={`${lesionAssessment.numberOfLesions || 'not recorded'}; area ${lesionAssessment.lesionSizeCm || 'not recorded'} cm`} />
          <Row label="Affected areas" value={lesionAssessment.affectedAreas.join(', ') || 'None specified'} />
          <Row label="Duration" value={lesionAssessment.duration || 'Not specified'} />
          {lesionAssessment.hydrogenPeroxide && (
            <Row
              label="Hydrogen peroxide 1%"
              value={
                lesionAssessment.hydrogenPeroxide === 'offered-p-sale'
                  ? 'Offered as a P sale first'
                  : lesionAssessment.hydrogenPeroxide === 'unsuitable'
                    ? 'Unsuitable'
                    : 'Tried and ineffective'
              }
            />
          )}
          <Row
            label="Penicillin allergy"
            value={`${medicalHistory.penicillinAllergy === 'yes' ? 'Penicillin-allergic' : medicalHistory.penicillinAllergy === 'no' ? 'Not penicillin-allergic' : 'Penicillin allergy not asked (topical arm)'}. ${medicalHistory.penicillinAllergyHistory || ''}`.trim()}
          />
          <Row label="Allergies" value={medicalHistory.allergies || 'Not recorded'} />
          {age !== null && age < 18 && isMacrolide && (
            <Row
              label="Weight (measured today)"
              value={
                medicalHistory.cannotBeWeighed
                  ? 'Could not be weighed'
                  : `${medicalHistory.weightKg || 'not recorded'} kg${weightBand ? `; band ${weightBand} (rounded to the nearest kg)` : ''}`
              }
            />
          )}
          {(medicalHistory.pregnant || medicalHistory.breastfeeding) && (
            <Row
              label="Pregnancy / breastfeeding"
              value={`${medicalHistory.pregnant ? `Pregnant (${medicalHistory.pregnancyEstablishedHow || 'how established: not recorded'})` : ''}${
                medicalHistory.breastfeeding
                  ? `${medicalHistory.pregnant ? '; ' : ''}Breastfeeding${medicalHistory.breastfeedingDiscussed === 'yes' ? ', macrolide choice discussed and recorded' : medicalHistory.breastfeedingDiscussed === 'no' ? ', macrolide choice NOT discussed' : ''}`
                  : ''
              }`}
            />
          )}
          {medicalHistory.currentMedications && <Row label="Current medicines" value={medicalHistory.currentMedications} />}
          {lesionAssessment.additionalNotes && <Row label="Additional notes" value={lesionAssessment.additionalNotes} />}
        </div>
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Clinical Alerts</SectionHeader>
        <AlertSummary alerts={alerts} />
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Outcome</SectionHeader>
        <div className="space-y-2 text-xs print:space-y-1">
          <Row
            label="Outcome"
            value={
              stopped
                ? 'NOT SUPPLIED: exclusion criteria met; patient referred'
                : pSale
                  ? 'No PGD supply. Hydrogen peroxide 1% cream sold as a pharmacy medicine (offer recorded as the document requires)'
                  : 'Supplied under the PGD'
            }
          />
          {stopped && <Row label="Referral criteria" value={referralReasons.join(' ') || 'See clinical alerts'} />}
          {stopped && <Row label="Advice given and referral" value={summary.referralAdvice || 'Not recorded'} />}
          <Row label="Adverse drug reactions" value={summary.adverseDrugReactions || 'None reported'} />
        </div>
      </div>

      {supplied && (
        <div className="px-6 py-4 print:px-4 print:py-2">
          <SectionHeader>Medicine Supplied under PGD</SectionHeader>
          <div className="space-y-2 text-xs print:space-y-1">
            <Row label="Treatment (arm)" value={TREATMENT_LABEL[treatmentSelection.treatment] || 'Not selected'} />
            <Row label="Formulation" value={treatmentSelection.formulation || 'Not recorded'} />
            <Row label="Dose" value={treatmentSelection.dose || 'Not recorded'} />
            <Row label="Frequency" value={treatmentSelection.frequency || 'Not recorded'} />
            <Row
              label="Duration"
              value={`${treatmentSelection.duration}${treatmentSelection.duration === '7 days' ? ` (extended: ${treatmentSelection.extensionReason || 'reason not recorded'})` : ''}`}
            />
            {treatmentSelection.doseValue === 'clari-500' && (
              <Row label="500mg twice a day, reason" value={treatmentSelection.severeDoseReason || 'Not recorded'} />
            )}
            <Row label="Quantity" value={`${treatmentSelection.quantity} ${treatmentSelection.quantityUnit}`.trim()} />
            <Row label="Route" value={treatmentSelection.formulation === 'cream' ? 'Topical' : 'Oral'} />
            <Row label="Date of supply" value={summary.consultationDate} />
          </div>
        </div>
      )}

      {pSale && (
        <div className="px-6 py-4 print:px-4 print:py-2">
          <SectionHeader>Pharmacy Medicine Sold (not a PGD supply)</SectionHeader>
          <div className="space-y-2 text-xs print:space-y-1">
            <Row label="Product" value="Hydrogen peroxide 1% cream" />
            <Row label="Directions" value={`${treatmentSelection.dose}; ${treatmentSelection.frequency}; ${treatmentSelection.duration}`} />
          </div>
        </div>
      )}

      <div className="px-6 py-4 print:px-4 print:py-2">
        <SectionHeader>Counselling Provided</SectionHeader>
        <CounsellingGrid items={counsellingItems} />
      </div>

      {summary.clinicalNotes && (
        <div className="px-6 py-4 print:px-4 print:py-2">
          <SectionHeader>Clinical Notes</SectionHeader>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">{summary.clinicalNotes}</p>
        </div>
      )}

      <div className="px-6 py-4 print:px-4 print:py-2">
        {supplied ? (
          <PharmacistDeclaration
            pgdName={PGD_NAME}
            pharmacistName={summary.pharmacistName}
            pharmacistGPhC={summary.pharmacistGPhC || ''}
            pharmacyName={summary.pharmacyName || ''}
          />
        ) : (
          <>
            <SectionHeader>Practitioner Declaration</SectionHeader>
            <p className="text-xs text-gray-600 mb-4">
              {stopped
                ? `I confirm that this consultation was conducted in accordance with the Patient Group Direction for ${PGD_NAME}, that an exclusion criterion applied, that no medicine was supplied under the PGD, and that the advice given and the referral made are recorded above.`
                : `I confirm that this consultation was conducted in accordance with the Patient Group Direction for ${PGD_NAME}, that hydrogen peroxide 1% cream was offered and sold as a pharmacy medicine, and that no medicine was supplied under the PGD.`}
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Practitioner name</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacistName || ''}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">GPhC number</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacistGPhC || ''}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Pharmacy</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacyName || ''}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Signature</p>
                <div className="border-b border-gray-300 min-h-[2rem]" />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="px-6 py-4 print:px-4 print:py-2">
        <ReportFooter pgdName={PGD_NAME} />
      </div>
    </div>
  );
}
