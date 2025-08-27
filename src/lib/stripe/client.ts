import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error('Stripe publishable key is not configured');
}

export const stripePromise = loadStripe(stripePublishableKey);

export const getStripe = async () => {
  return await stripePromise;
};