
interface PricingConfig {
  uberPremierBase: number;
  markupMultiplier: number;
  stripePercentage: number;
  stripeFixed: number;
}

const DEFAULT_PRICING: PricingConfig = {
  uberPremierBase: 25.00,
  markupMultiplier: 1.30,
  stripePercentage: 0.029, // 2.9%
  stripeFixed: 0.30 // $0.30
};

export class SmartPricingCalculator {
  private config: PricingConfig;

  constructor(config?: Partial<PricingConfig>) {
    this.config = { ...DEFAULT_PRICING, ...config };
  }

  calculatePrice(distanceMiles: number = 0): {
    baseFare: number;
    withMarkup: number;
    stripeFees: number;
    total: number;
    breakdown: {
      base: number;
      markup: number;
      stripePercentage: number;
      stripeFixed: number;
    };
  } {
    // Base fare calculation (can be enhanced with distance-based pricing)
    const baseFare = this.config.uberPremierBase + (distanceMiles * 2.5);
    
    // Apply markup
    const withMarkup = baseFare * this.config.markupMultiplier;
    
    // Calculate Stripe fees
    const stripePercentageFee = withMarkup * this.config.stripePercentage;
    const stripeFees = stripePercentageFee + this.config.stripeFixed;
    
    // Final total
    const total = withMarkup + stripeFees;

    return {
      baseFare: Math.round(baseFare * 100) / 100,
      withMarkup: Math.round(withMarkup * 100) / 100,
      stripeFees: Math.round(stripeFees * 100) / 100,
      total: Math.round(total * 100) / 100,
      breakdown: {
        base: baseFare,
        markup: withMarkup - baseFare,
        stripePercentage: stripePercentageFee,
        stripeFixed: this.config.stripeFixed
      }
    };
  }

  calculatePriceInCents(distanceMiles: number = 0): number {
    const pricing = this.calculatePrice(distanceMiles);
    return Math.round(pricing.total * 100);
  }
}

export const smartPricing = new SmartPricingCalculator();
