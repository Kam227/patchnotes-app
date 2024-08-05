import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import GameSelection from './components/GameSelection';
import PatchSelection from './components/PatchSelection';
import Patchnotes from './components/Patchnotes';
import DevTools from './components/DevTools';
import CharacterPage from './components/CharacterPage';
import LoginSignupModal from './components/LoginSignupModal';
import Navbar from './components/Navbar';
import { UserContext } from '../UserContext';

function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const updateUser = (newUser) => {
    setUser(newUser);
  };

  useEffect(() => {
    localStorage.setItem('user', JSON.stringify(user));
  }, [user]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <UserContext.Provider value={{ user, updateUser, openModal, closeModal }}>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<GameSelection />} />
          <Route path="/signup" element={<LoginSignupModal isOpen={true} onClose={closeModal} />} />
          <Route path="/login" element={<LoginSignupModal isOpen={true} onClose={closeModal} />} />
          <Route path="/devtools" element={<DevTools />} />
          <Route path="/game/overwatch" element={<PatchSelection game="overwatch" />} />
          <Route path="/game/league-of-legends" element={<PatchSelection game="league-of-legends" />} />
          <Route path="/patchnotes/overwatch/:year/:month" element={<Patchnotes game="overwatch" openModal={openModal} />} />
          <Route path="/patchnotes/league-of-legends/:version" element={<Patchnotes game="league-of-legends" openModal={openModal} />} />
          <Route path="/overwatch/:character" element={<CharacterPage game="overwatch" />} />
          <Route path="/league-of-legends/:character" element={<CharacterPage game="league-of-legends" />} />
        </Routes>
        <LoginSignupModal isOpen={isModalOpen} onClose={closeModal} />
      </Router>
    </UserContext.Provider>
  );
}

export default App;
