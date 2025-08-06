export class AuthorizationError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "AuthorizationError";

    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class SecretariaatAuthorizationError extends AuthorizationError {
  constructor(message?: string) {
    super(message);
    this.name = "SecretariaatAuthorizationError";

    Object.setPrototypeOf(this, SecretariaatAuthorizationError.prototype);
  }
}

export class SystemAdminAuthorizationError extends AuthorizationError {
  constructor(message?: string) {
    super(message);
    this.name = "SystemAdminAuthorizationError";

    Object.setPrototypeOf(this, SystemAdminAuthorizationError.prototype);
  }
}
