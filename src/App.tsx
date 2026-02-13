import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import GenerateCard from "./pages/GenerateCard";
import VerifyMember from "./pages/VerifyMember";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import TemplateDesigner from "./pages/TemplateDesigner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/generate-card" element={<GenerateCard />} />
          <Route path="/verify-member" element={<VerifyMember />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/template-designer" element={<TemplateDesigner />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
