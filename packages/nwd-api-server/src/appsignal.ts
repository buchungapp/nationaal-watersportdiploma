import { Appsignal } from "@appsignal/nodejs";

const appsignalPushApiKey = process.env.APPSIGNAL_PUSH_API_KEY;

export const appsignal = new Appsignal({
  active: appsignalPushApiKey != null,
  environment: process.env.NODE_ENV,
  name: "nwd-api-server",
  pushApiKey: appsignalPushApiKey,
});
