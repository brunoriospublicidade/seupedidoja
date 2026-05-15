import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Pizza, Beef, Fish, Package } from 'lucide-react';

const LoadingScreen = ({ message = "Carregando..." }: { message?: string }) => {
  const [iconIndex, setIconIndex] = useState(0);
  
  const foods = [
    { icon: Beef, color: 'text-amber-600', name: 'Hamburguer' },
    { icon: Pizza, color: 'text-red-500', name: 'Pizza' },
    { icon: Fish, color: 'text-blue-500', name: 'Sushi' },
    { icon: Package, color: 'text-emerald-600', name: 'Marmita' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % foods.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = foods[iconIndex].icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full space-y-8 py-12">
      <div className="relative">
        {/* Outer Glow */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`absolute inset-0 blur-2xl rounded-full ${foods[iconIndex].color} opacity-20`}
        />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={iconIndex}
            initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 1.5, opacity: 0, rotate: 20 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className={`relative z-10 p-8 bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 ${foods[iconIndex].color}`}
          >
            <CurrentIcon size={64} strokeWidth={1.5} />
          </motion.div>
        </AnimatePresence>

        {/* Cooking Particles */}
        <div className="absolute -top-4 -right-4 flex flex-col gap-1">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -20],
                x: [0, i % 2 === 0 ? 10 : -10],
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeOut"
              }}
              className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"
            />
          ))}
        </div>
      </div>

      <div className="text-center space-y-2">
        <motion.h3 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]"
        >
          {message}
        </motion.h3>
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Preparando com carinho...
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-48 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          animate={{
            x: ["-100%", "100%"]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
          className={`h-full w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent`}
        />
      </div>
    </div>
  );
};

export default LoadingScreen;
