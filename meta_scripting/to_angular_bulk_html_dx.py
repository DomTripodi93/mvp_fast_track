

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
        ):
            base_type = re.match(r"\w+", col_type.lower())
            ts_type = type_mapping.get(base_type.group(), "string") if base_type else "string"
            

            # fields_to_parameters.append(f"{col_name} = @{col_name}")
            fields_to_grid_columns.append(
                f"""<dxi-column dataField="{pascal_to_camel(col_name)}" 
            dataType="{ts_type}" 
            caption="{pascal_to_spaced(col_name)}" 
            cellTemplate="default" 
            [allowEditing]="true">
        </dxi-column>"""
            )

    controller = f"""
@if(!savingChanges && !showRecordsForUpload) {"{"}
    <div class="width-fixed spaced">
        <div id="fileuploader-container">
            <dx-file-uploader selectButtonText="Select File" labelText=""
                accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                uploadMode="useForm" (change)="prepToAddFile($event)">
            </dx-file-uploader>
        </div>
    </div>
{"}"}

@if(parsing || savingChanges) {"{"}
    <div class="middle centered">
        <dx-load-indicator height="80" width="80"></dx-load-indicator>
    </div>
{"}"}

@if(fileParsed && !showRecordsForUpload && !savingChanges && {pascal_to_camel(model_name)}s.length > 0) {"{"}
    <dx-button stylingMode="contained" type="success" text="Upload"
        (click)="showRecordsAfterParsing()">
    </dx-button>
{"}"}

@if(showRecordsForUpload && !savingChanges) {"{"}
    <div class="grid50 width-fixed">
        <div class="spaced">
            <dx-button stylingMode="contained" type="danger" text="Cancel" (click)="cancelUpload()">
            </dx-button>
        </div>
        <div class="spaced">
            <dx-button stylingMode="contained" type="success" text="Submit" (click)="bulkUpload{model_name}()">
            </dx-button>
        </div>
    </div>
{"}"}

@if(uploadCompleted) {"{"}
    <div class="centered middle">
        <h1>Upload Successful!</h1>
    </div>
{"}"}

@if(savingChanges && {pascal_to_camel(model_name)}s.length > 0 && !uploadCompleted && !uploadFailed) {"{"}
    <dx-data-grid #dataGrid
        id="dataGrid"
        [height]="gridHeight"
        [dataSource]="{pascal_to_camel(model_name)}s"
        [allowColumnReordering]="false"
        [allowColumnResizing]="false"
        [columnAutoWidth]="true"
        [showBorders]="true"
        [showRowLines]="true"
        [rowAlternationEnabled]="false"
        [wordWrapEnabled]="false"
        [repaintChangesOnly]="true"
        >
        <dxo-export [enabled]="true" fileName="{pascal_to_spaced(model_name)} - Pre-Upload"></dxo-export>
        <dxo-sorting mode="none"></dxo-sorting>
        <dxo-filter-row [visible]="true"></dxo-filter-row>
        <dxo-header-filter [visible]="true"></dxo-header-filter>
        <dxo-column-fixing [enabled]="true"></dxo-column-fixing>
        <dxo-search-panel [visible]="true" [width]="240" placeholder="Search..."></dxo-search-panel>
        <dxo-paging [enabled]="false"></dxo-paging>
        <dxo-scrolling mode="virtual" [useNative]="true"></dxo-scrolling>
        <dxo-editing mode="cell" 
            [allowUpdating]="true" 
            [allowDeleting]="false" 
            [allowAdding]="false"></dxo-editing>

        {"\n\t\t".join(fields_to_grid_columns)}

        <div *dxTemplate="let cell of 'default'" class="default">
            {"{{"}cell.text{"}}"}
        </div>

        <div *dxTemplate="let cell of 'centered'" class="centered">
            {"{{"}cell.text{"}}"}
        </div>

    </dx-data-grid> 
{"}"}
@if(savingChanges && {pascal_to_camel(model_name)}s.length > 0 && !uploadCompleted && uploadFailed) {"{"}
    <h1>
        The source file is formatted incorrectly, please check source
    </h1>
{"}"}
    
"""

    return controller
