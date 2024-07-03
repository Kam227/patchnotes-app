import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { UserContext } from '../../UserContext';

const GameSelection = () => {
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
        <div>
            <button onClick={handleLogout}>Logout</button>
            <p onClick={() => navigate('/game/overwatch')}>Overwatch</p>
            <p onClick={() => navigate('/game/valorant')}>Valorant</p>
        </div>
    );
}

export default GameSelection;
