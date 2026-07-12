import React, { useState } from 'react';

const Auth = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        const endpoint = isLogin
            ? '/api/auth/login'
            : '/api/auth/signup';

        try {
            const response = await fetch(
                `https://smartqueue-u73d.onrender.com${endpoint}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username,
                        password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Kuch galat hua!');
            }

            if (isLogin) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
                onLoginSuccess(data.username);
            } else {
                setMessage(data.message || 'Registration successful!');
                setIsLogin(true);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2>{isLogin ? '🔒 Clinic Admin Login' : '📝 Admin Signup'}</h2>

                {message && <div style={styles.success}>{message}</div>}
                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={styles.input}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={styles.input}
                    />

                    <button type="submit" style={styles.button}>
                        {isLogin ? 'Login' : 'Register'}
                    </button>
                </form>

                <p style={styles.toggleText}>
                    {isLogin
                        ? 'Naya account banana hai? '
                        : 'Pehle se account hai? '}

                    <span
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setMessage('');
                            setError('');
                        }}
                        style={styles.link}
                    >
                        {isLogin ? 'Signup karein' : 'Login karein'}
                    </span>
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        background: '#f4f6f9',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
    },
    card: {
        background: '#fff',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        width: '350px',
        textAlign: 'center',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        marginTop: '20px',
    },
    input: {
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        fontSize: '16px',
    },
    button: {
        padding: '10px',
        background: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    success: {
        background: '#d4edda',
        color: '#155724',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '10px',
    },
    error: {
        background: '#f8d7da',
        color: '#721c24',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '10px',
    },
    toggleText: {
        marginTop: '20px',
        color: '#555',
    },
    link: {
        color: '#007bff',
        cursor: 'pointer',
        fontWeight: 'bold',
        textDecoration: 'underline',
    },
};

export default Auth;