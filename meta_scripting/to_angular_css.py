import re
from meta_scripting.helpers import pascal_to_camel, pascal_to_kabob, pascal_to_snake


def table_to_ts_component(
    sql: str, ignore_fields: list[str], model_name: str = "AutoModel"
) -> str:
    get_proc = f"dbo.sp{model_name}_Get"
    upsert_proc = f"dbo.sp{model_name}_Upsert"
    delete_proc = f"dbo.sp{model_name}_Delete"
    fields_to_parameters = []

    # Extract lines from CREATE TABLE
    columns = re.findall(r"\s*(\w+)\s+([\w()]+)(.*)", sql, re.IGNORECASE)

    primary_key = ""
    primary_keys_for_delete = ""
    has_single_primary_key = False
    for col_name, col_type, extras in columns:
        
        if (
            not col_name in ignore_fields
            and (col_name != model_name or col_type != "(")
            and not (
                "clustered" in extras.lower()
                and col_name.lower() == "primary"
                and col_type.lower() == "key"
            )
        ):
            is_primary = "primary key" in extras.lower()
            if is_primary:
                primary_key = col_name
                has_single_primary_key = True
                primary_keys_for_delete = f"{pascal_to_camel(model_name)}ForDelete.{pascal_to_camel(primary_key)}"

            has_primary = (
                "clustered" in extras.lower()
                and col_name.lower() == "primary"
                and col_type.lower() == "key"
            )
            if has_primary:
                primary_key_fields = extras[(extras.index("(") + 1) : extras.index(")")]
                primary_keys_string = primary_key_fields.replace(" ", "")
                primary_keys = primary_keys_string.split(",")
                primary_keys_pascal = [
                    f"{pascal_to_camel(model_name)}ForDelete.{pascal_to_camel(primary_key)}"
                    for primary_key in primary_keys
                ]
                primary_keys_for_delete = ",".join(primary_keys_pascal)

            # fields_to_parameters.append(f"{col_name} = @{col_name}")
            fields_to_parameters.append(
                f'"{pascal_to_snake(col_name)}": {pascal_to_snake(model_name)}.{pascal_to_snake(col_name)}'
            )

    controller = f"""

"""

    return controller
