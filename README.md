# Service Pro - Backend Server

The backend for Service Pro is a high-performance Express.js server that handles business logic, database management, secure authentication, real-time messaging, and payment processing for the Service Pro platform.

## 🚀 Core Functionalities

- **RESTful API**: Comprehensive endpoints for user profiles, service catalogs, blog management, and FAQs.
- **Secure Authentication**: JWT-based auth with password hashing using `bcryptjs`.
- **Database Integration**: Scalable data storage using **MongoDB**.
- **Payment Processing**: Full integration with **SSLCommerz**, including success/fail/cancel callbacks and IPN support.
- **Real-time Communication**: Event-driven architecture using **Socket.io** for instant messaging and typing indicators.
- **Email Services**: Automated email verification and password reset links via `nodemailer`.
- **Admin Management**: Secure routes for admin control, user role updates, and dashboard statistics.

## 🛠️ Technology Stack

- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Authentication**: JWT (JSON Web Tokens)
- **Hashing**: Bcryptjs
- **Real-time**: [Socket.io](https://socket.io/)
- **Emailing**: Nodemailer
- **Payment**: SSLCommerz Integration
- **Deployment**: Configured for **Vercel** (`vercel.json` included).

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or local MongoDB instance

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd servies-pro-server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory and add:

   ```env
   # Database
   DB_USER=your_db_user
   DB_PASS=your_db_password

   # JWT
   ACCESS_TOKEN_SECRET=your_jwt_secret

   # SSLCommerz
   STORE_ID=your_store_id
   STORE_PASSWORD=your_store_password
   BASE_URL=your_server_url

   # Email (Nodemailer)
   EMAIL_USER=servicepro24x@gmail.com
   EMAIL_PASS=your_app_password
   ```

4. Start the server:
   ```bash
   npm run start
   ```
   For development with auto-reload:
   ```bash
   npx nodemon index.js
   ```

## 📡 API Highlights

- `POST /register`: Register new user with email verification.
- `POST /login`: Authenticate user and receive token.
- `GET /services`: Fetch all available services.
- `POST /initiate-payment`: Start a transaction flow.
- `GET /api/messages/:roomId`: Fetch chat history.
- `PUT /make-admin/:id`: Elevate user privileges (Admin only).

## 📁 Project Structure

- `index.js`: Main entry point containing MongoDB connection and all route definitions.
- `emailConfig.js`: Transporter configuration for Nodemailer.
- `vercel.json`: Configuration for Vercel deployment.

## 📄 License

This project is licensed under the ISC License.
