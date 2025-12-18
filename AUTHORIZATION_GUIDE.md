# 🔐 Complete Authorization & Access Control Guide

## System Overview
This system uses **role-based access control (RBAC)** with two user types:
1. **Regular Users** - Can manage their own contacts/leads
2. **Admins** - Can view and manage all users and leads

---

## 👤 Regular User Access (Authenticated, isAdmin = false)

### ✅ **Can Access:**

#### Frontend Routes:
- `/contacts` - View their own contact list
- `/contacts/new` - Submit new contact/lead
- `/contacts/:id` - View/Edit/Delete their own contacts

#### Backend API Endpoints:
- `GET /api/leads` - Returns only contacts created by this user
- `POST /api/leads` - Create new contact (auto-assigned to user)
- `GET /api/leads/:id` - View contact IF it belongs to user
- `PATCH /api/leads/:id` - Edit contact IF it belongs to user
- `DELETE /api/leads/:id` - Delete contact IF it belongs to user

### ❌ **Cannot Access:**
- Any `/admin/*` routes (redirected to `/admin/login`)
- Contacts created by other users
- Admin API endpoints (401 Unauthorized)

### 🔒 **How It's Protected:**

**Frontend:**
```typescript
// AuthGuard checks:
1. Is user authenticated? → If NO, redirect to /login
2. Is user admin? → If YES, redirect to /admin/dashboard (admins can't access user routes)
3. Allow access ✅
```

**Backend:**
```typescript
// Every endpoint in LeadsController:
@UseGuards(AuthGuard('jwt'))  // Requires valid JWT token

// LeadsService.findAll(userId):
return leads.filter(lead => lead.userId === userId);  // Only user's own leads
```

---

## 👨‍💼 Admin User Access (Authenticated, isAdmin = true)

### ✅ **Can Access:**

#### Frontend Routes:
- `/admin/dashboard` - Statistics overview
- `/admin/users` - View all users in system
- `/admin/users/:id` - View/Edit/Delete specific user
- `/admin/leads` - View all leads from all users

#### Backend API Endpoints:
- `GET /api/admin/users` - All users
- `GET /api/admin/users/:id` - Specific user details + their leads
- `PATCH /api/admin/users/:id` - Update user (toggle admin status)
- `DELETE /api/admin/users/:id` - Delete user + their leads
- `GET /api/admin/leads` - All leads from all users
- `GET /api/admin/leads?userId=X` - Filter leads by user
- `GET /api/admin/stats` - System statistics

### ❌ **Cannot Access:**
- Regular user routes `/contacts` (redirected to `/admin/dashboard`)

### 🔒 **How It's Protected:**

**Frontend:**
```typescript
// AdminGuard checks:
1. Is user authenticated? → If NO, redirect to /admin/login
2. Is user admin? → If NO, redirect to /admin/login
3. Allow access ✅
```

**Backend:**
```typescript
// Every endpoint in AdminController:
@UseGuards(AuthGuard('jwt'), AdminGuard)

// AdminGuard checks:
if (!req.user?.isAdmin) {
  throw new ForbiddenException('Admin access required');
}
```

---

## 🚫 Unauthenticated Users (Not Logged In)

### ✅ **Can ONLY Access:**
- `/login` - User login page
- `/register` - User registration page
- `/admin/login` - Admin login page

### ❌ **Cannot Access:**
- Everything else (redirected to `/login`)

### 🔒 **How It's Protected:**

**Frontend:**
```typescript
// GuestGuard (on login/register pages):
1. Is user already logged in? → Redirect to dashboard
2. Not logged in? → Allow access to login/register ✅

// AuthGuard / AdminGuard (on all other pages):
1. Check authentication status via APP_INITIALIZER
2. If not authenticated → Redirect to login
```

**Backend:**
```typescript
// All API endpoints require:
@UseGuards(AuthGuard('jwt'))

// If no valid JWT token in cookies:
→ 401 Unauthorized
```

---

## 🔄 Authentication Flow

