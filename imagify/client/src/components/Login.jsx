import React, { useContext, useEffect, useState } from 'react';
import { assets } from '../assets/assets';
import { AppContext } from '../context/AppContext';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

const Login = () => {
    const [state, setState] = useState('Login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const { setShowLogin, setToken, setUser } = useContext(AppContext);

    const handleGoogleLogin = async () => {
        try {
            setIsGoogleLoading(true);
            const provider = new GoogleAuthProvider();
            
            // Configure Google provider with minimal settings
            provider.setCustomParameters({
                prompt: 'select_account'
            });

            // Use popup with a timeout
            const result = await Promise.race([
                signInWithPopup(auth, provider),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Login timeout')), 30000)
                )
            ]);

            const user = result.user;
            console.log("Google user:", user);
            
            try {
                const { data } = await axios.post('/api/user/firebase-login', {
                    name: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    uid: user.uid,
                });
                
                if (data.success) {
                    setToken(data.token);
                    setUser(data.user);
                    localStorage.setItem('token', data.token);
                    setShowLogin(false);
                    toast.success('Successfully logged in with Google!');
                } else {
                    toast.error(data.message || 'Failed to login with Google');
                }
            } catch (serverError) {
                console.error("Server error:", serverError);
                toast.error(serverError.response?.data?.message || 'Failed to complete login with server');
            }
        } catch (error) {
            console.error("Google Login Error:", error);
            if (error.code === 'auth/popup-closed-by-user') {
                toast.error('Google login was cancelled. Please try again.');
            } else if (error.code === 'auth/cancelled-popup-request') {
                toast.error('Another login attempt is in progress. Please wait.');
            } else if (error.code === 'auth/popup-blocked') {
                toast.error(
                    <div>
                        <p>Google login was blocked. Please:</p>
                        <ol className="list-decimal pl-4 mt-2">
                            <li>Allow popups for this site</li>
                            <li>Try logging in again</li>
                        </ol>
                    </div>,
                    { autoClose: 5000 }
                );
            } else if (error.message === 'Login timeout') {
                toast.error('Login attempt timed out. Please try again.');
            } else {
                toast.error(error.message || 'Failed to login with Google');
            }
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        try {
            const url = state === 'Login' ? '/api/user/login' : '/api/user/register';
            const payload = state === 'Login' ? { email, password } : { name, email, password };

            const { data } = await axios.post(url, payload);

            if (data.success) {
                setToken(data.token);
                setUser(data.user);
                localStorage.setItem('token', data.token);
                setShowLogin(false);
                toast.success(state === 'Login' ? 'Successfully logged in!' : 'Account created successfully!');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('/api/user/forgot-password', { email });
            if (data.success) {
                toast.success('Password reset link has been sent to your email');
                setShowForgotPassword(false);
            } else {
                toast.error(data.message || 'Failed to send reset link');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Something went wrong');
        }
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className='absolute top-0 left-0 right-0 bottom-0 z-10 backdrop-blur-sm bg-black/30 flex justify-center items-center'>
            <motion.form 
                onSubmit={showForgotPassword ? handleForgotPassword : onSubmitHandler} 
                className='relative bg-white p-10 rounded-xl text-slate-500'
                initial={{ opacity: 0.2, y: 50 }}
                transition={{ duration: 0.3 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <h1 className='text-center text-2xl text-neutral-700 font-medium'>
                    {showForgotPassword ? 'Forgot Password' : state}
                </h1>
                <p className='text-sm'>
                    {showForgotPassword 
                        ? 'Enter your email to receive a password reset link'
                        : 'Welcome back! Please sign in to continue'
                    }
                </p>

                {!showForgotPassword && state !== 'Login' && (
                    <div className='border px-6 py-2 flex items-center gap-2 rounded-full mt-5'>
                        <img src={assets.email_icon} alt='' />
                        <input 
                            onChange={e => setName(e.target.value)} 
                            value={name} 
                            className='outline-none text-sm' 
                            type='text' 
                            placeholder='Full Name' 
                            required 
                        />
                    </div>
                )}

                <div className='border px-6 py-2 flex items-center gap-2 rounded-full mt-4'>
                    <img src={assets.email_icon} alt='' />
                    <input 
                        onChange={e => setEmail(e.target.value)} 
                        value={email} 
                        className='outline-none text-sm' 
                        type='email' 
                        placeholder='Email id' 
                        required 
                    />
                </div>

                {!showForgotPassword && (
                    <div className='border px-6 py-2 flex items-center gap-2 rounded-full mt-4'>
                        <img src={assets.lock_icon} alt='' />
                        <input 
                            onChange={e => setPassword(e.target.value)} 
                            value={password} 
                            className='outline-none text-sm' 
                            type='password' 
                            placeholder='Password' 
                            required
                        />
                    </div>
                )}

                {!showForgotPassword && (
                    <p 
                        className='text-sm text-blue-600 my-4 cursor-pointer'
                        onClick={() => setShowForgotPassword(true)}
                    >
                        Forgot password?
                    </p>
                )}

                <button 
                    type="submit"
                    className='bg-blue-600 w-full text-white py-2 rounded-full hover:bg-blue-700 transition-colors'
                >
                    {showForgotPassword ? 'Send Reset Link' : (state === 'Login' ? 'Login' : 'Create Account')}
                </button>

                {!showForgotPassword && (
                    <button 
                        type='button' 
                        onClick={handleGoogleLogin}
                        disabled={isGoogleLoading}
                        className='bg-red-600 w-full text-white py-2 rounded-full mt-4 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        {isGoogleLoading ? 'Signing in...' : 'Sign in with Google'}
                    </button>
                )}

                {!showForgotPassword && (
                    state === 'Login' ? (
                        <p className='mt-5 text-center'>
                            Don't have an account? <span onClick={() => setState('Sign Up')} className='text-blue-600 cursor-pointer hover:underline'>Sign up</span>
                        </p>
                    ) : (
                        <p className='mt-5 text-center'>
                            Already have an account? <span onClick={() => setState('Login')} className='text-blue-600 cursor-pointer hover:underline'>Login</span>
                        </p>
                    )
                )}

                {showForgotPassword && (
                    <p className='mt-5 text-center'>
                        Remember your password? <span onClick={() => setShowForgotPassword(false)} className='text-blue-600 cursor-pointer hover:underline'>Login</span>
                    </p>
                )}

                <img onClick={() => setShowLogin(false)} className='absolute top-5 right-5 cursor-pointer hover:opacity-70 transition-opacity' src={assets.cross_icon} alt='' />
            </motion.form>
        </div>
    );
};

export default Login;