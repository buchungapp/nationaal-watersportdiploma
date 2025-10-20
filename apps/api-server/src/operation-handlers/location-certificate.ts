import * as api from "@nawadi/api";
import * as core from "@nawadi/core";
import type * as application from "../application/index.js";

export const getLocationCertificates: api.server.GetLocationCertificatesOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const { locationKey } = incomingRequest.parameters;

  // TODO get type from core
  let locationItem: Awaited<ReturnType<typeof core.Location.fromHandle>>;

  if (api.validators.isHandle(locationKey)) {
    locationItem = await core.Location.fromHandle({ handle: locationKey });
  } else if (api.validators.isId(locationKey)) {
    locationItem = await core.Location.fromId(locationKey);
  } else {
    throw "impossible";
  }

  if (locationItem == null) {
    return {
      parameters: {},
      status: 404,
      contentType: null,
    };
  }

  // TODO actually list certificates
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const certificateList: any[] = await (core.Certificate as any).byLocation(
    locationItem.id,
  );

  const responseEntity = certificateList.map((item) => ({
    id: item.id,
    handle: item.handle,
    title: item.title,
  }));

  return {
    status: 200,
    parameters: {},
    contentType: "application/json",
    entity: () => responseEntity,
  };
};

export const createLocationCertificate: api.server.CreateLocationCertificateOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) =>
  core.withTransaction(async () => {
    const { locationKey } = incomingRequest.parameters;
    const requestEntity = await incomingRequest.entity();

    // TODO get type from core
    let locationItem: Awaited<ReturnType<typeof core.Location.fromHandle>>;

    if (api.validators.isHandle(locationKey)) {
      locationItem = await core.Location.fromHandle({ handle: locationKey });
    } else if (api.validators.isId(locationKey)) {
      locationItem = await core.Location.fromId(locationKey);
    } else {
      throw "impossible";
    }

    if (locationItem == null) {
      return {
        parameters: {},
        status: 404,
        contentType: null,
      };
    }

    // TODO actually create a certificate
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const certificateItem: any = (core.Certificate as any).create({
      locationId: locationItem.id,
      handle: requestEntity.handle,
      title: requestEntity.title,
    });

    const responseItem = {
      id: certificateItem.id,
    };

    return {
      status: 201,
      parameters: {},
      contentType: "application/json",
      entity: () => responseItem,
    };
  });
