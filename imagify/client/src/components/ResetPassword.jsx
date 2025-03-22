import React, { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { assets } from '../assets/assets';
import { AppContext } from '../context/AppContext';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { token } = useParams();
    const navigate = useNavigate();
    const { backendUrl, setShowLogin } = useContext(AppContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Password validation
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }
        
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            const { data } = await axios.post(`${backendUrl}/api/user/reset-password`, {
                token,
                password
            });

            if (data.success) {
                toast.success('Password has been reset successfully');
                setShowLogin(true); // Show login modal instead of navigating
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
            <motion.div 
                className='max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div>
                    <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
                        Reset your password
                    </h2>
                </div>
                <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
                    <div className='rounded-md shadow-sm -space-y-px'>
                        <div>
                            <label htmlFor='password' className='sr-only'>New Password</label>
                            <input
                                id='password'
                                name='password'
                                type='password'
                                required
                                minLength={6}
                                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm'
                                placeholder='New Password'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor='confirm-password' className='sr-only'>Confirm Password</label>
                            <input
                                id='confirm-password'
                                name='confirm-password'
                                type='password'
                                required
                                minLength={6}
                                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm'
                                placeholder='Confirm Password'
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type='submit'
                            className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        >
                            Reset Password
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPassword; 