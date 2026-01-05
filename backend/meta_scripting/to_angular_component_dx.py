import re
from meta_scripting.helpers import pascal_to_camel, pascal_to_kabob, pascal_to_snake


def table_to_ts_component(
    sql: str,
    ignore_fields: list[str],
    model_name: str = "AutoModel",
    file_root_model: str = "AutoModel",
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

        elif (
            "clustered" in extras.lower()
            and col_name.lower() == "primary"
            and col_type.lower() == "key"
        ):
            primary_key_fields = extras[(extras.index("(") + 1) : extras.index(")")]
            primary_keys_string = primary_key_fields.replace(" ", "")
            primary_keys = primary_keys_string.split(",")
            primary_keys_pascal = [
                f"{pascal_to_camel(model_name)}ForDelete.{pascal_to_camel(primary_key)}"
                for primary_key in primary_keys
            ]
            primary_keys_for_delete = ",".join(primary_keys_pascal)

    controller = f"""
import {"{"} Component, OnDestroy, OnInit, Input  {"}"} from '@angular/core';
import {"{"} {model_name}Service  {"}"} from '../../services/{pascal_to_kabob(file_root_model)}/{pascal_to_kabob(model_name)}-service.service';
import {"{"} ActivatedRoute  {"}"} from '@angular/router';
import {"{"} Subscription  {"}"} from 'rxjs';
import {"{"} DxButtonModule, DxDataGridModule, DxLoadIndicatorModule  {"}"} from 'devextreme-angular';
import {"{"} {model_name} {"}"} from '../../models/{pascal_to_kabob(file_root_model)}/{pascal_to_kabob(model_name)}.model';
import {"{"} AuthService {"}"} from '../services/auth-service.service';

@Component({"{"}
    selector: 'app-{pascal_to_kabob(model_name)}',
    standalone: true,
    imports: [
        DxButtonModule, 
        DxLoadIndicatorModule,
        DxDataGridModule
    ],
    templateUrl: './{pascal_to_kabob(model_name)}.component.html',
    styleUrl: './{pascal_to_kabob(model_name)}.component.css'
{"}"})
export class {model_name}Component implements OnInit, OnDestroy {"{"}
    routeParamsSubscription: Subscription = new Subscription();
    {pascal_to_camel(model_name)}HasChangedSubscription: Subscription = new Subscription();
    {f'selected{primary_key}: string = "";' if has_single_primary_key else ""}
    singleSelection: boolean = false;
    selected{model_name}: {model_name} = {"{"} 
        ... this.{pascal_to_camel(model_name)}Serv.empty{model_name} 
    {"}"};
    
    searchTerm: string = '';
    resultsLoaded: boolean = true;
    activeOnly: boolean = true;
    savingChanges: boolean = true;
    gridHeight: string = "80vh";
    

    constructor(
        private route: ActivatedRoute,
        public {pascal_to_camel(model_name)}Serv: {model_name}Service,
        public auth: AuthService
    ) {"{"}{"}"}

    ngOnInit(): void {"{"}
        {'this.subscribeParams();' if has_single_primary_key else ""}
        this.subscribe{model_name}HasChanged();
    {"}"}
    
    subscribe{model_name}HasChanged() {"{"}
        this.{pascal_to_camel(model_name)}HasChangedSubscription = this.{pascal_to_camel(model_name)}Serv.{pascal_to_camel(model_name)}sHaveChanged.subscribe(() => {"{"}
            this.get{model_name}s();
        {"}"})
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
            this.get{model_name}s();
        {"}"})
    {"}"}""" if has_single_primary_key else ""}  
    

    toggleActiveOnly() {"{"}
        this.activeOnly = !this.activeOnly;
        this.get{model_name}s();
    {"}"}

    openEditForm(event: any) {"{"}
        event.component.editRow(event.rowIndex)
    {"}"}
    

    get{model_name}s() {"{"}
        this.resultsLoaded = false;
        this.{pascal_to_camel(model_name)}Serv.get{model_name}s(this.searchTerm, !this.activeOnly).subscribe(res => {"{"}
            this.{pascal_to_camel(model_name)}Serv.{pascal_to_camel(model_name)}List = res;
            this.resultsLoaded = true;
        {"}"});
    {"}"}

    upsert{model_name}(event: any) {"{"}
        let {pascal_to_camel(model_name)}ForUpsert = event.key
        this.savingChanges = true;
        this.{pascal_to_camel(model_name)}Serv.upsert{model_name}({pascal_to_camel(model_name)}ForUpsert).subscribe({"{"}
            next: () => {"{"}
                this.savingChanges = false;
                this.get{model_name}s();
            {"}"},
            error: (err: any) => {"{"}
                this.savingChanges = false;
                console.log(err);
            {"}"}
        {"}"});
    {"}"}

    delete{model_name}(event: any) {"{"}
        let {pascal_to_camel(model_name)}ForDelete = event.key
        this.{pascal_to_camel(model_name)}Serv.delete{model_name}({primary_keys_for_delete}).subscribe({"{"}
            next: () => {"{"}
                this.get{model_name}s();
            {"}"},
            error: (err: any) => {"{"}
                console.log(err);
            {"}"}
        {"}"});
    {"}"}
    
    ngOnDestroy(): void {"{"}
        this.routeParamsSubscription.unsubscribe();
        this.{pascal_to_camel(model_name)}HasChangedSubscription.unsubscribe();
    {"}"}
    
{"}"}
    
    
"""

    return controller
