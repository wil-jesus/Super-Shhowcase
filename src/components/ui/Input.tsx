import { InputHTMLAttributes } from "react";
import { UseFormRegisterReturn } from "react-hook-form";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  register?: UseFormRegisterReturn;
  error?: string;
}

export function Input({ label, register, error, id, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={inputId}
        {...register}
        {...props}
        className={`block w-full rounded-lg border px-3 py-2 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${error ? "border-red-300" : "border-gray-300"} ${className}`}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
