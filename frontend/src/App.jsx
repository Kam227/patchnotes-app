import React, {useState, useEffect} from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import GameSelection from './components/GameSelection';
import PatchSelection from './components/PatchSelection';
import Patchnotes from './components/Patchnotes';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
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
          <Route path="/signup" element={ <SignupForm />} />
          <Route path="/game/overwatch" element={<PatchSelection game="overwatch" />} />
          <Route path="/game/valorant" element={<PatchSelection game="valorant" />} />
          <Route path="/patchnotes/overwatch/:year/:month" element={<Patchnotes game="overwatch" />} />
          <Route path="/patchnotes/valorant/:version" element={<Patchnotes game="valorant" />} />
          <Route path="/game/patch/:id" element={<p>Character Statistics</p>} />
        </Routes>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