### 1️⃣ **User Registration**
```
POST /api/auth/register
  ↓
- Create user account
- Generate access token (15 min) + refresh token (7 days)
- Store refresh token in database
- Set httpOnly cookies
- Return user info
  ↓
Frontend: Redirect to /contacts
```

### 2️⃣ **User Login**
```
POST /api/auth/login
  ↓
- Validate credentials
- Check isAdmin flag
- Generate tokens
- Store refresh token
- Set cookies
  ↓
Frontend: Redirect based on role:
  - Regular user → /contacts
  - Admin → /admin/dashboard
```

### 3️⃣ **Admin Login**
```
POST /api/auth/admin/login
  ↓
- Validate credentials
- Check isAdmin === true (required!)
- Generate tokens
- Store refresh token
- Set cookies
  ↓
Frontend: Redirect to /admin/dashboard
```

### 4️⃣ **Token Refresh (Automatic)**
```
Every 15 minutes (when access token expires):
  ↓
Frontend Interceptor catches 401 error
  ↓
POST /api/auth/refresh (with refresh token cookie)
  ↓
Backend validates refresh token from database
  ↓
Generate new access token
  ↓
User stays logged in ✅
```

### 5️⃣ **Logout**
```
POST /api/auth/logout
  ↓
- Revoke all refresh tokens for user
- Clear cookies
  ↓
Frontend: Redirect to /login or /admin/login
```

---

## 🛡️ Security Layers

### Layer 1: Frontend Route Guards
```typescript
GuestGuard  → Protects login/register from logged-in users
AuthGuard   → Protects user routes from unauthenticated + admins
AdminGuard  → Protects admin routes from unauthenticated + regular users
```

### Layer 2: Backend Authentication
```typescript
@UseGuards(AuthGuard('jwt'))  → Validates JWT token
AdminGuard                     → Validates isAdmin flag
```

### Layer 3: Data Filtering
```typescript
Regular Users:
- LeadsService.findAll(userId) → Only returns user's own leads
- Update/Delete → Checks ownership before allowing

Admins:
- LeadsService.findAll() → Returns all leads (no userId filter)
- UsersService.findAll() → Returns all users
```

### Layer 4: Token Security
```typescript
- Tokens stored in httpOnly cookies (JavaScript can't access)
- Access token: 15 minutes (short-lived)
- Refresh token: 7 days (long-lived, stored in database)
- Token rotation on refresh (old token revoked)
```

---

## 📊 Access Control Matrix

| Resource | Unauthenticated | Regular User | Admin |
|----------|----------------|--------------|-------|
| Login/Register Pages | ✅ View | ❌ Redirect | ❌ Redirect |
| Own Contacts (View) | ❌ | ✅ | ❌ |
| Own Contacts (Add) | ❌ | ✅ | ❌ |
| Own Contacts (Edit) | ❌ | ✅ | ❌ |
| Own Contacts (Delete) | ❌ | ✅ | ❌ |
| Other User's Contacts | ❌ | ❌ | ✅ (View Only) |
| Admin Dashboard | ❌ | ❌ | ✅ |
| User Management | ❌ | ❌ | ✅ |
| All Leads | ❌ | ❌ | ✅ |
| System Stats | ❌ | ❌ | ✅ |

---

## 🎯 Key Takeaways

1. ✅ **No guest access** - All functionality requires authentication
2. ✅ **Role-based access** - System determines permissions via isAdmin flag
3. ✅ **Data isolation** - Users can only see/edit their own data
4. ✅ **Admin oversight** - Admins can view everything but separated from user flows
5. ✅ **Multiple security layers** - Frontend guards + Backend guards + Data filtering
6. ✅ **Secure tokens** - httpOnly cookies + token rotation + database validation

## 🔧 Current Status

✅ All authorization is correctly implemented
✅ Frontend guards are working
✅ Backend API protection is active
✅ Data filtering by userId is enforced
✅ Token system is functional (with recent fixes)

**No security gaps identified!** 🎉
