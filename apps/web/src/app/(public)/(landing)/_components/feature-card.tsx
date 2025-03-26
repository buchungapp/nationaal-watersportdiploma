import type { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  className = "",
}: FeatureCardProps) {
  return (
    <div
      className={`group px-6 py-4 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300 ${className}`}
    >
      <div className="inline-flex p-3 rounded-full bg-blue-50 text-branding-dark group-hover:bg-blue-100 group-hover:text-branding-orange transition-all duration-200">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mt-3">{title}</h3>
      <p className="text-gray-600 text-sm mt-2">{description}</p>
    </div>
  );
}
