import re
from meta_scripting.helpers import pascal_to_snake


def table_to_pydantic_model(
    sql: str, ignore_fields: list[str], model_name: str = "AutoModel"
) -> str:
    type_mapping = {
        "int": "int",
        "bigint": "int",
        "smallint": "int",
        "tinyint": "int",
        "bit": "bool",
        "decimal": "float",
        "numeric": "float",
        "float": "float",
        "real": "float",
        "money": "float",
        "smallmoney": "float",
        "nvarchar": "str",
        "varchar": "str",
        "nchar": "str",
        "char": "str",
        "text": "str",
        "ntext": "str",
        "datetime": "datetime",
        "datetime2": "datetime",
        "smalldatetime": "datetime",
        "date": "date",
        "time": "time",
        "uniqueidentifier": "str",
    }

    fields = []

    # Extract lines from CREATE TABLE
    columns = re.findall(r"\s*(\w+)\s+([\w()]+)(.*)", sql, re.IGNORECASE)

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
            py_type = type_mapping.get(base_type.group(), "str") if base_type else "str"

            # Determine nullability
            is_nullable = "not null" not in extras.lower()
            default = " = None" if is_nullable else ""

            fields.append(f"    {pascal_to_snake(col_name)}: {py_type}{default}")

    model = f"\n\nclass {model_name}(BaseModel):\n"
    model += "\n".join(fields) or "    pass"

    return model
