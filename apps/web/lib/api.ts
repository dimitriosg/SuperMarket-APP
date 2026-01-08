// apps/web/lib/api.ts
export async function getProducts() {
  // Χρησιμοποιούμε την IP για να αποφύγουμε θέματα DNS/IPv6 του localhost
  const res = await fetch("http://127.0.0.1:3001/products", {
    cache: 'no-store' // Για να βλέπεις αμέσως τις αλλαγές στις δοκιμές
  });
  
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}