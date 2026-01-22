import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { Index } from "./pages/Index";
import { BasketAnalysisPage } from "./pages/BasketAnalysisPage";
import { ProductDetailsPage } from "./pages/ProductDetailsPage";
import { ShoppingList } from "./pages/ShoppingList";
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/analysis" element={<BasketAnalysisPage />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route path="/shopping-list" element={<ShoppingList />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
