import { Appsignal } from '@appsignal/nodejs'
import * as skiffaAppsignal from '@skiffa/appsignal'

const appsignalPushApiKey = process.env.APPSIGNAL_PUSH_API_KEY

export const appsignal = new Appsignal({
  active: appsignalPushApiKey != null,
  environment: process.env.NODE_ENV,
  name: '@nawadi/api-server',
  pushApiKey: appsignalPushApiKey,
  additionalInstrumentations: [new skiffaAppsignal.Instrumentation()],
})
