"use client";

import type { MuxPlayerProps } from "@mux/mux-player-react";
import dynamic from "next/dynamic";

const MuxPlayerClient = dynamic(
  () => import("./mux-player-client").then((m) => m.MuxPlayerClient),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-black/10">
        <div className="h-full w-full animate-pulse bg-white/10" />
      </div>
    ),
  },
);

export default function MuxVideo(props: MuxPlayerProps) {
  return <MuxPlayerClient {...props} preload={props.preload ?? "metadata"} />;
}

