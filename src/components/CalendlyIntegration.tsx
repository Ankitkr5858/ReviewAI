import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface CalendlyIntegrationProps {
  url: string;
  prefill?: {
    name?: string;
    email?: string;
    customAnswers?: Record<string, string>;
  };
  utm?: Record<string, string>;
  styles?: React.CSSProperties;
}

const CalendlyIntegration: React.FC<CalendlyIntegrationProps> = ({ 
  url, 
  prefill, 
  utm, 
  styles = {} 
}) => {
  const calendlyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Calendly script
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    // Clean up
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    // Initialize Calendly when the component mounts
    if (calendlyRef.current) {
      // Clear any existing content
      calendlyRef.current.innerHTML = '';

      // Create Calendly inline widget
      const calendlyOptions: any = {
        url: url,
        parentElement: calendlyRef.current,
        prefill: prefill || {},
        utm: utm || {}
      };

      // @ts-ignore - Calendly is loaded from external script
      if (window.Calendly) {
        // @ts-ignore
        window.Calendly.initInlineWidget(calendlyOptions);
      }
    }
  }, [url, prefill, utm]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl overflow-hidden shadow-xl"
    >
      <div 
        ref={calendlyRef} 
        className="calendly-inline-widget" 
        style={{ 
          minWidth: '320px',
          height: '700px',
          ...styles
        }}
      />
    </motion.div>
  );
};

export default CalendlyIntegration;