import assert from "node:assert";
import crypto from "node:crypto";
import { schema as s, uncontrolledSchema } from "@nawadi/db";
import { and, asc, eq, getTableColumns, isNull, sql } from "drizzle-orm";
import { fileTypeFromBuffer } from "file-type";
import { imageSize } from "image-size";
import { z } from "zod";
import { useQuery, useSupabaseClient } from "../../contexts/index.js";
import {
  singleRow,
  successfulCreateResponse,
  uuidSchema,
  withZod,
} from "../../utils/index.js";
import {
  constructBaseUrl,
  constructTransformBaseUrl,
  getNameFromObjectName,
} from "./media.helpers.js";
import { outputSchema } from "./media.schema.js";

export const create = withZod(
  z.object({
    file: z.instanceof(Buffer),
    isPublic: z.boolean().default(true),
    actorId: uuidSchema.optional(),
    locationId: uuidSchema.optional(),
  }),
  successfulCreateResponse,
  async (input) => {
    const supabase = useSupabaseClient();

    // Determine the file type
    const type = await fileTypeFromBuffer(input.file);

    if (!type) {
      throw new Error("Failed to determine file type");
    }

    if (!type.mime.startsWith("image/")) {
      throw new Error("Unsupported file type");
    }

    const bucketName = input.isPublic ? "public-assets" : "private-assets";

    // Helper function to handle the upload process
    const handleUpload = async () => {
      return await supabase.storage
        .from(bucketName)
        .upload(`${crypto.randomUUID()}.${type.ext}`, input.file, {
          contentType: type.mime,
        });
    };

    let { data, error } = await handleUpload();

    // Attempt to create the bucket and retry the upload if the bucket doesn't exist
    if (error && error.message === "Bucket not found") {
      await supabase.storage.createBucket(bucketName, {
        public: input.isPublic,
      });
      ({ data, error } = await handleUpload()); // Retry upload after creating the bucket
    }

    if (error) throw error; // Throw any remaining errors

    // Handle possible TypeScript or type errors with data
    if (!data) {
      throw new Error("Failed to upload file");
    }

    const dimensions = imageSize(input.file);

    const query = useQuery();

    const [media] = await query
      .insert(s.media)
      .values({
        object_id: data.id,
        alt: "",
        size: input.file.length,
        mimeType: type.mime,
        status: "ready",
        type: "image",
        actorId: input.actorId,
        locationId: input.locationId,
        _metadata: sql`(((${JSON.stringify({
          width: dimensions.width,
          height: dimensions.height,
        })})::jsonb)#>> '{}')::jsonb`,
      })
      .returning({ id: s.media.id });

    if (!media) {
      throw new Error("Failed to create media");
    }

    return media;
  },
);

export const remove = withZod(uuidSchema, z.void(), async (id) => {
  const query = useQuery();

  await query
    .update(s.media)
    .set({
      deletedAt: sql`NOW()`,
    })
    .where(and(eq(s.media.id, id), isNull(s.media.deletedAt)));
});

export const fromId = withZod(
  uuidSchema,
  outputSchema.nullable(),
  async (id) => {
    const query = useQuery();

    const mediaRow = await query
      .select()
      .from(s.media)
      .innerJoin(
        uncontrolledSchema._objectTable,
        eq(s.media.object_id, uncontrolledSchema._objectTable.id),
      )
      .where(and(eq(s.media.id, id), isNull(s.media.deletedAt)))
      .then(singleRow);

    const expectedMetadataSchema = z.object({
      width: z
        .number()
        .int()
        .nullable()
        .catch(() => null),
      height: z
        .number()
        .int()
        .nullable()
        .catch(() => null),
    });
    const { height, width } = expectedMetadataSchema.parse(
      mediaRow.media._metadata,
    );

    const bucketId = mediaRow.objects.bucket_id;
    const objectName = mediaRow.objects.name;

    assert(bucketId, "Bucket ID is expected");
    assert(objectName, "Object name is expected");

    return {
      id: mediaRow.media.id,
      type: "image" as const,
      url: constructBaseUrl(bucketId, objectName),
      transformUrl: constructTransformBaseUrl(bucketId, objectName),
      name: getNameFromObjectName(objectName),
      width,
      height,
      alt: mediaRow.media.alt ?? "",
      size: mediaRow.media.size,
      mimeType: mediaRow.media.mimeType,
      createdAt: mediaRow.media.createdAt,
      updatedAt: mediaRow.media.updatedAt,
    };
  },
);

