// apps/api/src/services/pricing.service.test.ts
import { describe, expect, test } from "bun:test";
import { PricingService } from "./pricing.service";
import { UnitType } from "@prisma/client";

describe("PricingService Logic", () => {
  
  // TEST PHASE 1: Unit Price
  test("Calculates correct unit price for ML -> L", () => {
    // Περίπτωση: Γάλα 500ml που κάνει 1.50€
    // Πρέπει να βγει 3.00€ το λίτρο
    const unitPrice = PricingService.calculateUnitPrice(1.50, 500, UnitType.ML);
    expect(unitPrice).toBe(3.00);
  });

  test("Calculates correct unit price for KG -> KG", () => {
    // Περίπτωση: Πατάτες 2kg που κάνουν 2.00€
    // Πρέπει να βγει 1.00€ το κιλό
    const unitPrice = PricingService.calculateUnitPrice(2.00, 2, UnitType.KG);
    expect(unitPrice).toBe(1.00);
  });

  // TEST PHASE 0: Anomaly Detection
  test("Detects anomaly when price drops 90%", () => {
    const oldPrices = [10, 10, 10]; // Μέση τιμή 10
    const newPrice = 1; // Νέα τιμή 1 (90% κάτω)
    
    const isAnomaly = PricingService.isPriceAnomaly(newPrice, oldPrices);
    expect(isAnomaly).toBe(true); // Πρέπει να βαρέσει καμπανάκι
  });

  test("Accepts normal price fluctuation", () => {
    const oldPrices = [10, 12, 11]; // Μέση τιμή ~11
    const newPrice = 9; // Μικρή πτώση
    
    const isAnomaly = PricingService.isPriceAnomaly(newPrice, oldPrices);
    expect(isAnomaly).toBe(false); // Όλα καλά
  });

  // TEST PARSER
  test("Parses quantity strings correctly", () => {
    expect(PricingService.parseQuantity("1.5 lt")).toEqual({ value: 1.5, unit: UnitType.L });
    expect(PricingService.parseQuantity("500 γρ")).toEqual({ value: 500, unit: UnitType.G });
    expect(PricingService.parseQuantity("Coca Cola")).toBeNull(); // Invalid string
  });
});