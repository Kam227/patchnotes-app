import { useNavigate } from 'react-router-dom';

const GameSelection = () => {
    const navigate = useNavigate();

    return (
        <div>
            <p onClick={() => navigate('/game/overwatch')}>Overwatch</p>
            <p onClick={() => navigate('/game/valorant')}>Valorant</p>
        </div>
    );
}

export default GameSelection;
