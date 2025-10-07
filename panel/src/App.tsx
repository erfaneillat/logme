import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import PlansPage from './pages/PlansPage';

const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ProtectedRoute>
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/plans" element={<PlansPage />} />
                    </Routes>
                </ProtectedRoute>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;

