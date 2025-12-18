# Admin Credentials Setup

## Default Admin User

The system includes a default admin user with the following credentials:

```
Email: admin@example.com
Password: admin1234
```

## How to Create/Update Admin User

### Option 1: Using the Seed Script (Recommended)

Run the following command from the `leads-backend` directory:

```bash
npm run seed:admin
```

This script will:
- Create a new admin user if one doesn't exist
- Update existing user to admin if the email already exists
- Hash the password securely using bcrypt

### Option 2: Manual SQL

If you prefer to manually update the database:

```sql
-- Step 1: Add isAdmin column (if not already added)
ALTER TABLE `user` ADD COLUMN `isAdmin` TINYINT(1) NOT NULL DEFAULT 0;

-- Step 2: Update existing user to admin
UPDATE `user` SET `isAdmin` = 1 WHERE `email` = 'admin@example.com';

-- Or create a new admin user (password needs to be hashed)
INSERT INTO `user` (email, password, isAdmin, registeredAt, updatedAt) 
VALUES ('admin@example.com', '$2b$10$hashedPasswordHere', 1, NOW(), NOW());
```

## Login URLs

- **User Login**: `http://localhost:4200/login`
- **Admin Login**: `http://localhost:4200/admin/login`

## Security Notes

⚠️ **Important**: Change the default admin password in production!

To change the admin password:
1. Login as admin
2. Navigate to profile/settings (when implemented)
3. Change password through the UI

Or manually in database:
```sql
-- Hash a new password using bcrypt (bcrypt.hash('newPassword', 10))
UPDATE `user` SET `password` = '$2b$10$yourNewHashedPassword' WHERE `email` = 'admin@example.com';
```

## Admin Access

Admin users have access to:
- `/admin/dashboard` - Admin dashboard
- `/admin/*` - All admin routes
- All regular user routes

Regular users:
- Cannot access `/admin/*` routes
- Redirected to `/admin/login` if they try to access admin areas
