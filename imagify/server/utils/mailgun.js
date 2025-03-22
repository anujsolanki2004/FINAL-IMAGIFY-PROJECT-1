const mailgun = require('mailgun-js');

const mg = mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN
});

const sendPasswordResetEmail = async (email, resetToken) => {
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    const data = {
        from: 'Imagify <noreply@imagify.com>',
        to: email,
        subject: 'Password Reset Request',
        html: `
            <h1>Password Reset Request</h1>
            <p>You have requested to reset your password. Click the link below to reset it:</p>
            <a href="${resetLink}">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
        `
    };

    try {
        await mg.messages().send(data);
        return true;
    } catch (error) {
        console.error('Mailgun Error:', error);
        return false;
    }
};

module.exports = {
    sendPasswordResetEmail
}; 