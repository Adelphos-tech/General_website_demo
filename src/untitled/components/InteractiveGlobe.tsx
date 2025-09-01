import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Component031 from '../imports/031';
// Removed overlay icons for a cleaner globe

interface InteractiveGlobeProps {
  onVoiceStart: () => void;
  onVoiceEnd: () => void;
  isListening: boolean;
  isProcessing: boolean;
  volume?: number; // 0..1
}

export function InteractiveGlobe({ onVoiceStart, onVoiceEnd, isListening, isProcessing, volume = 0 }: InteractiveGlobeProps) {
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

  // Clamp and derive animation intensities from volume + state
  const v = Math.max(0, Math.min(1, volume));
  const idle = !isListening && !isProcessing;
  let outerAmp: number, middleAmp: number, globeAmp: number;
  let outerOpacity: number, middleOpacity: number, dur: number;

  if (idle) {
    // Gentle, regular glow while idle
    outerAmp = 0.08; // ±8%
    middleAmp = 0.06;
    globeAmp  = 0.04;
    outerOpacity = 0.35;
    middleOpacity = 0.4;
    dur = 2.6;
  } else {
    // Talking/listening: respond to live volume
    const talkBoost = isProcessing ? 1 : 0.7;
    outerAmp = (isProcessing ? 0.20 : 0.15) + 0.25 * v * talkBoost;
    middleAmp = (isProcessing ? 0.14 : 0.12) + 0.18 * v * talkBoost;
    globeAmp  = (isProcessing ? 0.10 : 0.08) + 0.10 * v * talkBoost;
    outerOpacity = 0.3 + 0.5 * v * talkBoost;
    middleOpacity = 0.35 + 0.45 * v * talkBoost;
    dur = Math.max(0.6, (isProcessing ? 1.1 : 1.6) - v * 0.4);
  }

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring */}
      <motion.div
        className={"absolute w-80 h-80 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 blur-xl"}
        animate={{
          scale: pulseAnimation ? [1, 1 + outerAmp, 1] : 1,
          opacity: pulseAnimation ? [outerOpacity * 0.7, outerOpacity, outerOpacity * 0.7] : 0.2,
        }}
        transition={{ duration: dur, repeat: pulseAnimation ? Infinity : 0, ease: "easeInOut" }}
      />
      
      {/* Middle glow ring */}
      <motion.div
        className={"absolute w-72 h-72 rounded-full bg-gradient-to-r from-purple-400/30 via-pink-400/30 to-orange-400/30 blur-lg"}
        animate={{
          scale: pulseAnimation ? [1, 1 + middleAmp, 1] : 1,
          opacity: pulseAnimation ? [middleOpacity * 0.7, middleOpacity, middleOpacity * 0.7] : 0.3,
        }}
        transition={{ duration: Math.max(0.5, dur - 0.2), repeat: pulseAnimation ? Infinity : 0, ease: "easeInOut", delay: 0.2 }}
      />

      {/* Globe container */}
      <motion.div
        className={"relative w-64 h-64 cursor-pointer select-none"}
        onClick={handleGlobeClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ scale: pulseAnimation ? [1, 1 + globeAmp, 1] : 1 }}
        transition={{ duration: Math.max(0.5, dur - 0.3), repeat: pulseAnimation ? Infinity : 0, ease: "easeInOut", delay: 0.1 }}
      >
        {/* Rotate the globe slowly while idle */}
        <motion.div
          style={{ width: '100%', height: '100%' }}
          animate={idle ? { rotate: 360 } : { rotate: 0 }}
          transition={idle ? { repeat: Infinity, duration: 40, ease: 'linear' } : { duration: 0 }}
        >
          <Component031 />
        </motion.div>
        
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
            : "Tap the globe to start talking to our experts instantly"
        }
      </motion.p>
    </div>
  );
}
