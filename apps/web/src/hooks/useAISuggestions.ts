import { useState } from 'react';

export interface Suggestion {
  id: string;
  name: string;
  category: string;
  price: number;
  rationale: string;
}

export interface AISuggestionsResponse {
  suggestions: Suggestion[];
  metadata: {
    model: string;
    latency_ms: number;
    aiTimeout: boolean;
  };
  error?: string;
  fallback_suggestions?: Suggestion[];
}

export const useAISuggestions = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<AISuggestionsResponse['metadata'] | null>(null);

  const fetchSuggestions = async (items: string[], budget?: number, preferences?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items, budget, preferences }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch suggestions');
      }

      setSuggestions(data.suggestions || []);
      setMetadata(data.metadata);
      
      if (data.error) {
        // Handle partial error with fallback
        setError(data.error);
      }

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  return { suggestions, loading, error, metadata, fetchSuggestions };
};
