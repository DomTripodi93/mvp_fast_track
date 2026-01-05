import re
from meta_scripting.helpers import (
    pascal_to_camel,
    pascal_to_kabob,
    pascal_to_snake,
    pascal_to_spaced,
)


def table_to_ts_bulk_component(
    sql: str, ignore_fields: list[str], model_name: str = "AutoModel"
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
import {"{"} Component, OnInit {"}"} from '@angular/core';
import {"{"} {model_name}Service {"}"} from '../../services/{pascal_to_kabob(model_name)}-service.service';
import {"{"} ActivatedRoute {"}"} from '@angular/router';
import {"{"} Subscription {"}"} from 'rxjs';
import {"{"} DxButtonModule, DxDataGridModule, DxFileUploaderModule, DxLoadIndicatorModule {"}"} from 'devextreme-angular';
import {"{"} {model_name} {"}"} from '../../models/{pascal_to_kabob(model_name)}.model';
import {"{"} AuthService {"}"} from '../services/auth.service';

import * as XLSX from 'xlsx';

@Component({"{"}
    selector: 'app-course-list',
    standalone: true,
    imports: [
        DxButtonModule, 
        DxLoadIndicatorModule,
        DxFileUploaderModule,
        DxDataGridModule
    ],
    templateUrl: './course-list.component.html',
    styleUrl: './course-list.component.css'
{"}"})
export class {model_name}Component implements OnInit {"{"}
    savingChanges: boolean = true;
    uploadCompleted: boolean = false;
    uploadFailed: boolean = false;

    parsing: boolean = false;
    fileParsed: boolean = false;
    showRecordsForUpload: boolean = false;

    gridHeight: string = "80vh";
    {pascal_to_camel(model_name)}s: {model_name}[] = [];
    

    constructor(
        public {pascal_to_camel(model_name)}Serv: {model_name}Service,
        public auth: AuthService
    ) {"{"} {"}"}

    ngOnInit(): void {"{"}
    {"}"}

    showRecordsAfterParsing(){"{"}
        this.showRecordsForUpload = true;
    {"}"}

    cancelUpload(){"{"}
        this.showRecordsForUpload = false;
        this.fileParsed = false;
    {"}"}
    

    bulkUpload{model_name}() {"{"}
        this.uploadCompleted = false;
        this.uploadFailed = false;
        this.savingChanges = true;
        this.{pascal_to_camel(model_name)}Serv.bulkUpload{model_name}(this.{pascal_to_camel(model_name)}s).subscribe({"{"}
            next: () => {"{"}
                this.savingChanges = false;
                this.uploadCompleted = true;
                this.showRecordsForUpload = false;
            {"}"},
            error: (err: any) => {"{"}
                this.savingChanges = false;
                this.uploadFailed = true;
                console.log(err);
            {"}"}
        {"}"});
    {"}"}


    processExcelFile(event) {"{"}
        this.uploadCompleted = false;
        this.uploadFailed = false;
        try {"{"}
            if (event.target.files.length > 0) {"{"}
                this.parsing = true;
                this.{pascal_to_camel(model_name)}s = [];

                let fileToParse: any = event.target.files[0];
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
                    
                    let columnToFieldMap = {"{"} {"}"};
                    let parsedRecords: any[] = [];

                    let dataCells = Object.keys(worksheet).filter(key => {"{"}
                        return key.indexOf("!") === -1;
                    {"}"})

                    dataCells.forEach((cellId, i) => {"{"}
                        let cellIdParts = cellId.split("");
                        let columnId = "";
                        let rowId = "";
                        cellIdParts.forEach(idPart => {"{"}
                            if (isNaN(+idPart)) {"{"}
                                columnId = idPart + "";
                            {"}"} else {"{"}
                                rowId = idPart + "";
                            {"}"}
                        {"}"})


                        let cellValue = worksheet[cellId].v;

                        if ((cellValue + "").includes("Total")) {"{"}
                            this.setParsedResult(parsedRecords);
                            return;
                        {"}"}


                        let headerToFieldMap = {"{"}
                            {",\n\t\t\t\t\t\t\t".join(headers_to_fields)}
                        {"}"}

                        let columnKeys = Object.keys(headerToFieldMap);


                        if (+rowId === 1) {"{"}
                            if (columnKeys.includes(cellValue)) {"{"}
                                columnToFieldMap[columnId] = headerToFieldMap[cellValue];
                            {"}"}
                        {"}"}


                        if (!parsedRecords[rowId]) {"{"}
                            parsedRecords[rowId] = {"{"} {"}"};
                        {"}"}

                        parsedRecords[rowId][columnToFieldMap[columnId]] = cellValue;

                        if (i === dataCells.length - 1) {"{"}
                            this.setParsedResult(parsedRecords);
                        {"}"}


                    {"}"})
                {"}"}
            {"}"}
        {"}"} catch (err) {"{"}
            alert("The file uploaded is not in the correct format");
            console.log(err);
        {"}"}
    {"}"}

    setParsedResult(dataResult: any[]){"{"}
        dataResult.shift();
        dataResult.shift();
        this.{pascal_to_camel(model_name)}s = dataResult;
        this.parsing = false;
        this.fileParsed = true;
    {"}"}
    
{"}"}
    
    
"""

    return controller
