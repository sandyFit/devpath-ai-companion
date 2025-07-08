import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Test from './pages/Test';
import ProjectAnalysis from './components/ProjectAnalysis';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      {/* <Route path="/test" element={<Test />} /> */}
      <Route path="/project/:projectId" element={<ProjectAnalysis />} />
    </Routes>
  </BrowserRouter>
);

export default App;
