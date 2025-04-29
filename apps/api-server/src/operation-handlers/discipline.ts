import * as api from "@nawadi/api";
import * as core from "@nawadi/core";
import type * as application from "../application/index.js";
import { NwdApiError } from "../lib/error.js";

export const listDisciplines: api.server.ListDisciplinesOperationHandler<
  application.Authentication
> = async ({ token }) => {
  const disciplineList = await core.Course.Discipline.list();

  const responseEntity = disciplineList.map((item) => ({
    id: item.id,
    handle: item.handle,
  }));

  return responseEntity;
};

export const retrieveDiscipline: api.server.RetrieveDisciplineOperationHandler<
  application.Authentication
> = async ({ disciplineKey }, { token }) => {
  if (api.validators.isHandle(disciplineKey)) {
    const discipline = await core.Course.Discipline.fromHandle(disciplineKey);
    if (discipline == null) {
      throw new NwdApiError({
        code: "not_found",
        message: `Discipline with handle ${disciplineKey} not found`,
      });
    }
    return {
      id: discipline.id,
      handle: discipline.handle,
    };
  }

  if (api.validators.isId(disciplineKey)) {
    // @elmerbulthuis why is type of disciplineKey never here?
    const discipline = await core.Course.Discipline.fromId(disciplineKey);
    if (discipline == null) {
      throw new NwdApiError({
        code: "not_found",
        message: `Discipline with handle ${disciplineKey} not found`,
      });
    }

    return {
      id: discipline.id,
      handle: discipline.handle,
    };
  }

  // @elmerbulthuis is this the best way to handle this?
  throw "impossible";
};
