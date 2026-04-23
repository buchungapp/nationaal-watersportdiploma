import type * as api from "@nawadi/api";
import * as core from "@nawadi/core";
import type * as application from "../application/index.js";

export const openId: api.server.OpenIdAuthenticationHandler<
  application.Authentication
> = async (token) => {
  try {
    const session = await core.Auth.getBetterAuth().api.getSession({
      headers: new Headers({ Authorization: `Bearer ${token}` }),
    });

    if (!session?.user) {
      return;
    }

    const personItems = await core.User.Person.list({
      filter: { userId: session.user.id },
    });

    return {
      user: session.user.id,
      persons: personItems.items.map((item) => item.id),
    };
  } catch (error) {
    core.warn(error);
    return;
  }
};
