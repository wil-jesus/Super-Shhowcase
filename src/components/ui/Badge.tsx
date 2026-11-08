import { HTMLAttributes, ReactNode } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  color?: "blue" | "purple" | "green" | "gray" | "yellow" | "red";
}

const colorClasses = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-200",
  green: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200",
  gray: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100",
  yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200",
  red: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200",
};

export function Badge({
  children,
  color = "gray",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClasses[color]} ${className}`}
    >
      {children}
    </span>
  );
}
