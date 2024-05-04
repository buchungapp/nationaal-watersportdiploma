"use client";
import JSConfetti from "js-confetti";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

export function Confetti() {
  const searchParams = useSearchParams();

  const confettiClient = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return new JSConfetti();
  }, []);

  const showConfetti = useCallback(() => {
    if (!confettiClient) {
      console.info("Confetti client not initialized");
      return;
    }

    void confettiClient.addConfetti({
      confettiColors: ["#ff8000", "#007FFF", "#0047ab"],
      confettiRadius: 6,
      confettiNumber: 500,
    });
  }, [confettiClient]);

  useEffect(() => {
    if (searchParams.has("redirected")) {
      showConfetti();
    }
  }, [searchParams, showConfetti]);

  return (
    <button
      onClick={showConfetti}
      className="mt-6 mx-auto px-4 py-2.5 bg-branding-orange text-white rounded-full font-medium"
    >
      Nog een keer vieren?! 🎉
    </button>
  );
}
