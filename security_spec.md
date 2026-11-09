# Security Specification for SM Studios Firestore

## Data Invariants
1. Products are public read-only for store catalog browsing; write, update, and delete access is strictly limited to verified Administrators (`isAdmin()`).
2. Admin records (`/admins/{adminUid}`) can only be read or written by verified administrators.
3. User profiles (`/users/{userId}`) can only be read and updated by their owner (`isOwner(userId)`) or administrators (`isAdmin()`). Users cannot self-escalate to admin.
4. Orders (`/orders/{orderId}`):
   - Authenticated customers can read their own orders where `resource.data.userId == request.auth.uid`.
   - Administrators can read, list, update, and delete all orders.
   - Creating an order via direct Firestore client write requires authentication with matching `userId`.
   - Guest tracking and order submissions are securely processed through the Express backend which enforces phone-number verification and authorization before serving order details.
5. Catch-all `match /{document=**}` defaults to deny all operations.

## The Dirty Dozen Payloads (Negative Tests)
1. Unauthenticated write to `/products/{productId}` -> PERMISSION_DENIED
2. Customer write to `/products/{productId}` -> PERMISSION_DENIED
3. Customer modifying `/admins/{uid}` -> PERMISSION_DENIED
4. Customer user trying to self-assign `role: 'admin'` on `/users/{uid}` -> PERMISSION_DENIED
5. Unauthenticated read of private `/users/{userId}` -> PERMISSION_DENIED
6. User A attempting to read User B's `/users/{userB}` -> PERMISSION_DENIED
7. User A reading User B's order directly from `/orders/{orderId}` -> PERMISSION_DENIED
8. Unauthenticated list query on `/orders` -> PERMISSION_DENIED
9. Customer updating status or quoteAmount on an order -> PERMISSION_DENIED
10. Malformed ID poisoning attempt (length > 128 or invalid characters) -> PERMISSION_DENIED
11. Unauthenticated write to catch-all unknown collection -> PERMISSION_DENIED
12. Direct client deletion of order by non-admin customer -> PERMISSION_DENIED
