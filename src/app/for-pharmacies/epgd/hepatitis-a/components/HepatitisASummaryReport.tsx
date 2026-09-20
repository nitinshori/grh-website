'use client';

import React from 'react';
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from '../../shared/components/SummaryReportShell';
import type { ClinicalAlert } from '../../shared/types';
import type {
  HepatitisAPatientDetails,
  HepatitisAConsent,
  HepatitisAIndication,
  HepatitisACourse,
  HepatitisAMedicalHistory,
  HepatitisASummary,
  HepatitisAPostVaccineAdvice,
  HepatitisAExclusionOutcome,
} from '../hepatitis-a-types';
import {
  PRODUCTS,
  FIRST_DOSE_PRODUCT_LABEL,
  DOSE_NUMBER_LABEL,
  SITE_LABEL,
  REFERRAL_LABEL,
  HEPATITIS_A_PGD_VERSION,
} from '../hepatitis-a-types';
import { assessSecondDoseTiming, bleedingCautionApplies, doseNumberFor } from '../hepatitis-a-clinical-logic';

interface HepatitisASummaryReportProps {
  patientDetails: HepatitisAPatientDetails;
  consent: HepatitisAConsent;
  indication: HepatitisAIndication;
  course: HepatitisACourse;
  medicalHistory: HepatitisAMedicalHistory;
  summary: HepatitisASummary;
  clinicalAlerts: ClinicalAlert[];
  postVaccineAdvice: HepatitisAPostVaccineAdvice;
  /** A stop exists: print "not supplied", no vaccine, and a declaration that
   *  does not say "no exclusion criteria applied". */
  isBlocked: boolean;
  exclusionOutcome: HepatitisAExclusionOutcome;
}

const CONSENT_BASIS_LABEL: Record<string, string> = {
  self: 'Patient (aged 16 and over)',
  parental: 'Person with parental responsibility',
  gillick: 'Young person, assessed as Gillick competent',
  unobtainable: 'Valid consent could not be obtained (exclusion)',
};

const INDICATION_LABEL: Record<string, string> = {
  travel: 'Travel to an area of moderate or high endemicity',
  'non-travel': 'Non-travel risk factor',
  both: 'Travel and a non-travel risk factor',
  none: 'No indication (exclusion)',
};

const ROUTE_LABEL: Record<string, string> = {
  intramuscular: 'Intramuscular',
  subcutaneous: 'Subcutaneous',
};

