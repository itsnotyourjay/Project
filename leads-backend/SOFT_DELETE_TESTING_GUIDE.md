# 🗑️ Soft Delete Implementation - Testing Guide

## ✅ Step 1: Database Setup (YOU DO THIS IN phpMyAdmin)

Run this SQL in phpMyAdmin:

```sql
-- Add soft delete columns to user table
ALTER TABLE `user` 
  ADD COLUMN `deleted_at` DATETIME(6) NULL DEFAULT NULL,
  ADD COLUMN `deleted_by` INT NULL DEFAULT NULL,
  ADD COLUMN `deletion_reason` TEXT NULL DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX `idx_user_deleted_at` ON `user`(`deleted_at`);
```

---

## ✅ Step 2: Backend Code (ALREADY DONE!)

All backend code has been updated:
- ✅ User entity with soft delete columns
- ✅ UsersService with soft delete methods
- ✅ LeadsService with reassignment methods
- ✅ AdminController with new endpoints

---

## 🧪 Step 3: Test the API Endpoints

### **Test 1: Get All Users (Including Deleted)**

```bash
GET http://localhost:3000/api/admin/users?includeDeleted=true
```

### **Test 2: Get Only Deleted Users**

```bash
GET http://localhost:3000/api/admin/users/deleted/list
```

### **Test 3: Soft Delete a User (Without Lead Reassignment)**

```bash
DELETE http://localhost:3000/api/admin/users/21
Content-Type: application/json

{
  "reason": "User requested account deletion"
}
```

Expected Response:
```json
{
  "message": "User test@example.com has been soft deleted",
  "deletedUser": {
    "id": 21,
    "email": "test@example.com",
    "deleted_at": "2025-12-23T10:30:00.000Z",
    "deleted_by": 16,
    "deletion_reason": "User requested account deletion"
  },
  "leadCount": 5,
  "leadsReassigned": 0,
  "reassignedTo": null
}
```

### **Test 4: Soft Delete a User (WITH Lead Reassignment)**

```bash
DELETE http://localhost:3000/api/admin/users/21
Content-Type: application/json

{
  "reason": "Policy violation",
  "reassignTo": 16
}
```

Expected Response:
```json
{
  "message": "User test@example.com has been soft deleted",
  "deletedUser": { ... },
  "leadCount": 5,
  "leadsReassigned": 5,
  "reassignedTo": 16
}
```

### **Test 5: Restore a Deleted User**

```bash
POST http://localhost:3000/api/admin/users/21/restore
```

Expected Response:
```json
{
  "message": "User test@example.com has been restored",
  "user": {
    "id": 21,
    "email": "test@example.com",
    "deleted_at": null,
    "deleted_by": null,
    "deletion_reason": null
  }
}
```

### **Test 6: Manually Reassign Leads**

```bash
POST http://localhost:3000/api/admin/leads/reassign
Content-Type: application/json

{
  "fromUserId": 21,
  "toUserId": 16
}
```

Expected Response:
```json
{
  "count": 5,
  "message": "Successfully reassigned 5 leads from user 21 to user 16"
}
```

### **Test 7: Assign Orphaned Leads to Admin**

```bash
POST http://localhost:3000/api/admin/leads/assign-orphaned
Content-Type: application/json

{
  "defaultAdminId": 16
}
```

Expected Response:
```json
{
  "count": 12,
  "message": "Reassigned 12 orphaned leads to admin 16"
}
```

### **Test 8: Hard Delete (PERMANENT - Use with Caution!)**

```bash
DELETE http://localhost:3000/api/admin/users/21/permanent
```

Expected Response:
```json
{
  "message": "User with ID 21 has been permanently deleted",
  "warning": "This action cannot be undone"
}
```

---

## 📊 Database Verification

After soft deleting a user, check the database:

```sql
-- View all users including deleted
SELECT 
  id,
  email,
  deleted_at,
  deleted_by,
  deletion_reason
FROM user
ORDER BY deleted_at DESC;

-- View only deleted users
SELECT 
  id,
  email,
  deleted_at,
  deleted_by,
  deletion_reason
FROM user
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;

-- Check leads after reassignment
SELECT 
  l.id,
  l.name,
  l.email,
  l.userId,
  u.email as user_email,
  u.deleted_at as user_deleted
FROM lead l
LEFT JOIN user u ON l.userId = u.id
ORDER BY l.id DESC;
```

