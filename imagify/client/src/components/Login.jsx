import React, { useContext, useEffect, useState } from 'react';
import { assets } from '../assets/assets';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase';

const Login = () => {
    const [state, setState] = useState('Login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const { backendUrl, setShowLogin, setToken, setUser } = useContext(AppContext);

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const { data } = await axios.post(`${backendUrl}/api/user/firebase-login`, {
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
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Google Login Error:", error);
            toast.error(error.message || "Google Login failed");
        }
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        try {
            const url = state === 'Login' ? '/api/user/login' : '/api/user/register';
            const payload = state === 'Login' ? { email, password } : { name, email, password };

            const { data } = await axios.post(`${backendUrl}${url}`, payload);

            if (data.success) {
                setToken(data.token);
                setUser(data.user);
                localStorage.setItem('token', data.token);
                setShowLogin(false);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
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
                onSubmit={onSubmitHandler} 
                className='relative bg-white p-10 rounded-xl text-slate-500'
                initial={{ opacity: 0.2, y: 50 }}
                transition={{ duration: 0.3 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <h1 className='text-center text-2xl text-neutral-700 font-medium'>{state}</h1>
                <p className='text-sm'>Welcome back! Please sign in to continue</p>

                {state !== 'Login' && (
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

                <div className='border px-6 py-2 flex items-center gap-2 rounded-full mt-4'>
                    <img src={assets.lock_icon} alt='' />
                    <input 
                        onChange={e => setPassword(e.target.value)} 
                        value={password} 
                        className='outline-none text-sm' 
                        type='password' 
                        placeholder='Password' 
                    />
                </div>

                <p className='text-sm text-blue-600 my-4 cursor-pointer'>Forgot password?</p>
                <button className='bg-blue-600 w-full text-white py-2 rounded-full'>{state === 'Login' ? 'Login' : 'Create Account'}</button>
                <button type='button' onClick={handleGoogleLogin} className='bg-red-600 w-full text-white py-2 rounded-full mt-4'>
                    Sign in with Google
                </button>

                {state === 'Login' ? (
                    <p className='mt-5 text-center'>Don't have an account? <span onClick={() => setState('Sign Up')} className='text-blue-600 cursor-pointer'>Sign up</span></p>
                ) : (
                    <p className='mt-5 text-center'>Already have an account? <span onClick={() => setState('Login')} className='text-blue-600 cursor-pointer'>Login</span></p>
                )}

                <img onClick={() => setShowLogin(false)} className='absolute top-5 right-5 cursor-pointer' src={assets.cross_icon} alt='' />
            </motion.form>
        </div>
    );
};

export default Login;