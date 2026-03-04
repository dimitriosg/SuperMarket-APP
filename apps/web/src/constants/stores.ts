export const LOCATIONS = [
  { id: "all", name: "Όλη η Ελλάδα (Χωρίς Φίλτρο)" },
  { id: "attica", name: "Περιφέρεια Αττικής" },
  { id: "central_macedonia", name: "Περιφέρεια Κεντρικής Μακεδονίας (Θεσ/νίκη)" },
  { id: "thessaly", name: "Περιφέρεια Θεσσαλίας" },
  { id: "western_greece", name: "Περιφέρεια Δυτικής Ελλάδας" },
  { id: "peloponnese", name: "Περιφέρεια Πελοποννήσου" },
  { id: "crete", name: "Περιφέρεια Κρήτης" },
  { id: "eastern_macedonia_thrace", name: "Περιφέρεια Αν. Μακεδονίας & Θράκης" },
  { id: "epirus", name: "Περιφέρεια Ηπείρου" },
  { id: "western_macedonia", name: "Περιφέρεια Δυτικής Μακεδονίας" },
  { id: "central_greece", name: "Περιφέρεια Στερεάς Ελλάδας" },
  { id: "ionian", name: "Περιφέρεια Ιονίων Νήσων" },
  { id: "south_aegean", name: "Περιφέρεια Νοτίου Αιγαίου" },
  { id: "north_aegean", name: "Περιφέρεια Βορείου Αιγαίου" },
];

export const STORES_DATA = [
  {
    id: "sklavenitis",
    name: "Σκλαβενίτης",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/29/Sklavenitis_Logo_2018.png",
    regions: ["all"],
  },
  {
    id: "ab",
    name: "ΑΒ Βασιλόπουλος",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/f8/Alfa-Beta_Vassilopoulos_logo.svg",
    regions: ["all"],
  },
  {
    id: "lidl",
    name: "Lidl",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Lidl-Logo.svg/512px-Lidl-Logo.svg.png",
    regions: ["all"],
  },
  {
    id: "masoutis",
    name: "Μασούτης",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/23/Masoutis_logo.svg",
    regions: ["all"],
  },
  {
    id: "mymarket",
    name: "My Market",
    logo: "https://upload.wikimedia.org/wikipedia/el/1/15/My_Market_logo.svg",
    regions: ["all"],
  },
  {
    id: "galaxias",
    name: "Γαλαξίας",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Galaxias_Super_Markets_logo.png/320px-Galaxias_Super_Markets_logo.png",
    regions: ["all"],
  },
  {
    id: "kritikos",
    name: "Κρητικός",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/8d/Kritikos_logo.png",
    regions: ["all"],
  },
  {
    id: "marketin",
    name: "Market In",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Market_In_logo.png/320px-Market_In_logo.png",
    regions: ["all"],
  },
  {
    id: "bazaar",
    name: "Bazaar",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Bazaar.svg",
    regions: ["all"],
  },
  {
    id: "xalkiadakis",
    name: "Χαλκιαδάκης",
    logo: "https://www.xalkiadakis.gr/v2/img/xalkiadakis-logo-new.png",
    regions: ["crete"],
  },
  {
    id: "synka",
    name: "SYN.KA",
    logo: "https://www.synka-sm.gr/wp-content/uploads/2022/12/logo.png",
    regions: ["crete", "south_aegean", "ionian"],
  },
];

export const getStoreIdByName_OLD = (apiName: string) => {
  const clean = apiName.toUpperCase();
  const found = STORES_DATA.find((s) => clean.includes(s.name.toUpperCase()));
  return found ? found.id : "other";
};

export const getStoreIdByName = (apiName: string) => {
  if (!apiName) return "other";

  const clean = apiName.toUpperCase();
  const found = STORES_DATA.find((s) => s.name && clean.includes(s.name.toUpperCase()));
  return found ? found.id : "other";
};
