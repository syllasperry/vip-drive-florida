import React from 'react';
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const PricingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Pricing</h1>
        <p className="text-muted-foreground">Pricing information coming soon.</p>
      </main>
      <SiteFooter />
    </div>
  );
};