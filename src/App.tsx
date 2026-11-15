import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Graficos from "./pages/Graficos.tsx";
import Home from "./pages/Home.tsx";
import Parlamentares from "./pages/Parlamentares.tsx";
import ParlamentarDetails from "./pages/ParlamentarDetails.tsx";
import ProjetosDeLei from "./pages/ProjetosDeLei.tsx";
import ProjetoDeLeiDetails from "./pages/ProjetoDeLeiDetails.tsx";
import SenadorDetails from "./pages/SenadorDetails.tsx";

const queryClient = new QueryClient();
const basename = import.meta.env.BASE_URL;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Index />} />
          <Route path="/graficos" element={<Graficos />} />
          <Route path="/parlamentares" element={<Parlamentares />} />
          <Route path="/parlamentares/:id" element={<ParlamentarDetails />} />
          <Route path="/parlamentares/senadores/:id" element={<SenadorDetails />} />
          <Route path="/projetos-de-lei" element={<ProjetosDeLei />} />
          <Route path="/projetos-de-lei/:id" element={<ProjetoDeLeiDetails />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
