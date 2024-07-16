import React, {useState, useEffect} from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import GameSelection from './components/GameSelection';
import PatchSelection from './components/PatchSelection';
import Patchnotes from './components/Patchnotes';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import DevTools from './components/DevTools';
import { UserContext } from '../UserContext';

function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const updateUser = (newUser) => {
    setUser(newUser);
  }

  useEffect(() => {
    localStorage.setItem('user', JSON.stringify(user));
  }, [user])


  return (
    <UserContext.Provider value={{ user, updateUser}}>
      <Router>
        <Routes>
          <Route path="/" element={user ? <GameSelection /> : <LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/devtools" element={<DevTools />} />
          <Route path="/game/overwatch" element={<PatchSelection game="overwatch" />} />
          <Route path="/game/league-of-legends" element={<PatchSelection game="league-of-legends" />} />
          <Route path="/patchnotes/overwatch/:year/:month" element={<Patchnotes game="overwatch" />} />
          <Route path="/patchnotes/league-of-legends/:version" element={<Patchnotes game="league of legends" />} />
          <Route path="/game/patch/:id" element={<p>Character Statistics</p>} />
        </Routes>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
