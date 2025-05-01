import { z } from "zod";

export const CONFIRMATION_WORD = "begrepen";

export const confirmWordSchema = z.literal(CONFIRMATION_WORD);
