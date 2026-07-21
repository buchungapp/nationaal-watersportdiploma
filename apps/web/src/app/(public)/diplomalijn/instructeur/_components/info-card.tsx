import type { ReactNode } from "react";

type Tone = "instructeur" | "leercoach" | "beoordelaar" | "neutral";

interface InfoCardProps {
  tone?: Tone;
  emphasis?: boolean;
  icon: ReactNode;
  title: string;
  children: ReactNode;
}

const toneTokens: Record<
  Tone,
  {
    border: string;
    iconBg: string;
    iconColor: string;
    soft: string;
    softBorder: string;
  }
> = {
  instructeur: {
    border: "border-slate-200",
    iconBg: "bg-branding-light/10",
    iconColor: "text-branding-light",
    soft: "bg-branding-light/5",
    softBorder: "border-branding-light/20",
  },
  leercoach: {
    border: "border-slate-200",
    iconBg: "bg-branding-orange/10",
    iconColor: "text-branding-orange",
    soft: "bg-branding-orange/5",
    softBorder: "border-branding-orange/20",
  },
  beoordelaar: {
    border: "border-slate-200",
    iconBg: "bg-branding-dark/10",
    iconColor: "text-branding-dark",
    soft: "bg-branding-dark/5",
    softBorder: "border-branding-dark/20",
  },
  neutral: {
    border: "border-slate-200",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    soft: "bg-slate-50",
    softBorder: "border-slate-200",
  },
};

export function InfoCard({
  tone = "neutral",
  emphasis = false,
  icon,
  title,
  children,
}: InfoCardProps) {
  const t = toneTokens[tone];
  const wrapperClass = emphasis
    ? `rounded-xl border ${t.softBorder} ${t.soft} p-5`
    : `rounded-xl border ${t.border} bg-white p-5`;

  return (
    <div className={`not-prose ${wrapperClass}`}>
      <div className="flex items-start gap-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${t.iconBg} ${t.iconColor}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <div className="mt-1 text-sm leading-relaxed text-slate-600 space-y-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
