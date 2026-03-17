# JK Baking Essentials

## Current State
Admin login requires two steps: (1) Internet Identity login, (2) enter/set a password. Users reported this setup was failing and confusing.

## Requested Changes (Diff)

### Add
- PIN-based admin login (4-digit numeric PIN)
- First-visit PIN setup screen (set PIN + confirm)
- Backend functions: `setAdminPin`, `adminPinLogin`, `isAdminPinSet`

### Modify
- Remove Internet Identity requirement from admin login page
- Replace password input with 4-digit OTP PIN input
- Backend: replace `adminPassword` / `setAdminPassword` / `adminLogin` with PIN equivalents

### Remove
- Internet Identity step from admin login flow
- Password-based admin auth

## Implementation Plan
1. Update `main.mo`: replace `adminPassword` var and password functions with `adminPin` and PIN functions
2. Update `AdminLoginPage.tsx`: remove II logic, replace password form with InputOTP 4-digit PIN, store session in localStorage
