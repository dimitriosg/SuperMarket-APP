# 🛒 MarketWise

> Ο έξυπνος βοηθός για τα ψώνια σου στο Σούπερ Μάρκετ. Σύγκρινε τιμές, δες ιστορικό και γλίτωσε χρήματα με έξυπνες στρατηγικές αγορών.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 📖 Περιγραφή

Το **MarketWise** είναι μια modern web εφαρμογή που βοηθά τους καταναλωτές στην Ελλάδα να βελτιστοποιήσουν το καλάθι του σούπερ μάρκετ. Σε αντίθεση με τις απλές συγκρίσεις προϊόντων, το MarketWise αναλύει **ολόκληρο το καλάθι αγορών** και προτείνει στρατηγικές (αγορά από ένα κατάστημα vs συνδυαστική αγορά) λαμβάνοντας υπόψη τη γεωγραφική θέση του χρήστη.

## ✨ Βασικές Λειτουργίες

### 🔍 Αναζήτηση & Πλοήγηση
- **Live Smart Search:** Άμεση αναζήτηση με debouncing, tokenization και διατήρηση ιστορικού αναζήτησης (session persistence).
- **Location Filtering:** Φιλτράρισμα καταστημάτων βάσει των 13 Περιφερειών της Ελλάδας (π.χ. εμφάνιση "Χαλκιδάκης" μόνο στην Κρήτη).
- **Store Filtering:** Δυνατότητα ενεργοποίησης/απενεργοποίησης συγκεκριμένων αλυσίδων από τα αποτελέσματα.

### 🧺 Έξυπνο Καλάθι & Στρατηγική
- **Split Strategy Analysis:**
  - **Σενάριο Α (Ευκολία):** Το φθηνότερο κατάστημα για να τα πάρεις όλα από ένα μέρος.
  - **Σενάριο Β (Οικονομία):** Mix & Match αγορές από διαφορετικά καταστήματα για τη βέλτιστη τιμή.
- **Persistent Basket:** Το καλάθι αποθηκεύεται αυτόματα και διατηρείται (Local Storage).
- **Pinned Sidebar:** Εύχρηστο πλαϊνό μενού σε μεγάλες οθόνες.

### 🛡️ Διαφάνεια & Ιστορικό
- **Price Freshness UX:** Ενδείξεις "φρεσκάδας" τιμής (π.χ. "Πριν 2 ώρες", "Χθες").
- **Stale Price Warning:** Αυτόματη ανίχνευση και προειδοποίηση στο καλάθι αν επιλεγεί κατάστημα με τιμές παλαιότερες των 7 ημερών.
- **Ιστορικό Τιμών:** Γράφημα πορείας τιμής 30 ημερών στη σελίδα λεπτομερειών προϊόντος.
- **Full Offers List:** Εμφάνιση όλων των διαθέσιμων προσφορών για κάθε προϊόν, όχι μόνο των φθηνότερων.

---

## 🛠️ Τεχνολογίες

Το project είναι στημένο ως **Monorepo** (Turborepo structure):

### Frontend (`apps/web`)
- **React 18** (Vite)
- **TypeScript**
- **Tailwind CSS** (Styling & Responsive Design)
- **Recharts** (Data Visualization)
- **React Router DOM v6** (Navigation)
- **Context API** (Global State Management)

### Backend (`apps/api`)
- **Runtime:** Bun
- **Framework:** ElysiaJS
- **ORM:** Prisma

### Database (`packages/db`)
- **PostgreSQL**
- **Prisma Schema** (με μοντέλα για Product, Price, Store, PriceHistory)

---

## 🚀 Εγκατάσταση & Εκτέλεση

### Προαπαιτούμενα
- [Bun](https://bun.sh/) (ή Node.js v18+)
- PostgreSQL (Τοπικά ή Docker)

### 1. Κλωνοποίηση Repository
```bash
git clone [https://github.com/your-username/marketwise.git](https://github.com/your-username/marketwise.git)
cd marketwise
```

### 2. Εγκατάσταση Εξαρτήσεων
```bash
bun install
```

### 3. Ρύθμιση Περιβάλλοντος (.env)
Δημιουργήστε τα αρχεία .env:

Στο apps/web/.env:
```bash
VITE_API_URL=http://localhost:3001
```

Στο packages/db/.env:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/supermarket?schema=public"
```

### 4. Βάση Δεδομένων (Prisma)
Συγχρονισμός του schema με τη βάση:
```bash
cd packages/db
bun prisma db push
```

### 5. Εκτέλεση (Development)
Μπορείτε να τρέξετε Frontend και Backend ταυτόχρονα ή ξεχωριστά.

**Backend:**
```bash
cd apps/api
bun run dev
# Server running at: http://localhost:3001
```

**Frontend:**
```bash
cd apps/web
bun run dev
# App running at: http://localhost:5173
```

🤝 Συνεισφορά
Κάντε Fork το project.

Δημιουργήστε Feature Branch (git checkout -b feature/NewFeature).

Κάντε Commit (git commit -m 'Add NewFeature').

Κάντε Push (git push origin feature/NewFeature).

Ανοίξτε Pull Request.

📄 Άδεια
Διανέμεται υπό την άδεια MIT. Δείτε το αρχείο LICENSE για περισσότερες πληροφορίες.

Created with ❤️ by Dimitris Zeus
