import React from 'react';
import FluToolClient from './FluToolClient';

export const metadata = {
  title: 'Flu Vaccination eTool | Pharmacy PGD',
  description:
    'UK Pharmacy Group Protocol Direction (PGD) consultation tool for flu vaccination',
};

export default function FluToolPage(): React.ReactNode {
  return (
    <main>
      <FluToolClient />
    </main>
  );
}
