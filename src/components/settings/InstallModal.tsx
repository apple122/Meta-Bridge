import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { X, Share, PlusSquare, ArrowUp } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';


interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: { duration: 0.2, ease: 'easeIn' }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-sm glass-card p-6 sm:p-8 relative overflow-hidden ring-1 ring-white/10 mb-20 md:mb-0"
          >
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 -translate-x-1/2 w-48 h-48 bg-primary/20 blur-[80px] -z-10" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] -z-10" />

            <div className="flex justify-between items-start mb-8">
              <motion.div variants={itemVariants}>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1">{t('createShortcut')}</h3>
                <p className="text-xs text-slate-400 font-medium">{t('installInstructions')}</p>
              </motion.div>
              <button 
                onClick={onClose} 
                className="p-2.5 hover:bg-white/5 active:scale-90 rounded-full transition-all border border-transparent hover:border-white/10 group"
              >
                <X size={20} className="text-slate-500 group-hover:text-white transition-colors" />
              </button>
            </div>

            <div className="space-y-6 relative">
              {/* Step 1 */}
              <motion.div variants={itemVariants} className="flex items-center gap-5 group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10 flex items-center justify-center shrink-0 shadow-xl group-hover:border-primary/50 transition-colors duration-500">
                  <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                  <Share size={20} className="text-primary relative z-10" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1 opacity-70">{t('step1')}</p>
                  <p className="text-sm font-bold text-slate-100 leading-snug">{t('safariShare')}</p>
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div variants={itemVariants} className="flex items-center gap-5 group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10 flex items-center justify-center shrink-0 shadow-xl group-hover:border-primary/50 transition-colors duration-500">
                  <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                  <PlusSquare size={20} className="text-primary relative z-10" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1 opacity-70">{t('step2')}</p>
                  <p className="text-sm font-bold text-slate-100 leading-snug">{t('safariAddHome')}</p>
                </div>
              </motion.div>

              {/* Tips Banner */}
              <motion.div 
                variants={itemVariants}
                className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-center gap-4 group hover:bg-primary/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <ArrowUp className="text-primary animate-bounce" size={20} />
                </div>
                <p className="text-[11px] font-bold text-primary leading-relaxed uppercase tracking-wide">
                  {t('launchFromHome')}
                </p>
              </motion.div>
            </div>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="w-full mt-10 py-4 rounded-2xl bg-gradient-to-r from-primary to-blue-600 font-black uppercase tracking-[0.2em] text-background text-[11px] shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
            >
              {t('iUnderstand')}
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

