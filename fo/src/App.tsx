import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';

import { GillogPage } from './pages/GillogPage';
import { GPanRadarPage } from './pages/GPanRadarPage';
import { RoadboarderPage } from './pages/RoadboarderPage';
import { AutopilotPage } from './pages/AutopilotPage';
import { DarksidePage } from './pages/DarksidePage';
import { OnboardingPage } from './pages/OnboardingPage';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<GillogPage />} />
            <Route path="/gpan" element={<GPanRadarPage />} />
            <Route path="/board" element={<RoadboarderPage />} />
            <Route path="/autopilot" element={<AutopilotPage />} />
            <Route path="/darkside" element={<DarksidePage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
