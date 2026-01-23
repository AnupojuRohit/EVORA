import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route , Outlet} from "react-router-dom";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UserLogin from "./pages/auth/UserLogin";
import UserRegister from "./pages/auth/UserRegister";
import AdminLogin from "./pages/auth/AdminLogin";
import AdminRegister from "./pages/auth/AdminRegister";
import UserDashboard from "./pages/user/Dashboard";
import UserBookings from "./pages/user/Bookings";
import AdminDashboard from "./pages/admin/Dashboard";
import MyVehicles from './pages/user/MyVehicles';
import SlotSelectionPage from "@/pages/user/SlotSelection";
import PaymentPage from "@/pages/user/Payment"
import TicketPage from "@/pages/user/TicketPage"
import TransactionsPage from "@/pages/user/TransactionsPage"
import DashboardLayout  from "@/components/layout/DashboardLayout";
import AdminStationPage from "./pages/admin/Station";
import AdminSlotPage from "./pages/admin/Slot";
import StationManage from "./pages/admin/StationManage";
// import ProfilePage from "./pages/user/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          
          {/* User Auth */}
          <Route path="/login" element={<UserLogin />} />
          <Route path="/register" element={<UserRegister />} />
          <Route path="/user/vehicles" element={<MyVehicles />} />
          
            <Route
              path="/booking/:stationId/slots"
              element={<SlotSelectionPage />}
            />

            <Route
              path="/booking/payment"
              element={<PaymentPage />}
            />
            <Route
              path="/booking/ticket/:bookingId"
              element={<TicketPage />}
            />
          
          <Route
              path="/dashboard"
              element={
                <DashboardLayout userType="user">
                  <Outlet />
                </DashboardLayout>
              }
            >
              <Route index element={<UserDashboard />} />
              <Route path="transactions" element={<TransactionsPage />} />
              {/* Settings route removed */}
            </Route>
          
          

          {/* Admin Auth */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/register" element={<AdminRegister />} />
          
          {/* User Dashboard */}
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/dashboard/cars" element={<UserDashboard />} />
          <Route path="/dashboard/bookings" element={<UserBookings />} />
          {/* <Route path="/dashboard/settings" element={<UserDashboard />} /> */}
          
          {/* Admin Dashboard */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/stations" element={<AdminStationPage />} />
          <Route path="/admin/stations/:stationId/manage" element={<StationManage />} />
          <Route path="/admin/slots" element={<AdminSlotPage />} />
          {/* <Route path="/admin/settings" element={<AdminDashboard />} /> */}
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
