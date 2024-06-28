import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import GameSelection from './components/GameSelection';
import PatchSelection from './components/PatchSelection';
import Patchnotes from './components/Patchnotes';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GameSelection />} />
        <Route path="/game/overwatch" element={<PatchSelection game="overwatch" />} />
        <Route path="/game/valorant" element={<PatchSelection game="valorant" />} />
        <Route path="/patchnotes/overwatch/:year/:month" element={<Patchnotes game="overwatch" />} />
        <Route path="/patchnotes/valorant/:version" element={<Patchnotes game="valorant" />} />
        <Route path="/game/patch/:id" element={<p>Character Statistics</p>} />
      </Routes>
    </Router>
  );
}

export default App;
