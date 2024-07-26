import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import '../styles/GameSelection.css';

import image1 from '../assets/home/image1.jpg';
import image2 from '../assets/home/image2.jpg';
import image3 from '../assets/home/image3.jpg';
import image4 from '../assets/home/image4.png';

import logo1 from '../assets/home/logo1.png';
import logo2 from '../assets/home/logo2.png';

const images = [image1, image2, image3, image4];

const GameSelection = () => {
    const navigate = useNavigate();
    const [currentImage, setCurrentImage] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImage((prevImage) => (prevImage + 1) % images.length);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const filteredGames = [
        { name: 'Overwatch', logo: logo1, path: '/game/overwatch' },
        { name: 'League of Legends', logo: logo2, path: '/game/league-of-legends' }
    ].filter(game => game.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className='game-selection'>
            <Navbar />
            <div
                className='banner'
                style={{ backgroundImage: `url(${images[currentImage]})` }}
            >
                <div className='banner-overlay'>
                    <h1>SELECT A GAME</h1>
                    <p>Find patch notes for various games, engage in discussions about updates, and track the progression of your characters' strengths and popularity.</p>
                    <div className='search-bar'>
                        <input
                            type='text'
                            placeholder='Search for a game...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>
            <div className='game-logos'>
                {filteredGames.map(game => (
                    <img
                        key={game.name}
                        src={game.logo}
                        alt={game.name}
                        onClick={() => navigate(game.path)}
                    />
                ))}
            </div>
        </div>
    );
}

export default GameSelection;
