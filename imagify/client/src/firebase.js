import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDbN1vL08TYaGxYG6EOeD7h6nj7ab8UOtI",
    authDomain: "imagify-7c973.firebaseapp.com",
    projectId: "imagify-7c973",
    storageBucket: "imagify-7c973.firebasestorage.app",
    messagingSenderId: "168306232017",
    appId: "1:168306232017:web:95c0ed6a61f502c88c93f0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const handleGoogleLogin = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        console.log("User logged in:", result.user);
        return result.user;
    } catch (error) {
        console.error("Google Login Error:", error);
        throw error;
    }
};

// ✅ Corrected export statement
export { app, auth, provider, handleGoogleLogin };
