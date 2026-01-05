import re
from meta_scripting.helpers import pascal_to_snake


def table_to_fastapi_controller(
    sql: str,
    ignore_fields: list[str],
    model_name: str = "AutoModel",
    file_root_model: str = "AutoModel",
) -> str:
    get_proc = f"dbo.sp{model_name}_Get"
    upsert_proc = f"dbo.sp{model_name}_Upsert"
    delete_proc = f"dbo.sp{model_name}_Delete"
    bulk_load_proc = f"dbo.sp{model_name}Bulk_Load"
    bulk_id_proc = f"dbo.sp{model_name}BulkUploadId_Get"
    fields_to_parameters = []
    fields_to_parameters_bulk = []
    value_field_list = []
    insert_param_list = []

    # Extract lines from CREATE TABLE
    columns = re.findall(r"\s*(\w+)\s+([\w()]+)(.*)", sql, re.IGNORECASE)

    primary_key = ""
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
            is_primary = "primary key" in extras.lower()
            if is_primary:
                primary_key = col_name

            # fields_to_parameters.append(f"{col_name} = @{col_name}")
            if (col_name != "BulkUploadId"):
                fields_to_parameters.append(
                    f'"{pascal_to_snake(col_name)}": {pascal_to_snake(model_name)}.{pascal_to_snake(col_name)}'
                )
                fields_to_parameters_bulk.append(
                    f'sql_params[f"{pascal_to_snake(col_name)}{"{"}row_for_params{"}"}"] = {pascal_to_snake(model_name)}.{pascal_to_snake(col_name)}'
                )
                value_field_list.append(col_name)
                insert_param_list.append(f':{pascal_to_snake(col_name)}{"{"}row_for_params{"}"}')

    controller = f"""
@router.post("/Get{model_name}s")
def get_{pascal_to_snake(model_name)}(parameters: Dict[str, Any], request: Request):
    sql = "EXEC {get_proc} @EditUser=:email"
    
    sql_params = {"{"}
        "bulk_upload_id": request.state.user["email"]
    {"}"}
    
    return data_access.load_query_with_params(sql, sql_params)
    
@router.delete("/Delete{model_name}/{"{" + pascal_to_snake(primary_key) + "}"}")
def delete_{pascal_to_snake(model_name)}({pascal_to_snake(primary_key)}: str, request: Request):
    sql = "EXEC {delete_proc} @EditUser=:email"
    sql += ", @{primary_key}=:{pascal_to_snake(primary_key)}"
    
    sql_params = {"{"}
        "email": request.state.user["email"],
        "{pascal_to_snake(primary_key)}": {pascal_to_snake(primary_key)}
    {"}"}
    
    return data_access.execute_query_with_params(sql, sql_params)
    
@router.post("/Upsert{model_name}")
def upsert_{pascal_to_snake(model_name)}({pascal_to_snake(model_name)}: {model_name}, request: Request):
    sql = "EXEC {upsert_proc} @EditUser=:email"
    sql += ", @{primary_key}=:{pascal_to_snake(primary_key)}"
    
    sql_params = {"{"}
        "email": request.state.user["email"],
        {",\n        ".join(fields_to_parameters)}
    {"}"}
    
    return data_access.execute_query_with_params(sql, sql_params)
    
@router.post("/BulkUpload{model_name}")
def bulk_upload_{pascal_to_snake(model_name)}({pascal_to_snake(model_name)}s: list[{model_name}], request: Request):
    sql_get_bulk_id = "EXEC {bulk_id_proc}"
    result = data_access.execute_query_with_results(sql_get_bulk_id)
    
    bulk_upload_id = result[0][0]["bulkUploadId"]
    
    
    sql_bulk_insert = "INSERT INTO Staging.{model_name}({",".join(value_field_list)}, BulkUploadId) VALUES "
    
    sql_params = {"{"}
        "bulk_upload_id": bulk_upload_id
    {"}"}
    

    row_for_params = 0
    
    for {pascal_to_snake(model_name)} in {pascal_to_snake(model_name)}s:
        new_row = f"({",".join(insert_param_list)}, :bulk_upload_id),"
        
        if ((sql_bulk_insert + new_row).__len__() > 4000):
            data_access.execute_query_with_params(sql_bulk_insert[0:-1], sql_params)
            sql_params = {"{"}
                "bulk_upload_id": bulk_upload_id
            {"}"}

            new_row = "0,".join(new_row.split(f"{"{"}row_for_params{"}"},"))
            new_row = "0)".join(new_row.split(f"{"{"}row_for_params{"}"})"))
            row_for_params = 0
            sql_bulk_insert = "INSERT INTO Staging.{model_name}({",".join(value_field_list)}, BulkUploadId) VALUES " + new_row
        else:
            sql_bulk_insert += new_row

        {"\n        ".join(fields_to_parameters_bulk)}
    
        
    data_access.execute_query_with_params(sql_bulk_insert[0:-1], sql_params)
        
    sql_bulk_load = "EXEC {bulk_load_proc}"
    
    return data_access.execute_query_with_params(sql_bulk_load)
    
# Add routes to main file
# from controllers.{pascal_to_snake(file_root_model)}.{pascal_to_snake(model_name)}_controller import router as {pascal_to_snake(model_name)}_router
# app.include_router({pascal_to_snake(model_name)}_router, prefix="/api/v1/{pascal_to_snake(model_name)}", tags=["{model_name}"])
    
"""

    return controller
