-- ============================================================
-- Debug: Check what Account_GetLoggedInUserDetails returns
-- Run this in SSMS against 2026_MPKV_Rahuri_Test
-- Replace 1001 with your actual college login ID
-- ============================================================

-- 1. See what columns the SP returns for college user
EXEC Account_GetLoggedInUserDetails @UserTypeID = 61, @UserLoginID = '1001'

-- 2. Check what the login tracking table actually stores
-- (find the actual table name first)
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME LIKE '%Login%' OR TABLE_NAME LIKE '%Session%' OR TABLE_NAME LIKE '%User%'
ORDER BY TABLE_NAME

-- 3. Check what Account_UpdateLoginStatus does — look at its definition
SELECT OBJECT_DEFINITION(OBJECT_ID('Account_UpdateLoginStatus'))

-- 4. Check what Account_GetLoggedInUserDetails does
SELECT OBJECT_DEFINITION(OBJECT_ID('Account_GetLoggedInUserDetails'))
