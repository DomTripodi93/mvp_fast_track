DROP TABLE IF EXISTS dbo.UserAuth;

CREATE TABLE dbo.UserAuth
(
    Username NVARCHAR(50) PRIMARY KEY
    , PasswordHash VARBINARY(MAX)
    , PasswordSalt VARBINARY(MAX)
);
GO

CREATE OR ALTER PROCEDURE dbo.spPassword_Update
    @Username NVARCHAR(50)
    , @PasswordHash VARBINARY(MAX)
    , @PasswordSalt VARBINARY(MAX)
AS
BEGIN
    IF EXISTS (
                  SELECT    *
                    FROM    dbo.UserAuth
                   WHERE UserAuth.Username = @Username
              )
    BEGIN
        UPDATE  dbo.UserAuth
           SET  UserAuth.PasswordHash = @PasswordHash
                , UserAuth.PasswordSalt = @PasswordSalt
         WHERE  UserAuth.Username = @Username;
    END;
END;
GO

CREATE OR ALTER PROCEDURE dbo.spLoginConfirmation_Get
    @Username NVARCHAR(50)
AS
BEGIN
    SELECT  UserInfo.UserId
            , UserAuth.Username
            , UserInfo.DisplayName
            , UserAuth.PasswordHash
            , UserAuth.PasswordSalt
      FROM  dbo.UserAuth AS UserAuth
          LEFT JOIN dbo.UserInfo
              ON UserInfo.Username = UserAuth.Username
     WHERE  UserAuth.Username = @Username;
END;
GO


DROP TABLE IF EXISTS dbo.UserInfo;

CREATE TABLE dbo.UserInfo
(
    UserId BIGINT IDENTITY(1, 1)
    , Username NVARCHAR(50) PRIMARY KEY
    , DisplayName NVARCHAR(100)
    , LastAccessedDate DATETIME NOT NULL
          DEFAULT (GETDATE ())
    , IsActive BIT NOT NULL
          DEFAULT (1)
    , CanManageOptions BIT NOT NULL
          DEFAULT (0)
    , IsAdmin BIT NOT NULL
          DEFAULT (0)
    , HasOperator BIT NOT NULL
          DEFAULT (0)
    , HasOffice BIT NOT NULL
          DEFAULT (0)
    , HasSetup BIT NOT NULL
          DEFAULT (0)
);
GO

CREATE OR ALTER PROCEDURE dbo.spUser_Update
    @Username NVARCHAR(50)
    , @DisplayName NVARCHAR(100)
    , @CanManageOptions BIT = 0
    , @IsAdmin BIT = 0
    , @HasOffice BIT = 0
    , @HasSetup BIT = 0
    , @HasOperator BIT = 0
    , @Active BIT = 1
    , @UserId INT = NULL
AS
BEGIN
    IF EXISTS (
                  SELECT    *
                    FROM    dbo.UserInfo
                   WHERE UserInfo.UserId = @UserId
              )
    BEGIN
        UPDATE  dbo.UserInfo
           SET  UserInfo.DisplayName = @DisplayName
                , UserInfo.IsActive = @Active
                , UserInfo.CanManageOptions = @CanManageOptions
                , UserInfo.IsAdmin = @IsAdmin
                , UserInfo.HasOffice = @HasOffice
                , UserInfo.HasSetup = @HasSetup
                , UserInfo.HasOperator = @HasOperator
         WHERE  UserInfo.UserId = @UserId;
    END;
END;
GO

CREATE OR ALTER PROCEDURE dbo.spUser_Register
    @Username NVARCHAR(50)
    , @DisplayName NVARCHAR(50)
    , @PasswordHash VARBINARY(MAX)
    , @PasswordSalt VARBINARY(MAX)
AS
BEGIN
    IF NOT EXISTS (
                      SELECT    *
                        FROM    dbo.UserInfo
                       WHERE UserInfo.Username = @Username
                  )
       AND  NOT EXISTS (
                           SELECT   *
                             FROM   dbo.UserAuth
                            WHERE   UserAuth.Username = @Username
                       )
    BEGIN
        INSERT INTO dbo.UserInfo (DisplayName
                                  , Username
                                  , IsActive
                                  , CanManageOptions
                                  , IsAdmin
                                  , HasOffice
                                  , HasSetup
                                  , HasOperator)
        VALUES (@DisplayName, @Username, 1, 0, 0, 0, 0, 0);

        INSERT INTO dbo.UserAuth (Username
                                  , PasswordHash
                                  , PasswordSalt)
        VALUES (@Username, @PasswordHash, @PasswordSalt);
    END;
END;
GO

--ALTER TABLE  dbo.UserInfo ADD 
--     HasOperator BIT NOT NULL
--          DEFAULT (0)
--    , HasOffice BIT NOT NULL
--          DEFAULT (0)
--    , HasSetup BIT NOT NULL
--          DEFAULT (0)