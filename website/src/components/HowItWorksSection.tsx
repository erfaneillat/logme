import React from 'react';
import { useTranslation } from 'react-i18next';
import ScrollAnimation from './ScrollAnimation';
import GlowButton from './GlowButton';
import { scrollToDownload } from '../utils/scrollToSection';

const HowItWorksSection: React.FC = () => {
    const { t } = useTranslation();

    return (
        <section
            id="how-it-works"
            className="px-6 pb-20 relative overflow-hidden bg-cover bg-center bg-no-repeat bg-black"
            style={{
                backgroundImage: 'url(/how_works_bg.jpg)',
                minHeight: '80vh'
            }}
        >
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="max-w-7xl mx-auto relative z-10">
                {/* Content positioned to work with background layout */}
                <div className="flex items-center justify-center md:justify-end" style={{ minHeight: '70vh' }}>
                    <ScrollAnimation className="text-center md:text-right space-y-6 max-w-xl md:ml-auto px-4 md:pr-4 lg:pr-8">
                        <h2 className="text-2xl lg:text-4xl font-bold text-white font-farsi">
                            {t('howItWorks.title')}
                        </h2>

                        <p className="text-base lg:text-lg text-gray-200 leading-relaxed font-farsi">
                            {t('howItWorks.description')}
                        </p>

                        <GlowButton
                            onClick={scrollToDownload}
                            className="bg-white text-black px-6 py-3 rounded-lg font-semibold text-base hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border border-gray-300 font-farsi mt-6"
                            glowColor="rgba(255, 255, 255, 0.3)"
                            pulseDuration={2.5}
                        >
                            {t('howItWorks.cta')}
                        </GlowButton>
                    </ScrollAnimation>
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;