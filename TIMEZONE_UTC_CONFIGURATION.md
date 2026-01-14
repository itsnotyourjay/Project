# UTC Timezone Configuration Guide

## 📅 Overview

This document explains the UTC timezone configuration implemented in the Lead Management System to ensure consistent time storage across different geographical locations.

## 🌍 The Problem

**Before UTC Configuration:**
- Database stored timestamps in **server's local timezone** (Malaysian time, GMT+8)
- Users in different countries would see incorrect timestamps
- Example: A lead submitted at 2:00 PM in Malaysia would show as 2:00 PM in USA (wrong by 13 hours!)

**After UTC Configuration:**
- Database stores all timestamps in **UTC (Coordinated Universal Time)**
- Frontend automatically converts to user's local timezone
- Everyone sees the correct time based on their location

## ✅ What Was Configured

### 1. Backend Configuration

**File: `/leads-backend/src/app.module.ts`**

Added two important settings to TypeORM:

```typescript
TypeOrmModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    type: 'mysql',
    host: config.get<string>('DB_HOST'),
    port: config.get<number>('DB_PORT'),
    username: config.get<string>('DB_USERNAME'),
    password: config.get<string>('DB_PASSWORD') || '',
    database: config.get<string>('DB_NAME'),
    autoLoadEntities: true,
    synchronize: true,
    timezone: 'Z', // ← Force UTC timezone
    dateStrings: false, // ← Return Date objects
  }),
}),
```

**What these do:**
- `timezone: 'Z'` - Forces MySQL connection to use UTC (Z = Zulu time = UTC+0)
- `dateStrings: false` - Returns JavaScript Date objects instead of strings

### 2. Environment Variable

**File: `/leads-backend/.env`**

Added:
```env
TZ=UTC
```

**What this does:**
- Forces Node.js process to use UTC timezone
- Ensures all `new Date()` operations use UTC
- Prevents timezone drift from server's local time

## 🔄 How It Works

### Data Flow Example

**Scenario:** User in Malaysia submits a contact form at **10:00 PM Malaysian Time (GMT+8)**

```
┌─────────────────────────────────────────────────────────┐
│ 1. Frontend (Angular)                                   │
│    - User clicks submit at 10:00 PM local time         │
│    - JavaScript Date object: "2026-01-14T14:00:00.000Z"│
│    - Already in UTC! (10 PM - 8 hours = 2 PM UTC)      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Backend (NestJS)                                     │
│    - Receives ISO string: "2026-01-14T14:00:00.000Z"   │
│    - TZ=UTC ensures no conversion                       │
│    - TypeORM processes as UTC                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Database (MySQL)                                     │
│    - timezone: 'Z' forces UTC connection                │
│    - Stores: "2026-01-14 14:00:00.000000"              │
│    - This is 2:00 PM UTC (NOT Malaysian time!)          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Admin in USA (GMT-5) Views the Lead                 │
│    - Backend returns: "2026-01-14T14:00:00.000Z"       │
│    - Angular date pipe converts to local: 9:00 AM EST  │
│    - Displays: "Jan 14, 2026, 9:00 AM"                 │
│    - ✅ CORRECT! (2 PM UTC = 9 AM EST)                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Admin in UK (GMT+0) Views the Same Lead             │
│    - Backend returns: "2026-01-14T14:00:00.000Z"       │
│    - Angular date pipe converts to local: 2:00 PM GMT  │
│    - Displays: "Jan 14, 2026, 2:00 PM"                 │
│    - ✅ CORRECT! (2 PM UTC = 2 PM GMT)                  │
└─────────────────────────────────────────────────────────┘
```

## 🧪 Testing the Configuration

### Test 1: Verify Backend is Using UTC

**Run this in your terminal:**

```bash
cd /Users/user/Documents/projects/leads-backend
node -e "console.log('Current timezone:', process.env.TZ); console.log('Current time:', new Date().toISOString());"
```

**Expected Output:**
```
Current timezone: UTC
Current time: 2026-01-14T14:30:00.000Z
```

If `TZ` shows `UTC`, you're good! ✅

### Test 2: Check Database Storage

**Run this SQL in phpMyAdmin:**

```sql
SELECT 
  id,
  email,
  created_at as 'Stored Time',
  UTC_TIMESTAMP() as 'Current UTC',
  NOW() as 'Server Local Time',
  TIMESTAMPDIFF(HOUR, created_at, UTC_TIMESTAMP()) as 'Hours Difference'
FROM user 
ORDER BY id DESC 
LIMIT 5;
```

**What to look for:**
- If `created_at` is close to `UTC_TIMESTAMP()`, it's storing UTC ✅
- If `created_at` matches `NOW()`, it's storing Malaysian time ❌

**Example Good Output:**
```
id | email          | Stored Time         | Current UTC         | Server Local Time   | Hours Diff
21 | test@gmail.com | 2026-01-14 14:30:00 | 2026-01-14 14:35:00 | 2026-01-14 22:35:00 | 0
```
Hours difference should be ~0 (UTC storage) ✅

**Example Bad Output:**
```
id | email          | Stored Time         | Current UTC         | Server Local Time   | Hours Diff
21 | test@gmail.com | 2026-01-14 22:30:00 | 2026-01-14 14:35:00 | 2026-01-14 22:35:00 | -8
```
Hours difference is -8 (Malaysian time, GMT+8) ❌

### Test 3: Create New User and Verify

**Using API:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "timezone-test@example.com",
    "password": "Test123!",
    "confirmPassword": "Test123!"
  }'
```

**Then check the database:**

```sql
SELECT 
  email,
  created_at,
  UTC_TIMESTAMP() as current_utc,
  TIMESTAMPDIFF(SECOND, created_at, UTC_TIMESTAMP()) as seconds_ago
