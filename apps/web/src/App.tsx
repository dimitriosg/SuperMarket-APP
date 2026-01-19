import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { Index } from "./pages/Index";
import { BasketAnalysisPage } from "./pages/BasketAnalysisPage";
import { ProductDetailsPage } from "./pages/ProductDetailsPage";
import { ShoppingList } from "./pages/ShoppingList";
import { BasketProvider } from "./context/BasketContext";

function App() {
  return (
    <BasketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/analysis" element={<BasketAnalysisPage />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route path="/shopping-list" element={<ShoppingList />} />
        </Routes>
      </BrowserRouter>
    </BasketProvider>
  );
}

export default App;
