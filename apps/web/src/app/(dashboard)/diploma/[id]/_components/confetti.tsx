"use client";
import JSConfetti from "js-confetti";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

function showConfetti() {
  const jsConfetti = new JSConfetti();
  jsConfetti.addConfetti({
    confettiColors: ["#ff8000", "#007FFF", "#0047ab"],
    confettiRadius: 6,
    confettiNumber: 500,
  });
}

export function Confetti() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.has("redirected")) {
      showConfetti();
    }
  }, []);

  return (
    <button
      onClick={() => {
        showConfetti();
      }}
      className="mt-6 mx-auto px-4 py-2.5 bg-branding-orange text-white rounded-full font-medium"
    >
      Nog een keer vieren?! 🎉
    </button>
  );
}
