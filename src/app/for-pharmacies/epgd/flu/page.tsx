import React from 'react';
import FluToolClient from './FluToolClient';
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: 'Flu Vaccination ePGD | Pharmacy PGD',
  description:
    'UK Pharmacy Group Protocol Direction (PGD) consultation tool for flu vaccination',
};

export default function FluToolPage(): React.ReactNode {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PgdPageActions />
      </div>
      <FluToolClient />
    </main>
  );
}
