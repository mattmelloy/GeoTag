import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { MapCanvas } from './modules/map/MapCanvas';
import { TrackerProvider } from './context/TrackerContext';
import { CaptureScreen } from './modules/capture/CaptureScreen';
import { SeekerScreen } from './modules/seeker/SeekerScreen';
import { LibraryScreen } from './modules/library/LibraryScreen';

function App() {
  return (
    <TrackerProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<MapCanvas />} />
            <Route path="/capture" element={<CaptureScreen />} />
            <Route path="/seeker" element={<SeekerScreen />} />
            <Route path="/library" element={<LibraryScreen />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TrackerProvider>
  );
}

export default App;
