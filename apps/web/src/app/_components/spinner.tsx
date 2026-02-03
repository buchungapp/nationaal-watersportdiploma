import clsx from "clsx";

const sizeToClassName = {
  xs: "size-3",
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
} as const;

export default function Spinner({
  className = "text-slate-700",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className={clsx(sizeToClassName[size], className)} data-slot="icon">
      <div
        style={{
          position: "relative",
          top: "50%",
          left: "50%",
        }}
        className={clsx("loading-spinner", sizeToClassName[size], className)}
      >
        {[...Array(12)].map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: intentional
            key={i}
            style={{
              animationDelay: `${-1.2 + 0.1 * i}s`,
              background: "currentColor",
              position: "absolute",
              borderRadius: "1rem",
              width: "30%",
              height: "8%",
              left: "-10%",
              top: "-4%",
              transform: `rotate(${30 * i}deg) translate(120%)`,
            }}
            className="animate-spinner"
          />
        ))}
      </div>
    </div>
  );
}
