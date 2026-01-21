import { z } from "zod";

export interface SuggestionsRequest {
  items: string[];
  budget?: number;
  preferences?: string[];
}

export class ValidationError extends Error {
  field: string;

  constructor(field: string, message: string) {
    super(message);
    this.field = field;
  }
}

const GREEK_ONLY_REGEX = /^[\p{Script=Greek}\s]+$/u;
const PROFANITY_LIST = ["fuck", "shit", "bitch", "asshole", "cunt", "μαλάκα", "μαλακα", "σκατά", "σκατα"];

const itemSchema = z
  .string()
  .trim()
  .min(1, { message: "Item cannot be empty" })
  .max(100, { message: "Item text max 100 characters" })
  .refine((value) => GREEK_ONLY_REGEX.test(value), {
    message: "Item must contain Greek characters only",
  });

const itemsSchema = z.array(itemSchema).superRefine((items, ctx) => {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    const normalized = item.trim().toLowerCase();
    if (seen.has(normalized)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Duplicate item",
        path: [index],
      });
    } else {
      seen.add(normalized);
    }
  });
});

const preferencesSchema = z
  .array(z.string().trim().min(1, { message: "Preference cannot be empty" }))
  .max(5, { message: "Maximum 5 preferences allowed" })
  .superRefine((preferences, ctx) => {
    preferences.forEach((preference, index) => {
      const normalized = preference.toLowerCase();
      const hasProfanity = PROFANITY_LIST.some((term) => normalized.includes(term));
      if (hasProfanity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Preference contains profanity",
          path: [index],
        });
      }
    });
  });

const suggestionsRequestSchema = z.object({
  items: itemsSchema,
  budget: z
    .number()
    .min(0, { message: "Budget must be 0-1000" })
    .max(1000, {
      message: "Budget must be 0-1000",
    })
    .optional(),
  preferences: preferencesSchema.optional(),
});

const formatIssuePath = (path: (string | number)[]) =>
  path.length > 0 ? path.join(".") : "body";

export function validateSuggestionsRequest(data: unknown): SuggestionsRequest {
  try {
    return suggestionsRequestSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issue = error.issues[0];
      throw new ValidationError(formatIssuePath(issue.path), issue.message);
    }
    throw error;
  }
}
