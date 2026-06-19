import { useTheme } from "../hooks/useTheme";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import ProblemSection from "../components/ProblemSection";
import SolutionSection from "../components/SolutionSection";
import FeaturesSection from "../components/FeaturesSection";
import TimeReclaimedCalculator from "../components/TimeReclaimedCalculator";
import SocialProof from "../components/SocialProof";
import TrustSection from "../components/TrustSection";
import DemoVideo from "../components/DemoVideo";
import Pricing from "../components/Pricing";
import FinalCTA from "../components/FinalCTA";
import Footer from "../components/Footer";
import SignUpModal from "../components/SignUpModal";

export default function LandingPage() {
  const { theme, toggle } = useTheme();

  return (
    <>
      <a href="#problem" className="skip-link">
        Skip to content
      </a>

      <Navbar theme={theme} onToggleTheme={toggle} />

      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <FeaturesSection />
        <TimeReclaimedCalculator />
        <SocialProof />
        <TrustSection />
        <DemoVideo />
        <Pricing />
        <FinalCTA />
      </main>

      <Footer />

      <SignUpModal />
    </>
  );
}
