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
        <Route path="/game" element={<PatchSelection />} />
        <Route path="/game/patch/:year/:month" element={<Patchnotes />} />
        <Route path="/game/patch/character" element={<p>Character Statistics</p>} />
      </Routes>
    </Router>
  );
}

export default App;
