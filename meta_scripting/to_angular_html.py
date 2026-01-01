import re
from meta_scripting.helpers import (
    pascal_to_camel,
    pascal_to_kabob,
    pascal_to_snake,
    pascal_to_spaced,
    pascal_to_words,
)


def table_to_angular_html(
    sql: str,
    ignore_fields: list[str],
    rename_option_keys: dict,
    remove_from_label_strings: dict,
    model_name: str = "AutoModel",
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
    type_editor_mapping = {
        "int": "app-custom-input",
        "bigint": "app-custom-input",
        "smallint": "app-custom-input",
        "tinyint": "app-custom-input",
        "bit": "app-custom-checkbox",
        "decimal": "app-custom-input",
        "numeric": "app-custom-input",
        "float": "app-custom-input",
        "real": "app-custom-input",
        "money": "app-custom-input",
        "smallmoney": "app-custom-input",
        "nvarchar": "app-custom-input",
        "varchar": "app-custom-input",
        "nchar": "app-custom-input",
        "char": "app-custom-input",
        "text": "app-custom-input",
        "ntext": "app-custom-input",
        "datetime": "app-custom-datebox",
        "datetime2": "app-custom-datebox",
        "smalldatetime": "app-custom-datebox",
        "date": "app-custom-datebox",
        "time": "app-custom-datebox",
        "uniqueidentifier": "app-custom-input",
    }
    # fields_to_grid_columns = []
    # fields_to_display = []
    dropdown_options = ""
    has_dropdown = False
    fields_to_edit = []
    dropdown_elements = []
    default_label_class = "field-label"
    default_value_class = "field-value"
    default_container_class = "field-container"
    default_edit_class = "field-edit"
    dropdown_filters = []
    primary_keys = []

    # Extract lines from CREATE TABLE
    columns = re.findall(r"\s*(\w+)\s+([\w()]+)(.*)", sql, re.IGNORECASE)

    columns = sorted(columns, key=lambda row: 0 if row[0] == "IsActive" else 1)

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
            ts_editor_type = (
                type_editor_mapping.get(base_type.group(), "string")
                if base_type
                else "string"
            )

            # fields_to_parameters.append(f"{col_name} = @{col_name}")
            # fields_to_display.append(
            #     f"""<div class="{default_container_class}">
            #     <label class="{default_label_class}">{pascal_to_spaced(col_name)}:</label>
            #     <div class="{default_value_class}">
            #         {"{{selected" + model_name + "." + pascal_to_camel(col_name) + "}}"}

            #         <{ts_editor_type}{" type=\"number\"" if ts_type == "number" else " "}
            #             [(value)]="{"selected" + model_name + "." + pascal_to_camel(col_name)}"
            #             [softDisabled]="true">
            #         </{ts_editor_type}>
            #     </div>
            # </div>"""
            # )
            disable_condition = f"""[softDisabled]="(!editMode || noEditFields.includes('{pascal_to_camel(col_name)}')) && !addMode">"""

            is_primary = "primary key" in extras.lower()
            if is_primary:
                disable_condition = f"""(valueChange)="setPrimaryKeys()"
                        [softDisabled]="!addMode">"""

            fields_to_edit.append(
                f"""<div class="{default_container_class}">
                <label class="{default_label_class}">{pascal_to_spaced(col_name)}:</label>
                <div class="{default_edit_class}{" centered" if ts_type == "boolean" else ""}">
                    <{ts_editor_type}{" size='22px'" if ts_type == "boolean" else (" type=\"number\"" if ts_type == "number" else " ")} 
                        [(value)]="selected{model_name}.{pascal_to_camel(col_name)}"
                        {disable_condition}
                    </{ts_editor_type}>
                </div>
            </div>"""
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
                disable_to_replace = f"""[softDisabled]="(!editMode || noEditFields.includes('{pascal_to_camel(primary_key)}')) && !addMode">"""

                replacement_disable = f"""(valueChange)="setPrimaryKeys()"
                        [softDisabled]="!addMode">"""

                lable_to_replace = f"""{pascal_to_spaced(primary_key)}:</label>"""

                replacement_lable = f"""*{pascal_to_spaced(primary_key)}:</label>"""

                fields_to_edit = [
                    field_to_edit.replace(
                        disable_to_replace, replacement_disable
                    ).replace(lable_to_replace, replacement_lable)
                    for field_to_edit in fields_to_edit
                ]

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

            label_fields = []

            for link_field in link_fields:
                link_field_for_label = link_field
                if any(
                    remove_from_label_string in link_field
                    for remove_from_label_string in remove_from_label_strings
                ):
                    for remove_from_label_string in remove_from_label_strings:
                        link_field_for_label = link_field_for_label.replace(
                            remove_from_label_string, ""
                        )
                label_fields.append(pascal_to_spaced(link_field_for_label))

            option_label = "/".join(label_fields)

            option_field_pascal = option_label.replace("/", "").replace(" ", "")

            option_field = pascal_to_camel(option_field_pascal)

            disable_condition = f"""[softDisabled]="(!editMode || noEditFields.includes('{option_field}')) && !addMode">"""
            field_label = f"""<label class="field-label">{option_label}:</label>"""

            is_primary = (
                True
                if any(link_field in primary_keys for link_field in link_fields)
                else False
            )
            if is_primary:
                disable_condition = f"""[softDisabled]="!addMode">"""
                field_label = f"""<label class="field-label">*{option_label}:</label>"""

            dropdown_element = f"""<div class="field-container">
                {field_label}
                <div class="field-edit">
                    <app-custom-search
                        [startingValue]="[selected{model_name}]"
                        optionListKey="{pascal_to_camel(link_to)}"
                        [wholeObjectValue]="true"
                        [showClearSelection]="true"
                        [fieldNameMappings]="{pascal_to_camel(model_name)}Serv.dropdownInfo['{option_field}']['fieldMap']"
                        [displayKeys]="optionServ.{pascal_to_camel(link_to)}Keys"
                        (valueChange)="set{option_field_pascal}($event)"
                        {disable_condition}
                    </app-custom-search>
                </div>
            </div>"""

            dropdown_filters.append(
                f"""<div class="section-lr search-width">
                <p class="filter-label">{option_label}:</p>
                <div class="filter-dropdown">
                    <app-custom-search
                        [startingValue]="[]"
                        optionListKey="{pascal_to_camel(link_to)}"
                        [wholeObjectValue]="true"
                        [showClearSelection]="true"
                        [fieldNameMappings]="{pascal_to_camel(model_name)}Serv.dropdownInfo['{option_field}']['fieldMap']"
                        [displayKeys]="optionServ.{pascal_to_camel(link_to)}Keys"
                        (valueChange)="set{option_field_pascal}Filter($event)">
                    </app-custom-search>
                </div>
            </div>"""
            )

            fields_to_edit = [
                (
                    field_to_edit
                    if all(
                        f'.{pascal_to_camel(link_field)}"' not in field_to_edit
                        for link_field in link_fields
                    )
                    else dropdown_element
                )
                for field_to_edit in fields_to_edit
            ]
            fields_to_edit = list(dict.fromkeys(fields_to_edit))
            # print(col_name)
            # print(col_type)
            # print(extras)
            # dropdown_elements.append(dropdown_element)
            dropdown_options = f"""
                [dropdownColumns]="dropdownColumns"
                [dropdownKeys]="dropdownKeys"
                [dropdownInfo]="{pascal_to_camel(model_name)}Serv.dropdownInfo"
                (onSetDropdownValue)="setDropdownValue($event)" """

    component_list_html = f"""
<div class="page-title">
    {"{{"}pageName{"}}"}
</div>
@if(errorInfo.isError){"{"}
    <app-error-message [errorInfo]="errorInfo"></app-error-message>
{"}"}
<div class="top-space grid-fit">
    @if(bulkUpload){"{"}
        <app-{pascal_to_kabob(model_name)}-bulk-upload
            (onCancelUpload)="setBulkUpload(false)"
            [fieldDisplayNames]="fieldDisplayNames">
        </app-{pascal_to_kabob(model_name)}-bulk-upload>
    {"}"} @else if(optionServ.optionsAvailable) {"{"}
        <div class="flex-any filter-fit">
            <div class="section-lr search-width">
                <p class="filter-label">
                    Search:
                </p>

                <app-custom-input (onEnter)="get{model_name}()" [(value)]="searchTerm" placeholder="Search">
                </app-custom-input>
            </div>
            {"\n\t\t\t".join(dropdown_filters)}
            <div class="section-lr search-width">
                <p class="filter-label">
                    Active Only:
                </p>
                <div class="centered filter-checkbox">
                    <app-custom-checkbox [(value)]="activeOnly" [size]="'20px'">
                    </app-custom-checkbox>
                </div>
            </div>
            <!--<div class="update-width">
                <div class="centered">
                    @if(resultsLoaded){"{"}
                        <img class="filter-icon pointer" src="/assets/SearchIcon.png"
                            (click)="get{model_name}()" />
                    {"}"}
                </div>
            </div>-->
            <div class="button-offset">
                @if(resultsLoaded || !initialSearchStarted){"{"}
                    <app-custom-button stylingMode="contained" variant="success"
                        (click)="get{model_name}()">
                        Update
                    </app-custom-button>
                {"}"} @else {"{"}
                    <app-custom-button stylingMode="contained" [disabled]="true"
                        [loading]="true"
                        style="background-color:rgb(165, 162, 150); color: white">
                        Update
                    </app-custom-button>
                {"}"}
            </div>
        </div>
        
        @if(singleSelection){"{"}
            <app-{pascal_to_kabob(model_name)}-single [(selected{model_name})]="selected{model_name}"
                [allowEditing]="true"
                [allowDeleting]="false"
                [(addMode)]="addMode"
                [(editMode)]="editMode"
                (onCloseSingleComponent)="setSingleEdit(selected{model_name}, false)"
                ></app-{pascal_to_kabob(model_name)}-single>
        {"}"}

        @if((!resultsLoaded || savingChanges) && initialSearchStarted){"{"}
            <app-loading-spinner width="40px" height="40px">
            </app-loading-spinner>
        {"}"} @else if(resultsLoaded && initialSearchStarted){"{"}
            <app-custom-grid [dataset]="{pascal_to_camel(model_name)}Serv.{pascal_to_camel(model_name)}List"
                [allowEditing]="true"
                [allowDeleting]="false"
                [allowAdding]="true"
                [fieldAlignment]="fieldAlignment"
                [fieldWidth]="fieldWidth"
                [displayOrder]="displayOrder"
                [noEditFields]="noEditFields"
                [fieldDisplayNames]="fieldDisplayNames"
                [hideKeys]="activeOnly ? hideKeysActiveOnly : hideKeys"
                [fieldTypes]="fieldTypes"
                [exportFileName]="pageName"
                [fixLeft]="fixedLeftFields"{dropdown_options}
                (onSaveEdit)="upsert{model_name}($event)"
                (onAddNewRow)="upsert{model_name}($event)"
                (onStartNewRow)="openCreate{model_name}()"
                (onStartBulkUpload)="setBulkUpload(true)"
                (onGoToDetail)="setSingleEdit($event, true)"
                ></app-custom-grid>
                <!--[deleteKeysForWarning]="primaryKeysForDelete"
                (onDelete)="delete{model_name}($event)" -->
            <!--@for({pascal_to_camel(model_name)} of {pascal_to_camel(model_name)}Serv.{pascal_to_camel(model_name)}List; let i = $index; track i){"{"}
                <app-{pascal_to_kabob(model_name)}-single 
                    [selected{model_name}]="{pascal_to_camel(model_name)}"
                    [dropdownInfo]="{pascal_to_camel(model_name)}Serv.dropdownInfo">
                </app-{pascal_to_kabob(model_name)}-single>
            {"}"} -->
        {"}"}
    {"}"}
</div>
    
"""
    #  @else {"{"}
    #     <app-loading-spinner width="40px" height="40px">
    #     </app-loading-spinner>    
    # {"}"}

    component_single_html = f"""
<div class="single-item-container">
    @if(!addMode && !nested){"{"}
        <div class="flex-any">
            <div class="field-container">
                @if(resultsLoaded){"{"}
                    <app-custom-button stylingMode="contained" variant="danger"
                        (click)="closeSingleComponent()">
                        Close Detail
                    </app-custom-button>
                {"}"} 
            </div>
        </div>
    {"}"} 
    @if(errorInfo.isError){"{"}
        <app-error-message [errorInfo]="errorInfo"></app-error-message>
    {"}"}
    <div class="default-edit-grid">
        @if(savingChanges) {"{"}
            <app-loading-spinner width="40px" height="40px">
            </app-loading-spinner>
        {"}"} @else {"{"}
            {"\n\t\t\t".join(fields_to_edit)}
        {"}"}
    </div>
    @if(editMode && !savingChanges){"{"}
        <div class="save-button-grid">
            <div class="field-container">
                <app-custom-button stylingMode="contained" variant="danger"
                    (click)="setEditMode(false)">
                    Cancel
                </app-custom-button>
            </div>
            <div class="field-container">
                <app-custom-button stylingMode="contained" variant="success"
                    (click)="upsert{model_name}()"
                    [disabled]="!canSubmit">
                    Submit
                </app-custom-button>
            </div>
        </div>
    {"}"} @else {"{"}
        <div class="edit-button-grid">
            @if(allowDeleting) {"{"}
                <div class="field-container">
                    <app-custom-button stylingMode="contained" variant="danger"
                        (click)="delete{model_name}()">
                        Delete
                    </app-custom-button>
                </div>
            {"}"}
            @if(allowEditing) {"{"}
                <div class="field-container">
                    <app-custom-button stylingMode="contained" variant="primary"
                        (click)="setEditMode(true)">
                        Edit
                    </app-custom-button>
                </div>
            {"}"}
        </div>
    {"}"}
</div>
"""

    return [component_list_html, component_single_html]
