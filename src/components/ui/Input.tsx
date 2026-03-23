import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ hasError, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          w-full px-3 py-2.5 rounded-lg border bg-white text-gray-900
          placeholder:text-gray-400 text-sm
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-offset-1
          ${hasError
            ? 'border-red-300 focus:ring-red-500/30 focus:border-red-500'
            : 'border-gray-300 focus:ring-blue-500/30 focus:border-blue-500 hover:border-gray-400'
          }
          ${className}
        `}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
