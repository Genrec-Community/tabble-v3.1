import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Theme system (single source of truth for dark/light styling)
import { getTheme } from './theme';
import { ThemeModeProvider, useThemeMode } from './themeMode';

// Store and Query Client
import { store } from './store';
import { queryClient } from './services/queryClient';

// Error Boundary
import ErrorBoundary from './components/ErrorBoundary';
import ChunkLoadErrorBoundary from './components/ChunkLoadErrorBoundary';
import GlobalSnackbar from './components/GlobalSnackbar';
import LoadingSpinner, { PageLoadingSpinner } from './components/LoadingSpinner';

// Authentication Wrapper
import AuthWrapper from './components/AuthWrapper';

// Layouts (not lazy loaded as they're used frequently)
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ChefLayout from './components/ChefLayout';

// Dynamic public path configuration for chunk loading
const configurePublicPath = () => {
  const currentPath = window.location.pathname;
  const publicUrl = process.env.PUBLIC_URL || 'http://0.0.0.0:8001';

  // If we're in production and chunks are failing to load from /admin path
  if (process.env.NODE_ENV === 'production' && currentPath.includes('/admin')) {
    // Set webpack public path dynamically
    if (window.__webpack_public_path__ !== undefined) {
      window.__webpack_public_path__ = '/admin/';
      console.log('🔧 DEBUG: Set webpack public path to:', window.__webpack_public_path__);
    }
  }

  console.log('🔧 DEBUG: Public path configuration:', {
    currentPath,
    publicUrl,
    webpackPublicPath: window.__webpack_public_path__,
    timestamp: new Date().toISOString()
  });
};

// Configure public path on app start
configurePublicPath();

// Add chunk loading error handling with better recovery
window.addEventListener('error', (event) => {
  if (event.error && event.error.name === 'ChunkLoadError') {
    console.error('🚨 CHUNK LOAD ERROR:', event.error);
    console.error('Failed to load chunk:', event.filename);

    // Try to fix the path if it's a known issue
    if (event.filename && event.filename.includes('/admin/static/js/')) {
      console.log('🔧 DEBUG: Attempting to fix chunk path...');
      // The chunk error handling will be managed by the lazyLoadWithRetry function
    } else {
      // For other chunk errors, force a page reload
      setTimeout(() => window.location.reload(), 1000);
    }
  }
});

// Handle unhandled promise rejections for chunk loading
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.name === 'ChunkLoadError') {
    console.error('🚨 UNHANDLED CHUNK LOAD ERROR:', event.reason);
    // Let the lazyLoadWithRetry handle this
  }
});

// Dynamic public path configuration for chunk loading

// Lazy load pages for code splitting with error handling
const lazyLoadWithRetry = (importFunc, retries = 3) => {
  return new Promise((resolve, reject) => {
    importFunc()
      .then(resolve)
      .catch((error) => {
        if (retries > 0 && error.name === 'ChunkLoadError') {
          console.warn(`🔄 Retrying chunk load (${retries} attempts left)...`, error);

          // If we're in production and the error suggests wrong path, try to fix it
          if (process.env.NODE_ENV === 'production' && window.location.pathname.includes('/admin')) {
            console.log('🔧 DEBUG: Attempting path correction for chunk loading...');

            // Force webpack to use the correct public path
            if (window.__webpack_public_path__ !== '/admin/') {
              window.__webpack_public_path__ = '/admin/';
              console.log('✅ DEBUG: Updated webpack public path to:', window.__webpack_public_path__);
            }
          }

          setTimeout(() => {
            lazyLoadWithRetry(importFunc, retries - 1).then(resolve).catch(reject);
          }, 1000);
        } else {
          reject(error);
        }
      });
  });
};

