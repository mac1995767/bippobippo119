import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from 'react-redux';
import store from './redux/store';
import useScrollToTop from './hooks/useScrollToTop';
import MainPage from "./pages/MainPage";
import HospitalListPage from "./pages/HospitalListPage";
import HospitalDetailPage from "./pages/HospitalDetailPage";
import PharmaciesList from "./pages/PharmaciesList";
import Footer from "./components/Footer";
//import AdSense from "./components/AdSense"; // 광고는 허가 나면 부착 
import LoginPage from "./pages/LoginPage";
import LogoutPage from "./pages/LogoutPage";
import AdminRoute from "./components/AdminRoute";
import HospitalManagementPage from './pages/HospitalManagementPage';
import EmergencyGuidePage from './pages/guides/EmergencyGuidePage';
import NightCareGuidePage from './pages/guides/NightCareGuidePage';
import WeekendCareGuidePage from './pages/guides/WeekendCareGuidePage';
import EmergencyCarePage from './pages/guides/EmergencyCarePage';
import { useAuth } from './contexts/AuthContext';
import DashboardPage from './pages/admin/DashboardPage';
import CategoryManagementPage from './pages/admin/CategoryManagementPage';
import RegisterPage from './pages/RegisterPage';
import CommunityPage from './pages/CommunityPage';
import TermsAgreement from './components/auth/TermsAgreement';
import NavigationBar from './components/NavigationBar';
import CreateBoardPage from './pages/community/CreateBoardPage';
import BoardDetail from './pages/community/BoardDetail';
import NaverCallback from './components/NaverCallback';
import KakaoCallback from "./components/KakaoCallback";
import GoogleCallback from './components/GoogleCallback';
import ProfilePage from './pages/profile/ProfilePage';
import EditBoardPage from './pages/community/EditBoardPage';
import CategoryTypeManagementPage from './pages/admin/CategoryTypeManagementPage';
import NursingHospitalList from './components/NursingHospitalList';
import NursingHospitalDetailPage from "./pages/nursing/NursingHospitalDetailPage";
import NursingHospitalReviewPage from "./pages/nursing/NursingHospitalReviewPage";
import AboutPage from './components/AboutPage';
import HealthCenterList from './components/HealthCenterList';
import AnnouncementBanner from './components/AnnouncementBanner';
import AnnouncementManagementPage from './pages/admin/AnnouncementManagementPage';
import { AnnouncementProvider } from './contexts/AnnouncementContext';
import MapPage from './components/MapPage';

const AppContent = () => {
  const { isLoggedIn, userRole, handleLogout } = useAuth();
  useScrollToTop();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AnnouncementProvider>
        <AnnouncementBanner />
        <NavigationBar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
        <Routes>
          <Route path="/map" element={<MapPage />} />
          <Route path="*" element={
            <>
              <div className="container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<MainPage isLoggedIn={isLoggedIn} userRole={userRole} />} />
                  <Route path="/hospitals" element={<HospitalListPage />} />
                  <Route path="/hospital/details/:id" element={<HospitalDetailPage />} />
                  <Route path="/pharmacies" element={<PharmaciesList />} />
                  <Route path="/nursing-hospitals" element={<NursingHospitalList />} />
                  <Route path="/nursing-hospitals/:id" element={<NursingHospitalDetailPage />} />
                  <Route path="/nursing-hospitals/:id/reviews" element={<NursingHospitalReviewPage />} />
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/dashboard" element={<AdminRoute><DashboardPage /></AdminRoute>} />
                  <Route path="/admin/hospitals" element={<AdminRoute><HospitalManagementPage /></AdminRoute>} />
                  <Route path="/admin/categories" element={<AdminRoute><CategoryManagementPage /></AdminRoute>} />
                  <Route path="/admin/category-types" element={<AdminRoute><CategoryTypeManagementPage /></AdminRoute>} />
                  <Route path="/admin/announcements" element={<AdminRoute><AnnouncementManagementPage /></AdminRoute>} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/logout" element={<LogoutPage />} />
                  <Route path="/guides/emergency" element={<EmergencyGuidePage />} />
                  <Route path="/guides/night-care" element={<NightCareGuidePage />} />
                  <Route path="/guides/weekend-care" element={<WeekendCareGuidePage />} />
                  <Route path="/guides/emergency-care" element={<EmergencyCarePage />} />
                  <Route path="/terms" element={<TermsAgreement />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/community" element={<CommunityPage />} />
                  <Route path="/community/category/:categoryId" element={<CommunityPage />} />
                  <Route path="/community/create" element={<CreateBoardPage />} />
                  <Route path="/community/create/:categoryId" element={<CreateBoardPage />} />
                  <Route path="/community/boards/:id" element={<BoardDetail />} />
                  <Route path="/community/boards/edit/:id" element={<EditBoardPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/auth/naver/callback" element={<NaverCallback />} />
                  <Route path="/auth/google/callback" element={<GoogleCallback />} />
                  <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/health-centers" element={<HealthCenterList />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
              <Footer />
            </>
          } />
        </Routes>
      </AnnouncementProvider>
    </div>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <Router>
        <AnnouncementProvider>
          <AppContent />
        </AnnouncementProvider>
      </Router>
    </Provider>
  );
};

export default App;
