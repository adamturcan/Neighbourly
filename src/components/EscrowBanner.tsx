import React from 'react';
import { Banner } from 'react-native-paper';

export default function EscrowBanner({ status }: { status: 'held'|'released'|'none' }) {
  if (status === 'none') return null;
  const text = status === 'held'
    ? 'Funds held in escrow until you confirm completion.'
    : 'Funds released to helper. Thank you!';
  return <Banner visible>{text}</Banner>;
}
