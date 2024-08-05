import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../UserContext';
import '../styles/Navbar.css';
import bannerOW from '../assets/home/bannerOW.jpg';
import logoOW from '../assets/home/logoOW.png';
import bannerLoL from '../assets/home/bannerLoL.webp';
import logoLoL from '../assets/home/logoLoL.png';

const Navbar = ({ game }) => {
    const navigate = useNavigate();
    const { user, updateUser, openModal } = useContext(UserContext);

    const handleLogout = async () => {
        try {
            const response = await fetch('http://localhost:3000/users/logout', {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                updateUser(null);
                navigate('/');
            } else {
                alert('Logout failed');
            }
        } catch (error) {
            alert('Logout failed: ' + error);
        }
    };

    const handleLogin = () => {
        openModal();
    };

    return (
        <div className='navbar-container'>
            <div className='navbar-top'>
                <div className='navbar-title' onClick={() => navigate('/')}>PatchCentral</div>
                <div className='navbar-buttons'>
                    <button onClick={() => navigate('/DevTools')}>Settings</button>
                    {user ? (
                        <button onClick={handleLogout}>Logout</button>
                    ) : (
                        <button onClick={handleLogin}>Sign In</button>
                    )}
                </div>
            </div>
            {game === 'overwatch' && (
                <div className='navbar-banner'>
                    <img src={bannerOW} alt='Overwatch Banner' className='banner-image' />
                    <img src={logoOW} alt='Overwatch Logo' className='logo-image' />
                </div>
            )}
            {game === 'league-of-legends' && (
                <div className='navbar-banner'>
                    <img src={bannerLoL} alt='League of Legends Banner' className='banner-image' />
                    <img src={logoLoL} alt='League of Legends Logo' className='logo-image' />
                </div>
            )}
        </div>
    );
};

export default Navbar;
