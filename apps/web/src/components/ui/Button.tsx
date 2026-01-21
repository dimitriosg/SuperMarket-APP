import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

const variantStyles = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500",
  secondary:
    "bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
} as const;

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
  icon: "p-2",
} as const;

export type ButtonVariant = keyof typeof variantStyles;
export type ButtonSize = keyof typeof sizeStyles;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      className,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const spinnerClasses =
      variant === "primary"
        ? "border-white/70"
        : "border-slate-400";

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
          variantStyles[variant],
          sizeStyles[size],
          size === "icon" && "rounded-xl",
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <span
            className={cn(
              "inline-flex h-4 w-4 animate-spin rounded-full border-2 border-t-transparent",
              spinnerClasses
            )}
            aria-hidden="true"
          />
        )}
        {!loading && icon}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
