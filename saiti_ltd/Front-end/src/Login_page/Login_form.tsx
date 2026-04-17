import { Button, Container } from "react-bootstrap"
import '../Styles/Login_form.css'
import React, { useState } from 'react'
import axios from '../api/axios'
import { useNavigate } from 'react-router-dom'

function Login_form() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
        const response = await axios.post('auth/login', {
            email: email.trim(),
            password: password.trim()
        }, {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true
        });

        if (response.data) {
          const accessToken = response.data?.data?.accessToken;

          if (accessToken) {
            window.localStorage.setItem('accessToken', accessToken);
          }

            setSuccess('Login successful! Redirecting...');
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        }
    } catch (err: any) {
        setError(err.response?.data?.message || 'An error occurred while trying to log in. Please try again later.');
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  return(
    <Container fluid className="">
      <div className="mb-5">
        <h1>WELCOME BACK!</h1>
        <p>Digitally connect your entire distribution network and make 
          faster, data-driven decisions from production to the retail shelf. </p>
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {success && <div className="alert alert-success" role="alert">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="d-flex flex-column form_input align-items-center">
          <input 
            value={email} 
            type="email" 
            placeholder="email" 
            onChange={(e) => setEmail(e.target.value)} 
            disabled={loading}
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
          <Button 
            type="submit" 
            style={{padding: "0.5rem 4rem", backgroundColor: "#F3D948"}} 
            className="rounded-pill border-white"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </div>
      </form>
    </Container>
  )
}

export default Login_form