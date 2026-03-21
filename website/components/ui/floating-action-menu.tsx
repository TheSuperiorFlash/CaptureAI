'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type FloatingActionMenuOption = {
  label: string;
  onClick: () => void;
  Icon?: React.ReactNode;
  isCta?: boolean;
};

type FloatingActionMenuProps = {
  options: FloatingActionMenuOption[];
  isOpen: boolean;
  onClose: () => void;
  className?: string;
};

const FloatingActionMenu = ({ options, isOpen, onClose, className }: FloatingActionMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{
            duration: 0.3,
            type: 'spring',
            stiffness: 300,
            damping: 20,
          }}
          className={cn('fixed z-50 flex flex-col items-end gap-2', className)}
          style={{ right: '1.5rem', top: '4rem' }}
        >
          {options.map((option, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
              }}
              className={cn(
                'w-fit rounded-xl border border-white/[0.08] shadow-[0_0_20px_rgba(0,0,0,0.3)] p-3',
                option.isCta
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500'
                  : 'bg-[#111111d1]'
              )}
              style={!option.isCta ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } : undefined}
            >
              <button
                type="button"
                onClick={() => {
                  option.onClick();
                  onClose();
                }}
                className={cn(
                  'flex flex-row-reverse items-center justify-end gap-2 text-sm font-medium transition-colors whitespace-nowrap',
                  option.isCta
                    ? 'text-white hover:opacity-80'
                    : 'text-[--color-text] hover:opacity-80'
                )}
              >
                {option.Icon}
                <span>{option.label}</span>
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingActionMenu;
