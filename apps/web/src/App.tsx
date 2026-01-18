import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { BasketAnalysisPage } from "./pages/BasketAnalysisPage";
import { ProductDetailsPage } from "./pages/ProductDetailsPage";
import { BasketProvider } from "./context/BasketContext";

function App() {
  return (
    <BasketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/analysis" element={<BasketAnalysisPage />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
        </Routes>
      </BrowserRouter>
    </BasketProvider>
  );
}

export default App;