export default function HepatitisASummaryReport({
  patientDetails,
  consent,
  indication,
  course,
  medicalHistory,
  summary,
  clinicalAlerts,
  postVaccineAdvice,
  isBlocked,
  exclusionOutcome,
}: HepatitisASummaryReportProps) {
  const product = summary.product ? PRODUCTS[summary.product] : null;
  const doseNumber = doseNumberFor(course);
  const timing =
    doseNumber === 'second' && course.firstDoseDateKnown === 'known'
      ? assessSecondDoseTiming(course.firstDoseProduct, course.firstDoseDate, summary.product)
      : null;
  const travel = indication.indicationType === 'travel' || indication.indicationType === 'both';
  const nonTravel = indication.indicationType === 'non-travel' || indication.indicationType === 'both';
  const riskFactors = [
    indication.chronicLiverDisease ? 'chronic liver disease including chronic hepatitis B or C' : null,
    indication.haemophiliaClottingFactors ? 'haemophilia or receipt of plasma-derived clotting factors' : null,
    indication.injectsDrugs ? 'injects drugs' : null,
    indication.msm ? 'gay, bisexual or other man who has sex with men' : null,
    indication.occupationalRisk ? `occupational risk: ${indication.occupationalRiskDetail || 'not recorded'}` : null,
  ].filter((x): x is string => x !== null);

  const firstDoseProductLabel =
    course.firstDoseProduct === 'other'
      ? course.firstDoseProductOther || 'Other brand, not recorded'
      : course.firstDoseProduct
      ? FIRST_DOSE_PRODUCT_LABEL[course.firstDoseProduct]
      : 'Not recorded';

  return (
    <div className="bg-white rounded-xl border border-gray-200 print:border-0">
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 print:bg-white print:border-0 print:pb-4">
        <h2 className="text-lg font-bold text-navy-900">Consultation Record</h2>
        <p className="text-sm text-gray-500 mt-1">Hepatitis A Vaccination ePGD. {HEPATITIS_A_PGD_VERSION}</p>
        {isBlocked && (
          <p className="mt-2 text-sm font-semibold text-red-700">
            {consent.patientDeclined
              ? 'NOT SUPPLIED: the patient declined vaccination after counselling. No vaccine was administered under this PGD.'
              : 'NOT SUPPLIED: no vaccine was administered under this PGD. The reason is recorded under Exclusion Outcome below.'}
          </p>
        )}
      </div>

      <div className="px-6 py-6 space-y-6 print:space-y-4">
        {/* Patient Details */}
        <div>
          <SectionHeader>Patient Details</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Name" value={`${patientDetails.firstName} ${patientDetails.lastName}`} />
            <Row label="Date of birth" value={patientDetails.dateOfBirth} />
            <Row label="Age" value={patientDetails.age !== null ? `${patientDetails.age} years` : 'N/A'} />
            <Row label="Address" value={patientDetails.address || 'Not provided'} />
            <Row label="NHS number" value={patientDetails.nhsNumber || 'Not provided'} />
            <Row label="GP name" value={patientDetails.gpName || 'Not provided'} />
            <Row label="GP practice" value={patientDetails.gpPractice || 'Not provided'} />
          </div>
        </div>

        {/* Indication */}
        <div>
          <SectionHeader>Indication</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Indication" value={INDICATION_LABEL[indication.indicationType] || 'Not recorded'} />
            {travel && (
              <>
                <Row label="Destination" value={indication.travelDestination || 'Not recorded'} />
                <Row label="Departure date" value={indication.departureDate || 'Not recorded'} />
                <Row label="Moderate or high endemicity confirmed" value={indication.endemicityConfirmed ? 'Yes' : 'No'} />
                {indication.shortNoticeAdvised && (
                  <Row label="Departing within 2 weeks" value="Dose given; told full protection comes after about 2 weeks" />
                )}
              </>
            )}
            {nonTravel && (
              <Row label="Non-travel risk factor" value={riskFactors.length ? riskFactors.join('; ') : 'None recorded'} />
            )}
            <Row label="Post-exposure situation" value={indication.postExposure === 'yes' ? 'Yes: contact of a case or outbreak exposure' : indication.postExposure === 'no' ? 'No' : 'Not recorded'} />
            <Row
              label="Hepatitis B also needed"
              value={
                indication.hepBAlsoNeeded === 'yes'
                  ? indication.hepBDecision === 'continue-hep-a-only'
                    ? 'Yes: continued with hepatitis A only (decision recorded)'
                    : indication.hepBDecision === 'use-combined-pgd'
                    ? 'Yes: seen under the Hepatitis A and B (Travel) PGD instead'
                    : 'Yes: decision not recorded'
                  : indication.hepBAlsoNeeded === 'no'
                  ? 'No'
                  : 'Not recorded'
              }
            />
            {indication.proofOfImmunityRequired && <Row label="Proof of immunity required" value="Yes (exclusion: serology out of scope)" />}
          </div>
        </div>

        {/* Course */}
        <div>
          <SectionHeader>Course</SectionHeader>
          <div className="space-y-1.5">
            <Row
              label="Previous hepatitis A vaccination"
              value={
                course.courseStatus === 'none'
                  ? 'None'
                  : course.courseStatus === 'one-dose'
                  ? 'One previous dose'
                  : course.courseStatus === 'completed'
                  ? 'Completed two dose course'
                  : 'Not recorded'
              }
            />
            {course.courseStatus === 'completed' && (
              <Row
                label="Completed course"
                value={
                  course.completedCourseOngoingRisk25Years
                    ? `Ongoing risk and 25 years passed: ${course.completedCourseNote || 'note not recorded'}`
                    : 'Excluded: nothing to add'
                }
              />
            )}
            {course.courseStatus === 'one-dose' && (
              <>
                <Row label="Product of the first dose" value={firstDoseProductLabel} />
                <Row
                  label="Date of the first dose"
                  value={
                    course.firstDoseDateKnown === 'known'
                      ? `${course.firstDoseDate || 'Not recorded'}${timing?.months !== null && timing?.months !== undefined ? ` (${timing.months} months ago)` : ''}`
                      : course.firstDoseDateKnown === 'not-known'
                      ? `Not known. Reported: ${course.firstDoseDateNote || 'not recorded'}${course.firstDoseSixMonthsConfirmed ? '; 6 months or more ago as reliably reported' : ''}`
                      : 'Not recorded'
                  }
                />
                {timing?.beyondWindow && (
                  <Row
                    label="Off-label decision"
                    value={
                      course.offLabelDecisionRecorded
                        ? `Second dose beyond the licensed window (${timing.windowLabel}): informed off-label decision explained to the patient and recorded`
                        : 'Second dose beyond the licensed window: off-label decision NOT recorded'
                    }
                  />
                )}
              </>
            )}
            <Row label="Dose number today" value={doseNumber ? DOSE_NUMBER_LABEL[doseNumber] : 'Not recorded'} />
          </div>
        </div>

        {/* Medical History */}
        <div>
          <SectionHeader>Medical History and Cautions</SectionHeader>
          <CounsellingGrid
            items={[
              ['Anaphylaxis to hepatitis A vaccine or component', medicalHistory.anaphylaxisHepAVaccineOrComponent],
              ['Neomycin hypersensitivity', medicalHistory.neomycinHypersensitivity],
              ['Previous hypersensitivity reaction to hepatitis A vaccine', medicalHistory.previousHypersensitivityReaction],
              ['Acute severe febrile illness', medicalHistory.acuteSevereFebrileIllness],
              ['Pregnant', medicalHistory.pregnant],
              ['Breastfeeding', medicalHistory.breastfeeding],
              ['Immunosuppression, including HIV', medicalHistory.immunosuppressed],
              ['Bleeding disorder, thrombocytopenia or anticoagulation', bleedingCautionApplies(indication, medicalHistory)],
              ['Phenylketonuria', medicalHistory.phenylketonuria],
              ['Latex sensitivity', medicalHistory.latexSensitivity],
            ]}
          />
          <div className="mt-2 space-y-1.5">
            {medicalHistory.breastfeeding && <Row label="Breastfeeding decision" value={medicalHistory.breastfeedingDecision || 'Not recorded'} />}
            {medicalHistory.immunosuppressed && <Row label="Immunosuppression counselling" value={medicalHistory.immunosuppressionCounselling || 'Not recorded'} />}
            {medicalHistory.pregnant && (summary.product === 'avaxim' || summary.product === 'avaxim-junior') && (
              <Row label="Pregnancy, Avaxim: risk-benefit assessment" value={summary.pregnancyRiskBenefitNote || 'Not recorded'} />
            )}
            {medicalHistory.latexSensitivity && summary.product === 'avaxim' && (
              <Row label="Latex: Avaxim presentation checked" value={summary.latexPresentationChecked ? 'Yes' : 'No'} />
            )}
            <Row label="Known allergies" value={medicalHistory.knownAllergies || 'None recorded'} />
          </div>
        </div>

        {/* Clinical Alerts */}
        <div>
          <SectionHeader>Clinical Alerts</SectionHeader>
          <AlertSummary alerts={clinicalAlerts} />
        </div>

        {/* Exclusion outcome, or vaccine administration */}
        {isBlocked ? (
          <div>
            <SectionHeader>Exclusion Outcome</SectionHeader>
            <div className="space-y-1.5">
              <Row label="Reason" value={clinicalAlerts.filter((a) => a.severity === 'stop').map((a) => a.message).join('; ')} />
              <Row label="Food and water hygiene advice given" value={exclusionOutcome.foodWaterAdviceGiven ? 'Yes' : 'No'} />
              <Row label="Advice given and decision" value={exclusionOutcome.adviceGiven || 'Not recorded'} />
              <Row label="Referral or next action" value={REFERRAL_LABEL[exclusionOutcome.referral] ?? exclusionOutcome.referral} />
              <Row label="Vaccine" value="Not supplied" />
            </div>
          </div>
        ) : (
          <div>
            <SectionHeader>Vaccine Administration</SectionHeader>
            <div className="space-y-1.5">
              <Row label="Vaccine" value={product ? product.label : 'Not recorded'} />
              <Row label="Dose volume" value={product ? product.volume : 'Not recorded'} />
              <Row label="Dose number" value={doseNumber ? DOSE_NUMBER_LABEL[doseNumber] : 'Not recorded'} />
              <Row label="Batch number" value={summary.batchNumber || 'Not recorded'} />
              <Row label="Expiry date" value={summary.expiryDate || 'Not recorded'} />
              <Row label="Route" value={ROUTE_LABEL[summary.route] || 'Not recorded'} />
              {bleedingCautionApplies(indication, medicalHistory) && summary.route === 'intramuscular' && (
                <Row label="Bleeding precautions" value={summary.bleedingPrecautionsConfirmed ? '23 gauge or finer needle, firm pressure for at least 2 minutes' : 'Not confirmed'} />
              )}
              <Row label="Administration site" value={summary.administrationSite ? SITE_LABEL[summary.administrationSite] : 'Not recorded'} />
              <Row label="Date of administration" value={summary.consultationDate} />
              <Row label="Time of administration" value={summary.administrationTime || 'Not recorded'} />
              <Row label="Other vaccine at this visit" value={summary.coAdministered ? summary.coAdministeredDetails || 'Yes, details not recorded' : 'None'} />
              <Row
                label="Second dose due"
                value={
                  doseNumber === 'first'
                    ? summary.secondDoseDue || 'Not recorded'
                    : doseNumber === 'second'
                    ? 'Course complete: no further routine booster'
                    : doseNumber === 'booster-25-years'
                    ? 'None: booster after a completed course'
                    : 'Not recorded'
                }
              />
              <Row label="Patient told the second dose date" value={postVaccineAdvice.toldSecondDoseDate ? 'Yes' : 'No'} />
              <Row label="Adrenaline 1 in 1,000, anaphylaxis protocol and telephone available" value={summary.adrenalineAvailable ? 'Confirmed' : 'Not confirmed'} />
              <Row label="15 minute observation completed" value={postVaccineAdvice.observationCompleted ? 'Yes' : 'No'} />
              <Row label="Adverse reaction" value={postVaccineAdvice.adverseReaction ? postVaccineAdvice.adverseReactionDetails || 'Yes, details not recorded' : 'None observed'} />
              <Row label="Administered under this PGD" value="Yes" />
            </div>
          </div>
        )}

        {/* Counselling and consent */}
        <div>
          <SectionHeader>Patient Counselling and Consent</SectionHeader>
          <div className="space-y-1.5 mb-3">
            <Row label="Consent given by" value={CONSENT_BASIS_LABEL[patientDetails.consentBasis] || 'Not recorded'} />
            {patientDetails.consentDetail && (
              <Row
                label={patientDetails.consentBasis === 'gillick' ? 'Basis of Gillick assessment' : 'Person with parental responsibility'}
                value={patientDetails.consentDetail}
              />
            )}
          </div>
          <CounsellingGrid
            items={[
              ['Informed consent obtained', consent.informedConsentGiven],
              ['ID verified', consent.idVerified],
              ['Patient aware of private service', consent.patientAwarePrivateService],
              ['Understands what the service costs', consent.understandsCost],
              ['Consents to GP notification', !!consent.notifyGp],
              ['One dose: protection from about 2 weeks for about a year', postVaccineAdvice.counselledOneDoseProtection],
              [doseNumber === 'first' ? 'Second dose in 6 to 12 months, at least 25 years; booked' : 'Course complete, at least 25 years', postVaccineAdvice.counselledSecondDose],
              ...(doseNumber === 'first'
                ? [['Missed second dose: come anyway, no restart', postVaccineAdvice.counselledMissedDose] as [string, boolean]]
                : []),
              ['Food and water hygiene advice given', postVaccineAdvice.counselledFoodWater],
              ['Common self-limiting reactions explained', postVaccineAdvice.counselledReactions],
              ['Does not cover hepatitis B or C (where discussed)', postVaccineAdvice.counselledHepBNotCovered],
              ['Follow-up advice: jaundice, dark urine, pale stools', postVaccineAdvice.counselledFollowUp],
              ['Patient information leaflet supplied', postVaccineAdvice.pilSupplied],
              [doseNumber === 'first' ? 'Written record given with second dose due date' : 'Written record given, course complete', postVaccineAdvice.writtenRecordGiven],
              ...(consent.patientDeclined ? [['Patient declined vaccination after counselling', true] as [string, boolean]] : []),
            ]}
          />
        </div>

        {summary.clinicalNotes && (
          <div>
            <SectionHeader>Clinical Notes</SectionHeader>
            <p className="text-xs text-gray-600 whitespace-pre-wrap">{summary.clinicalNotes}</p>
          </div>
        )}

        <div>
          <SectionHeader>Consultation Details</SectionHeader>
          <div className="space-y-1.5">
            <Row label="Consultation date" value={summary.consultationDate} />
            <Row label="Consultation time" value={summary.consultationTime} />
          </div>
        </div>

        {isBlocked ? (
          <div>
            <SectionHeader>Pharmacist Declaration</SectionHeader>
            <p className="text-xs text-gray-600 mb-4">
              I confirm that this patient was assessed under the Patient Group Direction for Hepatitis A Vaccination, that no vaccine was administered under the PGD for the reason recorded above (an exclusion criterion, or the patient declined), and that the advice given and the decision reached are recorded above.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Pharmacist name</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacistName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">GPhC number</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacistGPhC}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Pharmacy</p>
                <p className="text-sm text-navy-900 border-b border-gray-300 pb-1 min-h-[1.5rem]">{summary.pharmacyName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Signature</p>
                <div className="border-b border-gray-300 min-h-[2rem]" />
              </div>
            </div>
          </div>
        ) : (
          <PharmacistDeclaration
            pgdName="Hepatitis A Vaccination"
            pharmacistName={summary.pharmacistName}
            pharmacistGPhC={summary.pharmacistGPhC}
            pharmacyName={summary.pharmacyName}
          />
        )}

        <ReportFooter pgdName="Hepatitis A Vaccination" />
      </div>
    </div>
  );
}
