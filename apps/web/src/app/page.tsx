import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { InfoSection } from "@/components/landing/InfoSection";
import { BackedBySection } from "@/components/landing/BackedBySection";
import { UseCasesSection } from "@/components/landing/UseCasesSection";

export default function LandingPage() {
  return (
    <div className="landing flex flex-col bg-[#F5F5F5]">
      <div className="container flex h-screen flex-col overflow-hidden">
        <Navbar />
        <HeroSection />
      </div>
      <InfoSection />
      <BackedBySection />
      <UseCasesSection />
    </div>
  );
}
