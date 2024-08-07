import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../UserContext';
import '../styles/Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const { updateUser } = useContext(UserContext);

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

    return (
        <div className='navbar'>
            <div className='navbar-title'>PatchCentral</div>
            <div className='navbar-buttons'>
                <button onClick={() => navigate('/DevTools')}>Settings</button>
                <button onClick={handleLogout}>Logout</button>
            </div>
        </div>
    );
};

export default Navbar;
