import type { ApiClient } from "./auth.js";

export type Variables = {
  client: ApiClient;
  requestId: string;
  startedAt: number;
  requestBody: unknown;
};

export type Env = { Variables: Variables };
