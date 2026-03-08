import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

/* ================= PAGES ================= */
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

/* Auth */
import UserLogin from "./pages/auth/UserLogin";
import UserRegister from "./pages/auth/UserRegister";
import AdminLogin from "./pages/auth/AdminLogin";
import AdminRegister from "./pages/auth/AdminRegister";

/* User */
import UserDashboard from "./pages/user/Dashboard";
import MyVehicles from "./pages/user/MyVehicles";
import UserBookings from "./pages/user/Bookings";
import TransactionsPage from "./pages/user/TransactionsPage";
import WalletPage from "./pages/user/Wallet";
import SlotSelectionPage from "./pages/user/SlotSelection";
import PaymentPage from "./pages/user/Payment";
import TicketPage from "./pages/user/TicketPage";
import ProfileSettingsPage from "./pages/user/ProfileSettings";
import QRScanResult from "./pages/user/QRScanResult";

/* Admin */
import AdminDashboard from "./pages/admin/Dashboard";
import AdminStationPage from "./pages/admin/Station";
import StationManage from "./pages/admin/StationManage";
import AdminSlotPage from "./pages/admin/Slot";
import AdminUsersPage from "./pages/admin/Users";
import AdminWalletPage from "./pages/admin/Wallet";

/* Layout */
import DashboardLayout from "@/components/layout/DashboardLayout";

/* Components */
import FloatingChatbot from "@/components/FloatingChatbot";

/* ================= SETUP ================= */
const queryClient = new QueryClient();

/* User Layout Wrapper with Chatbot */
const UserLayoutWrapper = () => {
  return (
    <>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
      <FloatingChatbot />
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <Routes>

            {/* ================= PUBLIC ================= */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<UserLogin />} />
            <Route path="/register" element={<UserRegister />} />

            {/* ================= USER DASHBOARD ================= */}
            <Route
              path="/dashboard"
              element={<UserLayoutWrapper />}
            >
              <Route index element={<UserDashboard />} />
              <Route path="vehicles" element={<MyVehicles />} />
              <Route path="bookings" element={<UserBookings />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="wallet" element={<WalletPage />} />
            </Route>

            {/* ================= PROFILE SETTINGS (SEPARATE LAYOUT) ================= */}
            <Route path="/profile" element={<ProfileSettingsPage />} />

            {/* ================= BOOKING FLOW (NO DASHBOARD LAYOUT) ================= */}
            <Route path="/booking/:stationId/slots" element={<SlotSelectionPage />} />
            <Route path="/booking/payment" element={<PaymentPage />} />
            <Route path="/booking/ticket/:bookingId" element={<TicketPage />} />
            <Route path="/scan" element={<QRScanResult />} />

            {/* ================= ADMIN ================= */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<AdminRegister />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/stations" element={<AdminStationPage />} />
            <Route
              path="/admin/stations/:stationId/manage"
              element={<StationManage />}
            />
            <Route path="/admin/slots" element={<AdminSlotPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/vehicles" element={<AdminUsersPage />} />
            <Route path="/admin/wallet" element={<AdminWalletPage />} />

            {/* ================= FALLBACK ================= */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