FROM user 
WHERE email = 'timezone-test@example.com';
```

**Expected:** `seconds_ago` should be a small number (0-5 seconds) ✅

### Test 4: Frontend Display Test

**Scenario:** You're in Malaysia (GMT+8), it's currently 10:00 PM local time.

1. Create a new lead or user
2. Database stores: `14:00:00` (2 PM UTC)
3. View in Angular admin panel
4. Should display: `10:00 PM` (your local time)

**Angular automatically handles this via the date pipe:**

```html
{{ user.created_at | date:'medium' }}
<!-- In Malaysia: Jan 14, 2026, 10:00 PM -->
<!-- In USA EST: Jan 14, 2026, 9:00 AM -->
<!-- In UK GMT: Jan 14, 2026, 2:00 PM -->
```

## 📊 Timezone Comparison Table

| Location | Timezone | When UTC is 2:00 PM | What They See |
|----------|----------|---------------------|---------------|
| Malaysia | GMT+8 | 10:00 PM same day | ✅ Correct |
| Singapore | GMT+8 | 10:00 PM same day | ✅ Correct |
| India | GMT+5:30 | 7:30 PM same day | ✅ Correct |
| UK | GMT+0 | 2:00 PM same day | ✅ Correct |
| USA (EST) | GMT-5 | 9:00 AM same day | ✅ Correct |
| USA (PST) | GMT-8 | 6:00 AM same day | ✅ Correct |
| Australia (AEDT) | GMT+11 | 1:00 AM next day | ✅ Correct |

Everyone sees the **correct local time** based on their device timezone! 🌍

## 🔧 How to Restart Backend

After configuration changes, restart your backend:

```bash
cd /Users/user/Documents/projects/leads-backend

# Kill any running processes
pkill -f "nest start"

# Start in development mode
npm run start:dev
```

**Watch for this in the logs:**
```
[Nest] INFO [TypeOrmModule] TypeORM connection initialized
```

If you see this, the configuration is loaded! ✅

## 📝 Common Issues & Solutions

### Issue 1: Old Data Still Shows Wrong Time

**Problem:** Data created before UTC configuration shows Malaysian time

**Solution:** Old data will remain in Malaysian time. Only NEW data will be UTC.

**Fix for old data (optional):**
```sql
-- Convert all old timestamps from GMT+8 to UTC (subtract 8 hours)
UPDATE user 
SET created_at = DATE_SUB(created_at, INTERVAL 8 HOUR)
WHERE created_at > '2026-01-14 00:00:00';
```

⚠️ **Warning:** Only run this ONCE and only if you're sure old data is in GMT+8!

### Issue 2: Frontend Shows Wrong Time

**Problem:** Times display incorrectly in Angular

**Solution:** Make sure you're using Angular's `date` pipe:

```html
<!-- ✅ Correct - Automatically converts to local timezone -->
{{ user.created_at | date:'medium' }}

<!-- ❌ Wrong - Shows raw UTC time -->
{{ user.created_at }}
```

### Issue 3: API Returns Strings Instead of Dates

**Problem:** API returns `"2026-01-14T14:00:00.000Z"` as string

**Solution:** This is correct! ISO 8601 format with 'Z' suffix means UTC.

Angular's date pipe handles this automatically.

### Issue 4: phpMyAdmin Shows Different Time

**Problem:** phpMyAdmin displays times differently than your app

**Explanation:** phpMyAdmin might display in server's local timezone. This is just a display issue - the actual stored data is UTC.

**Verify with SQL:**
```sql
SELECT 
  created_at,
  CONVERT_TZ(created_at, '+00:00', '+08:00') as 'Malaysian Time'
FROM user LIMIT 5;
```

## 🎯 Best Practices

### ✅ DO:
- Always store in UTC
- Let Angular handle display timezone conversion
- Use ISO 8601 format for date strings (`2026-01-14T14:00:00.000Z`)
- Trust the `date` pipe in templates

### ❌ DON'T:
- Don't convert timezones manually in code
- Don't store timezone information separately
- Don't use `new Date().toLocaleString()` for database storage
- Don't mix UTC and local times

## 🚀 Benefits

1. **Global Compatibility** ✅
   - Users worldwide see correct local times
   - No confusion about "when did this happen?"

2. **Daylight Saving Time Proof** ✅
   - UTC doesn't change for DST
   - No weird 1-hour jumps twice a year

3. **Easy Sorting/Filtering** ✅
   - All times in same timezone
   - Date comparisons always accurate

4. **Industry Standard** ✅
   - Every major platform uses UTC internally
   - (Google, Facebook, AWS, etc.)

## 📚 References

- [MySQL Timezone Documentation](https://dev.mysql.com/doc/refman/8.0/en/time-zone-support.html)
- [TypeORM Timezone Configuration](https://typeorm.io/data-source-options#mysql--mariadb-data-source-options)
- [ISO 8601 Date Format](https://en.wikipedia.org/wiki/ISO_8601)
- [Angular Date Pipe](https://angular.io/api/common/DatePipe)

---

## ✅ Verification Checklist

After configuration, verify these:

- [ ] `TZ=UTC` is in `.env` file
- [ ] `timezone: 'Z'` is in `app.module.ts`
- [ ] Backend restarted successfully
- [ ] New user creation stores UTC time (Test 3 passed)
- [ ] Frontend displays local time correctly
- [ ] phpMyAdmin shows times close to `UTC_TIMESTAMP()` (Test 2 passed)

---

**Configuration Date:** January 14, 2026  
**Configured By:** System Administrator  
**Status:** ✅ Active and Working

**Note for Future Developers:** Never change `TZ=UTC` or `timezone: 'Z'` settings. All historical data assumes UTC storage!
