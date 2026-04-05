import React from 'react';
import Logo from '@/components/Logo';
import JoinUsForm from '@/components/JoinUsForm';
import NavigationButtons from '@/components/NavigationButtons';

const Index: React.FC = () => {
  return (
    <div className="msl-page-bg flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-lg">
        <div className="msl-panel flex flex-col items-center p-4 md:p-6">
          <Logo className="mb-4 md:mb-6 animate-bounce-smooth" />
          <div className="w-full mb-6 text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-[#014f35] to-[#1a7d52] text-white text-xs font-medium uppercase tracking-wider mb-3 shadow-lg">
              Registration Form
            </span>
            <h1 className="text-2xl md:text-4xl font-bold text-[#014f35]">
              Join MSL Pakistan
            </h1>
            <p className="text-gray-600 mt-2 text-sm md:text-base">Start your journey with MSL Pakistan—just fill out the form to become a member.</p>
          </div>
          <div className="w-full msl-form-shell p-4 md:p-6">
            <div className="bg-white rounded-xl p-4 md:p-6">
              <JoinUsForm />
            </div>
          </div>
          <div className="w-full text-center mt-3">
            <p className="text-xs text-gray-600 mb-2">If you face any error, contact us on WhatsApp.</p>
            <a
              href="https://wa.me/923298876069"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-[#014f35] px-4 py-2 text-xs font-medium text-white hover:bg-[#013d29] transition-colors"
            >
              Contact on Whatsapp
            </a>
          </div>
          <div style={{ minHeight: 48 }} />
          <NavigationButtons />
        </div>
      </main>
    </div>
  );
};

export default Index;
