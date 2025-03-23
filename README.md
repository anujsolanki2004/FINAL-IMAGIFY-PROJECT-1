# Imagify - AI Image Generation Platform

Imagify is a modern web application that allows users to generate images using AI technology. The platform features Google authentication and a user-friendly interface for image generation.

## Features

- 🔐 Google Authentication
- 🎨 AI Image Generation
- 💳 Payment Integration with Razorpay
- 🎯 User Dashboard
- 📱 Responsive Design

## Tech Stack

- Frontend: React.js with Vite
- Backend: Node.js with Express
- Authentication: Firebase
- Database: MongoDB
- Payment Gateway: Razorpay
- Image Generation: AI API

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Firebase Account
- Razorpay Account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/anujsolanki2004/FINAL-IMAGIFY-PROJECT-1.git
```

2. Install dependencies for both client and server:

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. Set up environment variables:

   - Create `.env` files in both client and server directories
   - Add necessary environment variables (see `.env.example` files)

4. Start the development servers:

```bash
# Start the backend server
cd server
npm start

# Start the frontend server
cd client
npm run dev
```

## Environment Variables

### Client (.env)

```
VITE_API_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

### Server (.env)

```
PORT=3000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Anuj Solanki

- GitHub: [@anujsolanki2004](https://github.com/anujsolanki2004)
