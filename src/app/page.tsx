"use client";

import Header from "@/components/landing/header";
import HeroSection from "@/components/landing/hero-section";
import FeaturesSection from "@/components/landing/features-section";
import SafetySection from "@/components/landing/safety-section";
import CtaSection from "@/components/landing/cta-section";
import Footer from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Header />
        <main>
          <HeroSection />
          <FeaturesSection />
          <SafetySection />
          <CtaSection />
        </main>
        <Footer />
      </div>
    </div>
  );
}
