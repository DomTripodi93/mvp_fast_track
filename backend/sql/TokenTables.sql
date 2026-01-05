--CREATE DATABASE MVPFastPass;
--GO

--USE MVPFastPass;
--GO

--CREATE SCHEMA Staging;
--GO

DROP TABLE IF EXISTS dbo.TokenAvailability;

CREATE TABLE dbo.TokenAvailability
(
    AccountId INT PRIMARY KEY
    , TokensAvailable INT NOT NULL
          DEFAULT (0)
    , InsertDate DATETIME NOT NULL
          DEFAULT (GETDATE ())
    , UpdateDate DATETIME NOT NULL
          DEFAULT (GETDATE ())
    , LastPurchaseDate DATETIME NOT NULL
          DEFAULT (GETDATE ())
);

DROP TABLE IF EXISTS dbo.TokenUsageLog;

CREATE TABLE dbo.TokenUsageLog
(
    AccountId INT
    , TokensUsed INT NOT NULL
    , EmailAddress VARCHAR(255)
    , InsertDate DATETIME NOT NULL
          DEFAULT (GETDATE ())
);

CREATE CLUSTERED INDEX cix_TokenUsageLog_AccountId_InsertDate
    ON dbo.TokenUsageLog (AccountId, InsertDate);

DROP TABLE IF EXISTS dbo.AccountUser;

CREATE TABLE dbo.AccountUser
(
    AccountId INT
    , EmailAddress VARCHAR(255)
    , CanGenerateKeys BIT NOT NULL
          DEFAULT (0)
    , CanPurchaseTokens BIT NOT NULL
          DEFAULT (0)
    , TokensAvailable INT NOT NULL
          DEFAULT (0)
    , InsertDate DATETIME NOT NULL
          DEFAULT (GETDATE ())
    , UpdateDate DATETIME NOT NULL
          DEFAULT (GETDATE ())
    ,
    PRIMARY KEY (AccountId, EmailAddress)
);
GO

CREATE OR ALTER PROCEDURE dbo.spTokenUsage_Record
    @EditUser VARCHAR(255)
    , @AccountId INT
    , @TokensUsed INT
AS
BEGIN
    BEGIN TRANSACTION;

    UPDATE  dbo.TokenAvailability
       SET  TokenAvailability.TokensAvailable = TokenAvailability.TokensAvailable - @TokensUsed
            , TokenAvailability.UpdateDate = GETDATE ()
     WHERE  TokenAvailability.AccountId = @AccountId;

    UPDATE  dbo.AccountUser
       SET  AccountUser.TokensAvailable = AccountUser.TokensAvailable - @TokensUsed
            , AccountUser.UpdateDate = GETDATE ()
     WHERE  AccountUser.AccountId = @AccountId;

    COMMIT TRANSACTION;

    INSERT INTO dbo.TokenUsageLog (AccountId
                                   , TokensUsed
                                   , EmailAddress)
    VALUES (@AccountId, @TokensUsed, @EditUser);
END;
GO

CREATE OR ALTER PROCEDURE dbo.spTokensAvailable_Get
    @EditUser VARCHAR(255)
    , @AccountId INT
AS
BEGIN
    SELECT  CASE WHEN AccountUser.TokensAvailable < TokenAvailability.TokensAvailable
                     THEN AccountUser.TokensAvailable
                ELSE TokenAvailability.TokensAvailable
            END AS TokensAvailable
            , AccountUser.TokensAvailable AS UserTokensAvailable
      FROM  dbo.AccountUser
          JOIN dbo.TokenAvailability
              ON AccountUser.AccountId = TokenAvailability.AccountId
     WHERE  AccountUser.AccountId = @AccountId
            AND AccountUser.EmailAddress = @EditUser;
END;
GO