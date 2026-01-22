import { LOCATIONS, STORES_DATA } from "../../services/api";
import { ProductResult } from "../../types";
import { ProductUI, RegionUI, StoreUI } from "./types";

type ProductRow = ProductResult & {
  nameEn?: string;
  category?: string;
  unit?: string;
};

const DEFAULT_CATEGORY = "Λοιπά";

export const toProductUI = (row: ProductRow): ProductUI => ({
  id: row.id,
  name: row.name,
  nameEn: row.nameEn,
  category: row.category || DEFAULT_CATEGORY,
  unit: row.unit
});

export const toStoreUI = (row: (typeof STORES_DATA)[number]): StoreUI => ({
  id: row.id,
  name: row.name
});

export const toRegionUI = (row: (typeof LOCATIONS)[number]): RegionUI => ({
  id: row.id,
  name: row.name
});

export type ProductDataRow = ProductRow;
