export type Authentication = {
  token: {
    authMechanism: "api_key" | "oauth_token" | "jwt";
    userId: string;
    restrictedToLocationId: string | null;
  };
};
