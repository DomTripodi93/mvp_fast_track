USE [master];
GO

SELECT CASE SERVERPROPERTY('IsIntegratedSecurityOnly')
    WHEN 1 THEN 'Windows Authentication Only'
    WHEN 0 THEN 'Mixed Mode (Windows and SQL Server Authentication)'
END AS [Authentication Mode];
-- EXEC xp_instance_regwrite
--     N'HKEY_LOCAL_MACHINE',
--     N'Software\Microsoft\MSSQLServer\MSSQLServer',
--     N'LoginMode',
--     REG_DWORD,
--     2;
GO

DROP LOGIN AppUser;
GO

CREATE LOGIN AppUser
    WITH PASSWORD = 'uiyhqet@er%$^to#$qwoui&*'
         , CHECK_POLICY = ON
         , CHECK_EXPIRATION = OFF;
GO

ALTER SERVER ROLE sysadmin ADD MEMBER AppUser;
GO

USE JobShopMom;
GO

DROP USER IF EXISTS AppUser;

CREATE USER AppUser FOR LOGIN AppUser;

ALTER ROLE db_owner ADD MEMBER AppUser;
GO