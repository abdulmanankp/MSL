import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CreditCard, ShieldCheck } from 'lucide-react';

const NavigationButtons: React.FC = () => {
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-8 mb-4">
      <Button 
        variant="default" 
        size="md" 
        asChild 
        className="bg-[#014f35] hover:bg-[#013d29] text-white min-w-[150px] min-h-[44px] text-base font-semibold rounded-lg shadow-md transition-all duration-200"
      >
        <Link to="/verify-member" className="gap-2">
          <ShieldCheck className="h-5 w-5" />
          Verify Member
        </Link>
      </Button>
      <Button 
        variant="default" 
        size="md" 
        asChild 
        className="bg-[#014f35] hover:bg-[#013d29] text-white min-w-[150px] min-h-[44px] text-base font-semibold rounded-lg shadow-md transition-all duration-200"
      >
        <Link to="/generate-card" className="gap-2">
          <CreditCard className="h-5 w-5" />
          Get Your Card
        </Link>
      </Button>
    </div>
  );
};

export default NavigationButtons;
