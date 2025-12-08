export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'one-time';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'trial';

export interface Subscription {
  id: string;
  accountId: string;
  name: string;
  cost: number;
  currency: string;
  billingCycle: BillingCycle;
  nextBillingDate?: Date;
  cancellationUrl?: string;
  canPause: boolean;
  status: SubscriptionStatus;
  paymentMethod?: string;
}

export function normalizeToMonthlyCost(cost: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'weekly': return cost * 4.33;
    case 'monthly': return cost;
    case 'quarterly': return cost / 3;
    case 'yearly': return cost / 12;
    case 'one-time': return 0;
  }
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}
