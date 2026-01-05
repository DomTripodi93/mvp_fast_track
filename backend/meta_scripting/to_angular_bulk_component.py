import re
from meta_scripting.helpers import (
    pascal_to_camel,
    pascal_to_kabob,
    pascal_to_snake,
    pascal_to_spaced,
)


def table_to_angular_bulk_component(
    sql: str, 
    ignore_fields: list[str], 
    model_name: str = "AutoModel",
    file_root_model: str = "AutoModel",
) -> str:
    get_proc = f"dbo.sp{model_name}_Get"
    upsert_proc = f"dbo.sp{model_name}_Upsert"
    delete_proc = f"dbo.sp{model_name}_Delete"
    fields_to_parameters = []
    headers_to_fields = []

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

            # fields_to_parameters.append(f"{col_name} = @{col_name}")
            if col_name != "BulkUploadId":
                fields_to_parameters.append(
                    f'"{pascal_to_snake(col_name)}": {pascal_to_snake(model_name)}.{pascal_to_snake(col_name)}'
                )
                headers_to_fields.append(
                    f'"{pascal_to_spaced(col_name)}": "{pascal_to_camel(col_name)}"'
                )

    controller = f"""
import * as XLSX from 'xlsx';
import {"{"} Component, EventEmitter, Input, OnInit, Output {"}"} from '@angular/core';
import {"{"} {model_name} {"}"} from '../../../models/{file_root_model.lower()}/{pascal_to_kabob(model_name)}.model';
import {"{"} {model_name}Service {"}"} from '../../../services/{file_root_model.lower()}/{pascal_to_kabob(model_name)}-service.service';
import {"{"} CustomUploadComponent {"}"} from '../../../elements/custom-upload/custom-upload.component';
import {"{"} CustomGridComponent {"}"} from '../../../elements/custom-grid/custom-grid.component';
import {"{"} LoadingSpinnerComponent {"}"} from "../../../elements/loading-spinner/loading-spinner.component";
import {"{"} ErrorInfo {"}"} from '../../../models/error-info.model';
import {"{"} ErrorService {"}"} from '../../../services/error-service.service';
import {"{"} ErrorMessageComponent {"}"} from '../../../elements/error-message/error-message.component';
import {"{"} CustomButtonComponent {"}"} from '../../../elements/custom-button/custom-button.component';

@Component({"{"}
    selector: 'app-{pascal_to_kabob(model_name)}-bulk-upload',
    standalone: true,
    imports: [
        CustomUploadComponent,
        CustomGridComponent,
        LoadingSpinnerComponent,
        ErrorMessageComponent,
        CustomButtonComponent
    ],
    templateUrl: './{pascal_to_kabob(model_name)}-bulk-upload-component.component.html',
    styleUrl: './{pascal_to_kabob(model_name)}-bulk-upload-component.component.css'
{"}"})
export class {model_name}BulkComponent implements OnInit {"{"}
    @Output() onCancelUpload: EventEmitter<void> = new EventEmitter<void>();
    @Input() fieldDisplayNames: Record<string, string> = {"{"}{"}"};
    errorInfo: ErrorInfo = this.errorServ.resetErrorMessage();
    savingChanges: boolean = false;
    uploadCompleted: boolean = false;
    uploadFailed: boolean = false;

    parsing: boolean = false;
    fileParsed: boolean = false;
    showRecordsForUpload: boolean = false;

    {pascal_to_camel(model_name)}: {model_name}[] = [];
    

    constructor(
        public {pascal_to_camel(model_name)}Serv: {model_name}Service,
        private errorServ: ErrorService
    ) {"{"} {"}"}

    ngOnInit(): void {"{"}
    {"}"}

    cancelUpload() {"{"}
        this.onCancelUpload.emit();
    {"}"}

    showRecordsAfterParsing() {"{"}
        this.showRecordsForUpload = true;
    {"}"}

    restartUpload() {"{"}
        this.showRecordsForUpload = false;
        this.fileParsed = false;
    {"}"}    

    submitUpload() {"{"}
        this.uploadCompleted = false;
        this.uploadFailed = false;
        this.savingChanges = true;
        this.{pascal_to_camel(model_name)}Serv.bulkUpload{model_name}(this.{pascal_to_camel(model_name)}).subscribe({"{"}
            next: () => {"{"}
                this.savingChanges = false;
                this.uploadCompleted = true;
                this.showRecordsForUpload = false;
            {"}"},
            error: (err: any) => {"{"}
                this.savingChanges = false;
                console.log(err);
                let errorMessage = "An error occurred while uploading the {pascal_to_spaced(model_name)}. Please try again later.";
                this.errorInfo = this.errorServ.getErrorMessage(errorMessage, err.message);
            {"}"}
        {"}"});
    {"}"}


    processExcelFile(files: any) {"{"}
        this.uploadCompleted = false;
        this.uploadFailed = false;
        try {"{"}
            if (files.length > 0) {"{"}
                this.parsing = true;
                this.{pascal_to_camel(model_name)} = [];

                let fileToParse: any = files[0];
                let fileReader = new FileReader();
                fileReader.readAsArrayBuffer(fileToParse);

                fileReader.onload = (e) => {"{"}
                    let arrayBuffer: any = fileReader.result;
                    let raw8BitRows = new Uint8Array(arrayBuffer);
                    let rawBinaryRows = new Array();

                    for (let i = 0; i != raw8BitRows.length; ++i) {"{"}
                        rawBinaryRows[i] = String.fromCharCode(raw8BitRows[i]);
                    {"}"}
                    let binaryFullFile = rawBinaryRows.join("");
                    let workbook = XLSX.read(binaryFullFile, {"{"} type: "binary" {"}"});
                    let mainSheetName = workbook.SheetNames[0];
                    let worksheet = workbook.Sheets[mainSheetName];
                    
                    let columnToFieldMap: any = {"{"}{"}"};
                    let parsedRecords: any[] = [];

                    let dataCells = Object.keys(worksheet).filter(key => {"{"}
                        return key.indexOf("!") === -1;
                    {"}"})

                    dataCells.forEach((cellId, i) => {"{"}
                        let columnId: string = cellId.match(/[A-Za-z]+/) + "";
                        let rowId: number = +(cellId.match(/\d+/) ?? 0) - 2;


                        let cellValue = worksheet[cellId].v;

                        if ((cellValue + "").includes("Total")) {"{"}
                            this.setParsedResult(parsedRecords);
                            return;
                        {"}"}


                        let headerToFieldMap = Object.fromEntries(
                            Object.entries(this.fieldDisplayNames).map(([key, value]) => {"{"}
                                return [value, key]
                            {"}"})
                        );

                        let columnKeys = Object.keys(headerToFieldMap);


                        if (+rowId === -1) {"{"}
                            if (columnKeys.includes(cellValue)) {"{"}
                                columnToFieldMap[columnId] = headerToFieldMap[cellValue];
                            {"}"}
                        {"}"}


                        if (+rowId > -1) {"{"}
                            if (!parsedRecords[rowId]) {"{"}
                                parsedRecords[rowId] = {"{"} {"}"};
                            {"}"}

                            parsedRecords[rowId][columnToFieldMap[columnId]] = cellValue;

                            if (i === dataCells.length - 1) {"{"}
                                this.setParsedResult(parsedRecords);
                            {"}"}
                        {"}"}


                    {"}"})
                {"}"}
            {"}"}
        {"}"} catch (err) {"{"}
            alert("The file uploaded is not in the correct format");
            console.log(err);
            this.uploadFailed = true;
        {"}"}
    {"}"}

    setParsedResult(dataResult: any[]) {"{"}
        this.{pascal_to_camel(model_name)} = dataResult;
        this.parsing = false;
        this.fileParsed = true;
        this.showRecordsForUpload = true;
    {"}"}
    
{"}"}
    
    
"""

    return controller
