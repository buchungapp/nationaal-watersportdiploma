"use client";

import MuxPlayer, { type MuxPlayerProps } from "@mux/mux-player-react";

import "@mux/mux-player-react/themes/minimal";

export function MuxPlayerClient(props: MuxPlayerProps) {
  return <MuxPlayer theme="minimal" disableTracking {...props} />;
}

