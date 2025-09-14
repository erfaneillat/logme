import React from 'react';
import './i18n';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import HowItWorksSection from './components/HowItWorksSection';
import AccuracySection from './components/AccuracySection';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101010' }}>
      <Header />
      <div className="pt-20">
        <HeroSection />
        <HowItWorksSection />
        <AccuracySection />
        <Footer />
      </div>
    </div>
  );
}

export default App;