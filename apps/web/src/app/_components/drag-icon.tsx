import clsx from "clsx";

export default function DragIcon({ isDragging }: { isDragging: boolean }) {
  return (
    <svg
      className={clsx(
        "-ml-2.5 h-6 w-6",
        isDragging ? "cursor-grabbing opacity-80" : "cursor-grab",
      )}
      fill="#a1a1aa"
      width="800px"
      height="800px"
      viewBox="0 0 36 36"
      version="1.1"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <circle
        cx="15"
        cy="12"
        r="1.5"
        className="clr-i-outline clr-i-outline-path-1"
      />
      <circle
        cx="15"
        cy="24"
        r="1.5"
        className="clr-i-outline clr-i-outline-path-2"
      />
      <circle
        cx="21"
        cy="12"
        r="1.5"
        className="clr-i-outline clr-i-outline-path-3"
      />
      <circle
        cx="21"
        cy="24"
        r="1.5"
        className="clr-i-outline clr-i-outline-path-4"
      />
      <circle
        cx="21"
        cy="18"
        r="1.5"
        className="clr-i-outline clr-i-outline-path-5"
      />
      <circle
        cx="15"
        cy="18"
        r="1.5"
        className="clr-i-outline clr-i-outline-path-6"
      />
      <rect x="0" y="0" width="36" height="36" fillOpacity="0" />
    </svg>
  );
}
