import 'server-only';
import Stripe from 'stripe';
import { env, ConfigError } from '@/lib/env';

let client: Stripe | null = null;

/** Created on first use so a missing key never breaks the build. */
export function getStripe(): Stripe {
  if (client) return client;
  if (!env.stripeSecretKey) throw new ConfigError(['STRIPE_SECRET_KEY']);
  client = new Stripe(env.stripeSecretKey, {
    appInfo: { name: 'Epic Menswear', version: '1.0.0' },
  });
  return client;
}
