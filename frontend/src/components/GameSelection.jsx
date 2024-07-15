import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import '../styles/GameSelection.css'

const GameSelection = () => {
    const navigate = useNavigate();

    return (
        <div className='game-selection'>
            <Navbar />
            <p onClick={() => navigate('/game/overwatch')}>Overwatch</p>
            <p onClick={() => navigate('/game/league-of-legends')}>League of Legends</p>
        </div>
    );
}

export default GameSelection;
