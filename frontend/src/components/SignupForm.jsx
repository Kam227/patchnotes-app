import React, { useState, useContext } from 'react';
import { UserContext } from '../../UserContext.js';
import '../styles/SignupForm.css';

const SignupForm = ({ onClose }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { updateUser } = useContext(UserContext);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:3000/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                const loggedInUser = data.user;
                updateUser(loggedInUser);
                onClose();
            } else {
                const errorData = await response.json();
                alert(`Sign up failed: ${errorData.error}`);
            }
        } catch (error) {
            alert('Sign up failed: ' + error);
        }
    };

    return (
        <form className="login-form" onSubmit={handleSubmit}>
            <h2>Sign Up</h2>
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
                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
            <button className="login-button" type="submit">Sign up</button>
        </form>
    );
};

export default SignupForm;
