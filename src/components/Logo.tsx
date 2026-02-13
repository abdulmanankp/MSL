import React from 'react';
import mslLogo from '@/assets/msl-logo.webp';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img 
        src={mslLogo} 
        alt="MSL Pakistan Logo" 
        className="w-24 h-24 object-contain"
      />
    </div>
  );
};

export default Logo;
