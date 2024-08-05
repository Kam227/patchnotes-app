import React, { useState, useContext } from 'react';
import { UserContext } from '../../UserContext.js';
import '../styles/LoginForm.css';

const LoginForm = ({ onClose }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { updateUser } = useContext(UserContext);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:3000/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                const loggedInUser = data.user;
                updateUser(loggedInUser);
                onClose();
            } else {
                const errorData = await response.json();
                alert(`Login failed: ${errorData.error}`);
            }
        } catch (error) {
            alert('Login failed: ' + error);
        }
    };

    return (
        <form className="login-form" onSubmit={handleLogin}>
            <h2>Login</h2>
            <div className="form-group">
                <label htmlFor="username">Username:</label>
                <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
            </div>
            <div className="form-group">
                <label htmlFor="password">Password:</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            <button className="login-button" type="submit">Login</button>
        </form>
    );
};

export default LoginForm;
