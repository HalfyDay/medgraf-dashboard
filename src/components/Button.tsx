"use client";
import React, { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "success" | "secondary";
  size?: "base" | "sm";
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "base",
  className = "",
  children,
  ...props
}) => {
  // Общие стили
  const base =
    "inline-flex items-center justify-center font-medium transition-transform duration-150 ease-out focus:outline-none";

  const sizeClass =
    size === "sm" ? "text-sm px-4 py-1.5" : "text-base px-6 py-3";

  // Настраиваем варианты
  const variantClass = {
    primary: `
      bg-gradient-to-r from-primary to-successLight
      bg-[length:200%_200%] rounded-3xl text-white
      hover:animate-gradient-shift focus:animate-gradient-shift
      hover:scale-105 focus:scale-105 focus:shadow-glowPrimary
    `,
    success: `
      bg-gradient-to-r from-success to-primaryLight
      bg-[length:200%_200%] rounded-3xl text-white
      hover:animate-gradient-shift focus:animate-gradient-shift
      hover:scale-105 focus:scale-105 focus:shadow-glowSuccess
    `,
    secondary: `
      bg-gray-100 text-text rounded-3xl
      hover:bg-gray-200 hover:scale-105 focus:scale-105 focus:ring-2 focus:ring-gray-400
    `,
  }[variant];

  return (
    <button
      {...props}
      className={`${base} ${sizeClass} ${variantClass} ${className}`}
    >
      {children}
    </button>
  );
};
