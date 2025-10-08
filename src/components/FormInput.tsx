"use client";

import React, { InputHTMLAttributes } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  className = "",
  ...props
}) => (
  <div className={`mb-4 ${className}`}>
    {label && (
      <label className="block text-sm font-medium mb-1 text-text pl-4">
        {label}
      </label>
    )}
    <input
      {...props}
      className={`
        w-full px-4 py-2 border rounded-3xl
        focus:outline-none focus:ring-2 focus:ring-primary
        transition-colors duration-200 ease-out
        ${error ? "border-red-500" : "border-gray-300"}
      `}
    />
    {error && (
      <p className="mt-1 text-sm text-red-600 pl-4">
        {error}
      </p>
    )}
  </div>
);
