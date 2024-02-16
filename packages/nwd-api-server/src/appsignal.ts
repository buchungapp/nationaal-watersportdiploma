import { Appsignal } from "@appsignal/nodejs";
import * as oa42 from "oa42-appsignal";

const appsignalPushApiKey = process.env.APPSIGNAL_PUSH_API_KEY;

export const appsignal = new Appsignal({
  active: appsignalPushApiKey != null,
  environment: process.env.NODE_ENV,
  name: "nwd-api-server",
  pushApiKey: appsignalPushApiKey,
  additionalInstrumentations: [new oa42.Instrumentation()],
});
