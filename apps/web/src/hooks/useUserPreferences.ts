import { useState } from "react";

export function useUserPreferences() {
  // Mock preferences
  const [preferences] = useState<string[]>(["Bio", "Ελληνικά προϊόντα"]);
  return preferences;
}
