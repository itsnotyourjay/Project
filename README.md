# Contact & Lead Management System

A full-stack web application for managing contacts and leads with secure authentication.

## 🚀 Features

- **User Authentication** - Secure JWT-based authentication with HttpOnly cookies
- **Contact Management** - Create, view, and manage leads/contacts
- **User Isolation** - Each user sees only their own submitted contacts
- **Responsive UI** - Modern, Bootstrap-based interface
- **Secure** - HttpOnly cookies, refresh token rotation, CORS protection

## 🏗️ Tech Stack

### Frontend
- **Angular 19** - Modern web framework
- **TypeScript** - Type-safe development
- **Bootstrap 5** - Responsive UI components
- **RxJS** - Reactive programming

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeORM** - Database ORM
- **MySQL** - Relational database
- **Passport JWT** - Authentication strategy
- **bcrypt** - Password hashing

## 📁 Project Structure

```
.
├── contact-us-app/        # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── guards/           # Route guards (auth, guest)
│   │   │   ├── pages/            # Page components
│   │   │   ├── services/         # HTTP services
│   │   │   └── app.config.ts     # App configuration
│   │   └── contacts/             # Contact entities & services
│   └── package.json
│
└── leads-backend/         # NestJS Backend
    ├── src/
    │   ├── auth/                 # Authentication module
    │   │   ├── entities/         # User token entities
    │   │   └── jwt.strategy.ts   # JWT strategy
    │   ├── leads/                # Leads module
    │   │   └── entities/         # Lead entity
    │   └── users/                # Users module
    └── package.json
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- MySQL 8+
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/contact-leads-app.git
cd contact-leads-app
```

### 2. Backend Setup

```bash
cd leads-backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your database credentials
# Required variables:
# - DB_HOST=localhost
# - DB_PORT=3306
# - DB_USERNAME=your_mysql_user
# - DB_PASSWORD=your_mysql_password
# - DB_NAME=leads_db
# - JWT_SECRET=your_super_secret_key
# - ACCESS_EXPIRES_IN=15m
# - REFRESH_EXPIRES_IN=7d
# - FRONTEND_ORIGIN=http://localhost:4200

# Create database
mysql -u root -p -e "CREATE DATABASE leads_db;"

# Run the application (it will auto-create tables)
npm run start:dev
```

Backend will run on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd contact-us-app

# Install dependencies
npm install

# Run the application
npm start
```

Frontend will run on `http://localhost:4200`

## 🔐 Authentication Flow

1. **Register** - Create a new account
2. **Login** - Receive HttpOnly cookies (accessToken + refreshToken)
3. **Protected Routes** - Automatic token validation on each request
4. **Refresh** - Automatic token refresh when access token expires
5. **Logout** - Revoke tokens and clear cookies

### Security Features
- ✅ HttpOnly cookies (XSS protection)
- ✅ JWT access + refresh token rotation
- ✅ Per-session token storage
- ✅ CORS protection
- ✅ Password hashing with bcrypt
- ✅ Route guards

## 📱 Usage

### Register a New User
1. Navigate to `/register`
2. Enter email and password
3. Submit to create account

### Login
1. Navigate to `/login`
2. Enter credentials
3. Redirected to `/contacts` on success

### Manage Contacts
1. View all your contacts at `/contacts`
2. Click "New Contact" to create a lead
3. Fill out the form (Name, Email, Message)
4. Submit to save
5. View individual contact details

### Key Pages
- `/login` - User login
- `/register` - User registration
- `/contacts` - Contact list (protected)
- `/contacts/new` - New contact form (protected)
- `/contacts/:id` - Contact details (protected)

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/me` - Get current user

### Leads (Protected)
- `GET /api/leads` - Get user's contacts
- `POST /api/leads` - Create new contact
- `GET /api/leads/:id` - Get single contact

## 🛡️ Database Schema

### Users Table
- `id` - Primary key
- `email` - Unique email
- `password` - Hashed password
- `createdAt` - Timestamp

### Leads Table
- `id` - Primary key
- `name` - Contact name
- `email` - Contact email
- `msg` - Message
- `userId` - Foreign key to users
- `createdAt`, `updatedAt`, `deletedAt` - Timestamps

### UserTokens Table
- `id` - Primary key
- `userId` - Foreign key to users
- `tokenHash` - Hashed refresh token
- `expiresAt` - Expiration timestamp
- `deviceType`, `ipAddress`, `userAgent` - Session metadata
- `revoked`, `replacedBy` - Token rotation fields

## 🚦 Environment Variables

### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=leads_db

# JWT
JWT_SECRET=your_secret_key_here
ACCESS_EXPIRES_IN=15m
ACCESS_EXPIRES_MS=900000
REFRESH_EXPIRES_IN=7d
REFRESH_EXPIRES_MS=604800000

# Server
PORT=3000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:4200
```

## 📄 License

MIT

## 👤 Author

Your Name - [@yourusername](https://github.com/yourusername)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## ⭐ Show your support

Give a ⭐️ if this project helped you!
