import { createContext, useEffect, useState } from "react";
import axios from '../utils/axios';
import { toast } from 'react-toastify'
import { useNavigate } from "react-router-dom";

export const AppContext = createContext()

const AppContextProvider = (props) => {
    const [showLogin, setShowLogin] = useState(false)
    const [token, setToken] = useState(localStorage.getItem('token'))
    const [user, setUser] = useState(null)
    const [credit, setCredit] = useState(0)
    const navigate = useNavigate();

    const loadCreditsData = async () => {
        try {
            const { data } = await axios.get('/api/user/credits')
            if (data.success) {
                setCredit(data.credits)
                setUser(data.user)
            }
        } catch (error) {
            console.error('Error loading credits:', error)
            toast.error(error.response?.data?.message || 'Failed to load credits')
        }
    }

    const generateImage = async (prompt) => {
        if (!prompt) {
            toast.error('Please enter a prompt')
            return null
        }

        if (credit <= 0) {
            toast.error('No credits available. Please purchase more credits.')
            navigate('/buy')
            return null
        }

        try {
            const { data } = await axios.post('/api/image/generate-image', { prompt })

            if (data.success) {
                setCredit(data.creditBalance)
                toast.success('Image generated successfully!')
                return data.resultImage
            } else {
                toast.error(data.message)
                if (data.creditBalance === 0) {
                    navigate('/buy')
                }
                return null
            }
        } catch (error) {
            console.error('Image generation error:', error)
            toast.error(error.response?.data?.message || 'Failed to generate image')
            if (error.response?.status === 401) {
                setShowLogin(true)
            }
            return null
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        setToken('')
        setUser(null)
        setCredit(0)
    }

    useEffect(() => {
        if (token) {
            loadCreditsData()
        }
    }, [token])

    const value = {
        token, setToken,
        user, setUser,
        showLogin, setShowLogin,
        credit, setCredit,
        loadCreditsData,
        generateImage,
        logout
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider