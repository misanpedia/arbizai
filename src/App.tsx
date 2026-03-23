import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Invest from "./pages/Invest";
import Investments from "./pages/Investments";
import Profile from "./pages/Profile";
import Team from "./pages/Team";
import Commissions from "./pages/Commissions";
import Rank from "./pages/Rank";
import History from "./pages/History";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminKYC from "./pages/admin/AdminKYC";
import AdminDeposits from "./pages/admin/AdminDeposits";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminProfitEngine from "./pages/admin/AdminProfitEngine";
import AdminWallets from "./pages/admin/AdminWallets";
import AdminReferral from "./pages/admin/AdminReferral";
import AdminReports from "./pages/admin/AdminReports";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminSecurity from "./pages/admin/AdminSecurity";
import AdminSystemMonitor from "./pages/admin/AdminSystemMonitor";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminManagement from "./pages/admin/AdminManagement";
import AdminDepositWallets from "./pages/admin/AdminDepositWallets";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminSpinControl from "./pages/admin/AdminSpinControl";
import AdminCheckinSettings from "./pages/admin/AdminCheckinSettings";
import AdminWithdrawalSettings from "./pages/admin/AdminWithdrawalSettings";
import AdminInvestments from "./pages/admin/AdminInvestments";
import KYCUpload from "./pages/KYCUpload";
import SpinWheel from "./pages/SpinWheel";
import DailyCheckin from "./pages/DailyCheckin";
import Education from "./pages/Education";
import CourseDetail from "./pages/education/CourseDetail";
import ArticleDetail from "./pages/education/ArticleDetail";
import Support from "./pages/Support";
import ArbizToken from "./pages/ArbizToken";
import Leaderboard from "./pages/Leaderboard";
import AboutUs from "./pages/AboutUs";
import ServerStatus from "./pages/ServerStatus";
import ContactUs from "./pages/ContactUs";
import HelpCenter from "./pages/HelpCenter";
import TermsOfService from "./pages/TermsOfService";
import AmlPolicy from "./pages/AmlPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import SecurityPage from "./pages/SecurityPage";
import Announcements from "./pages/Announcements";
import ProfitCalculator from "./pages/ProfitCalculator";
import ProfitHistory from "./pages/ProfitHistory";
import AdminLogin from "./pages/AdminLogin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <MaintenanceGuard>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/deposit" element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
            <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
            <Route path="/invest" element={<ProtectedRoute><Invest /></ProtectedRoute>} />
            <Route path="/investments" element={<ProtectedRoute><Investments /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
            <Route path="/commissions" element={<ProtectedRoute><Commissions /></ProtectedRoute>} />
            <Route path="/rank" element={<ProtectedRoute><Rank /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/kyc" element={<ProtectedRoute><KYCUpload /></ProtectedRoute>} />
            <Route path="/spin" element={<ProtectedRoute><SpinWheel /></ProtectedRoute>} />
            <Route path="/checkin" element={<ProtectedRoute><DailyCheckin /></ProtectedRoute>} />
            <Route path="/education" element={<ProtectedRoute><Education /></ProtectedRoute>} />
            <Route path="/education/course/:slug" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
            <Route path="/education/article/:slug" element={<ProtectedRoute><ArticleDetail /></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
            <Route path="/arbiz" element={<ProtectedRoute><ArbizToken /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
            <Route path="/calculator" element={<ProtectedRoute><ProfitCalculator /></ProtectedRoute>} />
            <Route path="/profit-history" element={<ProtectedRoute><ProfitHistory /></ProtectedRoute>} />
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/kyc" element={<AdminRoute><AdminKYC /></AdminRoute>} />
            <Route path="/admin/deposits" element={<AdminRoute><AdminDeposits /></AdminRoute>} />
            <Route path="/admin/deposit-wallets" element={<AdminRoute><AdminDepositWallets /></AdminRoute>} />
            <Route path="/admin/withdrawals" element={<AdminRoute><AdminWithdrawals /></AdminRoute>} />
            <Route path="/admin/plans" element={<AdminRoute><AdminPlans /></AdminRoute>} />
            <Route path="/admin/profit-engine" element={<AdminRoute><AdminProfitEngine /></AdminRoute>} />
            <Route path="/admin/wallets" element={<AdminRoute><AdminWallets /></AdminRoute>} />
            <Route path="/admin/referral" element={<AdminRoute><AdminReferral /></AdminRoute>} />
            <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
            <Route path="/admin/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
            <Route path="/admin/security" element={<AdminRoute><AdminSecurity /></AdminRoute>} />
            <Route path="/admin/system-monitor" element={<AdminRoute><AdminSystemMonitor /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
            <Route path="/admin/admin-management" element={<AdminRoute><AdminManagement /></AdminRoute>} />
            <Route path="/admin/announcements" element={<AdminRoute><AdminAnnouncements /></AdminRoute>} />
            <Route path="/admin/spin-control" element={<AdminRoute><AdminSpinControl /></AdminRoute>} />
            <Route path="/admin/checkin-settings" element={<AdminRoute><AdminCheckinSettings /></AdminRoute>} />
            <Route path="/admin/withdrawal-settings" element={<AdminRoute><AdminWithdrawalSettings /></AdminRoute>} />
            <Route path="/admin/investments" element={<AdminRoute><AdminInvestments /></AdminRoute>} />
            {/* Public Pages */}
            <Route path="/about" element={<AboutUs />} />
            <Route path="/server-status" element={<ServerStatus />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/aml" element={<AmlPolicy />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/security-info" element={<SecurityPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </MaintenanceGuard>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;