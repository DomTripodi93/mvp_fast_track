import re
from meta_scripting.helpers import (
    pascal_to_words,
    pascal_to_camel,
    pascal_to_kabob,
)


def table_to_angular_component(
    sql: str,
    ignore_fields: list[str],
    rename_option_keys: dict,
    remove_from_label_strings: dict,
    model_name: str = "AutoModel",
    file_root_model: str = "AutoModel",
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
        "datetime": "Date",
        "datetime2": "Date",
        "smalldatetime": "Date",
        "date": "Date",
        "time": "Date",
        "uniqueidentifier": "string",
    }
    type_defaults = {
        "int": "0",
        "bigint": "0",
        "smallint": "0",
        "tinyint": "0",
        "bit": "false",
        "decimal": "0",
        "numeric": "0",
        "float": "0",
        "real": "0",
        "money": "0",
        "smallmoney": "0",
        "nvarchar": '""',
        "varchar": '""',
        "nchar": '""',
        "char": '""',
        "text": '""',
        "ntext": '""',
        "datetime": "new Date()",
        "datetime2": "new Date()",
        "smalldatetime": "new Date()",
        "date": "new Date()",
        "time": "new Date()",
        "uniqueidentifier": '""',
    }
    display_name_defaults = {
        "IsActive": "Active",
        "UnitOfMeasurement": "UoM",
        "PartNumber": "Part",
        "RevNumber": "Rev",
        "OpSequence": "Op",
        "PreferredVendorId": "Preferred Vendor",
        "BillToCustomerId": "Bill To Customer",
        "ShipToCustomerId": "Ship To Customer",
    }

    field_types = {}

    model_name_words = pascal_to_words(model_name)
    fields_for_alignment = []
    field_widths = []
    fields_display_order = []
    fields_not_to_edit = []
    primary_for_single_get = []
    primary_for_set_keys = []
    primary_for_check_keys = []
    primary_for_alert_keys = []
    primary_for_default_keys = []
    primary_for_params = []
    field_display_names = []
    field_type_args = []
    dropdown_keys = []
    has_date = False

    # Extract lines from CREATE TABLE
    columns = re.findall(r"\s*(\w+)\s+([\w()]+)(.*)", sql, re.IGNORECASE)
    columns = sorted(columns, key=lambda row: 0 if row[0] == "IsActive" else 1)

    primary_key = ""
    primary_keys_for_delete = ""
    primary_keys = []
    has_single_primary_key = False
    dropdown_selection_event_handlers = []
    dropdown_selection_event_handlers_grid = []
    dropdown_columns = []
    dropdown_filters = []
    dropdown_filters_args = []
    dropdown_filters_to_set = {}
    linked_fields_to_set = []
    filter_dropdown_event_handlers = []

    ts_type_map = {}

    for col_name, col_type, extras in columns:
        field_types[col_name] = col_type.split("(")[0].lower()

        # if ("LINK" in col_name):
        #     print("'" + col_name + "'")
        #     print(col_type)
        #     print(extras)

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
            if ts_type.lower() == "date":
                has_date = True

            ts_type_map[col_name] = ts_type

            field_type_args.append(f'{pascal_to_camel(col_name)}: "{ts_type}"')

            fields_for_alignment.append(f'"{pascal_to_camel(col_name)}": "left"')
            field_widths.append(f'"{pascal_to_camel(col_name)}": "max-content"')
            fields_display_order.append(f'"{pascal_to_camel(col_name)}"')

            if col_name not in display_name_defaults and any(
                remove_from_label_string in col_name
                for remove_from_label_string in remove_from_label_strings
            ):
                display_name_defaults[col_name] = pascal_to_words(col_name)
                for remove_from_label_string in remove_from_label_strings:
                    display_name_defaults[col_name] = display_name_defaults[
                        col_name
                    ].replace(remove_from_label_string, "")
            field_display_names.append(
                f'"{pascal_to_camel(col_name)}": "{
                    display_name_defaults[col_name] if col_name in display_name_defaults else pascal_to_words(col_name)
                }"'
            )

            is_primary = "primary key" in extras.lower()
            if is_primary:
                primary_key = col_name
                has_single_primary_key = True
                primary_keys_for_delete = f'["{pascal_to_camel(primary_key)}"]'
                # primary_keys_for_delete = f"{pascal_to_camel(model_name)}ForDelete.{pascal_to_camel(primary_key)}"
                fields_not_to_edit.append(f'"{pascal_to_camel(col_name)}"')
                primary_for_single_get.append(
                    f"this.selected{model_name}.{pascal_to_camel(col_name)}"
                )
                primary_for_set_keys.append(
                    f'this.selectedPrimaryKeys["{pascal_to_camel(col_name)}"] = this.selected{model_name}.{pascal_to_camel(col_name)};'
                )
                primary_for_default_keys.append(
                    f"\"{pascal_to_camel(col_name)}\": {type_defaults[col_type.lower()] if col_type.lower() in type_defaults  else '""'}"
                )
                primary_for_params.append(
                    f"""if (params["{pascal_to_camel(col_name)}"]) {"{"}
                paramsSupplied = true;
                this.selectedPrimaryKeys["{pascal_to_camel(col_name)}"] = params["{pascal_to_camel(col_name)}"];
            {"}"}"""
                )
                primary_for_check_keys.append(
                    f'option.{pascal_to_camel(col_name)} == this.selectedPrimaryKeys["{pascal_to_camel(col_name)}"]'
                )
                primary_for_alert_keys.append(
                    f"""{pascal_to_words(col_name)}: ${"{"}this.selectedPrimaryKeys["{pascal_to_camel(col_name)}"]{"}"}"""
                )

        elif (
            "clustered" in extras.lower()
            and col_name.lower() == "primary"
            and col_type.lower() == "key"
        ):
            primary_key_fields = extras[(extras.index("(") + 1) : extras.index(")")]
            primary_keys_string = primary_key_fields.replace(" ", "")
            primary_keys = primary_keys_string.split(",")
            primary_keys_pascal = [
                pascal_to_camel(primary_key) for primary_key in primary_keys
            ]
            primary_keys_for_delete = f'["{'", "'.join(primary_keys_pascal)}"]'
            fields_not_to_edit = [
                f'"{pascal_to_camel(primary_key)}"' for primary_key in primary_keys
            ]
            primary_for_single_get = [
                f"this.selected{model_name}.{pascal_to_camel(primary_key)}"
                for primary_key in primary_keys
            ]
            primary_for_set_keys = [
                f'this.selectedPrimaryKeys["{pascal_to_camel(primary_key)}"] = this.selected{model_name}.{pascal_to_camel(primary_key)};'
                for primary_key in primary_keys
            ]
            primary_for_default_keys = [
                f"\"{pascal_to_camel(primary_key)}\": {type_defaults[field_types[primary_key]] if col_name in field_types and field_types[primary_key] in type_defaults else '""'}"
                for primary_key in primary_keys
            ]
            primary_for_params = [
                f"""if (params["{pascal_to_camel(primary_key)}"]) {"{"}
                paramsSupplied = true;
                this.selectedPrimaryKeys["{pascal_to_camel(primary_key)}"] = params["{pascal_to_camel(primary_key)}"];
            {"}"}"""
                for primary_key in primary_keys
            ]
            primary_for_check_keys = [
                f'option.{pascal_to_camel(primary_key)} == this.selectedPrimaryKeys["{pascal_to_camel(primary_key)}"]'
                for primary_key in primary_keys
            ]
            primary_for_alert_keys = [
                f"""{pascal_to_words(primary_key)}: ${"{"}this.selectedPrimaryKeys["{pascal_to_camel(primary_key)}"]{"}"}"""
                for primary_key in primary_keys
            ]
            # primary_keys_for_delete = ",".join(primary_keys_pascal)
        elif col_name.lower() == "link":
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
                dropdown_filters.append(
                    f"@Input() selected{link_field}: {ts_type_map[link_field]} = {type_defaults[field_types[link_field]]};"
                )
                dropdown_filters_args.append(f"this.selected{link_field}")

                link_field_for_label = link_field
                if any(
                    remove_from_label_string in link_field
                    for remove_from_label_string in remove_from_label_strings
                ):
                    for remove_from_label_string in remove_from_label_strings:
                        link_field_for_label = link_field_for_label.replace(
                            remove_from_label_string, ""
                        )
                label_fields.append(link_field_for_label)

                # for field_not_to_edit in fields_not_to_edit:
                #     if (field_not_to_edit.lower() ==))

            option_label = "".join(label_fields)

            print(link_fields)

            is_primary = (
                True
                if any(link_field in primary_keys for link_field in link_fields)
                else False
            )
            # dropdown_value_connection_keys.append(
            #     f'''"{pascal_to_camel(option_label)}": {dropdown_field_map}'''
            # )

            fields_display_order = [
                (
                    field_display_order
                    if all(
                        f'"{pascal_to_camel(link_field)}"' != field_display_order
                        for link_field in link_fields
                    )
                    else f'"{pascal_to_camel(option_label)}"'
                )
                for field_display_order in fields_display_order
            ]
            fields_display_order = list(dict.fromkeys(fields_display_order))

            field_display_names = [
                (
                    field_display_name
                    if all(
                        f'"{pascal_to_camel(link_field)}"' not in field_display_name
                        for link_field in link_fields
                    )
                    else f'"{pascal_to_camel(option_label)}": "{
                        display_name_defaults[option_label] if option_label in display_name_defaults else pascal_to_words(option_label)
                    }"'
                )
                for field_display_name in field_display_names
            ]
            field_display_names = list(dict.fromkeys(field_display_names))

            fields_not_to_edit = [
                (
                    field_not_to_edit
                    if all(
                        f'"{pascal_to_camel(link_field)}"' != field_not_to_edit
                        for link_field in link_fields
                    )
                    else f'"{pascal_to_camel(option_label)}"'
                )
                for field_not_to_edit in fields_not_to_edit
            ]
            fields_not_to_edit = list(dict.fromkeys(fields_not_to_edit))

            linked_fields_to_set = [
                f"""this.selected{model_name}.{pascal_to_camel(link_field)} = event.{rename_option_keys[link_field] if link_field in rename_option_keys else pascal_to_camel(link_field)}"""
                for link_field in link_fields
            ]

            linked_fields_to_set_grid = [
                f"""editObject.{pascal_to_camel(link_field)} = event.{rename_option_keys[link_field] if link_field in rename_option_keys else pascal_to_camel(link_field)}"""
                for link_field in link_fields
            ]

            dropdown_filters_to_set = [
                f"""this.selected{link_field} = event.{rename_option_keys[link_field] if link_field in rename_option_keys else pascal_to_camel(link_field)}"""
                for link_field in link_fields
            ]
            # print(col_name)
            # print(col_type)
            # print(extras)
            filter_dropdown_event_handlers.append(
                f"""
    set{option_label}Filter(event: any) {"{"}
        // console.log(event)
        {"\n\t\t".join(dropdown_filters_to_set)}
    {"}"}"""
            )

            dropdown_selection_event_handlers.append(
                f"""
    set{option_label}(event: any) {"{"}
        // console.log(event)
        {
            "\n\t\t".join(linked_fields_to_set)
        }{
            "\n\t\tthis.setPrimaryKeys();" if is_primary else ""
        }
    {"}"}"""
            )

            dropdown_selection_event_handlers_grid.append(
                f""""{pascal_to_camel(option_label)}": (event: any, editObject: any) => {"{"}
            // console.log(event)
            {"\n\t\t\t".join(linked_fields_to_set_grid)}
        {"}"}"""
            )

            dropdown_columns.append(f'"{pascal_to_camel(option_label)}"')

            dropdown_keys.append(
                f'"{pascal_to_camel(option_label)}": this.optionServ.{pascal_to_camel(link_to)}Keys'
            )

    component_list_ts = f"""
import {"{"} Component, OnDestroy, OnInit, Input {"}"} from '@angular/core';
import {"{"} {model_name}Service {"}"} from '../../services/{pascal_to_kabob(file_root_model)}/{pascal_to_kabob(model_name)}-service.service';
import {"{"} ErrorService {"}"} from '../../services/error-service.service';
import {"{"} ErrorInfo {"}"} from '../../models/error-info.model';
import {"{"} ActivatedRoute {"}"} from '@angular/router';
import {"{"} Subscription {"}"} from 'rxjs';
import {"{"} {model_name} {"}"} from '../../models/{pascal_to_kabob(file_root_model)}/{pascal_to_kabob(model_name)}.model';
import {"{"} AuthService {"}"} from '../../services/auth-service.service';
import {"{"} OptionService {"}"} from '../../services/option-service.service';
import {"{"} CustomButtonComponent {"}"} from '../../elements/custom-button/custom-button.component';
import {"{"} LoadingSpinnerComponent {"}"} from '../../elements/loading-spinner/loading-spinner.component';
import {"{"} CustomInputComponent {"}"} from '../../elements/custom-input/custom-input.component';
import {"{"} {model_name}SingleComponent {"}"} from './{pascal_to_kabob(model_name)}-single/{pascal_to_kabob(model_name)}-single-component.component';
import {"{"} CustomGridComponent {"}"} from "../../elements/custom-grid/custom-grid.component";
import {"{"} ErrorMessageComponent {"}"} from '../../elements/error-message/error-message.component';
import {"{"} CustomCheckboxComponent {"}"} from '../../elements/custom-checkbox/custom-checkbox.component';
import {"{"} {model_name}BulkComponent {"}"} from './{pascal_to_kabob(model_name)}-bulk-upload/{pascal_to_kabob(model_name)}-bulk-upload-component.component';
{'' if len(dropdown_selection_event_handlers) > 0 else "// "}import {"{"} CustomSearchComponent {"}"} from "../../elements/custom-search/custom-search.component";

@Component({"{"}
    selector: 'app-{pascal_to_kabob(model_name)}',
    standalone: true,
    imports: [
        CustomButtonComponent,
        CustomInputComponent,
        LoadingSpinnerComponent,
        {model_name}SingleComponent,
        CustomGridComponent,
        ErrorMessageComponent,
        CustomCheckboxComponent,
        {model_name}BulkComponent,
        {'' if len(dropdown_selection_event_handlers) > 0 else "// "}CustomSearchComponent,
    ],
    templateUrl: './{pascal_to_kabob(model_name)}-component.component.html',
    styleUrl: './{pascal_to_kabob(model_name)}-component.component.css'
{"}"})
export class {model_name}Component implements OnInit, OnDestroy {"{"}
    @Input() onlyMine: boolean = false;
    {"\n\t".join(dropdown_filters)}
    //Page Defaults:
    errorInfo: ErrorInfo = this.errorServ.resetErrorMessage();
    pageModel: string = "{model_name}";
    pageName: string = "{pascal_to_words(model_name)}";
    routeParamsSubscription: Subscription = new Subscription();
    {pascal_to_camel(model_name)}HasChangedSubscription: Subscription = new Subscription();
    fieldTypes: Record<string, string> = {"{"}
        {",\n\t\t".join(field_type_args)}
    {"}"}

    //Page State:{f'\n\tselected{primary_key}: string = "";' if has_single_primary_key else ""}
    singleSelection: boolean = false;
    selected{model_name}: {model_name} = {"{"}
        ... this.{pascal_to_camel(model_name)}Serv.empty{model_name}
    {"}"};
    searchTerm: string = '';
    initialSearchStarted: boolean = false;
    resultsLoaded: boolean = false;
    savingChanges: boolean = false;
    editMode: boolean = false;
    addMode: boolean = false;
    activeOnly: boolean = true;
    bulkUpload: boolean = false;

    
    //Grid Settings:
    primaryKeysForDelete: string[] = {primary_keys_for_delete};
    fieldAlignment: Record<string, string> = {"{"}
        {",\n\t\t".join(fields_for_alignment)}
    {"}"};
    fieldWidth: Record<string, string> = {"{"}
        {",\n\t\t".join(field_widths)}
    {"}"};
    displayOrder: string[] = [
        {",\n\t\t".join(fields_display_order)}
    ];
    noEditFields: string[] = [
        {",\n\t\t".join(fields_not_to_edit)}
    ];
    fixedLeftFields: string[] = [
        "isActive",
        {",\n\t\t".join(fields_not_to_edit[:5])}
    ];
    hideKeys: string[] = [];
    hideKeysActiveOnly: string[] = [
        "isActive",
        ...this.hideKeys
    ];
    fieldDisplayNames: Record<string, string> = {"{"}
        {",\n\t\t".join(field_display_names)}
    {"}"};

    {f"""dropdownKeys: Record<string, any> = {"{"}
        {",\n\t\t".join(dropdown_keys)}
    {"}"}
