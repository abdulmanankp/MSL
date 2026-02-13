import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-6 mt-12 border-t border-border">
      <div className="container mx-auto px-4 flex flex-col items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => window.open('https://mslpakistan.org/contact-us', '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
          Contact Us
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Design & Developed by <span className="font-medium text-foreground">Abdul Manan</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
