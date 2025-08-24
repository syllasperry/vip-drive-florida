
interface PricingBreakdown {
  uberEstimateCents: number;
  dispatcherFeeCents: number; // 20%
  appFeeCents: number; // 10%
  subtotalCents: number;
  stripeFeeCents: number;
  totalCents: number;
}

export class SmartPricingEngine {
  private static readonly DISPATCHER_FEE_RATE = 0.20; // 20%
  private static readonly APP_FEE_RATE = 0.10; // 10%
  private static readonly STRIPE_PERCENTAGE = 0.029; // 2.9%
  private static readonly STRIPE_FIXED = 30; // $0.30 in cents

  static calculatePrice(uberEstimateCents: number): PricingBreakdown {
    // Base Uber estimate
    const base = uberEstimateCents;
    
    // Calculate fees
    const dispatcherFeeCents = Math.round(base * this.DISPATCHER_FEE_RATE);
    const appFeeCents = Math.round(base * this.APP_FEE_RATE);
    const subtotalCents = base + dispatcherFeeCents + appFeeCents;
    
    // Gross-up calculation to ensure exact payout
    // Formula: (subtotal + fixed_fee) / (1 - percentage_fee)
    const totalCents = Math.ceil(
      (subtotalCents + this.STRIPE_FIXED) / (1 - this.STRIPE_PERCENTAGE)
    );
    
    const stripeFeeCents = totalCents - subtotalCents;

    return {
      uberEstimateCents: base,
      dispatcherFeeCents,
      appFeeCents,
      subtotalCents,
      stripeFeeCents,
      totalCents
    };
  }

  static formatBreakdown(breakdown: PricingBreakdown) {
    return {
      uberEstimate: `$${(breakdown.uberEstimateCents / 100).toFixed(2)}`,
      dispatcherFee: `$${(breakdown.dispatcherFeeCents / 100).toFixed(2)}`,
      appFee: `$${(breakdown.appFeeCents / 100).toFixed(2)}`,
      subtotal: `$${(breakdown.subtotalCents / 100).toFixed(2)}`,
      stripeFee: `$${(breakdown.stripeFeeCents / 100).toFixed(2)}`,
      total: `$${(breakdown.totalCents / 100).toFixed(2)}`,
      totalCents: breakdown.totalCents
    };
  }
}
