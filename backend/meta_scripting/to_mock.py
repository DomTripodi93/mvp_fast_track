import re


def table_to_mock(
    sql: str, ignore_fields: list[str], model_name: str = "AutoModel"
) -> str:
    mock_mapping = {
        "int": "IntValue",
        "bigint": "IntValue",
        "smallint": "IntValue",
        "tinyint": "IntValue",
        "bit": "BooleanValue",
        "decimal": "DecValue",
        "numeric": "DecValue",
        "float": "DecValue",
        "real": "DecValue",
        "money": "DecValue",
        "smallmoney": "DecValue",
        "nvarchar": "StringValue",
        "varchar": "StringValue",
        "nchar": "StringValue",
        "char": "StringValue",
        "text": "StringValue",
        "ntext": "StringValue",
        "datetime": "DateTimeValue",
        "datetime2": "DateTimeValue",
        "smalldatetime": "DateTimeValue",
        "date": "DateTimeValue",
        "time": "DateTimeValue",
        "uniqueidentifier": "StringValue",
    }
    get_fields = []
    field_inserts = []
    field_mocks = []
    parameters = []
    parameter_inserts = []
    fields_to_parameters_to_set = []
    fields_to_parameters_to_set_with_name = []

    # Extract lines from CREATE TABLE
    columns = re.findall(r"\s*(\w+)\s+([\w(),]+)(.*)", sql, re.IGNORECASE)

    primary_keys = []
    columns_to_select = []

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
            base_type = re.match(r"\w+", col_type.lower())
            mock_column = (
                mock_mapping.get(base_type.group(), "string") if base_type else "string"
            )

            is_nullable = "not null" not in extras.lower()
            default = " = NULL" if is_nullable else ""
            col_type_map[col_name] = col_type
            col_default_map[col_name] = default

            is_primary = "primary key" in extras.lower()
            if is_primary:
                primary_keys.append(col_name)

            parameters.append(f"@{col_name} {col_type}{default}")
            get_fields.append(f"{model_name}.{col_name}")

            fields_to_parameters_to_set_with_name.append(
                {
                    "col_name": col_name,
                    "param_string": f"{col_name} = @{col_name}",
                }
            )

            field_mocks.append(f"MockData.{mock_column} AS {col_name}")
            
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


    selection = f"""
GO

INSERT INTO dbo.{model_name} (
            {"\n\t\t\t, ".join(field_inserts)}
            , InsertDate
            , InsertUser
            , UpdateDate
            , UpdateUser)
SELECT {model_name}.{f"\n\t, {model_name}.".join(field_inserts)}
    , GETDATE()
    , 'MockData'
    , GETDATE()
    , 'MockData'
      FROM  (
                SELECT  *
                        , ROW_NUMBER () OVER (PARTITION BY MockData.{f", MockData.".join(primary_keys)}
                                                  ORDER BY MockData.StringValue
                                             ) AS RelatedRow
                  FROM  (SELECT {"\n\t\t\t\t\t\t\t, ".join(field_mocks)}
                            , MockData.StringValue 
                        FROM dbo.MockData) as MockData
            ) AS {model_name}
     WHERE  {model_name}.RelatedRow = 1;
"""

    return selection
