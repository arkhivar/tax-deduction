import React, { useEffect, useRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
  uppercase?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ hasError, uppercase, onChange, value, ...props }, ref) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = (el: HTMLTextAreaElement | null) => {
      innerRef.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    };

    // Grow the textarea to fit its content (rows acts as the minimum height)
    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (uppercase && e.target.value) {
        e.target.value = e.target.value.toUpperCase();
      }
      onChange?.(e);
    };

    return (
      <textarea
        ref={setRefs}
        className={`
          w-full px-3 py-2.5 rounded-lg border bg-white text-gray-900
          placeholder:text-gray-400 text-sm
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-offset-1
          ${hasError
            ? 'border-red-300 focus:ring-red-500/30 focus:border-red-500'
            : 'border-gray-300 focus:ring-blue-500/30 focus:border-blue-500 hover:border-gray-400'
          }
          ${uppercase ? 'uppercase' : ''}
          ${props.className || ''}
        `}
        value={value}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
