export type Authentication = {
  apiKey: {
    /** User-bound API key id. This is not a final vendor/client identity. */
    apiKey: string;
    user: string;
  };
  openId: {
    user: string;
    persons: string[];
  };
};
