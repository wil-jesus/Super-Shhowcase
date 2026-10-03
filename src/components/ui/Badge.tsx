import { HTMLAttributes, ReactNode } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  color?: "blue" | "purple" | "green" | "gray" | "yellow" | "red";
}

const colorClasses = {
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  green: "bg-green-100 text-green-700",
  gray: "bg-gray-100 text-gray-700",
  yellow: "bg-yellow-100 text-yellow-700",
  red: "bg-red-100 text-red-700",
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
