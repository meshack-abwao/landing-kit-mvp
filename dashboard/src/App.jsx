import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import Overview from './components/Dashboard/Overview';
import ProductList from './components/Dashboard/ProductList';
import OrdersTable from './components/Dashboard/OrdersTable';
import Settings from './components/Dashboard/Settings';
import Marketplace from './components/Dashboard/Marketplace';
import AddOnDetail from './components/Dashboard/AddOnDetail';
import TemplateShowcase from './components/Dashboard/TemplateShowcase';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="products" element={<ProductList />} />
              <Route path="orders" element={<OrdersTable />} />
              <Route path="marketplace" element={<Marketplace />} />
              <Route path="marketplace/:addonName" element={<AddOnDetail />} />
              <Route path="templates" element={<TemplateShowcase />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

const styles = {
  loading: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(255, 255, 255, 0.1)',
    borderTop: '4px solid #ff9f0a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

export default App;
