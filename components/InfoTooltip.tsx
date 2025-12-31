
import React from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  text: string;
}

export const InfoTooltip: React.FC<Props> = ({ text }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative inline-flex items-center ml-1 z-30">
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="text-[#00f7ff] opacity-70 hover:opacity-100 transition-opacity"
      >
        <Info size={12} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black border border-[#00f7ff] text-[10px] text-gray-300 shadow-[0_0_15px_rgba(0,247,255,0.2)] z-40"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#00f7ff] mt-[-1px]"></div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {isOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};
