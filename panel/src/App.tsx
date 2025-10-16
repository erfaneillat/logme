import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import PlansPage from './pages/PlansPage';
import OffersPage from './pages/OffersPage';
import UsersPage from './pages/UsersPage';
import UserDetailPage from './pages/UserDetailPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LogsPage from './pages/LogsPage';
import AppVersionsPage from './pages/AppVersionsPage';
import TicketsPage from './pages/TicketsPage';

const App = () => {
    return (
        <BrowserRouter basename="/panel">
            <AuthProvider>
                <ProtectedRoute>
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/analytics" element={<AnalyticsPage />} />
                        <Route path="/logs" element={<LogsPage />} />
                        <Route path="/plans" element={<PlansPage />} />
                        <Route path="/offers" element={<OffersPage />} />
                        <Route path="/users" element={<UsersPage />} />
                        <Route path="/users/:userId" element={<UserDetailPage />} />
                        <Route path="/subscriptions" element={<SubscriptionsPage />} />
                        <Route path="/app-versions" element={<AppVersionsPage />} />
                        <Route path="/tickets" element={<TicketsPage />} />
                    </Routes>
                </ProtectedRoute>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;

