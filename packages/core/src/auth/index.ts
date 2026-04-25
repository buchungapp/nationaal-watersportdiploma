export {
  AUTH_OTP_EXPIRES_IN_SECONDS,
  getAuthBaseUrl,
  getAuthSecret,
  resolveTrustedAuthOrigins,
  sendAuthOtpEmail,
} from "./email.js";
export {
  createBetterAuthOptions,
  getBetterAuth,
  PUBLIC_API_AUDIENCE,
  PUBLIC_API_SCOPES,
  VAARSCHOOL_CLAIM,
  VENDOR_CLAIM,
  type BetterAuthInstance,
  type PublicApiScope,
  type Session,
} from "./runtime.js";
export {
  findUserByEmail,
  getOrCreateUser,
  updateUserEmail,
} from "./repository.js";
