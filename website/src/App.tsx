import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './i18n';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import HowItWorksSection from './components/HowItWorksSection';
import AccuracySection from './components/AccuracySection';
import CallToActionSection from './components/CallToActionSection';
import Footer from './components/Footer';
import { Contact } from './pages';
import PrivacyPolicy from './pages/PrivacyPolicy';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen" style={{ backgroundColor: '#101010' }}>
            <Header />
            <div className="pt-20">
              <HeroSection />
              <HowItWorksSection />
              <AccuracySection />
              <CallToActionSection />
              <Footer />
            </div>
          </div>
        } />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Routes>
    </Router>
  );
}

export default App;