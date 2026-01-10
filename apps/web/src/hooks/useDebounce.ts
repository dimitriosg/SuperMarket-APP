import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Ορίζουμε ένα timer που θα ενημερώσει την τιμή μετά από 'delay' ms
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Αν η τιμή (value) αλλάξει πριν περάσει ο χρόνος (π.χ. ο χρήστης πάτησε κι άλλο πλήκτρο),
    // καθαρίζουμε τον προηγούμενο timer και ξεκινάμε νέο.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}