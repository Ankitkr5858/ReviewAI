import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const CalendlyIntegration: React.FC = () => {
  useEffect(() => {
    // Load the Calendly widget script
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    // Clean up
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Using the exact embed code you provided */}
      <div 
        className="calendly-inline-widget" 
        data-url="https://calendly.com/ankitkr5858/30min" 
        style={{ minWidth: '320px', height: '700px' }}
      />
    </motion.div>
  );
};

export default CalendlyIntegration;