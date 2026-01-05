

import re
from meta_scripting.helpers import pascal_to_camel, pascal_to_kabob, pascal_to_snake, pascal_to_spaced


def table_to_angular_html(
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
<div class="top-space grid-fit">
    <div class="flex-any filter-fit-shows">
        <div class="section-lr search-width">
            <label>
                Search:
            </label>

            <dx-text-box (onEnterKey)="get{model_name}s()" [(value)]="searchTerm" placeholder="Search">
            </dx-text-box>
        </div>
        <div class="section-lr tog-box-width">
            <div class="centered">
                <div class="shift-down pointer" (click)="toggleActiveOnly()">
                    <dx-switch [value]="activeOnly" [switchedOnText]="'Active'" [switchedOffText]="'All'"></dx-switch>
                </div>
            </div>
        </div>
        <div class="update-width">
            <div class="centered">
                <img class="filter-icon pointer" *ngIf="this.resultsLoaded" src="/assets/SearchIcon.png"
                    (click)="get{model_name}s()" />
            </div>
        </div>
        <div class="button-offset-sm">
            <dx-button *ngIf="resultsLoaded" stylingMode="contained" type="success" text="Update"
                (click)="get{model_name}s()">
            </dx-button>
            <dx-button *ngIf="!resultsLoaded" stylingMode="contained"
                style="background-color:rgb(165, 162, 150); color: white" text="Update">
                <div *dxTemplate="let data of 'content'">
                    <dx-load-indicator height="18" width="18" style="margin: none none none none; float: left;">
                    </dx-load-indicator>
                    <span class='dx-button-text space-left-text'>Update</span>
                </div>
            </dx-button>
        </div>
    </div>
    <div *ngIf="!resultsLoaded || savingChanges" class="centered middle">
        <dx-load-indicator #loading height="80" width="80" style="margin: auto;"></dx-load-indicator>
    </div>

    <dx-data-grid *ngIf="resultsLoaded && ({pascal_to_camel(model_name)}Serv.{pascal_to_camel(model_name)}List.length > 0)" id="gridContainer" #dataGrid
        [height]="gridHeight" [width]="'1400px'" [dataSource]="{pascal_to_camel(model_name)}Serv.{pascal_to_camel(model_name)}List" [allowColumnReordering]="true"
        [allowColumnResizing]="true" [columnAutoWidth]="true" columnResizingMode="widget" [showBorders]="true"
        [showRowLines]="true" [rowAlternationEnabled]="true" (onRowDblClick)="openEditForm($event)"
        (onRowUpdated)="upsert{model_name}($event)" (onRowInserted)="upsert{model_name}($event)">
        <dxo-filter-row [visible]="true"></dxo-filter-row>
        <dxo-export [enabled]="true" fileName="{pascal_to_spaced(model_name)}"></dxo-export>
        <dxo-header-filter [visible]="true"></dxo-header-filter>
        <dxo-sorting mode="multiple"></dxo-sorting>
        <dxo-column-chooser [enabled]="true" mode="select"></dxo-column-chooser>
        <dxo-column-fixing [enabled]="true"></dxo-column-fixing>
        <dxo-editing mode="row" [allowUpdating]="true" [allowDeleting]="false" [allowAdding]="true"></dxo-editing>
        <dxo-scrolling mode="virtual" [useNative]="true"></dxo-scrolling>


        {"\n\t\t".join(fields_to_grid_columns)}


        <div *dxTemplate="let cell of 'default'" class="default">
            {"{{"}cell.text{"}}"}
        </div>

        <div *dxTemplate="let cell of 'centered'" class="centered">
            {"{{"}cell.text{"}}"}
        </div>
    </dx-data-grid>
</div>
    
"""

    return controller