const Home = lazy(() => lazyLoadWithRetry(() => import('./pages/Home')));
const ChefDashboard = lazy(() => lazyLoadWithRetry(() => import('./pages/chef/Dashboard')));
const ChefOrders = lazy(() => lazyLoadWithRetry(() => import('./pages/chef/Orders')));
const ChefLogin = lazy(() => lazyLoadWithRetry(() => import('./pages/chef/Login')));
const CustomerLogin = lazy(() => lazyLoadWithRetry(() => import('./pages/customer/Login')));
const CustomerMenu = lazy(() => lazyLoadWithRetry(() => import('./pages/customer/Menu')));
const CustomerHome = lazy(() => lazyLoadWithRetry(() => import('./pages/customer/Home')));
const CustomerHistory = lazy(() => lazyLoadWithRetry(() => import('./pages/customer/History')));
const QRLanding = lazy(() => lazyLoadWithRetry(() => import('./pages/customer/QRLanding')));
const AdminLogin = lazy(() => lazyLoadWithRetry(() => import('./pages/admin/Login')));
const AdminDashboard = lazy(() => lazyLoadWithRetry(() => import('./pages/admin/Dashboard')));
const AdminDishes = lazy(() => lazyLoadWithRetry(() => import('./pages/admin/Dishes')));
const AdminOffers = lazy(() => lazyLoadWithRetry(() => import('./pages/admin/Offers')));
const AdminSpecials = lazy(() => lazyLoadWithRetry(() => import('./pages/admin/Specials')));
const CompletedOrders = lazy(() => lazyLoadWithRetry(() => import('./pages/admin/CompletedOrders')));
const LoyaltyProgram = lazy(() => lazyLoadWithRetry(() => import('./pages/admin/LoyaltyProgram')));
const SelectionOffers = lazy(() => lazyLoadWithRetry(() => import('./pages/admin/SelectionOffers')));
const TableManagement = lazy(() => lazyLoadWithRetry(() => import('./pages/admin/TableManagement')));
const AdminSettings = lazy(() => lazyLoadWithRetry(() => import('./pages/admin/Settings')));
const ChefsManagement = lazy(() => lazyLoadWithRetry(() => import('./pages/admin/Chefs')));
const SuperAdmin = lazy(() => lazyLoadWithRetry(() => import('./pages/admin/SuperAdmin')));

// Analysis Pages (lazy loaded)
const AnalysisDashboard = lazy(() => lazyLoadWithRetry(() => import('./pages/analysis/Dashboard')));
const CustomerAnalysis = lazy(() => lazyLoadWithRetry(() => import('./pages/analysis/CustomerAnalysis')));
const DishAnalysis = lazy(() => lazyLoadWithRetry(() => import('./pages/analysis/DishAnalysis')));
const ChefAnalysis = lazy(() => lazyLoadWithRetry(() => import('./pages/analysis/ChefAnalysis')));

// System monitoring components (lazy loaded)
const PerformanceMonitor = lazy(() => lazyLoadWithRetry(() => import('./components/PerformanceMonitor')));
const SystemDiagnostics = lazy(() => lazyLoadWithRetry(() => import('./components/SystemDiagnostics')));

// Fallback component for when chunks fail to load
const ChunkErrorFallback = ({ componentName }) => (
  <div style={{
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#121212',
    color: '#FFFFFF',
    border: '1px solid #FFA500',
    borderRadius: '8px',
    margin: '20px'
  }}>
    <h3 style={{ color: '#FFA500', marginBottom: '10px' }}>
      Component Loading Error
    </h3>
    <p style={{ marginBottom: '15px' }}>
      Failed to load {componentName}. This might be due to a network issue.
    </p>
    <button
      onClick={() => window.location.reload()}
      style={{
        backgroundColor: '#FFA500',
        color: '#000000',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold'
      }}
    >
      Reload Page
    </button>
  </div>
);

