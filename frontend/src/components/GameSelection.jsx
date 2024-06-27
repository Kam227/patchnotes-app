import { useNavigate } from 'react-router-dom';

const GameSelection = () => {
    const navigate = useNavigate()

    return (
        <div>
            <p onClick={() => navigate('/game')}>Overwatch</p>
        </div>
    )
}

export default GameSelection