export const listImages = withZod(z.void(), outputSchema.array(), async () => {
  const query = useQuery();
  return await query
    .select()
    .from(s.media)
    .innerJoin(
      uncontrolledSchema._objectTable,
      eq(s.media.object_id, uncontrolledSchema._objectTable.id),
    )
    .where(
      and(
        isNull(s.media.deletedAt),
        eq(s.media.type, "image"),
        eq(s.media.status, "ready"),
      ),
    )
    .then((rows) =>
      rows.map((row) => {
        const expectedMetadataSchema = z.object({
          width: z
            .number()
            .int()
            .nullable()
            .catch(() => null),
          height: z
            .number()
            .int()
            .nullable()
            .catch(() => null),
        });
        const { height, width } = expectedMetadataSchema.parse(
          row.media._metadata,
        );

        const bucketId = row.objects.bucket_id;
        const objectName = row.objects.name;

        assert(bucketId, "Bucket ID is expected");
        assert(objectName, "Object name is expected");

        return {
          id: row.media.id,
          type: "image" as const,
          url: constructBaseUrl(bucketId, objectName),
          transformUrl: constructTransformBaseUrl(bucketId, objectName),
          name: getNameFromObjectName(objectName),
          width,
          height,
          alt: row.media.alt ?? "",
          size: row.media.size,
          mimeType: row.media.mimeType,
          createdAt: row.media.createdAt,
          updatedAt: row.media.updatedAt,
        };
      }),
    );
});

export const listFiles = withZod(z.void(), async () => {
  const query = useQuery();

  const { object_id, actorId, locationId, status, type, ...selectFields } =
    getTableColumns(s.media);

  const rows = await query
    .select({
      ...selectFields,
    })
    .from(s.media)
    .where(
      and(
        isNull(s.media.deletedAt),
        isNull(s.media.locationId),
        eq(s.media.type, "file"),
        eq(s.media.status, "ready"),
      ),
    )
    .orderBy(asc(s.media.name));

  return rows;
});

export const createSignedUrl = withZod(
  z.object({
    id: z.string().uuid(),
    download: z.boolean().default(true),
  }),
  z.string().url(),
  async ({ id, download }) => {
    const query = useQuery();
    const supabase = useSupabaseClient();

    const mediaRow = await query
      .select({
        fileName: s.media.name,
        mimeType: s.media.mimeType,
        bucketId: uncontrolledSchema._objectTable.bucket_id,
        path: uncontrolledSchema._objectTable.name,
      })
      .from(s.media)
      .innerJoin(
        uncontrolledSchema._objectTable,
        eq(s.media.object_id, uncontrolledSchema._objectTable.id),
      )
      .where(
        and(
          isNull(s.media.deletedAt),
          eq(s.media.id, id),
          eq(s.media.status, "ready"),
        ),
      )
      .then(singleRow);

    assert(mediaRow.bucketId, "Bucket ID is required");
    assert(mediaRow.path, "Path is required");

    const fileNameWithExtension = `${mediaRow.fileName}.${
      mediaRow.mimeType?.split("/")[1]
    }`;

    const { data, error } = await supabase.storage
      .from(mediaRow.bucketId)
      .createSignedUrl(mediaRow.path, 60 * 5, {
        download: download ? fileNameWithExtension : false,
      });

    if (error) {
      throw error;
    }

    return data.signedUrl;
  },
);
