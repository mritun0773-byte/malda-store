# Malda Store

## Current State
The admin panel at `/admin` uses Internet Identity for authentication. It checks `useInternetIdentity` hook and `useIsAdmin` backend query for access control.

## Requested Changes (Diff)

### Add
- Simple username/password login form on the admin page
- Local state to track if admin is logged in (hardcoded credentials: ADMINMJ / Admin098)

### Modify
- `AdminPage.tsx`: Replace Internet Identity login screen with a username/password form. Once credentials are correct, show the product management panel directly without checking `useIsAdmin` backend role.

### Remove
- `useInternetIdentity` hook usage from AdminPage
- `useIsAdmin` check from AdminPage
- Internet Identity login button

## Implementation Plan
1. Update `AdminPage.tsx` to use local useState for `isLoggedIn`
2. When not logged in, show a form with username and password fields
3. On submit, check against hardcoded ADMINMJ / Admin098 -- if match, set isLoggedIn to true
4. Show product management UI when isLoggedIn is true
5. Add a logout button that resets isLoggedIn
