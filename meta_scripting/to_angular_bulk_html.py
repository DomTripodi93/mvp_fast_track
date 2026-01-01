

import re
from meta_scripting.helpers import pascal_to_camel, pascal_to_kabob, pascal_to_snake, pascal_to_spaced


def table_to_angular_bulk_html(
    sql: str, ignore_fields: list[str], model_name: str = "AutoModel"
) -> str:
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
        "datetime": "date",
        "datetime2": "date",
        "smalldatetime": "date",
        "date": "date",
        "time": "date",
        "uniqueidentifier": "string",
    }
    fields_to_grid_columns = []

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
            ts_type = type_mapping.get(base_type.group(), "string") if base_type else "string"
            

            # fields_to_parameters.append(f"{col_name} = @{col_name}")



    controller = f"""
@if(errorInfo.isError){"{"}
    <app-error-message [errorInfo]="errorInfo"></app-error-message>
{"}"}

@if(!savingChanges && !showRecordsForUpload) {"{"}
    <div class="width-fixed spaced">
        <div class="bulk-buttons">
            <app-custom-button variant="danger"
                (buttonClick)="cancelUpload()">
                Cancel Upload
            </app-custom-button>
        </div>
        <div id="fileuploader-container">
            <app-custom-upload (onSubmit)="processExcelFile($event)">
            </app-custom-upload>
        </div>
    </div>
{"}"}

@if(parsing || savingChanges) {"{"}
    <div class="middle centered">
        <app-loading-spinner ></app-loading-spinner>
    </div>
{"}"}

@if(uploadCompleted) {"{"}
    <div class="centered middle">
        <h1>Upload Successful!</h1>
    </div>
{"}"}

@if(savingChanges && {pascal_to_camel(model_name)}.length > 0 && !uploadCompleted && !uploadFailed) {"{"}
    <app-custom-grid [dataset]="{pascal_to_camel(model_name)}"
        [allowExporting]="false"
        (onCompleteBulkUpload)="submitUpload()"
        (onCancelBulkUpload)="cancelUpload()"
        (onRestartBulkUpload)="restartUpload()"
        ></app-custom-grid> 
{"}"}
@if(savingChanges && {pascal_to_camel(model_name)}.length > 0 && !uploadCompleted && uploadFailed) {"{"}
    <h1>
        The source file is formatted incorrectly, please check source
    </h1>
{"}"}
    

"""

    return controller
