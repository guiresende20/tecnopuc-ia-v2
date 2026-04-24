'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface InputFeedbackProps {
  message: string | null;
  type?: 'error' | 'info' | 'warning';
}

const TYPE_COLORS = {
  error: '#f87171',
  info: '#60a5fa',
  warning: '#f59e0b',
};

export function InputFeedback({ message, type = 'error' }: InputFeedbackProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          className="feedback"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          style={{ color: TYPE_COLORS[type] }}
        >
          {message}

          <style jsx>{`
            .feedback {
              font-size: 0.7rem;
              font-family: 'Montserrat', sans-serif;
              text-align: center;
              margin-top: 4px;
            }
          `}</style>
        </motion.p>
      )}
    </AnimatePresence>
  );
}
