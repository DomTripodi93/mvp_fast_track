import re
from meta_scripting.helpers import pascal_to_camel, pascal_to_snake


def table_to_dotnet_controller(
    sql: str,
    ignore_fields: list[str],
    model_name: str = "AutoModel",
    project_name: str = "Backend",
) -> str:
    type_mapping = {
        "int": "Int32",
        "bigint": "Int64",
        "smallint": "Int32",
        "tinyint": "Int32",
        "bit": "Boolean",
        "decimal": "Decimal",
        "numeric": "Decimal",
        "float": "Decimal",
        "real": "Decimal",
        "money": "Decimal",
        "smallmoney": "Decimal",
        "nvarchar": "String",
        "varchar": "String",
        "nchar": "String",
        "char": "String",
        "text": "String",
        "ntext": "String",
        "datetime": "DateTime",
        "datetime2": "DateTime",
        "smalldatetime": "DateTime",
        "date": "DateTime",
        "time": "DateTime",
        "uniqueidentifier": "String",
    }
    get_proc = f"dbo.sp{model_name}_Get"
    get_options_proc = f"dbo.sp{model_name}Options_Get"
    upsert_proc = f"dbo.sp{model_name}_Upsert"
    delete_proc = f"dbo.sp{model_name}_Delete"
    bulk_load_proc = f"dbo.sp{model_name}Bulk_Load"
    bulk_id_proc = f"dbo.sp{model_name}BulkUploadId_Get"
    fields_to_parameters_upsert = []
    fields_to_parameters_delete = []
    fields_to_parameters_bulk = []
    fields_to_parameters_single = []
    fields_to_parameters_search = []
    field_types = {}
    value_field_list = []
    insert_param_list = []
    dropdown_filter_params = []

    # Extract lines from CREATE TABLE
    columns = re.findall(r"\s*(\w+)\s+([\w()]+)(.*)", sql, re.IGNORECASE)

    primary_keys = []
    primary_keys_camel = []
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
            cs_db_type = (
                type_mapping.get(base_type.group(), "string") if base_type else "string"
            )
            field_types[col_name] = cs_db_type
            is_primary = "primary key" in extras.lower()
            if is_primary:
                primary_keys.append(col_name)
                primary_keys_camel.append(pascal_to_camel(col_name))
                fields_to_parameters_delete.append(
                    f"""sqlParams.Add("@{col_name}", {pascal_to_camel(model_name)}ForDelete.{col_name}, DbType.{cs_db_type});"""
                )
                fields_to_parameters_single.append(
                    f"""sqlParams.Add("@{col_name}", primaryKeys["{pascal_to_camel(col_name)}"].ToString(), DbType.{cs_db_type});"""
                )
                fields_to_parameters_search.append(
                    f"""if (parameters.ContainsKey("{col_name}") && parameters["{col_name}"].ToString() != "")
            {"{"}
                sqlParams.Add("@{col_name}", parameters["{pascal_to_camel(col_name)}"].ToString(), DbType.{cs_db_type});
            {"}"}"""
                )

            # fields_to_parameters.append(f"{col_name} = @{col_name}")
            if col_name != "BulkUploadId":
                fields_to_parameters_upsert.append(
                    f"""sqlParams.Add("@{col_name}", {pascal_to_camel(model_name)}ForUpsert.{col_name}, DbType.{cs_db_type});"""
                )
                fields_to_parameters_bulk.append(
                    f'sqlParams.Add($"@{col_name}{"{"}rowForParams.ToString(){"}"}", {pascal_to_camel(model_name)}ForUpsert.{col_name}, DbType.{cs_db_type});'
                )
                value_field_list.append(col_name)
                insert_param_list.append(f'{col_name}{"{"}rowForParams.ToString(){"}"}')
        elif (
            "clustered" in extras.lower()
            and col_name.lower() == "primary"
            and col_type.lower() == "key"
        ):
            primary_key_fields = extras[(extras.index("(") + 1) : extras.index(")")]
            primary_keys_string = primary_key_fields.replace(" ", "")
            primary_keys = primary_keys_string.split(",")
            for primary_key in primary_keys:
                pascal_primary_key = pascal_to_camel(primary_key)
                primary_keys_camel.append(pascal_primary_key)
                fields_to_parameters_delete.append(
                    f"""sqlParams.Add("@{primary_key}", {pascal_to_camel(model_name)}ForDelete.{primary_key}, DbType.{field_types[primary_key]});"""
                )
                fields_to_parameters_single.append(
                    f"""sqlParams.Add("@{primary_key}", primaryKeys["{pascal_primary_key}"].ToString(), DbType.{field_types[primary_key]});"""
                )
                fields_to_parameters_search.append(
                    f"""if (parameters.ContainsKey("{pascal_primary_key}") && parameters["{pascal_primary_key}"].ToString() != "")
            {"{"}
                sqlParams.Add("@{primary_key}", parameters["{pascal_primary_key}"].ToString(), DbType.{field_types[primary_key]});
            {"}"}"""
                )

        elif col_name.lower() == "link":
            has_dropdown = True
            link_info = col_type + extras
            link_info_parts = link_info.split(" TO ")
            link_to = link_info_parts[1]
            link_fields = (
                link_info_parts[0]
                .replace(" ", "")
                .replace("(", "")
                .replace(")", "")
                .split(",")
            )

            for link_field in link_fields:
                camel_link_field = pascal_to_camel(link_field)
                if (camel_link_field not in primary_keys_camel):
                    parameter_text = f"""if (parameters.ContainsKey("{camel_link_field}") && parameters["{camel_link_field}"].ToString() != "")
            {"{"}
                sqlParams.Add("@{link_field}", parameters["{camel_link_field}"].ToString(), DbType.{field_types[link_field]});
            {"}"}"""
                    
                    fields_to_parameters_search.append(parameter_text)

    controller = f"""
using System.Data;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using {project_name}.Data;
using {project_name}.Helpers;
using {project_name}.Models;


namespace {project_name}.Controllers
{"{"}
    [Authorize]
    [Route("api/v1/[controller]")]
    [ApiController]
    public class {model_name}Controller : ControllerBase {"{"}
        private readonly DataContextDapper _dapper;
        private readonly HelperPassthrough _helpers;
        
        public {model_name}Controller(IConfiguration config)
        {"{"}
            _dapper = new DataContextDapper(config);
            _helpers = new HelperPassthrough(config);
        {"}"}


        // [AllowAnonymous]
        [HttpPost("Get{model_name}")]
        public IActionResult Get{model_name}(Dictionary<string, object> parameters)
        {"{"}
            string sql = "{get_proc}";
            
            DynamicParameters sqlParams = new DynamicParameters();
            sqlParams.Add("@EditUser", User.FindFirst("Username")?.Value, DbType.String);            
            
            if (parameters.ContainsKey("searchTerm") && parameters["searchTerm"].ToString() != "")
            {"{"}
                sqlParams.Add("@SearchTerm", parameters["searchTerm"].ToString(), DbType.String);
            {"}"}

            if (parameters.ContainsKey("activeOnly") && parameters["activeOnly"].ToString()?.ToLower() == "false")
            {"{"}
                sqlParams.Add("@ActiveOnly", parameters["activeOnly"].ToString(), DbType.Boolean);
            {"}"}

            {"\n\n\t\t\t".join(fields_to_parameters_search)}

            return Ok(_dapper.LoadDataFromProcWithParameters<{model_name}>(sql, sqlParams));
        {"}"}
        

        // [AllowAnonymous]
        [HttpPost("Get{model_name}Options")]
        public IActionResult Get{model_name}Options(Dictionary<string, object> parameters)
        {"{"}
            string sql = "{get_options_proc}";
            
            DynamicParameters sqlParams = new DynamicParameters();
            sqlParams.Add("@EditUser", User.FindFirst("Username")?.Value, DbType.String);

            if (parameters.ContainsKey("activeOnly") && parameters["activeOnly"].ToString()?.ToLower() == "false")
            {"{"}
                sqlParams.Add("@ActiveOnly", parameters["activeOnly"].ToString(), DbType.Boolean);
            {"}"}

            {"\n\n\t\t\t\t".join(fields_to_parameters_search)}

            return Ok(_dapper.LoadDataFromProcWithParameters<{model_name}Option>(sql, sqlParams));
        {"}"}


        // [AllowAnonymous]
        [HttpPost("Get{model_name}Single")]
        public IActionResult Get{model_name}Single(Dictionary<string, object> primaryKeys)
        {"{"}
            string sql = "{get_proc}";
            
            DynamicParameters sqlParams = new DynamicParameters();
            sqlParams.Add("@EditUser", User.FindFirst("Username")?.Value, DbType.String);  

            {"\n\t\t\t".join(fields_to_parameters_single)}

            return Ok(_dapper.LoadDataSingleFromProcWithParameters<{model_name}>(sql, sqlParams));
        {"}"}

        // [AllowAnonymous]
        [HttpPost("Upsert{model_name}")]
        public IActionResult Upsert{model_name}({model_name} {pascal_to_camel(model_name)}ForUpsert)
        {"{"}
            string sql = "{upsert_proc}";
            
            DynamicParameters sqlParams = new DynamicParameters();
            sqlParams.Add("@EditUser", User.FindFirst("Username")?.Value, DbType.String);
            {"\n\t\t\t".join(fields_to_parameters_upsert)}

            if (_dapper.ExecuteProcWithParams(sql, sqlParams) > 0)
            {"{"}
                return Ok({pascal_to_camel(model_name)}ForUpsert);
            {"}"}
            throw new Exception("Upsert {model_name} failed on save");
        {"}"}

        // [AllowAnonymous]
        [HttpPost("Delete{model_name}/{"{"}{"}/{".join(primary_keys_camel)}{"}"}")]
        public IActionResult Delete{model_name}({model_name} {pascal_to_camel(model_name)}ForDelete)
        {"{"}
            string sql = "{delete_proc}";
            
            DynamicParameters sqlParams = new DynamicParameters();
            sqlParams.Add("@EditUser", User.FindFirst("Username")?.Value, DbType.String);
            {"\n\t\t\t".join(fields_to_parameters_delete)}

            if (_dapper.ExecuteProcWithParams(sql, sqlParams) > 0)
            {"{"}
                return Ok("{model_name} successfully deleted!");
            {"}"}
            throw new Exception("Deleting {model_name} failed on save");
        {"}"}

        // [AllowAnonymous]
        [HttpPost("BulkUpload{model_name}")]
        public IActionResult BulkUpload{model_name}(List<{model_name}> {pascal_to_camel(model_name)}sForBulkUpsert)
        {"{"}
            string sqlGetBulkId = "{bulk_id_proc}";
            List<string> result = _dapper.ExecuteProcedureWithResults<string>(sqlGetBulkId).ToList();
            
            string bulkUploadId = result[0];


            string insertRoot = "INSERT INTO Staging.{model_name}(BulkUploadId,{",".join(value_field_list)}) VALUES ";
            string sqlQuery = insertRoot;

            int rowsInserted = 0;
            int rowForParams = 0;

            DynamicParameters sqlParams = new DynamicParameters();
            sqlParams.Add("@BulkUploadId", bulkUploadId, DbType.Int64);

            foreach ({model_name} {pascal_to_camel(model_name)}ForUpsert in {pascal_to_camel(model_name)}sForBulkUpsert)
            {"{"}
                rowForParams += 1;
                string sqlToAdd = "(@BulkUploadId," 
                    + $"@{",\"\n\t\t\t\t\t+ $\"@".join(insert_param_list)}),";

                if ((sqlQuery + sqlToAdd).Length > 4000)
                {"{"}
                    rowsInserted += _dapper.ExecuteSQLWithParams(sqlQuery.Trim(','), sqlParams);
                    sqlParams = new DynamicParameters();
                    sqlParams.Add("@BulkUploadId", bulkUploadId, DbType.Int64);

                    sqlToAdd = string.Join("0,", sqlToAdd.Split(rowForParams.ToString() + ","));
                    sqlToAdd = string.Join("0)", sqlToAdd.Split(rowForParams.ToString() + ")"));
                    sqlQuery = insertRoot;
                    rowForParams = 0;
                {"}"}
                
                {"\n\t\t\t\t".join(fields_to_parameters_bulk)}

                sqlQuery += sqlToAdd;
            {"}"}
            
            rowsInserted += _dapper.ExecuteSQLWithParams(sqlQuery.Trim(','), sqlParams);

            string sqlLoadBulk = "{bulk_load_proc}";
            
            sqlParams = new DynamicParameters();
            sqlParams.Add("@BulkUploadId", bulkUploadId, DbType.Int64);
            if (_dapper.ExecuteProcWithParams(sqlLoadBulk, sqlParams) > 0)
            {"{"}
                return Ok();
            {"}"}
            throw new Exception("Bulk Upload {model_name} failed on save");


        {"}"}

    {"}"}
{"}"}\n\n
"""

    return controller