""" if len(dropdown_selection_event_handlers) > 0 
    else ""}{f"""\tdropdownColumns: string[] = [
        {",\n\t\t".join(dropdown_columns)}
    ]
""" if len(dropdown_selection_event_handlers) > 0 
    else ""}{f"""\tdropdownValueResponses: Record<string, (event: any, editObject: any) => void> = {"{"}
        {",\n\t\t".join(dropdown_selection_event_handlers_grid)}
    {"}"}
""" if len(dropdown_selection_event_handlers) > 0 
    else ""}
    
    constructor(
        private route: ActivatedRoute,
        private errorServ: ErrorService,
        public {pascal_to_camel(model_name)}Serv: {model_name}Service,
        public auth: AuthService,
        public optionServ: OptionService
    ) {"{"}{"}"}

    ngOnInit(): void {"{"}
        {'this.subscribeParams();' if has_single_primary_key else ""}
        this.subscribe{model_name}HasChanged();
    {"}"}
    
    subscribe{model_name}HasChanged() {"{"}
        this.{pascal_to_camel(model_name)}HasChangedSubscription = this.{pascal_to_camel(model_name)}Serv.{pascal_to_camel(model_name)}sHaveChanged.subscribe(() => {"{"}
            this.get{model_name}();
        {"}"})
    {"}"}
    {"\n\t".join(filter_dropdown_event_handlers)
    if len(filter_dropdown_event_handlers) > 0 else ""} 
    {f"""
    setDropdownValue(event: any) {"{"}
        let eventValue = event.value;
        let eventColumn = event.column;
        let eventObject = event.object;
        this.dropdownValueResponses[eventColumn](eventValue, eventObject);
    {"}"}
