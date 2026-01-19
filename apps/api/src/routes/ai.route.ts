import { Elysia, t } from 'elysia';
import { generateSuggestions } from '../services/ai.service';

export const aiRoutes = new Elysia({ prefix: '/ai' })
  .post('/suggestions', async ({ body, set }) => {
    const { items, budget, preferences } = body;
    
    // Κλήση του service που είδαμε στο προηγούμενο αρχείο
    const result = await generateSuggestions(
      { items, budget, preferences },
      process.env.OPENAI_API_KEY
    );

    if (result.error) {
      // Αν έχουμε timeout ή σφάλμα, επιστρέφουμε τα fallback με 200 (soft failure)
      // ή 500 ανάλογα με τη στρατηγική σου. Εδώ ακολουθούμε το "graceful fallback".
      return {
        ...result.error,
        metadata: result.metadata
      };
    }

    return {
      suggestions: result.data?.suggestions,
      metadata: result.metadata
    };
  }, {
    body: t.Object({
      items: t.Array(t.String()),
      budget: t.Optional(t.Number()),
      preferences: t.Optional(t.Array(t.String()))
    })
  });