"use client";

import MuxPlayer, { type MuxPlayerProps } from "@mux/mux-player-react";

import "@mux/mux-player-react/themes/minimal";

export default function MuxVideo({ ...props }: MuxPlayerProps) {
  return <MuxPlayer theme="minimal" {...props} />;
}