""" if len(dropdown_selection_event_handlers) > 0 
    else ""}
    openCreate{model_name}() {"{"}
        this.setSingleEdit(this.{pascal_to_camel(model_name)}Serv.empty{model_name}, true, true)
    {"}"}

    setBulkUpload(bulkUpload: boolean) {"{"}
        if (!bulkUpload && this.resultsLoaded) {"{"}
            this.resultsLoaded = false;
            setTimeout(() => {"{"}
                this.resultsLoaded = true;
            {"}"}, 1);
        {"}"}
        this.bulkUpload = bulkUpload;
    {"}"}

    setSingleEdit(selected{model_name}: {model_name}, singleSelection: boolean, addMode: boolean = false) {"{"}
        if (
            !singleSelection || 
            !this.singleSelection || 
            !this.editMode ||
            confirm("Are you sure you want to change {pascal_to_words(model_name).lower()} details without saving your changes?")
        ) {"{"}
            this.addMode = addMode;
            this.editMode = addMode;
            if (singleSelection) {"{"}
                this.selected{model_name} = {"{"} ...selected{model_name} {"}"};
            {"}"} else {"{"}
                this.selected{model_name} = {"{"} ...this.{pascal_to_camel(model_name)}Serv.empty{model_name} {"}"};
            {"}"}
            this.singleSelection = singleSelection;
        {"}"}
    {"}"}

    {f"""
    subscribeParams() {"{"}
        this.routeParamsSubscription = this.route.params.subscribe(params => {"{"}
            // console.log(params);
            if (params["{pascal_to_camel(primary_key)}"]) {"{"}
                this.selected{primary_key} = params["{pascal_to_camel(primary_key)}"];
                this.singleSelection = true;
            {"}"} else {"{"} 
                this.singleSelection = false;
            {"}"}
            if (this.singleSelection) {"{"}
                this.get{model_name}();
            {"}"}
        {"}"})
    {"}"}""" if has_single_primary_key else ""}  

    toggleActiveOnly() {"{"}
        this.activeOnly = !this.activeOnly;
        this.get{model_name}();
    {"}"}
    
    openEditForm(event: any) {"{"}
        event.component.editRow(event.rowIndex)
    {"}"}

    setUpdateComplete() {"{"}
        this.resultsLoaded = true;   
    {"}"}

    get{model_name}() {"{"}
        this.initialSearchStarted = true;
        this.resultsLoaded = false;
        this.errorInfo = this.errorServ.resetErrorMessage();
        this.{pascal_to_camel(model_name)}Serv.get{model_name}(
            this.searchTerm, 
            this.activeOnly,
            {",\n\t\t\t".join(dropdown_filters_args)}
        ).subscribe({"{"}
            next: res => {"{"}
                this.{pascal_to_camel(model_name)}Serv.{pascal_to_camel(model_name)}List = res;
                this.setUpdateComplete();
            {"}"},
            error: (err: any) => {"{"}
                console.log(err);
                this.setUpdateComplete();
                let errorMessage = "An error occurred while loading the {model_name_words} data. Please try again later.";
                let errorInner = JSON.stringify(err.error.errors, null, "\\t")
                    
                this.errorInfo = this.errorServ.getErrorMessage(errorMessage, errorInner);
            {"}"}
        {"}"});
    {"}"}

    upsert{model_name}(event: any) {"{"}
        let {pascal_to_camel(model_name)}ForUpsert = event
        this.savingChanges = true;
        this.errorInfo = this.errorServ.resetErrorMessage();
        this.{pascal_to_camel(model_name)}Serv.upsert{model_name}({pascal_to_camel(model_name)}ForUpsert).subscribe({"{"}
            next: () => {"{"}
                this.savingChanges = false;
                this.get{model_name}();
            {"}"},
            error: (err: any) => {"{"}
                this.savingChanges = false;
                console.log(err);
                let errorMessage = "An error occurred while saving the {model_name_words}. Please try again later.";
                let errorInner = JSON.stringify(err.error.errors, null, "\\t")
                    
                this.errorInfo = this.errorServ.getErrorMessage(errorMessage, errorInner);
            {"}"}
        {"}"});
    {"}"}

    delete{model_name}(event: any) {"{"}
        this.errorInfo = this.errorServ.resetErrorMessage();
        let {pascal_to_camel(model_name)}ForDelete = event
        this.{pascal_to_camel(model_name)}Serv.delete{model_name}({pascal_to_camel(model_name)}ForDelete).subscribe({"{"}
            next: () => {"{"}
                this.get{model_name}();
            {"}"},
            error: (err: any) => {"{"}
                console.log(err);
                let errorMessage = "An error occurred while deleting the {model_name_words}. Please try again later.";
                let errorInner = JSON.stringify(err.error.errors, null, "\\t")
                    
                this.errorInfo = this.errorServ.getErrorMessage(errorMessage, errorInner);
            {"}"}
        {"}"});
    {"}"}
    
    ngOnDestroy(): void {"{"}
        this.routeParamsSubscription.unsubscribe();
        this.{pascal_to_camel(model_name)}HasChangedSubscription.unsubscribe();
    {"}"}
    
{"}"}
    
    
"""

    component_single_ts = f"""
import {"{"} Component, OnInit, Input, OnDestroy, Output, EventEmitter, OnChanges, SimpleChanges {"}"} from '@angular/core';
import {"{"} {model_name}Service {"}"} from '../../../services/{pascal_to_kabob(file_root_model)}/{pascal_to_kabob(model_name)}-service.service';
import {"{"} ErrorService {"}"} from '../../../services/error-service.service';
import {"{"} ActivatedRoute {"}"} from '@angular/router';
import {"{"} Subscription {"}"} from 'rxjs';
import {"{"} {model_name} {"}"} from '../../../models/{pascal_to_kabob(file_root_model)}/{pascal_to_kabob(model_name)}.model';
import {"{"} AuthService {"}"} from '../../../services/auth-service.service';
import {"{"} OptionService {"}"} from '../../../services/option-service.service';
import {"{"} CustomButtonComponent {"}"} from '../../../elements/custom-button/custom-button.component';
import {"{"} LoadingSpinnerComponent {"}"} from '../../../elements/loading-spinner/loading-spinner.component';
import {"{"} CustomInputComponent {"}"} from '../../../elements/custom-input/custom-input.component';
import {"{"} CustomCheckboxComponent {"}"} from '../../../elements/custom-checkbox/custom-checkbox.component';
import {"{"} ErrorInfo {"}"} from '../../../models/error-info.model';
import {"{"} ErrorMessageComponent {"}"} from '../../../elements/error-message/error-message.component';
import {"{"} HelperService {"}"} from '../../../services/helper-service.service';
{'' if len(dropdown_selection_event_handlers) > 0 else "// "}import {"{"} CustomSearchComponent {"}"} from "../../../elements/custom-search/custom-search.component";
{'' if has_date else "// "}import {"{"} CustomDateboxComponent {"}"} from "../../../elements/custom-datebox/custom-datebox.component";

@Component({"{"}
    selector: 'app-{pascal_to_kabob(model_name)}-single',
    standalone: true,
    imports: [
        CustomButtonComponent,
        CustomInputComponent,
        CustomCheckboxComponent,
        LoadingSpinnerComponent,
        ErrorMessageComponent,
        {'' if len(dropdown_selection_event_handlers) > 0 else "// "}CustomSearchComponent,
        {'' if has_date else "//"} CustomDateboxComponent,
    ],
    templateUrl: './{pascal_to_kabob(model_name)}-single-component.component.html',
    styleUrl: '../{pascal_to_kabob(model_name)}-component.component.css'
{"}"})
export class {model_name}SingleComponent implements OnInit, OnDestroy, OnChanges {"{"}
    canSubmit: boolean = false;
    errorInfo: ErrorInfo = this.errorServ.resetErrorMessage();
    @Input() selected{model_name}: {model_name} = {"{"} 
        ... this.{pascal_to_camel(model_name)}Serv.empty{model_name} 
    {"}"};
    original{model_name}: {model_name} = {"{"} 
        ... this.{pascal_to_camel(model_name)}Serv.empty{model_name} 
    {"}"};

    @Output() selected{model_name}Change: EventEmitter<{model_name}> = new EventEmitter<{model_name}>();
    @Input() allowDeleting: boolean = false;
    @Input() allowEditing: boolean = false;
    noEditFields: string[] = [
        {",\n\t\t".join(fields_not_to_edit)}
    ];
    @Output() onCloseSingleComponent: EventEmitter<any> = new EventEmitter<any>();

    routeParamsSubscription: Subscription = new Subscription();
    {pascal_to_camel(model_name)}HasChangedSubscription: Subscription = new Subscription();
    defaultPrimaryKeys: Record<string, any> = {"{"}
        {",\n\t\t".join(primary_for_default_keys)}
    {"}"}
    selectedPrimaryKeys: Record<string, any> = {"{"}
        ...this.defaultPrimaryKeys
    {"}"}
    
    
    resultsLoaded: boolean = true;
    savingChanges: boolean = false;
    @Input() nested: boolean = false;
    @Input() addMode: boolean = false;
    @Output() addModeChange = new EventEmitter<any>();
    @Input() editMode: boolean = false;
    @Output() editModeChange = new EventEmitter<any>();
    
    constructor(
        private route: ActivatedRoute,
        private errorServ: ErrorService,
        public {pascal_to_camel(model_name)}Serv: {model_name}Service,
        public auth: AuthService,
        public optionServ: OptionService,
        public helperServ: HelperService
    ) {"{"}{"}"}

    ngOnInit(): void {"{"}
        this.subscribe{model_name}HasChanged();
        this.subscribeParams();
        this.initializeNewSelection();
    {"}"}

    ngOnChanges(changes: SimpleChanges) {"{"}
        if (changes['selected{model_name}']) {"{"}
            this.initializeNewSelection();
        {"}"}
    {"}"}

    initializeNewSelection() {"{"}
        this.errorInfo = this.errorServ.resetErrorMessage();
        this.setPrimaryKeys();
        this.storeOriginalValue();
    {"}"}

    storeOriginalValue() {"{"}
        this.original{model_name} = {"{"} ...this.selected{model_name} {"}"};
    {"}"}

    restoreOriginalValue() {"{"}
        this.selected{model_name} = {"{"} ...this.original{model_name} {"}"};
    {"}"}

    setPrimaryKeys() {"{"}
        {"\n\t\t".join(primary_for_set_keys)}
        if (this.addMode) {"{"}    
            this.checkPrimaryKeysValid();
        {"}"} else {"{"}
            this.canSubmit = true;
        {"}"}
    {"}"}

    checkPrimaryKeysValid() {"{"}
        Promise.all([
            this.primaryKeysNotDuplicated(), 
            this.helperServ.primaryKeysHaveValues(
                this.selectedPrimaryKeys, 
                this.defaultPrimaryKeys
            )
        ]).then((results) => {"{"}
            if (results.every(result => result)) {"{"}
                this.canSubmit = true;
            {"}"} else {"{"}
                this.canSubmit = false;
            {"}"}
        {"}"});
    {"}"}

    primaryKeysNotDuplicated() {"{"}
        return new Promise<boolean>(resolve => {"{"}
            let isDuplicate = this.optionServ.optionLists["{pascal_to_camel(model_name)}"].filter(option => {"{"}
                return {" &&\n\t\t\t\t\t".join(primary_for_check_keys)}
            {"}"}).length > 0;
            if (isDuplicate) {"{"}
                let errorMessage = "A {model_name_words} already exists with the provided values: \\n" + 
                    `{", ` + \n\t\t\t\t\t`".join(primary_for_alert_keys)}`;
                
                this.errorInfo = this.errorServ.getErrorMessage(errorMessage);
                // alert(errorMessage);
                resolve(false);
            {"}"} else {"{"}
                resolve(true);
            {"}"}
        {"}"});
    {"}"}

    {"\n\n\t".join(dropdown_selection_event_handlers)}
    
    subscribe{model_name}HasChanged() {"{"}
        this.{pascal_to_camel(model_name)}HasChangedSubscription = this.{pascal_to_camel(model_name)}Serv.{pascal_to_camel(model_name)}sHaveChanged.subscribe(() => {"{"}
            this.addMode = false;
            this.editMode = false;
            this.get{model_name}();
        {"}"})
    {"}"}

    closeSingleComponent() {"{"}
        this.onCloseSingleComponent.emit();
    {"}"}

    subscribeParams() {"{"}
        this.routeParamsSubscription = this.route.params.subscribe(params => {"{"}
            // console.log(params);
            let paramsSupplied = false;
            {"\n\t\t\t".join(primary_for_params)}
            if (paramsSupplied) {"{"}
                this.get{model_name}();
            {"}"}
        {"}"})
    {"}"}

    setEditMode(editMode: boolean) {"{"}
        if (this.addMode) {"{"}
            this.closeSingleComponent();
        {"}"} else {"{"}
            if (!editMode) {"{"}
                this.restoreOriginalValue();
            {"}"}
            this.editMode = editMode;
            this.editModeChange.emit(this.editMode);
        {"}"}
    {"}"}

    setUpdateComplete() {"{"}
        this.resultsLoaded = true;   
    {"}"}

    get{model_name}() {"{"}
        this.errorInfo = this.errorServ.resetErrorMessage();
        this.resultsLoaded = false;
        this.{pascal_to_camel(model_name)}Serv.get{model_name}Single(this.selectedPrimaryKeys).subscribe({"{"}
            next: res => {"{"}
                this.selected{model_name} = res;
                this.selected{model_name}Change.emit(this.selected{model_name})
                this.setUpdateComplete();
            {"}"},
            error: err => {"{"}
                this.setUpdateComplete();
                console.log(err);
                let errorMessage = "An error occurred while loading the {model_name_words} data. Please try again later.";
                let errorInner = JSON.stringify(err.error.errors, null, "\\t")
                    
                this.errorInfo = this.errorServ.getErrorMessage(errorMessage, errorInner);
            {"}"}
        {"}"});
    {"}"}

    upsert{model_name}() {"{"}
        this.errorInfo = this.errorServ.resetErrorMessage();
        this.savingChanges = true;
        this.{pascal_to_camel(model_name)}Serv.upsert{model_name}(this.selected{model_name}).subscribe({"{"}
            next: () => {"{"}
                this.savingChanges = false;
                this.get{model_name}();
                this.{pascal_to_camel(model_name)}Serv.{pascal_to_camel(model_name)}sHaveChanged.next();
                this.{pascal_to_camel(model_name)}Serv.{pascal_to_camel(model_name)}OptionsHaveChanged.next();
            {"}"},
            error: (err: any) => {"{"}
                this.savingChanges = false;
                console.log(err);
                let errorMessage = "An error occurred while saving the {model_name_words}. Please try again later.";
                let errorInner = JSON.stringify(err.error.errors, null, "\\t")
                    
                this.errorInfo = this.errorServ.getErrorMessage(errorMessage, errorInner);
            {"}"}
        {"}"});
    {"}"}

    delete{model_name}() {"{"}
        this.errorInfo = this.errorServ.resetErrorMessage();
        this.{pascal_to_camel(model_name)}Serv.delete{model_name}(this.selected{model_name}).subscribe({"{"}
            next: () => {"{"}
                this.get{model_name}();
            {"}"},
            error: (err: any) => {"{"}
                console.log(err);
                let errorMessage = "An error occurred while deleting the {model_name_words}. Please try again later.";
                let errorInner = JSON.stringify(err.error.errors, null, "\\t")
                    
                this.errorInfo = this.errorServ.getErrorMessage(errorMessage, errorInner);
            {"}"}
        {"}"});
    {"}"}
    
    ngOnDestroy(): void {"{"}
        this.routeParamsSubscription.unsubscribe();
        this.{pascal_to_camel(model_name)}HasChangedSubscription.unsubscribe();
    {"}"}
    
{"}"}
    
        
"""

    return [component_list_ts, component_single_ts]
