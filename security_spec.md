# Security Specification & Test Suite for Qalami Platform Firestore

## 1. Data Invariants
1. **User Invariant**: A user document at `/users/{userId}` can only be created or modified by the authenticated user whose `request.auth.uid == userId`. Users cannot impersonate another UID or modify other users' profiles.
2. **Document Ownership Invariant**: A document in `/documents/{documentId}` must have `userId == request.auth.uid` on creation. Updates must preserve `userId` and `createdAt` (immutable fields). Only the creator can edit or delete their document.
3. **Public Read vs Write Invariant**: Anyone signed in can read published study documents in `/documents/{documentId}` to learn and practice, but write/update/delete operations are strictly guarded by author ownership.
4. **Reminder Invariant**: Reminders in `/reminders/{reminderId}` belong exclusively to the user (`userId == request.auth.uid`). Users can only read, create, update, and delete their own reminders. Cross-user reminder access is strictly prohibited.
5. **Payload Size & Sanitization Invariant**: All strings must be bounded with maximum length limits. No unbounded strings or arbitrary shadow keys.

## 2. The "Dirty Dozen" Malicious Payloads

1. **Payload 1: Identity Spoofing on User Profile**
   - Attacker attempts to write to `/users/victim_user_123` with `request.auth.uid = attacker_uid`.
   - Expected: `PERMISSION_DENIED`.

2. **Payload 2: Shadow Keys Injection on User Profile**
   - Attacker sends extra unapproved keys: `{ id: 'uid', name: 'Hacker', role: 'student', isAdmin: true, superuser: true }`.
   - Expected: `PERMISSION_DENIED`.

3. **Payload 3: Oversized Name Injection (Denial of Wallet)**
   - Attacker sends `name` with 50,000 characters.
   - Expected: `PERMISSION_DENIED` due to `name.size() <= 100`.

4. **Payload 4: Document Creation with Spoofed userId**
   - User `uid_alice` creates document with `userId: 'uid_bob'`.
   - Expected: `PERMISSION_DENIED`.

5. **Payload 5: Document Update Stealing Ownership**
   - User `uid_alice` tries to update an existing document created by `uid_bob`.
   - Expected: `PERMISSION_DENIED`.

6. **Payload 6: Document Update Changing Immutable Fields**
   - Creator attempts to alter `userId` or `createdAt` on an existing document.
   - Expected: `PERMISSION_DENIED`.

7. **Payload 7: Unauthenticated Document Write**
   - Unauthenticated client attempts to create a document in `/documents/doc_1`.
   - Expected: `PERMISSION_DENIED`.

8. **Payload 8: Reminder Snooping (Cross-User List/Read)**
   - User `uid_alice` queries `/reminders` without filtering `userId == uid_alice`, attempting to read `uid_bob`'s study reminders.
   - Expected: `PERMISSION_DENIED`.

9. **Payload 9: Reminder Creation for Another User**
   - User `uid_alice` creates a reminder with `userId: 'uid_bob'`.
   - Expected: `PERMISSION_DENIED`.

10. **Payload 10: Reminder Update by Non-Owner**
    - User `uid_alice` attempts to toggle `isCompleted` on `uid_bob`'s reminder.
    - Expected: `PERMISSION_DENIED`.

11. **Payload 11: Malicious Path ID Injection (ID Poisoning)**
    - Attacker attempts to create document with path ID containing path traversal `../../malicious` or exceeding 128 characters.
    - Expected: `PERMISSION_DENIED` via `isValidId()`.

12. **Payload 12: Invalidation of Required Fields**
    - Document payload created missing `title` or `subject`.
    - Expected: `PERMISSION_DENIED`.

## 3. Test Runner Design
All operations must fail closed with default deny (`match /{document=**} { allow read, write: if false; }`). Tests assert `assertFails()` across all 12 attack vectors.
