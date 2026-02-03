import { clsx } from "clsx";

export function AnimatedWave({
  offset = 0,
  spacing = 0,
  textColorClassName = "text-white",
}: {
  offset?: number;
  spacing?: number;
  textColorClassName?: string;
}) {
  return (
    <div
      className={clsx(
        "absolute bottom-0 left-0 right-0 h-8 pointer-events-none z-0",
        textColorClassName,
      )}
    >
      <div className="absolute opacity-40 inset-0 flex">
        <Wave1
          className="absolute bottom-0"
          style={{
            animationName: "wave-reversed",
            animationDelay: `${offset + spacing}s`,
            animationDuration: "60s",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        />
        <Wave1
          className="absolute bottom-0 -translate-x-full"
          style={{
            animationName: "wave-reversed",
            animationDelay: `${offset + spacing}s`,
            animationDuration: "60s",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        />
      </div>
      <div className="absolute opacity-20 inset-0 flex">
        <Wave2
          className="absolute bottom-0"
          style={{
            animationName: "wave",
            animationDelay: `${offset + spacing * 2}s`,
            animationDuration: "40s",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        />
        <Wave2
          className="absolute bottom-0 translate-x-full"
          style={{
            animationName: "wave",
            animationDelay: `${offset + spacing * 2}s`,
            animationDuration: "40s",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        />
      </div>
      <div className="absolute text-white inset-0 flex">
        <Wave3
          className="absolute bottom-0"
          style={{
            animationName: "wave",
            animationDelay: `${offset + spacing * 3}s`,
            animationDuration: "100s",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        />
        <Wave3
          className="absolute bottom-0 translate-x-full"
          style={{
            animationName: "wave",
            animationDelay: `${offset + spacing * 3}s`,
            animationDuration: "100s",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        />
      </div>
    </div>
  );
}

function Wave1(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg
      width="910"
      height="28"
      viewBox="0 0 910 28"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M18.9583 19.7058L0 22.4286V55H18.9583H113.75H227.5H341.25H455H568.75H682.5H796.25H891.042H910V26.5V22.5C910 22.5 868 26.5 844.5 28.5C796.638 32.5734 730.455 37.3299 682.5 30.5714C664.983 28.1027 647.467 22.104 629.95 16.1053C609.55 9.11908 589.15 2.13292 568.75 0.72277C543.461 -1.09321 518.172 5.54649 492.883 12.1862C480.256 15.5017 467.628 18.8172 455 21.0799C417.083 27.7723 379.167 25.2277 341.25 19.7058C328.571 17.8934 315.893 15.7766 303.214 13.6598C277.976 9.44611 252.738 5.23242 227.5 3.42009C189.583 0.79911 151.667 3.34375 113.75 7.49152C81.9259 10.8447 50.1018 15.3271 29.487 18.2307C25.5404 18.7866 22.0046 19.2846 18.9583 19.7058Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Wave2(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg
      width="1066"
      height="30"
      viewBox="0 0 1066 30"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M0 5C90 -6 179.207 5.25907 266.5 10.2202C310.917 12.8425 355.333 20.685 399.75 25.9052C444.167 31.2234 488.583 33.6742 533 27.2286C577.417 20.685 621.833 5 666.25 7.62234C710.667 10.1467 755.083 31.2234 799.5 36.37C843.917 41.5167 888.333 31.2234 932.75 23.3073C977.167 15.5383 1021.58 10.1467 1043.79 7.62234L1066 5V59.8976H1043.79C1021.58 59.8976 977.167 59.8976 932.75 59.8976C888.333 59.8976 843.917 59.8976 799.5 59.8976C755.083 59.8976 710.667 59.8976 666.25 59.8976C621.833 59.8976 577.417 59.8976 533 59.8976C488.583 59.8976 444.167 59.8976 399.75 59.8976C355.333 59.8976 310.917 59.8976 266.5 59.8976C222.083 59.8976 177.667 59.8976 133.25 59.8976C88.8333 59.8976 44.417 59.8976 22.208 59.8976H0V5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Wave3(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg
      width="869"
      height="25"
      viewBox="0 0 869 25"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M0 1.99998C67.8123 -2.88737 148.729 2.3874 217.25 6.56427C253.458 8.85712 289.667 15.7143 325.875 20.2786C362.083 24.9286 398.292 27.0714 434.5 21.4357C470.708 15.7143 506.917 1.99998 543.125 4.29284C579.333 6.49998 615.542 24.9286 651.75 29.4286C687.958 33.9286 724.167 24.9286 760.375 18.0071C796.583 11.2143 832.792 6.49998 850.896 4.29284L869 1.99998V50H850.896C832.792 50 796.583 50 760.375 50C724.167 50 687.958 50 651.75 50C615.542 50 579.333 50 543.125 50C506.917 50 470.708 50 434.5 50C398.292 50 362.083 50 325.875 50C289.667 50 253.458 50 217.25 50C181.042 50 144.833 50 108.625 50C72.4167 50 36.2083 50 18.1042 50H0V1.99998Z"
        fill="currentColor"
      />
    </svg>
  );
}
