'use client';

import React from 'react';
import type { AMConsultationState } from '../anti-malarials-types';
import type { ClinicalAlert } from '../../shared/types';
import {
  getAtovaquoneProguanilBand,
  getMefloquineBand,
  calculateTripDuration,
  AM_PGD_VERSION,
} from '../anti-malarials-clinical-logic';
import {
  SectionHeader,
  Row,
  AlertSummary,
  CounsellingGrid,
  PharmacistDeclaration,
  ReportFooter,
} from '../../shared/components/SummaryReportShell';

interface AntiMalarialsSummaryReportProps {
  state: AMConsultationState;
  /** The live alerts computed by the client. The old state.alerts was never written. */
  alerts: ClinicalAlert[];
}

export const AntiMalarialsSummaryReport: React.FC<
  AntiMalarialsSummaryReportProps
> = ({ state, alerts }) => {
  const {
    patient,
    travelAssessment,
    medicineSelection,
    counselling,
    summary,
  } = state;

  const hasStops = alerts.some((a) => a.severity === 'stop');
  const days = calculateTripDuration(travelAssessment.departureDate, travelAssessment.returnDate);
  const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString('en-GB') : 'Not recorded');

  const medicineLabel: Record<string, string> = {
    malarone: 'Malarone (atovaquone 250mg / proguanil 100mg) tablets, adult strength',
    'malarone-paediatric': 'Malarone Paediatric (atovaquone 62.5mg / proguanil 25mg) tablets',
    doxycycline: 'Doxycycline 100mg capsules',
    mefloquine: 'Mefloquine 250mg tablets',
  };
  const apBand = getAtovaquoneProguanilBand(travelAssessment.weightKg);
  const mefBand = getMefloquineBand(travelAssessment.weightKg);
  const weightBand =
    medicineSelection.selectedMedicine === 'mefloquine'
      ? mefBand?.label
      : medicineSelection.selectedMedicine === 'malarone' || medicineSelection.selectedMedicine === 'malarone-paediatric'
        ? apBand?.label
        : undefined;

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-8 print:p-0 print:border-0 print:rounded-none">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Anti-malarials ePGD Consultation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Malaria Prophylaxis Consultation Record
          </p>
          <p className="text-xs text-gray-500 mt-1">{AM_PGD_VERSION}</p>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p className="font-medium">{summary.consultationDate}</p>
          <p>{summary.consultationTime}</p>
        </div>
      </div>

      {/* Patient Information */}
      <SectionHeader>Patient Information</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Row label="Name" value={`${patient.firstName} ${patient.lastName}`} />
        <Row label="Date of birth" value={`${fmtDate(patient.dateOfBirth)} (${patient.age ?? '?'} years)`} />
        <Row label="Address" value={patient.address || 'Not recorded'} />
        <Row label="NHS Number" value={patient.nhsNumber || 'Not provided'} />
        <Row label="GP Practice" value={patient.gpPractice || patient.gpName || 'Not recorded'} />
        <Row label="Consent" value={state.consent.informedConsentGiven ? 'Valid informed consent given by the patient' : 'Not recorded'} />
      </div>

      {/* Travel Details */}
      <SectionHeader>Travel Details</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Row label="Destination" value={travelAssessment.destinationCountry} />
        <Row label="Days in the malarious area" value={days !== null ? `${days} days (arrival and departure days both counted)` : 'Not recorded'} />
        <Row label="Departure" value={fmtDate(travelAssessment.departureDate)} />
        <Row label="Return" value={fmtDate(travelAssessment.returnDate)} />
        <Row label="Previous Prophylaxis" value={travelAssessment.previousMalariaProphylaxis ? travelAssessment.previousProphylaxisType : 'No'} />
        <Row label="Body weight" value={travelAssessment.weightKg !== null ? `${travelAssessment.weightKg} kg` : 'Not recorded'} />
        <Row label="Weight band applied" value={weightBand || 'Not applicable'} />
        <Row label="Risk assessment (NaTHNaC / TravelHealthPro)" value={travelAssessment.riskAssessmentCompleted ? 'Completed' : 'Not completed'} />
        <Row label="Source consulted" value={travelAssessment.riskAssessmentSource || 'Not recorded'} />
      </div>

      {/* Pregnancy & Breastfeeding Status */}
      <SectionHeader>Special Circumstances</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Row label="Currently Pregnant" value={travelAssessment.currentlyPregnant ? 'Yes' : 'No'} />
        <Row label="Planning Pregnancy" value={travelAssessment.planningPregnancy ? 'Yes' : 'No'} />
        <Row label="Breastfeeding" value={travelAssessment.breastfeeding ? 'Yes' : 'No'} />
      </div>

      {/* Clinical Alerts */}
      {alerts.length > 0 && (
        <>
          <SectionHeader>Clinical Alerts</SectionHeader>
          <AlertSummary alerts={alerts} />
        </>
      )}

      {/* Medicine Selection */}
      <SectionHeader>{hasStops ? 'Outcome' : 'Medicine Supplied under this PGD'}</SectionHeader>
      {hasStops ? (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Row label="Outcome" value="NOT SUPPLIED: exclusion criteria met. Patient referred as the alert directs." />
          <Row label="Advice given" value="Bite avoidance and the post-travel fever warning (see Counselling below)." />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Row label="Medicine (name, form, strength)" value={medicineLabel[medicineSelection.selectedMedicine] || medicineSelection.selectedMedicine || 'Not supplied'} />
          <Row label="Dose" value={medicineSelection.dose} />
          <Row label="Start Timing" value={medicineSelection.startTiming} />
          <Row label="Continue After Return" value={medicineSelection.continuationAfterReturn} />
          <Row label="Calculated course length (including tail)" value={medicineSelection.courseCalculation} />
          <Row label="Quantity supplied" value={medicineSelection.quantity !== null ? String(medicineSelection.quantity) : 'Not recorded'} />
          <Row label="Date of supply" value={summary.consultationDate} />
          <Row label="Batch number" value={medicineSelection.batchNumber} />
          <Row label="Expiry date" value={fmtDate(medicineSelection.expiryDate)} />
          {medicineSelection.selectedMedicine === 'mefloquine' && mefBand && mefBand.tabletFraction < 1 && (
            <Row label="Scored tablet confirmed" value={medicineSelection.scoredTabletConfirmed ? 'Yes' : 'No'} />
          )}
          <Row label="Clinical Reason" value={medicineSelection.reason} />
          <Row label="Supplied under" value={AM_PGD_VERSION} />
        </div>
      )}

      {/* Counselling Provided */}
      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ['How to take it (with food or milky drink / water upright / same day weekly)', counselling.takeWithFood],
          ['Keep taking it after leaving (7 days A/P; 4 weeks doxycycline, mefloquine)', counselling.completeCourseAdvised],
          ...(medicineSelection.selectedMedicine === 'doxycycline'
            ? [['Sun protection advice (doxycycline)', counselling.sunProtectionAdvice] as [string, boolean]]
            : []),
          ['Bite avoidance: 20 to 30% DEET or 20% picaridin, cover up from dusk, treated net', counselling.bitePrevention],
          [
            counselling.pregnancyAdviceNotApplicable
              ? 'Pregnancy / breastfeeding implications: not applicable'
              : 'Pregnancy / breastfeeding implications',
            counselling.pregnancyAdvice || counselling.pregnancyAdviceNotApplicable,
          ],
          ['Vomited dose, diarrhoea and food / antacid interactions', counselling.diarrhoeaManagement],
          ['Post-travel fever warning: any fever up to a YEAR after return, seek help immediately', counselling.feverManagement],
          ['Side effects explained', counselling.sideEffectsExplained],
          ...(medicineSelection.selectedMedicine === 'mefloquine'
            ? [['Mefloquine: STOP at first neuropsychiatric symptom, including insomnia or abnormal dreams', counselling.mefloquineStopAdvice] as [string, boolean]]
            : []),
          ['When to seek medical attention', counselling.whenToSeekHelp],
          ['Written information: PIL for the strength given, bite avoidance and post-travel fever sheet', counselling.medicineCardProvided],
        ]}
      />

      {/* Clinical Notes */}
      {summary.clinicalNotes && (
        <>
          <SectionHeader>Clinical Notes</SectionHeader>
          <div className="bg-gray-50 rounded p-4 mb-6">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {summary.clinicalNotes}
            </p>
          </div>
        </>
      )}

      {/* Pharmacist Declaration. The shared declaration asserts that no
          exclusion criteria applied, so it is only used when that is true. */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        {hasStops ? (
          <>
            <SectionHeader>Pharmacist Declaration</SectionHeader>
            <p className="text-xs text-gray-600 mb-4">
              I confirm that this consultation was conducted in accordance with the Patient Group Direction for
              malaria chemoprophylaxis, that the patient met an exclusion criterion, that NO medicine was supplied,
              and that the advice recorded above was given.
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
            </div>
          </>
        ) : (
          <PharmacistDeclaration
            pgdName="Anti-malarials ePGD"
            pharmacistName={summary.pharmacistName}
            pharmacistGPhC={summary.pharmacistGPhC}
            pharmacyName={summary.pharmacyName}
          />
        )}
      </div>

      {/* Footer */}
      <ReportFooter pgdName="Anti-malarials ePGD" />
    </div>
  );
};
