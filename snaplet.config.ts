/// <reference path=".snaplet/snaplet.d.ts" />
import { defineConfig } from "snaplet";

export default defineConfig({
  select: {
    $default: false,
    public: {
      $default: true,
      country: "structure",
    },
    auth: {
      $default: "structure",
      identities: true,
      users: true,
    },
    storage: true,
  },
  transform: {
    $mode: "unsafe",
  },
});
