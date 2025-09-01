import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Component031 from '../imports/031';
// Removed overlay icons for a cleaner globe

interface InteractiveGlobeProps {
  onVoiceStart: () => void;
  onVoiceEnd: () => void;
  isListening: boolean;
  isProcessing: boolean;
}

export function InteractiveGlobe({ onVoiceStart, onVoiceEnd, isListening, isProcessing }: InteractiveGlobeProps) {
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    if (isListening || isProcessing) {
      setPulseAnimation(true);
    } else {
      setPulseAnimation(false);
    }
  }, [isListening, isProcessing]);

  const handleGlobeClick = () => {
    if (isListening) {
      onVoiceEnd();
    } else if (!isProcessing) {
      onVoiceStart();
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring */}
      <motion.div
        className={"absolute w-80 h-80 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 blur-xl"}
        animate={{
          scale: pulseAnimation ? [1, 1.2, 1] : 1,
          opacity: pulseAnimation ? [0.3, 0.6, 0.3] : 0.2,
        }}
        transition={{
          duration: 2,
          repeat: pulseAnimation ? Infinity : 0,
          ease: "easeInOut"
        }}
      />
      
      {/* Middle glow ring */}
      <motion.div
        className={"absolute w-72 h-72 rounded-full bg-gradient-to-r from-purple-400/30 via-pink-400/30 to-orange-400/30 blur-lg"}
        animate={{
          scale: pulseAnimation ? [1, 1.15, 1] : 1,
          opacity: pulseAnimation ? [0.4, 0.7, 0.4] : 0.3,
        }}
        transition={{
          duration: 1.5,
          repeat: pulseAnimation ? Infinity : 0,
          ease: "easeInOut",
          delay: 0.2
        }}
      />

      {/* Globe container */}
      <motion.div
        className={"relative w-64 h-64 cursor-pointer select-none"}
        onClick={handleGlobeClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          scale: pulseAnimation ? [1, 1.08, 1] : 1,
        }}
        transition={{
          duration: 1.2,
          repeat: pulseAnimation ? Infinity : 0,
          ease: "easeInOut",
          delay: 0.1
        }}
      >
        <Component031 />
        
        {/* Voice state overlay removed as requested */}
      </motion.div>

      {/* Instruction text */}
      <motion.p
        className="absolute -bottom-16 text-center text-white/70 text-sm max-w-xs"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {isListening 
          ? "Listening... Tap to stop" 
          : isProcessing 
            ? "Processing your message..." 
            : "Tap the globe to start talking"
        }
      </motion.p>
    </div>
  );
}
