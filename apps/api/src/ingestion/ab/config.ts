// apps/api/src/ingestion/ab/config.ts

export const AB_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "el-GR,el;q=0.9,en-US;q=0.8,en;q=0.7",
  "cookie": process.env.AB_COOKIE || "",
  "x-csrf-token": process.env.AB_CSRF || "", // Αν το βρεις στα headers του browser
  "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "Referer": "https://www.ab.gr/el/search?q=:relevance:category:007",
  "Origin": "https://www.ab.gr",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin"
};

export const AB_CATEGORIES = [
  { id: "001", name: "Οπωροπωλείο" },
  { id: "002", name: "Κρέας & Ψάρι" },
  { id: "007", name: "Τυποποιημένα Τρόφιμα" },
  { id: "011", name: "Καθαριστικά" }
];