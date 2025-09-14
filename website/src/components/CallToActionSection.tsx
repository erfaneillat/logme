import React from 'react';
import { scrollToDownload } from '../utils/scrollToSection';

const CallToActionSection: React.FC = () => {

    return (
        <section className="py-20 px-6 text-center" style={{ backgroundColor: '#101010' }}>
            <div className="max-w-4xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-farsi">
                    امروز لقمه را امتحان کنید
                </h2>
                <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto font-farsi">
                    کالری‌هایتان را فقط با یک عکس ردیابی کنید
                </p>
                <button
                    onClick={scrollToDownload}
                    className="bg-white text-black px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-200 transition-colors duration-300 font-farsi"
                >
                    شروع کنید
                </button>
            </div>
        </section>
    );
};

export default CallToActionSection;
