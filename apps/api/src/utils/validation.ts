export interface SuggestionsRequest {
  items: string[];
  budget?: number;
  preferences?: string[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateSuggestionsRequest(
  data: unknown
): { isValid: true } | { isValid: false; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    return { isValid: false, errors: [{ field: "body", message: "Invalid request body" }] };
  }

  const { items, budget, preferences } = data as Record<string, unknown>;

  // Validate items
  if (!Array.isArray(items)) {
    errors.push({ field: "items", message: "Items must be an array" });
  } else {
    if (items.length === 0) {
      errors.push({ field: "items", message: "Items array cannot be empty" });
    }
    if (items.length > 50) {
      errors.push({ field: "items", message: "Maximum 50 items allowed" });
    }
    items.forEach((item, idx) => {
      if (typeof item !== "string") {
        errors.push({ field: `items[${idx}]`, message: "Item must be a string" });
      } else if (item.length > 100) {
        errors.push({ field: `items[${idx}]`, message: "Item text max 100 characters" });
      }
    });
  }

  // Validate budget (optional)
  if (budget !== undefined) {
    if (typeof budget !== "number" || budget < 0 || budget > 1000) {
      errors.push({ field: "budget", message: "Budget must be 0-1000" });
    }
  }

  // Validate preferences (optional)
  if (preferences !== undefined) {
    if (!Array.isArray(preferences)) {
      errors.push({ field: "preferences", message: "Preferences must be an array" });
    } else {
      if (preferences.length > 5) {
        errors.push({ field: "preferences", message: "Maximum 5 preferences allowed" });
      }
      preferences.forEach((pref, idx) => {
        if (typeof pref !== "string") {
          errors.push({ field: `preferences[${idx}]`, message: "Preference must be a string" });
        }
      });
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return { isValid: true };
}
