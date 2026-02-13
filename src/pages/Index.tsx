import React from 'react';
import Logo from '@/components/Logo';
import JoinUsForm from '@/components/JoinUsForm';
import Footer from '@/components/Footer';
import NavigationButtons from '@/components/NavigationButtons';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Full-width header bar */}
      <div className="w-full bg-[#014f35] flex items-center justify-between px-4 py-2" style={{position: 'relative', left: 0, right: 0, top: 0}}>
        <span className="text-white text-sm font-medium">Visit our official website</span>
        <a
          href="https://mslpakistan.com" target="_blank" rel="noopener noreferrer"
          className="px-4 py-1.5 rounded-full bg-white text-[#014f35] font-semibold text-xs shadow hover:bg-[#abd8c9] transition-colors duration-150"
        >
          Visit MSL Official Website
        </a>
      </div>
      <main className="flex-1 container mx-auto px-4 py-8 max-w-lg">
        <div className="flex flex-col items-center">
          <Logo className="mb-4 animate-bounce-smooth" />
          <div className="w-full mb-6 text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium uppercase tracking-wider mb-3">
              Registration Form
            </span>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#014f35' }}>
              Join MSL Pakistan
            </h1>
          </div>
          <div className="w-full bg-card rounded-xl shadow-lg p-6 md:p-8 border border-border">
            <JoinUsForm />
          </div>
          <div style={{ minHeight: 48 }} />
          <NavigationButtons />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
