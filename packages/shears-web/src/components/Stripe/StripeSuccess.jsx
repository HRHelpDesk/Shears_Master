import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router';

export default function StripeSuccess() {
  const [params] = useSearchParams();
  const userId = params.get('userId');

  useEffect(() => {
    async function verifyConnection() {
      try {
        const res = await fetch(`http://192.168.1.194:3000/v1/stripe/verify/${userId}`);
        const data = await res.json();

        if (data.connected) {
          // Optionally redirect back to mobile app or show success message
          window.location.href = `yourapp://stripe-connected?userId=${userId}`;
        } else {
          alert('Stripe setup incomplete. Please finish onboarding.');
        }
      } catch (err) {
        console.error(err);
        alert('Error verifying Stripe connection');
      }
    }
    if (userId) verifyConnection();
  }, [userId]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Connecting Your Stripe Account...</h2>
      <p>If you’re not redirected automatically, you can close this window.</p>
    </div>
  );
}
