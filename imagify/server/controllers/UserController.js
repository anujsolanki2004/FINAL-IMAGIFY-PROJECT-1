import userModel from "../models/userModel.js"
import transactionModel from "../models/transactionModel.js"
import razorpay from 'razorpay';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import stripe from "stripe";
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// API to register user
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // checking for all data to register user
        if (!name || !email || !password) {
            return res.json({ success: false, message: 'Missing Details' })
        }

        // Check if user already exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: 'User already exists' });
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name,
            email,
            password: hashedPassword,
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.json({ success: true, token, user: { name: user.name } })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "User does not exist" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token, user: { name: user.name } })
        }
        else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to handle Google login
const handleGoogleLogin = async (req, res) => {
    try {
        const { email, name, photoURL, uid } = req.body;

        // Find or create user
        let user = await userModel.findOne({ email });

        if (!user) {
            // Create new user if doesn't exist
            user = await userModel.create({
                name,
                email,
                password: uid, // Using Firebase UID as password for Google users
                photoURL,
                isGoogleUser: true
            });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        res.json({
            success: true,
            token,
            user: {
                name: user.name,
                email: user.email,
                photoURL: user.photoURL
            }
        });

    } catch (error) {
        console.error('Google Login Error:', error);
        res.json({ success: false, message: error.message });
    }
};

// API Controller function to get user available credits data
const userCredits = async (req, res) => {
    try {
        const userId = req.user.id; // Get userId from the token (set by auth middleware)

        // Fetching userdata using userId
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
        
        res.json({ success: true, credits: user.creditBalance, user: { name: user.name } });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// razorpay gateway initialize
const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// Payment API to add credits
const paymentRazorpay = async (req, res) => {
    try {

        const { userId, planId } = req.body

        const userData = await userModel.findById(userId)

        // checking for planId and userdata
        if (!userData || !planId) {
            return res.json({ success: false, message: 'Missing Details' })
        }

        let credits, plan, amount, date

        // Switch Cases for different plans
        switch (planId) {
            case 'Basic':
                plan = 'Basic'
                credits = 100
                amount = 10
                break;

            case 'Advanced':
                plan = 'Advanced'
                credits = 500
                amount = 50
                break;

            case 'Business':
                plan = 'Business'
                credits = 5000
                amount = 250
                break;

            default:
                return res.json({ success: false, message: 'plan not found' })
        }

        date = Date.now()

        // Creating Transaction Data
        const transactionData = {
            userId,
            plan,
            amount,
            credits,
            date
        }

        // Saving Transaction Data to Database
        const newTransaction = await transactionModel.create(transactionData)

        // Creating options to create razorpay Order
        const options = {
            amount: amount * 100,
            currency: process.env.CURRENCY,
            receipt: newTransaction._id,
        }

        // Creating razorpay Order
        await razorpayInstance.orders.create(options, (error, order) => {
            if (error) {
                console.log(error);
                return res.json({ success: false, message: error });
            }
            res.json({ success: true, order });
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API Controller function to verify razorpay payment
const verifyRazorpay = async (req, res) => {
    try {

        const { razorpay_order_id } = req.body;

        // Fetching order data from razorpay
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

        // Checking for payment status
        if (orderInfo.status === 'paid') {
            const transactionData = await transactionModel.findById(orderInfo.receipt)
            if (transactionData.payment) {
                return res.json({ success: false, message: 'Payment Failed' })
            }

            // Adding Credits in user data
            const userData = await userModel.findById(transactionData.userId)
            const creditBalance = userData.creditBalance + transactionData.credits
            await userModel.findByIdAndUpdate(userData._id, { creditBalance })

            // Marking the payment true 
            await transactionModel.findByIdAndUpdate(transactionData._id, { payment: true })

            res.json({ success: true, message: "Credits Added" });
        }
        else {
            res.json({ success: false, message: 'Payment Failed' });
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Stripe Gateway Initialize
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

// Payment API to add credits ( Stripe )
const paymentStripe = async (req, res) => {
    try {

        const { userId, planId } = req.body
        const { origin } = req.headers

        const userData = await userModel.findById(userId)

        // checking for planId and userdata
        if (!userData || !planId) {
            return res.json({ success: false, message: 'Invalid Credentials' })
        }

        let credits, plan, amount, date

        // Switch Cases for different plans
        switch (planId) {
            case 'Basic':
                plan = 'Basic'
                credits = 100
                amount = 10
                break;

            case 'Advanced':
                plan = 'Advanced'
                credits = 500
                amount = 50
                break;

            case 'Business':
                plan = 'Business'
                credits = 5000
                amount = 250
                break;

            default:
                return res.json({ success: false, message: 'plan not found' })
        }

        date = Date.now()

        // Creating Transaction Data
        const transactionData = {
            userId,
            plan,
            amount,
            credits,
            date
        }

        // Saving Transaction Data to Database
        const newTransaction = await transactionModel.create(transactionData)

        const currency = process.env.CURRENCY.toLocaleLowerCase()

        // Creating line items to for Stripe
        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: "Credit Purchase"
                },
                unit_amount: transactionData.amount * 100
            },
            quantity: 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&transactionId=${newTransaction._id}`,
            cancel_url: `${origin}/verify?success=false&transactionId=${newTransaction._id}`,
            line_items: line_items,
            mode: 'payment',
        })
        
        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API Controller function to verify stripe payment
const verifyStripe = async (req, res) => {
    try {

        const { transactionId, success } = req.body

        // Checking for payment status
        if (success === 'true') {
            const transactionData = await transactionModel.findById(transactionId)
            if (transactionData.payment) {
                return res.json({ success: false, message: 'Payment Already Verified' })
            }

            // Adding Credits in user data
            const userData = await userModel.findById(transactionData.userId)
            const creditBalance = userData.creditBalance + transactionData.credits
            await userModel.findByIdAndUpdate(userData._id, { creditBalance })

            // Marking the payment true 
            await transactionModel.findByIdAndUpdate(transactionData._id, { payment: true })

            res.json({ success: true, message: "Credits Added" });
        }
        else {
            res.json({ success: false, message: 'Payment Failed' });
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Forgot Password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        // Create email transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Verify transporter configuration
        try {
            await transporter.verify();
            console.log("Email transporter verified successfully");
        } catch (verifyError) {
            console.error("Email transporter verification failed:", verifyError);
            throw verifyError;
        }

        // Email content
        const mailOptions = {
            from: `"Imagify" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Reset Your Password - Imagify',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb; text-align: center;">Password Reset Request</h2>
                    <p>Hello ${user.name},</p>
                    <p>We received a request to reset your password for your Imagify account. If you didn't make this request, you can safely ignore this email.</p>
                    <p>To reset your password, click the button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p>This link will expire in 10 minutes for security reasons.</p>
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
                    <p>Best regards,<br>The Imagify Team</p>
                </div>
            `
        };

        // Send email
        try {
            await transporter.sendMail(mailOptions);
            console.log("Password reset email sent successfully to:", user.email);
            res.json({ success: true, message: "Password reset email sent" });
        } catch (sendError) {
            console.error("Failed to send email:", sendError);
            res.json({ success: false, message: `Failed to send email: ${sendError.message}` });
        }
    } catch (error) {
        console.error("Forgot password error:", error);
        res.json({ success: false, message: `Error: ${error.message}` });
    }
};

// Reset Password
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        // Hash token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await userModel.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.json({ success: false, message: "Invalid or expired reset token" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password and clear reset fields
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.json({ success: true, message: "Password has been reset" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { registerUser, loginUser, userCredits, paymentRazorpay, verifyRazorpay, paymentStripe, verifyStripe, forgotPassword, resetPassword, handleGoogleLogin }