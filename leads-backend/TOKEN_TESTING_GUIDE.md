# 🔐 Token Testing & Debugging Guide

## Current Configuration
- **Access Token:** Expires in 15 minutes
- **Refresh Token:** Expires in 7 days
- **Table:** `user_tokens` (stores hashed refresh tokens)

## Step-by-Step Testing

### 1️⃣ Check Backend is Running
Make sure the NestJS backend is running on port 3000:
```bash
cd /Users/user/Documents/projects/leads-backend
npm run start:dev
```

### 2️⃣ Check Database Connection
Open your MySQL client (TablePlus, MySQL Workbench, etc.) and run:
```sql
-- Check if user_tokens table exists
SHOW TABLES LIKE 'user%';

-- Check table structure
DESCRIBE user_tokens;

-- Check current data (should be empty initially)
SELECT * FROM user_tokens;
```

### 3️⃣ Test Login (Creates Tokens)

**Option A: Using the Angular App**
1. Open http://localhost:4200/admin/login
2. Login with your admin credentials
3. Watch the backend console for logs:
   - `💾 [ADMIN] Storing refresh token for user: X`
   - `📅 [ADMIN] Refresh token will expire at: ...`
   - `✅ [ADMIN] Refresh token saved successfully! ID: ...`

**Option B: Using cURL**
```bash
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password"}' \
  -c cookies.txt \
  -v
```

### 4️⃣ Verify Token was Saved
Run in MySQL:
```sql
SELECT 
  id,
  user_id,
  LEFT(token_hash, 20) as token_preview,
  expires_at,
  revoked,
  created_at
FROM user_tokens
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Result:**
- You should see 1 row
- `user_id` should match your admin user ID
- `expires_at` should be ~7 days in the future
- `revoked` should be `0` (false)

### 5️⃣ Test Token Refresh (After 15+ Minutes)

**Option A: Natural Expiration**
1. Stay logged in for 16 minutes (access token expires)
2. Try to navigate to any admin page
3. Watch backend console for refresh logs:
   - `🔄 Refreshing tokens...`
   - `👤 User ID from refresh token: X`
   - `🔍 Found X valid token(s) for user`
   - `✅ Refresh token validated! Generating new tokens...`
   - `✅ Token refresh successful! New token ID: ...`
4. Page should load successfully (not redirect to login)

**Option B: Force Refresh with cURL**
```bash
# Wait 16 minutes after login, then:
curl -X POST http://localhost:3000/api/auth/refresh \
  -b cookies.txt \
  -c cookies.txt \
  -v
```

**Option C: Manually Test Refresh Immediately**
```bash
# Get your refresh token from browser DevTools > Application > Cookies
# Then test the refresh endpoint:
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Cookie: refreshToken=YOUR_REFRESH_TOKEN_HERE" \
  -v
```

### 6️⃣ Check Token Rotation
After refreshing, check the database again:
```sql
SELECT 
  id,
  user_id,
  revoked,
  replaced_by,
  expires_at,
  created_at
FROM user_tokens
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Result:**
- You should see 2 rows now
- The OLD token should have `revoked = 1`
- The OLD token should have `replaced_by = <new_token_id>`
- The NEW token should have `revoked = 0`

## 🐛 Troubleshooting

### Issue: `user_tokens` table is still empty after login

**Check 1: Database Connection**
```sql
-- Can you insert manually?
INSERT INTO user_tokens (user_id, token_hash, expires_at, revoked)
VALUES (1, 'test_hash', DATE_ADD(NOW(), INTERVAL 7 DAY), 0);

SELECT * FROM user_tokens;
```

**Check 2: Backend Logs**
Look for:
- `💾 [ADMIN] Storing refresh token` - If missing, service not being called
- `❌ [ADMIN] Failed to save` - If present, shows the error
- Any TypeORM errors about the table

**Check 3: Entity Registration**
Verify in `src/auth/auth.module.ts`:
```typescript
TypeOrmModule.forFeature([User, UserToken])
```

### Issue: Tokens not refreshing (getting logged out)

**Check 1: Interceptor URL**
In `contact-us-app/src/app/services/auth.interceptor.ts`:
```typescript
// Should be absolute URL:
http.post<any>('http://localhost:3000/api/auth/refresh', ...)
// NOT relative URL:
// '/api/auth/refresh'
```

**Check 2: Cookies**
Open DevTools > Application > Cookies:
- `accessToken` should exist
- `refreshToken` should exist
- Both should have `HttpOnly` flag
- Check expiration dates

**Check 3: Backend Refresh Logs**
When token refresh fails, check for:
- `🔄 Refreshing tokens...` - Is endpoint being called?
- `🔍 Found 0 valid token(s)` - No tokens in database
- `❌ No matching refresh token found` - Token doesn't match database

### Issue: Getting 401 errors constantly

**Possible Causes:**
1. `user_tokens` table is empty (tokens not being saved)
2. Refresh endpoint using wrong URL (interceptor bug)
3. JWT_SECRET mismatch between token generation and validation
4. Cookies not being sent (CORS or SameSite issues)

**Fix:**
```bash
# Check .env file has JWT_SECRET
cat /Users/user/Documents/projects/leads-backend/.env | grep JWT_SECRET

# Should see something like:
# JWT_SECRET=your_secret_key_here

# If missing, add it:
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
```

## ✅ Success Criteria

After completing all steps, you should have:
1. ✅ Login creates a row in `user_tokens` table
2. ✅ Access token expires after 15 minutes
3. ✅ Refresh happens automatically in the background
4. ✅ Old tokens are revoked, new tokens are created
5. ✅ You stay logged in for 7 days without re-entering password
6. ✅ After 7 days, you're redirected to login page

## 📊 Expected Database State

**After 1 Login:**
```
user_tokens: 1 row (revoked=0)
```

**After 1 Refresh:**
```
user_tokens: 2 rows
  - Row 1: revoked=1, replaced_by=<new_id>
  - Row 2: revoked=0, replaced_by=NULL
```

**After Logout:**
```
user_tokens: All rows for user have revoked=1
```

## 🎯 Next Steps

1. **Test login** - Check backend logs and database
2. **If tokens not saving** - Check backend console for errors
3. **Wait 16 minutes** - Test automatic refresh
4. **If refresh fails** - Check interceptor URL and backend logs
5. **Report findings** - Share what you see in logs and database
