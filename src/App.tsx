import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppLayout } from "@/components/AppLayout";
import LedgerHome from "./pages/LedgerHome";
import NarrativePage from "./pages/NarrativePage";
import Explorer from "./components/explorer/Explorer";
import GDPAnalysis from "./pages/GDPAnalysis";
import SectoralView from "./pages/SectoralView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<LedgerHome />} />
              <Route path="/narrative" element={<NarrativePage />} />
              <Route path="/dashboard" element={<Explorer />} />
              <Route path="/gdp" element={<GDPAnalysis />} />
              <Route path="/sectors" element={<SectoralView />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
