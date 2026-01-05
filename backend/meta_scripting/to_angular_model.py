import re
from meta_scripting.helpers import pascal_to_camel


def table_to_angular_model(
    sql: str, ignore_fields: list[str], model_name: str = "AutoModel"
) -> list[str]:
    type_mapping = {
        "int": "number",
        "bigint": "number",
        "smallint": "number",
        "tinyint": "number",
        "bit": "boolean",
        "decimal": "number",
        "numeric": "number",
        "float": "number",
        "real": "number",
        "money": "number",
        "smallmoney": "number",
        "nvarchar": "string",
        "varchar": "string",
        "nchar": "string",
        "char": "string",
        "text": "string",
        "ntext": "string",
        "datetime": "Date",
        "datetime2": "Date",
        "smalldatetime": "Date",
        "date": "Date",
        "time": "Date",
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
            ts_type = (
                type_mapping.get(base_type.group(), "string") if base_type else "string"
            )
            col_type_map[col_name] = ts_type

            fields.append(f"{pascal_to_camel(col_name)}: {ts_type};")

            is_primary = "primary key" in extras.lower()
            if is_primary:
                primary_key_model_fields.append(f"{pascal_to_camel(col_name)}: {ts_type};")
        elif (
            "clustered" in extras.lower()
            and col_name.lower() == "primary"
            and col_type.lower() == "key"
        ):
            primary_key_fields = extras[(extras.index("(") + 1) : extras.index(")")]
            primary_keys_string = primary_key_fields.replace(" ", "")
            primary_keys = primary_keys_string.split(",")
            for primary_key in primary_keys:
                primary_key_model_fields.append(
                    f"{pascal_to_camel(primary_key)}: {col_type_map[primary_key]};"
                )

    model = f"""
export interface {model_name} {"{"}
    {"\n\t".join(fields)}
{"}"}\n\n
"""

    modelOption = f"""
export interface {model_name}Option {"{"}
    {"\n\t".join(primary_key_model_fields)}
{"}"}\n\n
"""

    return [model, modelOption]
