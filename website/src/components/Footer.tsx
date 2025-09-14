import React from 'react';

const Footer: React.FC = () => {

    return (
        <footer className="py-8 px-6" style={{ backgroundColor: '#101010' }}>
            <div className="max-w-7xl mx-auto text-center">
                <div className="flex flex-wrap justify-center items-center gap-8 text-sm font-farsi">
                    <button className="text-white hover:text-gray-300 transition-colors bg-transparent border-none cursor-pointer">
                        شرایط خدمات
                    </button>
                    <button className="text-white hover:text-gray-300 transition-colors bg-transparent border-none cursor-pointer">
                        حریم خصوصی
                    </button>
                    <button className="text-white hover:text-gray-300 transition-colors bg-transparent border-none cursor-pointer">
                        تماس با پشتیبانی
                    </button>
                    <span className="text-white">
                        © 2025 لقمه
                    </span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;