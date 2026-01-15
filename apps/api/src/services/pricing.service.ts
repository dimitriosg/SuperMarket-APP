import { UnitType } from '@prisma/client';

export class PricingService {
  
  // Regex Patterns (ίδια με το script, αλλά τώρα μέσα στο app)
  private static PATTERNS = [
    { unit: UnitType.ML, regex: /(\d+(?:[.,]\d+)?)\s*(?:ml|μλ|mlit)/i },
    { unit: UnitType.L, regex: /(\d+(?:[.,]\d+)?)\s*(?:lt|l|λίτρα|λιτρα)/i },
    { unit: UnitType.G, regex: /(\d+(?:[.,]\d+)?)\s*(?:gr|g|γρ|γραμμάρια)/i },
    { unit: UnitType.KG, regex: /(\d+(?:[.,]\d+)?)\s*(?:kg|k|κιλά|κιλό)/i },
    { unit: UnitType.ITEM, regex: /(\d+)\s*(?:tem|tm|τεμ|τμχ)/i },
  ];

  /**
   * Helper: Μετατρέπει string (π.χ. "500ml") σε { value: 500, unit: 'ML' }
   */
  static parseQuantity(rawQuantity: string | null): { value: number, unit: UnitType } | null {
    if (!rawQuantity) return null;
    
    const qtyString = rawQuantity.toLowerCase().replace(',', '.');

    for (const pattern of this.PATTERNS) {
      const match = qtyString.match(pattern.regex);
      if (match) {
        return {
          value: parseFloat(match[1]),
          unit: pattern.unit
        };
      }
    }
    return null;
  }

  /**
   * PHASE 1: Unit Price Calculation
   */
  static calculateUnitPrice(price: number, quantity: number, unit: UnitType): number | null {
    if (!quantity || quantity === 0) return null;

    let normalizedQuantity = quantity;

    // Μετατροπή σε L ή KG για τον υπολογισμό
    if (unit === UnitType.G || unit === UnitType.ML) {
      normalizedQuantity = quantity / 1000;
    }

    return parseFloat((price / normalizedQuantity).toFixed(2));
  }

  /**
   * PHASE 0: Anomaly Detection
   */
  static isPriceAnomaly(newPrice: number, historicalPrices: number[]): boolean {
    if (historicalPrices.length === 0) return false;

    const sum = historicalPrices.reduce((a, b) => a + b, 0);
    const average = sum / historicalPrices.length;

    if (average === 0) return false;

    const difference = Math.abs(newPrice - average);
    const percentageChange = (difference / average) * 100;
    const THRESHOLD_PERCENTAGE = 50;

    return percentageChange > THRESHOLD_PERCENTAGE;
  }
}