---

## 🔄 Typical Workflow

### Scenario: Delete User with Leads

1. **Admin views user details**
   - `GET /api/admin/users/21`
   - Sees user has 5 leads

2. **Admin decides to delete user**
   - Opens delete modal in frontend
   - Sees option to reassign leads to another user

3. **Admin selects reassignment target**
   - Chooses admin user (ID: 16) from dropdown
   - Enters reason: "Policy violation"

4. **Admin confirms deletion**
   - `DELETE /api/admin/users/21`
   - Body: `{ "reason": "Policy violation", "reassignTo": 16 }`

5. **Backend processes**
   - ✅ Reassigns 5 leads from user 21 to user 16
   - ✅ Marks user 21 as deleted (sets deleted_at, deleted_by, deletion_reason)
   - ✅ User 21 cannot log in anymore
   - ✅ All data preserved for audit

6. **Admin can view deleted users**
   - `GET /api/admin/users?includeDeleted=true`
   - Sees user 21 with "Deleted" badge and deletion info

7. **Admin can restore if needed**
   - `POST /api/admin/users/21/restore`
   - User 21 can log in again
   - Leads remain with user 16 (manual reassignment needed to restore)

---

## 🚨 Important Notes

### **Soft Delete vs Hard Delete**

**Soft Delete (Default):**
- ✅ Sets `deleted_at` timestamp
- ✅ User cannot log in
- ✅ Data preserved for audit
- ✅ Can be restored anytime
- ✅ Use for: normal user deletions, GDPR requests (temporarily)

**Hard Delete (Permanent):**
- ❌ Completely removes user from database
- ❌ Cannot be undone
- ❌ All related data must be handled first
- ❌ Use for: extreme cases only (spam accounts, etc.)

### **Lead Handling Options**

**Option 1: Reassign During Delete**
```json
{
  "reason": "User violated terms",
  "reassignTo": 16
}
```
- Leads automatically transferred
- No orphaned data

**Option 2: Leave Orphaned**
```json
{
  "reason": "User requested deletion"
}
```
- Leads remain connected to deleted user
- Can bulk reassign later using `/api/admin/leads/assign-orphaned`

**Option 3: Manual Reassignment**
```json
// First delete user
DELETE /api/admin/users/21

// Later, manually reassign
POST /api/admin/leads/reassign
{ "fromUserId": 21, "toUserId": 16 }
```

---

## 🎯 Next Steps

After database migration:

1. ✅ Run SQL in phpMyAdmin (add columns)
2. ✅ Restart NestJS backend (`npm run start:dev`)
3. ✅ Test soft delete endpoint
4. ✅ Verify data in database
5. ✅ Update frontend UI (next step)

---

## 🔍 Troubleshooting

### Error: "Column 'deleted_at' doesn't exist"
- Run the ALTER TABLE SQL in phpMyAdmin first!

### Error: "Cannot read property 'id' of undefined"
- Make sure you're logged in as admin
- Check that `@Req() req` contains user data

### Leads still showing for deleted user
- This is expected! Soft delete doesn't cascade
- Use reassignment endpoints to move leads

### User can still log in after soft delete
- Check auth middleware excludes soft-deleted users
- Update JwtStrategy to check `deleted_at IS NULL`

---

## 📝 Summary

**What You Get:**
- ✅ Soft delete with full audit trail
- ✅ Lead reassignment (automatic or manual)
- ✅ Restore deleted users
- ✅ View deletion history
- ✅ GDPR compliant (data retention)
- ✅ Hard delete option for extreme cases

**API Endpoints Added:**
- `GET /api/admin/users?includeDeleted=true` - Get all users including deleted
- `GET /api/admin/users/deleted/list` - Get only deleted users
- `DELETE /api/admin/users/:id` - Soft delete with optional reassignment
- `POST /api/admin/users/:id/restore` - Restore deleted user
- `DELETE /api/admin/users/:id/permanent` - Hard delete (permanent)
- `POST /api/admin/leads/reassign` - Manually reassign leads
- `POST /api/admin/leads/assign-orphaned` - Bulk assign orphaned leads

All backend code is ready! Just run the SQL migration and test! 🚀
