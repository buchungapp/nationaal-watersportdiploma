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
  type BetterAuthInstance,
  type Session,
} from "./runtime.js";
export {
  findUserByEmail,
  getOrCreateUser,
  updateUserEmail,
} from "./repository.js";
