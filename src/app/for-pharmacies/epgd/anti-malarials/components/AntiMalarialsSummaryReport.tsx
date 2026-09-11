'use client';

import React from 'react';
import type { AMConsultationState } from '../anti-malarials-types';
import { getAtovaquoneProguanilBand, getMefloquineBand, AM_PGD_VERSION } from '../anti-malarials-clinical-logic';
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
}

export const AntiMalarialsSummaryReport: React.FC<
  AntiMalarialsSummaryReportProps
> = ({ state }) => {
  const {
    patient,
    travelAssessment,
    medicineSelection,
    counselling,
    summary,
    alerts,
  } = state;

  const tripDays =
    new Date(travelAssessment.returnDate).getTime() -
    new Date(travelAssessment.departureDate).getTime();
  const days = Math.ceil(tripDays / (1000 * 60 * 60 * 24));

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
        <Row label="Age" value={`${patient.age} years`} />
        <Row label="NHS Number" value={patient.nhsNumber || 'Not provided'} />
        <Row label="GP Practice" value={patient.gpPractice || 'Not provided'} />
      </div>

      {/* Travel Details */}
      <SectionHeader>Travel Details</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Row label="Destination" value={travelAssessment.destinationCountry} />
        <Row label="Duration" value={`${days} days`} />
        <Row label="Departure" value={new Date(travelAssessment.departureDate).toLocaleDateString('en-GB')} />
        <Row label="Return" value={new Date(travelAssessment.returnDate).toLocaleDateString('en-GB')} />
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
      <SectionHeader>Medicine Prescribed</SectionHeader>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Row label="Medicine (name, form, strength)" value={medicineLabel[medicineSelection.selectedMedicine] || medicineSelection.selectedMedicine} />
        <Row label="Dose" value={medicineSelection.dose} />
        <Row label="Start Timing" value={medicineSelection.startTiming} />
        <Row label="Continue After Return" value={medicineSelection.continuationAfterReturn} />
        <Row label="Quantity and course length" value={medicineSelection.quantity} />
        <Row label="Batch number" value={medicineSelection.batchNumber} />
        <Row label="Expiry date" value={medicineSelection.expiryDate} />
        {medicineSelection.selectedMedicine === 'mefloquine' && mefBand && mefBand.tabletFraction < 1 && (
          <Row label="Scored tablet confirmed" value={medicineSelection.scoredTabletConfirmed ? 'Yes' : 'No'} />
        )}
        <Row label="Clinical Reason" value={medicineSelection.reason} />
      </div>

      {/* Counselling Provided */}
      <SectionHeader>Counselling Provided</SectionHeader>
      <CounsellingGrid
        items={[
          ['How to take it (with food or milky drink / water upright / same day weekly)', counselling.takeWithFood],
          ['Keep taking it after leaving (7 days A/P; 4 weeks doxycycline, mefloquine)', counselling.completeCourseAdvised],
          ['Sun protection advice (doxycycline)', counselling.sunProtectionAdvice],
          ['Bite avoidance: 20 to 30% DEET or 20% picaridin, cover up from dusk, treated net', counselling.bitePrevention],
          ['Pregnancy / breastfeeding implications', counselling.pregnancyAdvice],
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

      {/* Pharmacist Declaration */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <PharmacistDeclaration
          pgdName="Anti-malarials ePGD"
          pharmacistName={summary.pharmacistName}
          pharmacistGPhC={summary.pharmacistGPhC}
          pharmacyName={summary.pharmacyName}
        />
      </div>

      {/* Footer */}
      <ReportFooter pgdName="Anti-malarials ePGD" />
    </div>
  );
};
