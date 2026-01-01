import re


def table_to_procs(
    sql: str, ignore_fields: list[str], model_name: str = "AutoModel"
) -> str:
    sql = "\n".join([row for row in sql.split("\n") if "drop table" not in row.lower()])

    get_fields = []
    field_inserts = []
    parameters = []
    parameter_inserts = []
    fields_to_parameters_to_set = []
    fields_to_parameters_to_set_with_name = []

    # Extract lines from CREATE TABLE
    columns = re.findall(r"\s*(\w+)\s+([\w(),]+)(.*)", sql, re.IGNORECASE)

    primary_keys = []
    non_primary_filter_params = []
    primary_key_params = []
    primary_key_params_not_null = []
    primary_key_search = []
    primary_key_params_blank = []
    primary_key_conditions = []
    primary_key_conditions_isnull = []
    primary_key_get_fields = []

    col_type_map = {}
    col_default_map = {}
    for col_name, col_type, extras in columns:
        if (
            not col_name in ignore_fields
            and (col_name != model_name or col_type != "(")
            and not (
                "clustered" in extras.lower()
                and col_name.lower() == "primary"
                and col_type.lower() == "key"
            )
            and not col_name.lower() == "link"
        ):
            is_nullable = "not null" not in extras.lower()
            default = " = NULL" if is_nullable else ""
            col_type_map[col_name] = col_type
            col_default_map[col_name] = default

            is_primary = "primary key" in extras.lower()
            if is_primary:
                primary_keys.append(col_name)
                primary_key_params.append(f"@{col_name} {col_type} = NULL")
                primary_key_params_not_null.append(f"@{col_name} {col_type}")
                primary_key_params_blank.append(f"@{col_name} = ''")
                primary_key_search.append(
                    f"(@SearchTerm IS NULL OR {col_name} LIKE '%' + @SearchTerm + '%')"
                )
                primary_key_conditions.append(f"{col_name} = @{col_name}")
                primary_key_conditions_isnull.append(
                    f"{model_name}.{col_name} = ISNULL(@{col_name}, {model_name}.{col_name})"
                )
                primary_key_get_fields.append(f"{model_name}.{col_name}")

            parameters.append(f"@{col_name} {col_type}{default}")
            get_fields.append(f"{model_name}.{col_name}")

            fields_to_parameters_to_set_with_name.append(
                {
                    "col_name": col_name,
                    "param_string": f"{col_name} = @{col_name}",
                }
            )

            # if not is_primary or not extras.lower().__contains__("identity"):
            if not extras.lower().__contains__("identity"):
                parameter_inserts.append(f"@{col_name}")
                field_inserts.append(f"{col_name}")
            # if not is_primary:
            #     fields_to_parameters_to_set.append(f"{col_name} = @{col_name}")
        elif (
            "clustered" in extras.lower()
            and col_name.lower() == "primary"
            and col_type.lower() == "key"
        ):
            primary_key_fields = extras[(extras.index("(") + 1) : extras.index(")")]
            primary_keys_string = primary_key_fields.replace(" ", "")
            primary_keys = primary_keys_string.split(",")
            for primary_key in primary_keys:
                primary_key_params.append(
                    f"@{primary_key} {col_type_map[primary_key]} = NULL"
                )
                primary_key_params_not_null.append(
                    f"@{primary_key} {col_type_map[primary_key]}"
                )
                primary_key_get_fields.append(f"{model_name}.{primary_key}")
                primary_key_search.append(
                    f"(@SearchTerm IS NULL OR {primary_key} LIKE '%' + @SearchTerm + '%')"
                )
                primary_key_params_blank.append(f"@{primary_key} = ''")
                primary_key_conditions.append(f"{primary_key} = @{primary_key}")
                primary_key_conditions_isnull.append(
                    f"{model_name}.{primary_key} = ISNULL(@{primary_key}, {model_name}.{primary_key})"
                )

        elif col_name.lower() == "link":
            link_info = col_type + extras
            link_info_parts = link_info.split(" TO ")
            # link_to = link_info_parts[1]
            link_fields = (
                link_info_parts[0]
                .replace(" ", "")
                .replace("(", "")
                .replace(")", "")
                .split(",")
            )

            for link_field in link_fields:
                filter_text = f"@{link_field} {col_type_map[link_field]} = NULL"
                if filter_text not in primary_key_params:
                    non_primary_filter_params.append(filter_text)
                    primary_key_conditions_isnull.append(
                        f"{model_name}.{link_field} = ISNULL(@{link_field}, {model_name}.{link_field})"
                    )

    fields_to_parameters_to_set = [
        field["param_string"]
        for field in fields_to_parameters_to_set_with_name
        if not primary_keys.__contains__(field["col_name"])
    ]

    where_clause = f" WHERE {"\n\t\t\tAND ".join(primary_key_conditions)}"
    where_clause_isnull = f" WHERE {"\n\t\t\tAND ".join(primary_key_conditions_isnull)}"

    staging_load = f"""DROP TABLE IF EXISTS Staging.{model_name};\n\n
CREATE TABLE Staging.{sql}

ALTER TABLE Staging.{model_name} ADD BulkUploadId BIGINT NOT NULL

GO

DROP TABLE IF EXISTS dbo.{model_name}BulkUploadId;
GO

CREATE TABLE dbo.{model_name}BulkUploadId
(
    BulkUploadId BIGINT NOT NULL
);
GO

INSERT INTO dbo.{model_name}BulkUploadId (BulkUploadId)
VALUES (0);
GO

CREATE OR ALTER PROCEDURE dbo.sp{model_name}BulkUploadId_Get
AS
BEGIN
    BEGIN TRANSACTION;

    UPDATE  dbo.{model_name}BulkUploadId
       SET  {model_name}BulkUploadId.BulkUploadId = BulkUploadId + 1;

    SELECT  BulkUploadId
      FROM  dbo.{model_name}BulkUploadId;

    COMMIT TRANSACTION;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp{model_name}Bulk_Load
    @BulkUploadId BIGINT
AS
BEGIN
    IF EXISTS (
                  SELECT    *
                    FROM    Staging.{model_name}
                   WHERE {model_name}.BulkUploadId = @BulkUploadId
              )
    BEGIN
        INSERT INTO dbo.{model_name} (
            {"\n\t\t\t, ".join(field_inserts)}
            , InsertDate
            , InsertUser
            , UpdateDate
            , UpdateUser)
        SELECT {"\n\t\t\t, ".join(field_inserts)}
            , InsertDate
            , InsertUser
            , UpdateDate
            , UpdateUser
          FROM  Staging.{model_name};
          
        DELETE FROM Staging.{model_name}
            WHERE {model_name}.BulkUploadId = @BulkUploadId
    END;
END;
GO
 

"""

    procs = f"""{staging_load}\n\nCREATE OR ALTER PROCEDURE dbo.sp{model_name}_Upsert
    {"\n\t, ".join(parameters)}
    , @EditUser NVARCHAR(255) 
AS 
BEGIN 
    IF NOT EXISTS (SELECT * FROM dbo.{model_name}
        {where_clause})
    BEGIN
        INSERT INTO dbo.{model_name} (
            {"\n\t\t\t, ".join(field_inserts)}
            , InsertDate
            , InsertUser
            , UpdateDate
            , UpdateUser
        ) VALUES ( 
            {"\n\t\t\t, ".join(parameter_inserts)}
            , GETDATE()
            , @EditUser
            , GETDATE()
            , @EditUser
        )
    END
    ELSE 
    BEGIN
        UPDATE dbo.{model_name} 
        SET {"\n\t\t\t, ".join(fields_to_parameters_to_set)}
            , UpdateDate = GETDATE()
            , UpdateUser = @EditUser
        {where_clause}
    END

END
GO
    """

    procs += f"""\n\nCREATE OR ALTER PROCEDURE dbo.sp{model_name}_Get
    {"\n\t, ".join(primary_key_params)}
    {f""", {"\n\t, ".join(non_primary_filter_params)}""" if len(non_primary_filter_params) > 0 else ""}
    , @EditUser NVARCHAR(255) = NULL
    , @SearchTerm NVARCHAR(255) = NULL
    , @ActiveOnly BIT = NULL
AS 
/*
    EXEC dbo.sp{model_name}_Get
*/
BEGIN 
    
    SELECT {f"\n\t\t\t, ".join(get_fields)}
            , {model_name}.InsertDate
            , {model_name}.InsertUser
            , {model_name}.UpdateDate
            , {model_name}.UpdateUser
        FROM dbo.{model_name}
        {where_clause_isnull}
            AND (@ActiveOnly <> 1 OR {model_name}.IsActive = 1)
            AND ({"\n\t\t\t\tAND ".join(primary_key_search)})

END
GO

"""

    procs += f"""\n\nCREATE OR ALTER PROCEDURE dbo.sp{model_name}Options_Get
    {"\n\t, ".join(primary_key_params)}
    {f""", {"\n\t, ".join(non_primary_filter_params)}""" if len(non_primary_filter_params) > 0 else ""}
    , @EditUser NVARCHAR(255) = NULL
    , @ActiveOnly BIT = 1
AS 
/*
    EXEC dbo.sp{model_name}Options_Get
*/
BEGIN 
    
    SELECT {f"\n\t\t\t, ".join(primary_key_get_fields)}
        FROM dbo.{model_name}
        {where_clause_isnull}
            AND (@ActiveOnly <> 1 OR {model_name}.IsActive = 1)

END
GO

"""

    procs += f"""\n\nCREATE OR ALTER PROCEDURE dbo.sp{model_name}_Delete
    {"\n\t, ".join(primary_key_params_not_null)}
    , @EditUser NVARCHAR(255) 
AS 
/*
    EXEC dbo.sp{model_name}_Delete 
        {"\n\t\t,".join(primary_key_params_blank)}
*/
BEGIN 
    
    DELETE FROM dbo.{model_name}
        {where_clause}

END
GO

"""

    return procs
