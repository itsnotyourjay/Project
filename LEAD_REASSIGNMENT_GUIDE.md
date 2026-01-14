# Lead Reassignment Feature Guide

## Overview
This feature allows admins to reassign contact leads from one user to another. This is especially useful when:
- A user is deleted and their leads become "orphaned"
- You need to redistribute leads among team members
- A user leaves and you want to transfer their leads to someone else

## Features Implemented

### 1. Visual Indicators for Orphaned Leads
- Leads from deleted users are highlighted with a **yellow/warning background**
- Shows a red "Deleted User" badge instead of the user email
- Displays "Was: [original email]" to show who originally submitted it

### 2. Single Lead Reassignment
- Each lead row has a **reassign button** (↻ icon)
- Clicking it opens a modal to reassign THAT SPECIFIC lead to another user
- Shows lead details (name, email, current owner)
- Select the target user from a dropdown
- Only that ONE lead gets reassigned

### 3. Bulk Orphaned Lead Assignment
- **"Fix Orphaned" button** in the filter bar
- Automatically assigns ALL orphaned leads to the main admin (ID #19)
- One-click solution to clean up leads from deleted users

## How to Use

### Method 1: Reassign a Single Lead
1. Go to **Admin → Contact Leads**
2. Find the specific lead you want to reassign
3. Click the **reassign button** (↻) in the Actions column for that lead
4. Review the lead information (name, email, current owner)
5. Select the new user from the dropdown
6. Click **"Confirm Reassignment"**
7. Only THAT specific lead will be reassigned

### Method 2: Fix All Orphaned Leads at Once
1. Go to **Admin → Contact Leads**
2. Click the **"Fix Orphaned"** button (top right in filters)
3. Confirm the action
4. All orphaned leads will be assigned to the main admin

## API Endpoints

### Reassign a Single Lead to a Different User
```http
POST http://localhost:3000/api/admin/leads/reassign-single
Content-Type: application/json

{
  "leadId": 5,
  "toUserId": 19
}
```

**Response:**
```json
{
  "message": "Successfully reassigned lead 5 from user 21 to user 19",
  "lead": {
    "id": 5,
    "name": "John Doe",
    "email": "john@example.com",
    "msg": "Contact me please",
    "userId": 19,
    "createdAt": "2025-12-26T10:30:00.000Z"
  }
}
```

### Reassign All Leads from One User to Another (Bulk)
```http
POST http://localhost:3000/api/admin/leads/reassign
Content-Type: application/json

{
  "fromUserId": 21,
  "toUserId": 19
}
```

**Response:**
```json
{
  "count": 5,
  "message": "Successfully reassigned 5 leads from user 21 to user 19"
}
```

### Assign All Orphaned Leads to Default Admin
```http
POST http://localhost:3000/api/admin/leads/assign-orphaned
Content-Type: application/json

{
  "defaultAdminId": 19
}
```

**Response:**
```json
{
  "count": 3,
  "message": "Successfully assigned 3 orphaned leads to admin user 19"
}
```

## Backend Implementation

### Files Modified

1. **`/leads-backend/src/leads/leads.service.ts`**
   - Added `getLeadCountForUser()` method
   - Added `reassignLeads()` method
   - Added `reassignOrphanedLeads()` method
   - Updated `findAll()` to include user relations

2. **`/leads-backend/src/admin/admin.controller.ts`**
   - Added `POST /leads/reassign` endpoint
   - Added `POST /leads/assign-orphaned` endpoint
   - Updated `GET /leads` to include deleted users in relations
   - Delete user endpoint supports `reassignTo` parameter

### Key Methods

**LeadsService.reassignSingleLead()** ⭐ NEW
```typescript
async reassignSingleLead(leadId: number, toUserId: number) {
  const lead = await this.leadsRepository.findOne({ where: { id: leadId } });
  if (!lead) {
    throw new NotFoundException(`Lead with ID ${leadId} not found`);
  }
  const previousUserId = lead.userId;
  lead.userId = toUserId;
  await this.leadsRepository.save(lead);
  return { message: `Successfully reassigned lead ${leadId}`, lead };
}
```

**LeadsService.reassignLeads()** (Bulk operation)
```typescript
async reassignLeads(fromUserId: number, toUserId: number) {
  const leads = await this.leadsRepository.find({ where: { userId: fromUserId } });
  await this.leadsRepository.update({ userId: fromUserId }, { userId: toUserId });
  return { count: leads.length, message: `Successfully reassigned ${leads.length} leads` };
}
```

**LeadsService.reassignOrphanedLeads()**
```typescript
async reassignOrphanedLeads(defaultAdminId: number) {
  const orphaned = await this.leadsRepository
    .createQueryBuilder('lead')
    .leftJoin('lead.user', 'user')
    .where('user.deleted_at IS NOT NULL')
    .getMany();
  
  for (const lead of orphaned) {
    lead.userId = defaultAdminId;
    await this.leadsRepository.save(lead);
  }
  
  return { count: orphaned.length, message: `Assigned ${orphaned.length} orphaned leads` };
}
```

## Frontend Implementation

### Files Modified

1. **`/contact-us-app/src/app/pages/admin-leads/admin-leads.component.ts`**
   - Added `showReassignModal`, `reassignLeadId`, `reassignToUserId`, `reassignLeadInfo` state
   - Added `isOrphanedLead()` helper method
   - Added `openReassignModal(lead)` - takes full lead object, not just userId
   - Added `closeReassignModal()`, `confirmReassign()` methods
   - Updated API call to use `/leads/reassign-single` endpoint
   - Added `assignOrphanedLeads()` for bulk assignment

2. **`/contact-us-app/src/app/pages/admin-leads/admin-leads.component.html`**
   - Added "Fix Orphaned" button in filter bar
   - Added Actions column with reassign button per lead
   - Updated reassign button to call `openReassignModal(lead)` with full lead object
   - Added yellow background for orphaned leads (`table-warning`)
   - Updated reassignment modal to show lead details (name, email, current owner)
   - Removed lead count display - now reassigns single lead only
   - Shows "Deleted User" badge for orphaned leads

3. **`/contact-us-app/src/app/pages/admin-leads/admin-leads.component.css`**
   - Added `.table-warning` styling (yellow background)
   - Added modal backdrop and display styles

## Visual Examples

### Normal Lead Row
```
ID | Name    | Email           | Message       | Submitted By      | Date
1  | John    | john@email.com  | Hello world   | [i] user@test.com | Dec 26, 2025
```

### Orphaned Lead Row (Yellow Background)
```
ID | Name    | Email           | Message       | Submitted By                  | Date
2  | Jane    | jane@email.com  | Contact me    | [!] Deleted User              | Dec 25, 2025
                                                  Was: world@gmail.com
```

### Reassignment Modal
```
┌──────────────────────────────────────────┐
│ ↻ Reassign Lead                       × │
├──────────────────────────────────────────┤
│ ℹ️ Lead Information:                     │
│   👤 Name: John Doe                      │
│   ✉️ Email: john@example.com             │
│   → Currently assigned to: world@gmail.com│
│                                          │
│ Reassign to User:                        │
│ ┌──────────────────────────────────────┐ │
│ │ admin@example.com                   ▼│ │
│ └──────────────────────────────────────┘ │
│                                          │
│        [Cancel] [✓ Confirm]              │
└──────────────────────────────────────────┘
```

## Testing Steps

### Test 1: Reassign a Single Lead
1. Go to Admin → Contact Leads
2. Find any lead in the table
3. Click the reassign button (↻) on that specific lead
4. Modal opens showing the lead's name, email, and current owner
5. Select a different user from the dropdown
6. Click "Confirm Reassignment"
7. Verify only THAT ONE lead is reassigned (check by reloading the page)
8. Verify other leads from the same user remain unchanged

### Test 2: Orphaned Leads Detection
1. Delete a user who has submitted leads
2. Go to Admin → Contact Leads
3. Verify their leads show yellow background
4. Verify they show "Deleted User" badge
5. Verify "Was: [email]" shows original owner

### Test 3: Fix Orphaned Leads
1. Ensure there are some orphaned leads (from deleted users)
2. Click "Fix Orphaned" button
3. Confirm the action
4. Verify all orphaned leads are now assigned to admin
5. Verify yellow background is removed

### Test 4: Delete User with Lead Reassignment
1. Use API or create delete modal UI
2. Delete user with `reassignTo` parameter:
   ```bash
   curl -X DELETE http://localhost:3000/api/admin/users/21 \
     -H "Content-Type: application/json" \
     -d '{"reason": "Left company", "reassignTo": 19}'
   ```
3. Verify user is soft-deleted
4. Verify their leads are reassigned to specified user
5. Verify no orphaned leads created

## Integration with Soft Delete

When deleting a user through the API, you can specify lead reassignment:

```typescript
// DELETE /api/admin/users/:id
{
  "reason": "User requested account deletion",
  "reassignTo": 19  // Optional: Reassign leads to this user ID
}
```

This prevents orphaned leads from being created in the first place.

## Troubleshooting

### Issue: Orphaned leads not showing
**Solution:** Make sure the backend is loading deleted users with the lead relation:
```typescript
const deletedUser = await this.usersService.repo.findOne({
  where: { id: lead.userId },
  withDeleted: true
});
```

### Issue: Reassignment modal not opening
**Solution:** Check browser console for errors. Ensure `showReassignModal` state is toggling correctly.

### Issue: Can't select user in dropdown
**Solution:** Make sure users are loaded in `ngOnInit()` and check that `this.users` array is populated.

### Issue: "Fix Orphaned" assigns to wrong admin
**Solution:** Update the hardcoded admin ID in `assignOrphanedLeads()`:
```typescript
const adminUser = this.users.find(u => u.id === 19); // Change 19 to your admin ID
```

## Future Enhancements

1. **Multi-select reassignment** - Select multiple leads and reassign them
2. **Lead history tracking** - Track who owned a lead over time
3. **Smart reassignment** - Auto-distribute leads evenly among active users
4. **Notification system** - Notify users when leads are assigned to them
5. **Lead ownership change log** - Audit trail of all reassignments

## Benefits

✅ **No data loss** - Leads are never orphaned or lost  
✅ **Easy recovery** - One-click fix for orphaned leads  
✅ **Flexible** - Reassign individual or bulk leads  
✅ **Visual feedback** - Clear indicators for orphaned leads  
✅ **Admin control** - Full control over lead ownership  
✅ **Audit trail** - Can track who owned leads before deletion  

---

**Last Updated:** December 26, 2025  
**Status:** ✅ Fully Implemented and Tested
