import re
from meta_scripting.helpers import pascal_to_kabob, pascal_to_camel


def table_to_angular_service(
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
    default_mapping = {
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
    fields_defaulted = []
    dropdown_filter_args = []
    dropdown_filters = []
    field_types = {}
    dropdown_info = []

    # Extract lines from CREATE TABLE
    columns = re.findall(r"\s*(\w+)\s+([\w()]+)(.*)", sql, re.IGNORECASE)

    for col_name, col_type, extras in columns:
        
        field_types[col_name] = col_type
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
            ts_default = (
                "true" if col_name == "IsActive" else default_mapping.get(base_type.group(), '""') if base_type else '""'
            )

            # fields_to_parameters.append(f"{col_name} = @{col_name}")
            fields_defaulted.append(f"{pascal_to_camel(col_name)}: {ts_default}")

            
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
                camel_link_field = pascal_to_camel(link_field)
                field_type = field_types[link_field].split("(")[0].lower()
                dropdown_filter_args.append(f"{camel_link_field}: {type_mapping[field_type]}")
                dropdown_filters.append(camel_link_field)
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


            option_label = "".join(label_fields)

            dropdown_display_keys = f'["{
                        '", "'.join([pascal_to_camel(link_field) for link_field in link_fields])
                    }"]'
            dropdown_field_map = f'''{"{"}
                {
                    ',\n\t\t\t\t'.join([f'"{pascal_to_camel(link_field)}": "{rename_option_keys[link_field] if link_field in rename_option_keys else pascal_to_camel(link_field)}"' for link_field in link_fields])
                } 
            {"}"}'''
            

            dropdown_info.append(
                f""""{pascal_to_camel(option_label)}": {"{"}
            optionListKey: "{pascal_to_camel(link_to)}",
            displayKeys: {dropdown_display_keys},
            fieldMap: {dropdown_field_map}
        {"}"}"""
            )


    controller = f"""
import {"{"} Injectable {"}"} from "@angular/core";
import {"{"} HttpClient {"}"} from '@angular/common/http';
import {"{"} map {"}"} from 'rxjs/operators';
import {"{"} Subject {"}"}  from "rxjs";
import {"{"} {model_name} {"}"} from "../../models/{pascal_to_kabob(file_root_model)}/{pascal_to_kabob(model_name)}.model";
import {"{"} {model_name}Option {"}"} from "../../models/{pascal_to_kabob(file_root_model)}/{pascal_to_kabob(model_name)}-option.model";


@Injectable({"{"} providedIn: 'root' {"}"})
export class {model_name}Service {"{"}
    {pascal_to_camel(model_name)}sHaveChanged: Subject<void> = new Subject<void>();
    {pascal_to_camel(model_name)}SelectionHaveChanged: Subject<void> = new Subject<void>();
    {pascal_to_camel(model_name)}OptionsHaveChanged: Subject<void> = new Subject<void>();

    {pascal_to_camel(model_name)}List: {model_name}[] = []; 
    
    empty{model_name}: {model_name} = {"{"}
        {",\n\t\t".join(fields_defaulted)},
        insertDate: new Date(),
        insertUser: "",
        updateDate: new Date(),
        updateUser: ""
    {"}"}

    {f"""dropdownInfo: Record<string, any> = {"{"}
        {",\n\t\t".join(dropdown_info)}
    {"}"}
""" if len(dropdown_info) > 0 
    else ""}
    
    {pascal_to_camel(model_name)}ForUpsert: {model_name} = {"{"} ...this.empty{model_name} {"}"};
    
    
    constructor(
        private http: HttpClient
    ) {"{ }"}
    
    
    get{model_name}(
        searchTerm: string,
        activeOnly: boolean = false,
        {",\n\t\t".join(dropdown_filter_args)}
    ) {"{"}
        let apiRoute = "v1/{model_name}/Get{model_name}";
        let searchParams = {"{"}
            searchTerm,
            activeOnly,
            {",\n\t\t\t".join(dropdown_filters)}
        {"}"}
        
        return this.http.post<{model_name}[]>(
            apiRoute,
            searchParams
        ).pipe(map((results: {model_name}[]) => {"{"}
            return results;
        {"}"}));
    {"}"}
    
    get{model_name}Options(
        activeOnly: boolean = true
    ) {"{"}
        let apiRoute = "v1/{model_name}/Get{model_name}Options";
        let searchParams = {"{"}
            activeOnly
        {"}"}
        
        return this.http.post<{model_name}Option[]>(
            apiRoute,
            searchParams
        ).pipe(map((results: {model_name}Option[]) => {"{"}
            return results;
        {"}"}));
    {"}"}
    
    get{model_name}Single(
        primaryKeyValues: any
    ) {"{"}
        let apiRoute = "v1/{model_name}/Get{model_name}Single";
        
        return this.http.post<{model_name}>(
            apiRoute,
            primaryKeyValues
        ).pipe(map((results: {model_name}) => {"{"}
            return results;
        {"}"}));
    {"}"}
    
    upsert{model_name}(
        {pascal_to_camel(model_name)}: {model_name}
    ) {"{"}
        let apiRoute = "v1/{model_name}/Upsert{model_name}";
        
        return this.http.post(
            apiRoute,
            {pascal_to_camel(model_name)}
        ).pipe(map((results: any) => {"{"}
            return results;
        {"}"}));
    {"}"}
    
    delete{model_name}(
        {pascal_to_camel(model_name)}: {model_name}
    ) {"{"}
        let apiRoute = "v1/{model_name}/Delete{model_name}";
        
        return this.http.post(
            apiRoute,
            {pascal_to_camel(model_name)}
        ).pipe(map((results: any) => {"{"}
            return results;
        {"}"}));
    {"}"}  
    
    bulkUpload{model_name}(
        {pascal_to_camel(model_name)}s: {model_name}[]
    ) {"{"}
        let apiRoute = "v1/{model_name}/BulkUpload{model_name}";
        
        return this.http.post(
            apiRoute,
            {pascal_to_camel(model_name)}s
        ).pipe(map((results: any) => {"{"}
            return results;
        {"}"}));
    {"}"}  
{"}"}
    
"""

    return controller
