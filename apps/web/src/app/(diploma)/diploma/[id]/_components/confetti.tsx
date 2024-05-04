"use client";
import { CakeIcon } from "@heroicons/react/16/solid";
import JSConfetti from "js-confetti";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { Button } from "~/app/(dashboard)/_components/button";

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
    <Button onClick={showConfetti} color="orange">
      <CakeIcon />
      Nog een keer vieren?!
    </Button>
  );
}
