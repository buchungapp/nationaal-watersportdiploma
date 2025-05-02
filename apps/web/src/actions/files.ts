export const MAX_FILE_SIZE = 5_000_000;
export const ACCEPTED_IMAGE_TYPES = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "application/pdf": [".pdf"],
};

export function extractFileExtension(file: File) {
  const name = file.name;
  const lastDot = name.lastIndexOf(".");

  return name.substring(lastDot);
}
