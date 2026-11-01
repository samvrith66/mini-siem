import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import LogExplorerPage from './pages/LogExplorerPage';
import AlertsPage from './pages/AlertsPage';
import ThreatDetectionPage from './pages/ThreatDetectionPage';
import AnalyticsPage from './pages/AnalyticsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/logs" element={<LogExplorerPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/threats" element={<ThreatDetectionPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

