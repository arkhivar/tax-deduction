import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ hasError, options, placeholder, className = '', ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`
          w-full px-3 py-2.5 rounded-lg border bg-white text-gray-900 text-sm
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-offset-1
          ${hasError
            ? 'border-red-300 focus:ring-red-500/30 focus:border-red-500'
            : 'border-gray-300 focus:ring-blue-500/30 focus:border-blue-500 hover:border-gray-400'
          }
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = 'Select';
