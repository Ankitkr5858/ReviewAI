import React from 'react';
import { motion } from 'framer-motion';
import { Wand2, Sparkles } from 'lucide-react';

interface OverlaySpinnerProps {
  isVisible: boolean;
  text?: string;
  onClose?: () => void;
}

const OverlaySpinner: React.FC<OverlaySpinnerProps> = ({ 
  isVisible, 
  text = 'Processing...', 
  onClose 
}) => {
  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className="flex flex-col items-center justify-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* FIXED: BIGGER transparent gradient circle with magic effect */}
        <div className="relative">
          {/* BIGGER Gradient Circle Background */}
          <motion.div
            className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 flex items-center justify-center"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.3, 0.2]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* FIXED: BIGGER Static Wand (no rotation) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Wand2 size={40} className="text-blue-600" />
          </div>
          
          {/* FIXED: BIGGER WHITE stars moving around the wand */}
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                top: '50%',
                left: '50%',
                transformOrigin: '0 0'
              }}
              animate={{
                rotate: [0 + (i * 90), 360 + (i * 90)],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.2
              }}
            >
              <Sparkles 
                size={16} 
                className="text-white -translate-x-10 -translate-y-1/2" 
              />
            </motion.div>
          ))}
        </div>
        
        {/* FIXED: Loading Text WITHOUT "ReviewAI" title */}
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-white/90 text-lg font-medium">{text}</p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default OverlaySpinner;