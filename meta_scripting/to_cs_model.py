import re
from meta_scripting.helpers import pascal_to_camel


def table_to_cs_model(
    sql: str,
    ignore_fields: list[str],
    model_name: str = "AutoModel",
    project_name: str = "Backend",
) -> list[str]:
    type_mapping = {
        "int": "int",
        "bigint": "long",
        "smallint": "int",
        "tinyint": "int",
        "bit": "bool",
        "decimal": "decimal",
        "numeric": "decimal",
        "float": "decimal",
        "real": "decimal",
        "money": "decimal",
        "smallmoney": "decimal",
        "nvarchar": "string",
        "varchar": "string",
        "nchar": "string",
        "char": "string",
        "text": "string",
        "ntext": "string",
        "datetime": "DateTime",
        "datetime2": "DateTime",
        "smalldatetime": "DateTime",
        "date": "DateTime",
        "time": "DateTime",
        "uniqueidentifier": "string",
    }

    fields = []
    primary_key_model_fields = []
    col_type_map = {}

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
            cs_type = (
                type_mapping.get(base_type.group(), "string") if base_type else "string"
            )
            col_type_map[col_name] = cs_type

            fields.append(
                f"public {cs_type} {col_name} {"{"} get; set; {"}"} {"= \"\";" if cs_type == "string" else ""}"
            )

            is_primary = "primary key" in extras.lower()
            if is_primary:
                primary_key_model_fields.append(
                    f"public {cs_type} {col_name} {"{"} get; set; {"}"} {"= \"\";" if cs_type == "string" else ""}"
                )
        elif (
            "clustered" in extras.lower()
            and col_name.lower() == "primary"
            and col_type.lower() == "key"
        ):
            primary_key_fields = extras[(extras.index("(") + 1) : extras.index(")")]
            primary_keys_string = primary_key_fields.replace(" ", "")
            primary_keys = primary_keys_string.split(",")
            for primary_key in primary_keys:
                cs_type = col_type_map[primary_key]
                primary_key_model_fields.append(
                    f"public {cs_type} {primary_key} {"{"} get; set; {"}"} {"= \"\";" if cs_type == "string" else ""}"
                )

    model = f"""
namespace {project_name}.Models
{"{"}
    public partial class {model_name} {"{"}
        {"\n\t\t".join(fields)}
    {"}"}
{"}"}\n\n
"""

    modelOption = f"""
namespace {project_name}.Models
{"{"}
    public partial class {model_name}Option {"{"}
        {"\n\t\t".join(primary_key_model_fields)}
    {"}"}
{"}"}\n\n
"""

    return [model, modelOption]
