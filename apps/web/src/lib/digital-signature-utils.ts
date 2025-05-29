import { useSupabaseClient, withSupabaseClient } from "@nawadi/core";
import { supabaseConfig } from "./nwd";

/**
 * Utility functions for digital signature certificate management
 */

/**
 * Load a P12 certificate from file system
 * @param certificatePath - Path to the .p12 certificate file
 * @returns Buffer containing the certificate data
 */
export async function loadP12Certificate(
  certificatePath: string,
): Promise<ArrayBuffer> {
  return await withSupabaseClient(supabaseConfig, async () => {
    const file = await useSupabaseClient()
      .storage.from("private-assets")
      .download(certificatePath);

    if (file.error) {
      throw new Error(`Certificate file not found: ${certificatePath}`);
    }

    return file.data.arrayBuffer();
  });
}

/**
 * Create a digital signature configuration object
 * @param options - Signature configuration options
 * @returns Digital signature configuration for use with generatePDF
 */
export async function createDigitalSignatureConfig(options: {
  certificatePath: string;
  passphrase: string;
  reason?: string;
  location?: string;
  contactInfo?: string;
  name?: string;
}) {
  const certificate = await loadP12Certificate(options.certificatePath);

  return {
    certificate,
    passphrase: options.passphrase,
    reason: options.reason || "Diplomaverificatie",
    location: options.location || "Netherlands",
    contactInfo: options.contactInfo || "info@nationaalwatersportdiploma.nl",
    name: options.name || "Nationaal Watersportdiploma",
  };
}
