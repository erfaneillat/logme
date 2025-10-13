import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import PlansPage from './pages/PlansPage';
import UsersPage from './pages/UsersPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import AnalyticsPage from './pages/AnalyticsPage';

const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ProtectedRoute>
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/analytics" element={<AnalyticsPage />} />
                        <Route path="/plans" element={<PlansPage />} />
                        <Route path="/users" element={<UsersPage />} />
                        <Route path="/subscriptions" element={<SubscriptionsPage />} />
                    </Routes>
                </ProtectedRoute>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;

