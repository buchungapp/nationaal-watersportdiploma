import { useSupabaseClient } from "../../contexts/index.js";

export function constructBaseUrl(bucketId: string, objectName: string) {
  const supabase = useSupabaseClient();

  const url = supabase.storage.from(bucketId).getPublicUrl(objectName)
    .data.publicUrl;

  return url;
}

export function constructTransformBaseUrl(
  bucketId: string,
  objectName: string,
) {
  const supabase = useSupabaseClient();

  const url = supabase.storage.from(bucketId).getPublicUrl(objectName, {
    transform: {},
  }).data.publicUrl;

  return url;
}

export function getNameFromObjectName(objectName: string) {
  return objectName.split("/").pop() ?? "";
}