// ThemedApp uses the mode from ThemeModeProvider and rebuilds the theme reactively
const ThemedApp = ({ children }) => {
  const { mode } = useThemeMode();
  const theme = React.useMemo(() => getTheme(mode), [mode]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

function App() {
  console.log('🚀 DEBUG: App component mounting', {
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    baseUrl: process.env.REACT_APP_API_BASE_URL,
    publicUrl: process.env.PUBLIC_URL,
    currentPath: window.location.pathname,
    webpackPublicPath: window.__webpack_public_path__
  });

  // Add additional chunk error recovery
  const handleChunkError = (error) => {
    console.error('🚨 CHUNK ERROR RECOVERY:', error);

    // If we're in the /admin path and chunks are failing, try alternative approaches
    if (window.location.pathname.startsWith('/admin')) {
      console.log('🔧 DEBUG: Detected /admin path, attempting recovery...');

      // Try to reload from root if chunks are missing
      const chunkUrl = error?.filename || '';
      if (chunkUrl.includes('/admin/static/js/')) {
        console.log('🔄 DEBUG: Attempting to load chunk from root path...');
        // This will be handled by the lazyLoadWithRetry function
      }
    }
  };

  // Set up global chunk error handler
  window.handleChunkError = handleChunkError;

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
          <ThemeModeProvider>
            <ThemedApp>
            <GlobalSnackbar />
            <ChunkLoadErrorBoundary>
            <Router>
              <Suspense fallback={
                <PageLoadingSpinner message="Loading application components..." />
              }>
                <ErrorBoundary fallback={<ChunkErrorFallback componentName="Application Routes" />}>
                  <Routes>
                    {/* Standalone login pages — no layout, no auth */}
                    <Route path="/admin/login" element={<ErrorBoundary><AdminLogin /></ErrorBoundary>} />
                    <Route path="/chef/login" element={<ErrorBoundary><ChefLogin /></ErrorBoundary>} />

                    {/* Super Admin — standalone with own auth */}
                    <Route path="/adminofthetabble" element={<ErrorBoundary><SuperAdmin /></ErrorBoundary>} />

                    {/* QR scan landing — no layout wrapper, no auth */}
                    <Route
                      path="/order"
                      element={
                        <ErrorBoundary>
                          <QRLanding />
                        </ErrorBoundary>
                      }
                    />

                    {/* Home — standalone, full-bleed background */}
                    <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />

                    {/* Chef Layout Routes — Firebase auth guard inside ChefLayout */}
                    <Route element={<ChefLayout />}>
                      <Route path="/chef" element={<ErrorBoundary><ChefDashboard /></ErrorBoundary>} />
                      <Route path="/chef/orders" element={<ErrorBoundary><ChefOrders /></ErrorBoundary>} />
                    </Route>

                    {/* Customer Routes — standalone mobile app (no site chrome,
                        no homepage chrome). Login -> Home -> Menu -> History. */}
                    <Route path="/customer" element={<ErrorBoundary><CustomerLogin /></ErrorBoundary>} />
                    <Route path="/customer/home" element={<ErrorBoundary><CustomerHome /></ErrorBoundary>} />
                    <Route path="/customer/history" element={<ErrorBoundary><CustomerHistory /></ErrorBoundary>} />
                    <Route path="/customer/menu" element={<ErrorBoundary><CustomerMenu /></ErrorBoundary>} />
                    <Route path="/customer/demo-entry" element={<ErrorBoundary><CustomerMenu /></ErrorBoundary>} />

                    {/* Admin Layout Routes — AuthWrapper only here */}
                    <Route element={<AuthWrapper><AdminLayout /></AuthWrapper>}>
                        <Route
                          path="/admin"
                          element={
                            <ErrorBoundary>
                              <AdminDashboard />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/admin/dishes"
                          element={
                            <ErrorBoundary>
                              <AdminDishes />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/admin/offers"
                          element={
                            <ErrorBoundary>
                              <AdminOffers />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/admin/specials"
                          element={
                            <ErrorBoundary>
                              <AdminSpecials />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/admin/completed-orders"
                          element={
                            <ErrorBoundary>
                              <CompletedOrders />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/admin/loyalty"
                          element={
                            <ErrorBoundary>
                              <LoyaltyProgram />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/admin/selection-offers"
                          element={
                            <ErrorBoundary>
                              <SelectionOffers />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/admin/tables"
                          element={
                            <ErrorBoundary>
                              <TableManagement />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/admin/settings"
                          element={
                            <ErrorBoundary>
                              <AdminSettings />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/admin/chefs"
                          element={
                            <ErrorBoundary>
                              <ChefsManagement />
                            </ErrorBoundary>
                          }
                        />

                        {/* Analysis Routes */}
                        <Route
                          path="/analysis"
                          element={
                            <ErrorBoundary>
                              <AnalysisDashboard />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/analysis/customer"
                          element={
                            <ErrorBoundary>
                              <CustomerAnalysis />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/analysis/dish"
                          element={
                            <ErrorBoundary>
                              <DishAnalysis />
                            </ErrorBoundary>
                          }
                        />
                        <Route
                          path="/analysis/chef"
                          element={
                            <ErrorBoundary>
                              <ChefAnalysis />
                            </ErrorBoundary>
                          }
                        />
                      </Route>

                      {/* Independent system monitoring route - no auth required */}
                      <Route element={<Layout />}>
                        <Route
                          path="/backitup"
                          element={
                            <ErrorBoundary>
                              <PerformanceMonitor />
                            </ErrorBoundary>
                          }
                        />
                      </Route>

                      {/* System diagnostics */}
                      <Route path="/sysdiag" element={<ErrorBoundary><PerformanceMonitor /></ErrorBoundary>} />
                      <Route path="/emergency-sys" element={<ErrorBoundary><SystemDiagnostics /></ErrorBoundary>} />
                      <Route path="/backitup" element={<ErrorBoundary><PerformanceMonitor /></ErrorBoundary>} />

                    </Routes>
                  </ErrorBoundary>
                </Suspense>
              </Router>
          </ChunkLoadErrorBoundary>
            </ThemedApp>
          </ThemeModeProvider>
        {/* React Query Devtools - only in development */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
