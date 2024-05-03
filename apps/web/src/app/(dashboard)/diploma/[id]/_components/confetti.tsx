"use client";
import JSConfetti from "js-confetti";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function Confetti() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.has("redirected")) {
      const jsConfetti = new JSConfetti();
      jsConfetti.addConfetti();
    }
  }, []);

  return null;
}
