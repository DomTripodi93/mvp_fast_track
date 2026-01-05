import { CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgClass, NgStyle } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, QueryList, Renderer2, ViewChild, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { Column, Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { HelperService } from '../../services/helper-service.service';
import { CustomInputComponent } from '../custom-input/custom-input.component';
import { CustomCheckboxComponent } from '../custom-checkbox/custom-checkbox.component';
import { ResizableColumnDirective } from './resizable-column-directive.directive';
import { CustomButtonComponent } from "../custom-button/custom-button.component";
import { CustomSearchComponent } from '../custom-search/custom-search.component';
import { Router } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CustomDateboxComponent } from '../custom-datebox/custom-datebox.component';

//Revisit
//Row Select / Multi Select
//Row Fixing left/right
//Edit Button Display
//Open Single

//Context Menus
//Tootips
//Cell Templating

//Posibly separate list entity
//Row Drag to prioritize
//Grid to Grid Drag

@Component({
    selector: 'app-custom-grid',
    imports: [
        NgClass,
        FormsModule,
        LoadingSpinnerComponent,
        CustomInputComponent,
        CustomDateboxComponent,
        CustomCheckboxComponent,
        NgStyle,
        ResizableColumnDirective,
        CdkDrag,
        CdkDropList,
        CustomButtonComponent,
        CustomSearchComponent,
        ScrollingModule
    ],
    templateUrl: './custom-grid.component.html',
    styleUrl: './custom-grid.component.css'
})
export class CustomGridComponent implements OnInit {
    @ViewChildren('headerCell') headerCells: QueryList<ElementRef> | null = null;

    @Input() dataset: any[] = [];
    activeDataset: any[] = [];
    editObject: any = {};
    lastRightClickedColumn: string = "";

    typeDefaults: Record<string, any> = {
        "undefined": "",
        "null": "",
        "string": "",
        "number": -1,
        "Date": new Date(),
        "boolean": false
    }

    @Input() defaultAlignment: string = "left";
    @Input() deleteWarning: string = "";
    @Input() deleteKeysForWarning: string[] = [];
    @Input() fieldAlignment: Record<string, string> = {};
    @Input() fieldWidth: Record<string, string> = {};
    // @Input() defaultWidth: string = "130px";
    @Input() defaultWidth: string = "max-content";
    @Input() displayOrder: string[] = [];
    @Input() hideKeys: string[] = [];
    @Input() fieldDisplayNames: Record<string, string> = {};
    @Input() fieldTypes: Record<string, string> = {};
    allDisplayNames: Record<string, string> = {};
    displayKeys: string[] = [];
    distinctColumnValues: Record<string, any[]> = {};
    gridInfoPrepComplete: boolean = false;
    gridDimensionsReady: boolean = false;
    distinctValuesReady: boolean = false;
    columnWidthsReady: boolean = false;
    columnHeaderStyles: Record<string, Record<string, string>> = {};
    columnBodyStyles: Record<string, Record<string, string>> = {};

    @Input() shadeEveryOther: boolean = true;
    // @Input() shadeEveryOther: boolean = false;

    @Input() height: any = "auto";
    gridHeight: any = "70vh";

    @Input() width: any = "auto";
    gridWidth: any = "max-content";
    gridMaxWidth: any = "100%";

    @Input() allowEditing: boolean = false;
    @Input() allowAdding: boolean = false;
    @Input() showEditButtons: boolean = true;
    @Input() onlyEmitOnEdit: boolean = false;
    @Input() editMode: string = "row";
    @Input() noAddFields: string[] = [];
    @Input() noEditFields: string[] = [];
    @Input() canEditFields: string[] = [];
    @Input() editColumnWidth: string = "30px";
    activeButtons: string[] = [];
    editRowIndex: number = -1;

    sortKeys: Record<string, boolean> = {};
    sortOrder: string[] = [];
    sortOrderNum: Record<string, number> = {};

    @Input() customButton: string = "";
    @Input() showFilters: boolean = true;
    @Input() allowDeleting: boolean = false;
    @Input() allowExporting: boolean = true;
    @Input() linkDetail: boolean = true;
    @Input() loading: boolean = false;
    @Input() exportFileName: string = "ExportFile";
    @Input() fixLeft: string[] = [];
    @Input() fixRight: string[] = [];

    activeFilters: Record<string, string> = {};
    columnWidths: Record<string, string> = {};
    fixedLeft: string[] = [
        // "isActive"
    ];
    fixedRight: string[] = [
        "customLink",
        "deleteLink",
        "editLink",
        "detailLink"
    ];
    fixedButtons: string[] = [
        "customLink",
        "deleteLink",
        "editLink",
        "detailLink"
    ];

    visibleFilterDropdown: string = "";
    filterSelections: Record<string, string[]> = {};

    otherButtonSpaces: any[] = [];
    hasOtherButtons: boolean = false;
    showAddRow: boolean = false;
    contextClicked: boolean = false;


    @Output() onEditingStart = new EventEmitter<any>();
    @Output() onCancelEdit = new EventEmitter<any>();
    @Output() onDelete = new EventEmitter<any>();
    @Output() onGoToDetail = new EventEmitter<any>();
    @Output() onSaveEdit = new EventEmitter<any>();
    @Output() onAddNewRow = new EventEmitter<any>();
    @Output() onStartNewRow = new EventEmitter<any>();
    @Output() onCustomClick = new EventEmitter<any>();
    @Output() onExport = new EventEmitter<any>();
    @Output() onStartBulkUpload = new EventEmitter<any>();
    @Output() onCompleteBulkUpload = new EventEmitter<any>();
    @Output() onCancelBulkUpload = new EventEmitter<any>();
    @Output() onRestartBulkUpload = new EventEmitter<any>();
    allowBulkUpload: boolean = false;
    allowCompleteUpload: boolean = false;
    allowCancelUpload: boolean = false;
    allowRestartUpload: boolean = false;

    showGridButtons: boolean = false;

    headerContextMenu: any = {
        pageX: 0,
        pageY: 0,
        willContextMenuShow: false,
        columnIsFixedLeft: false,
        columnIsFixedRight: false
    }

    @Input() dropdownColumns: string[] = []
    @Input() dropdownInfo: Record<string, any> = {}
    @Input() dropdownKeys: Record<string, any> = {}
    @Output() onSetDropdownValue = new EventEmitter<any>();

    constructor(
        public helperServ: HelperService,
        private renderer: Renderer2
    ) { }

    ngOnInit(): void {
        // console.log(this.dropdownInfo)
        if (!this.onGoToDetail.observed) {
            this.linkDetail = false;
        }
        this.setDisplayKeys().then(() => {
            this.setGridDimensions();
            this.mapDistinctValues();
            this.setCanEditFields();
            this.setOtherButtonSpaces();
            this.setHasOtherButtons();
            this.setAllowBulkUpload();
            this.mapDisplayNames().then(() => {
                this.setStyleObject();
            });
        })
    }

    onSelectDropdownOption(value: any, column: string) {
        // console.log(column)
        if (this.onSetDropdownValue.observed) {
            this.onSetDropdownValue.emit({
                value, column, object: this.editObject
            })
        }
    }

    setAllowBulkUpload() {
        if (this.onStartBulkUpload.observed) {
            this.allowBulkUpload = true;
            this.showGridButtons = true;
        }
        if (this.onCompleteBulkUpload.observed) {
            this.allowCompleteUpload = true;
            this.showGridButtons = true;
        }
        if (this.onCancelBulkUpload.observed) {
            this.allowCancelUpload = true;
            this.showGridButtons = true;
        }
        if (this.onRestartBulkUpload.observed) {
            this.allowRestartUpload = true;
            this.showGridButtons = true;
        }
    }

    toggleContextMenu(showContextMenu: boolean, column: string, event: MouseEvent | null = null) {
        this.lastRightClickedColumn = column;
        if (event !== null) {
            event.preventDefault();
            this.headerContextMenu.pageX = event.pageX
            this.headerContextMenu.pageY = event.pageY
        }

        if (this.fixedLeft.includes(column)) {
            this.headerContextMenu.columnIsFixedLeft = true;
        } else {
            this.headerContextMenu.columnIsFixedLeft = false;
        }

        if (this.fixedRight.includes(column)) {
            this.headerContextMenu.columnIsFixedRight = true;
        } else {
            this.headerContextMenu.columnIsFixedRight = false;
        }

        this.headerContextMenu.willContextMenuShow = showContextMenu;

        // console.log(this.fixedLeft)
        // console.log(this.fixedRight)
    }

    setHasOtherButtons() {
        this.hasOtherButtons = this.customButton !== "" ||
            this.allowDeleting ||
            this.linkDetail;
    }

    setOtherButtonSpaces() {
        let arrayLength = (this.customButton !== "" ? 1 : 0) +
            (this.allowDeleting ? 1 : 0) +
            (this.linkDetail ? 1 : 0);// - 1;

        if (arrayLength > -1) {
            this.otherButtonSpaces = new Array(arrayLength);
        }
    }

    setCanEditFields() {
        if (this.canEditFields.length === 0) {
            this.canEditFields = this.displayKeys.filter(row => {
                return !this.noEditFields.includes(row);
            })
        }
    }

    startEditing(index: number, object: any) {
        if (!this.displayKeys.includes("isActive") && this.hideKeys.includes("isActive")) {
            this.displayKeys = ["isActive", ...this.displayKeys];
            this.fixedLeft = ["isActive", ...this.fixedLeft];
        }
        if (!this.canEditFields.includes("isActive")){
            this.canEditFields.push("isActive");
        }
        if (!this.columnWidths["isActive"]){
            this.columnWidths["isActive"] = "54px";
        }
        this.editRowIndex = index;
        if (this.onEditingStart.observed) {
            this.onEditingStart.emit(object);
        }
        if (!this.onlyEmitOnEdit) {
            this.columnWidths["editLink"] = "65px";
            this.setStyleObject();
            this.editRowIndex = index;
            this.editObject = { ...object };
        }
        // return column;
    }

    cancelEdit(object: any) {
        if (this.displayKeys.includes("isActive") && this.hideKeys.includes("isActive")) {
            this.displayKeys = this.displayKeys.filter(row => {
                return !this.hideKeys.includes(row);
            });
            this.fixedLeft = this.fixedLeft.filter(row => {
                return !this.hideKeys.includes(row);
            });
        }
        this.columnWidths["editLink"] = "30px";
        this.setStyleObject();
        this.editObject = {};
        this.editRowIndex = -1;
        this.onCancelEdit.emit(object);
    }

    saveEdit(object: any) {
        this.editObject = {};
        this.editRowIndex = -1;
        this.onSaveEdit.emit(object);
    }

    onAddClick() {
        if (this.onStartNewRow.observed) {
            this.onStartNewRow.emit();
        } else {
            this.editObject = {};

            let keysSet = 0;
            this.displayKeys.forEach(key => {
                this.editObject[key] = this.typeDefaults[this.fieldTypes[key]] ?? "";
                keysSet++;
                if (keysSet === this.displayKeys.length) {
                    this.showAddRow = true;
                }
            })
        }
    }

    onSaveNew() {
        if (this.onAddNewRow.observed) {
            this.onAddNewRow.emit();
        }
        this.showAddRow = false;
    }

    onDetailClick(object: any) {
        if (this.onGoToDetail.observed) {
            this.onGoToDetail.emit(object);
        }
    }

    deleteRow(object: any) {
        let warningForDelete = "Are you sure you want to delete this row?"
        if (this.deleteWarning != "") {
            warningForDelete = this.deleteWarning
            if (this.deleteKeysForWarning.length > 0) {
                let rowForDeleteInfo = this.deleteKeysForWarning.reduce((last, current, i) => {
                    return (i > 0 ? last + " / " : "") + object[current]
                }, "")
                warningForDelete += " for row: " + rowForDeleteInfo;
            }
        }

        if (confirm(warningForDelete)) {
            this.editObject = {};
            this.editRowIndex = -1;
            this.onDelete.emit(object);
        }
    }

    setColumnWidth(width: string, column: string) {
        // console.log(width);
        this.columnWidths[column] = width;
        this.setStyleObject();
    }

    setFixed(direction: string) {
        // this.contextClick();
        let column = this.lastRightClickedColumn;
        let isRight = direction === "right";
        let unfix = direction === "none";

        if (unfix) {
            this.unfixColumn(column);
        } else if (isRight) {
            this.unfixColumn(column, false, true);
            this.fixedRight.push(column);
        } else {
            this.unfixColumn(column, true, false);
            this.fixedLeft.push(column);
        }
        this.setStyleObject();
    }

    setDefaultButtonColumnWidth(button: string) {
        if (!this.columnWidths[button]) {
            this.columnWidths[button] = this.editColumnWidth;
        }
    }

    setDisplayKeys() {
        this.setFixedKeys();
        this.activeDataset = [...this.dataset];
        return new Promise<void>(resolve => {
            if (
                this.activeDataset.length > 0
                && this.displayOrder.length === 0
            ) {
                this.displayKeys = Object.keys(this.activeDataset[0]).filter(row => {
                    return !this.hideKeys.includes(row);
                });
                resolve();
            } else if (this.displayOrder.length > 0) {
                this.displayKeys = [
                    ...this.displayOrder.filter(row => {
                        return !this.hideKeys.includes(row);
                    })
                ];
                resolve();
            } else {
                resolve();
            }
        })
    }

    setFixedKeys() {
        if (this.fixLeft.length > 0) {
            this.fixedLeft = [
                ...this.fixedLeft,
                ...this.fixLeft
            ];
        }
        if (this.fixRight.length > 0) {
            this.fixedRight = [
                ...this.fixedRight,
                ...this.fixRight
            ];
        }
    }

    setGridDimensions() {
        if (this.height !== "auto") {
            this.gridHeight = this.height;
        }
        if (this.width !== "auto") {
            // this.gridWidth = this.width;
            this.gridMaxWidth = this.width;
        }
        this.gridDimensionsReady = true;
        this.setGridReady();
    }

    mapDistinctValues() {
        let keysProcessed = 0
        let dropdownKeys = Object.keys(this.dropdownInfo);
        this.displayKeys.forEach(key => {
            if (dropdownKeys.includes(key)) {
                // console.log(key)
                this.distinctColumnValues[key] = [...new Set(
                    this.activeDataset.map(row => {
                        return this.dropdownInfo[key]["displayKeys"].map((dropdownKey: string) => {
                            return row[dropdownKey]
                        }).join(",")
                    })
                )].sort((a, b) => {
                    return a > b ? 1 : -1;
                });
                // console.log(this.distinctColumnValues[key]);
            } else {
                this.distinctColumnValues[key] = [...new Set(
                    this.activeDataset.map(row => row[key])
                )].sort((a, b) => {
                    return a > b ? 1 : -1;
                });
            }
            keysProcessed += 1;
            if (keysProcessed === this.displayKeys.length) {
                this.distinctValuesReady = true;
                this.setGridReady();
            }
        })
    }

    getDistinctValues(column: string) {
        return [...new Set(
            this.activeDataset.map(row => row[column])
        )].sort((a, b) => {
            return a > b ? 1 : -1;
        });
    }

    setGridReady(gridReady: boolean = true) {
        // console.log(this.allDisplayNames)
        if (this.gridDimensionsReady && this.distinctValuesReady && this.columnWidthsReady) {
            this.gridInfoPrepComplete = gridReady;
        }
    }

    mapDisplayNames() {
        return new Promise<void>(resolve => {
            this.allDisplayNames = { ...this.fieldDisplayNames }
            let displayKeysMapped = 0;
            if (this.displayKeys.length === 0) {
                resolve();
            } else {
                this.displayKeys.forEach(column => {
                    let isDropdown = Object.keys(this.dropdownInfo).includes(column);
                    if (!this.allDisplayNames[column]) {
                        this.allDisplayNames[column] = this.helperServ.camelCaseToCapitalWords(column);
                    }
                    if (this.dataset.length > 0 && !this.fieldTypes[column]) {
                        if (isDropdown) {
                            this.fieldTypes[column] = "dropdown";
                        } else {
                            this.fieldTypes[column] = typeof this.dataset[0][column];
                        }
                    }

                    if (!this.columnWidths[column]) {
                        if (this.fieldWidth[column] && this.fieldWidth[column] != "max-content") {
                            this.columnWidths[column] = this.fieldWidth[column]
                        } else {
                            if (this.dataset.length > 0 && !isDropdown) {
                                let minLength = this.allDisplayNames[column].length + 3;
                                let maxLenValue = (this.dataset.sort((a, b) => {
                                    return (a[column] + "").length > (b[column] + "").length ? -1 : 1;
                                })[0][column] + "").length;

                                this.columnWidths[column] = (
                                    (
                                        minLength > maxLenValue ? minLength * 6 :
                                            (maxLenValue > 70 ? 70 : maxLenValue)* 8
                                    )) + "px"
                            } else if (this.dataset.length > 0 && isDropdown) {
                                let displayKeys = this.dropdownInfo[column]["displayKeys"];
                                let minLength = this.allDisplayNames[column].length + 3;
                                let maxLenRow = this.dataset.sort((a, b) => {
                                    let aLen = displayKeys.reduce((accumulated: string, key: any) => {
                                        return accumulated + a[key].length
                                    }, 0)
                                    let bLen = displayKeys.reduce((accumulated: string, key: any) => {
                                        return accumulated + b[key].length
                                    }, 0)
                                    return aLen > bLen ? -1 : 1;
                                })[0];

                                let maxLenValue = displayKeys.reduce((accumulated: string, key: any) => {
                                    return accumulated + maxLenRow[key].length
                                }, 0)

                                this.columnWidths[column] = (
                                    (
                                        minLength > maxLenValue ? minLength :
                                            (maxLenValue > 70 ? 70 : maxLenValue)
                                    ) * 8) + "px"
                            } else {
                                this.columnWidths[column] = (this.allDisplayNames[column].length * 8) + "px"
                            }
                        }
                    }
                    displayKeysMapped++;
                    if (displayKeysMapped === this.displayKeys.length) {
                        // console.log(this.columnWidths);
                        resolve();
                    }
                })
            }
        })
    }

    addSortKey(event: MouseEvent, keyname: string) {
        if (event.ctrlKey) {
            this.sortOrder = this.sortOrder.filter(sortKey => {
                return sortKey !== keyname;
            });
            this.sortOrder.push(keyname);
            let reverseSortOrder = [...this.sortOrder].reverse()

            this.sortOrderNum = reverseSortOrder.reduce((acc, cur, index) => {
                acc[cur] = index + 1;
                return acc;
            }, {} as Record<string, number>)

            if (keyname in this.sortKeys) {
                let newKeyVal = !this.sortKeys[keyname];
                delete this.sortKeys[keyname]
                this.sortKeys[keyname] = newKeyVal;
            } else {
                this.sortKeys[keyname] = true;
            }
        } else {
            this.sortOrder = [keyname];

            if (keyname in this.sortKeys) {
                this.sortKeys = { [keyname]: !this.sortKeys[keyname] };
            } else {
                this.sortKeys = { [keyname]: true };
            }
        }

        // console.log(Object.keys(this.sortKeys));

        this.sortOrder.forEach(sortKey => {
            this.activeDataset.sort((a, b) => {
                return a[sortKey] < b[sortKey] ? (this.sortKeys[sortKey] ? -1 : 1) : (this.sortKeys[sortKey] ? 1 : -1);
            })
        })
    }

    filterDataset(filterText: string | number, column: string) {
        this.activeFilters[column] = filterText + "";

        this.runActiveFilters().then(() => {
            this.mapDistinctValues();
        })
    }

    filterOnSelection(filterSelections: string[], column: string) {

        this.filterSelections[column] = filterSelections;
        if (filterSelections.length > 0) {
            this.activeDataset = this.dataset.filter(row => {
                if (Object.keys(this.dropdownInfo).includes(column)) {
                    let combinedValue = this.dropdownInfo[column]["displayKeys"].map((dropdownKey: string) => {
                        return row[dropdownKey]
                    }).join(",")
                    return filterSelections.includes(combinedValue);
                } else {
                    return filterSelections.includes(row[column]);
                }
            })
        } else {
            this.activeDataset = [...this.dataset];
        }
        this.runActiveFilters().then(() => {

        })
    }

    runActiveFilters() {
        return new Promise<void>(resolve => {
            let filterKeys = Object.keys(this.activeFilters);

            let workingDataset = [...this.dataset]

            let filterKeysProcessed = 0;
            filterKeys.forEach(filterKey => {
                workingDataset = workingDataset.filter(row => {
                    return row[filterKey].toLowerCase().includes(this.activeFilters[filterKey].toLowerCase());
                })
                filterKeysProcessed++;
                if (filterKeysProcessed === filterKeys.length) {
                    this.activeDataset = workingDataset;
                    resolve();
                }
            })
        });
    }

    clickFilter(column: string) {
        this.visibleFilterDropdown = "";
        setTimeout(() => {
            this.visibleFilterDropdown = column;
        }, 10);
    }

    dropHeader(event: any) {
        const x = event.dropPoint.x; // drop point x position
        let fromIndex = event.previousIndex;
        let dropIndex = -1;
        if (this.headerCells) {
            let headerCellsConsidered = 0;
            this.headerCells.forEach((cell, i) => {
                const rect = cell.nativeElement.getBoundingClientRect();
                if (x >= rect.left && x <= rect.right) {
                    if (fromIndex > i) {
                        dropIndex = i + 1;
                    } else if (fromIndex < i) {
                        dropIndex = i - 1;
                    } else {
                        return;
                    }
                }
                headerCellsConsidered++;
                if (headerCellsConsidered === this.headerCells?.length) {
                    // console.log(fromIndex)
                    // console.log(dropIndex)
                    // console.log(this.fixedLeft.length)
                    if (fromIndex < this.fixedLeft.length) {
                        if (dropIndex > this.fixedLeft.length - 1) {
                            dropIndex = this.fixedLeft.length - 1;
                        }
                    } else if (fromIndex + 1 > this.displayKeys.length - this.fixedRight.length) {
                        if (dropIndex < this.displayKeys.length - this.fixedRight.length - 1) {
                            dropIndex = this.displayKeys.length - this.fixedRight.length;
                        }
                    } else {
                        if (dropIndex + 1 < this.fixedLeft.length) {
                            dropIndex = this.fixedLeft.length;
                        } else if (dropIndex + 1 > this.displayKeys.length - this.fixedRight.length) {
                            dropIndex = this.displayKeys.length - this.fixedRight.length - 1;
                        }
                    }
                    moveItemInArray(this.displayKeys, event.previousIndex, dropIndex);
                    this.setStyleObject();
                }
            });
        }
    }

    unfixColumn(column: string, keepLeft: boolean = false, keepRight: boolean = false) {
        if (!keepRight && this.fixedRight.includes(column)) {
            this.fixedRight = this.fixedRight.filter(row => {
                return row !== column;
            })
            // console.log(this.fixedRight);
        }

        if (!keepLeft && this.fixedLeft.includes(column)) {
            this.fixedLeft = this.fixedLeft.filter(row => {
                return row !== column;
            })
            // console.log(this.fixedLeft);
        }
    }

    setStyleObject() {
        // return new Promise<void>(resolve => {
        let columnHeaderStyles: Record<string, Record<string, string>> = { ...this.columnHeaderStyles };
        let columnBodyStyles: Record<string, Record<string, string>> = { ...this.columnBodyStyles };

        let fixedAdjustments: Record<string, number> = {};
        let processedKeys = 0
        let activeButtons: string[] = []
        let buttonName = "";
        if (this.linkDetail) {
            buttonName = "detailLink";
            activeButtons.push(buttonName);
            this.setDefaultButtonColumnWidth(buttonName)
        }
        if (this.allowEditing && this.showEditButtons) {
            buttonName = "editLink";
            activeButtons.push(buttonName);
            this.setDefaultButtonColumnWidth(buttonName)
        }
        if (this.allowDeleting) {
            buttonName = "deleteLink";
            activeButtons.push(buttonName);
            this.setDefaultButtonColumnWidth(buttonName)
        }
        if (this.customButton !== "") {
            buttonName = "customLink";
            activeButtons.push(buttonName);
            this.setDefaultButtonColumnWidth(buttonName)
        }
        let keysToProcess: string[] = [...this.displayKeys, ...activeButtons]
        if (keysToProcess.length === 0) {
            this.columnWidthsReady = true;
            this.setGridReady();
        } else {
            keysToProcess.forEach(column => {
                // console.log(column)
                // console.log(this.columnWidths[column])
                let widthToSet = this.columnWidths[column] ? this.columnWidths[column] : this.fieldWidth[column] ? this.fieldWidth[column] : this.defaultWidth
                // console.log(column, this.columnWidths[column], this.fieldWidth[column], widthToSet);
                columnHeaderStyles[column] = {
                    width: widthToSet,
                    minWidth: widthToSet,
                    maxWidth: widthToSet
                }
                columnBodyStyles[column] = {
                    width: widthToSet,
                    minWidth: widthToSet,
                    maxWidth: widthToSet,
                    textAlign: this.fieldTypes[column] === 'boolean' ? 'center' :
                        this.fieldAlignment[column] ? this.fieldAlignment[column] : this.defaultAlignment
                }

                if (this.fixedLeft.includes(column) || this.fixedRight.includes(column)) {
                    fixedAdjustments[column] = +widthToSet.replace("px", "");
                }
                processedKeys++
                if (processedKeys === keysToProcess.length) {
                    this.setFixedOffsets(fixedAdjustments, columnHeaderStyles, columnBodyStyles).then((res) => {
                        this.columnHeaderStyles = res[0];
                        this.columnBodyStyles = res[1];
                        // resolve();
                        this.columnWidthsReady = true;
                        // console.log("hit");
                        this.setGridReady();
                    });
                }
            })
        }
        // });
    }

    setColumnOrderWithFixed() {
        let unfixedColumns = this.displayKeys.filter(column => {
            return !this.fixedLeft.includes(column) && !this.fixedRight.includes(column);
        });

        let fixedRightColumns = this.displayKeys.filter(column => {
            return this.fixedRight.includes(column);
        });

        let fixedRightButtons = this.fixedRight.filter(column => {
            return !this.displayKeys.includes(column)
        })

        let fixedLeftColumns = this.displayKeys.filter(column => {
            return this.fixedLeft.includes(column);
        });


        // Right fixed columns are displayed in reverse order as they stack from right to left
        this.displayKeys = [...fixedLeftColumns, ...unfixedColumns, ...fixedRightColumns.reverse()];


        this.fixedLeft = fixedLeftColumns;

        this.fixedRight = [...fixedRightButtons, ...fixedRightColumns];
        // console.log(this.displayKeys);
        // console.log(this.fixedRight)
    }

    setFixedOffsets(
        fixedAdjustments: Record<string, number>,
        columnHeaderStyles: Record<string, Record<string, string>>,
        columnBodyStyles: Record<string, Record<string, string>>
    ) {
        // console.log(this.columnWidths);
        return new Promise<Record<string, Record<string, string>>[]>(resolve => {
            this.setColumnOrderWithFixed();
            // console.log(fixedAdjustments)

            let fixedAdjustmentKeys = Object.keys(fixedAdjustments);
            let fixedLeftPromise = this.setFixedLeft(fixedAdjustments, columnHeaderStyles, columnBodyStyles, fixedAdjustmentKeys);
            let fixedRightPromise = this.setFixedRight(fixedAdjustments, columnHeaderStyles, columnBodyStyles, fixedAdjustmentKeys);

            Promise.all([fixedLeftPromise, fixedRightPromise]).then((res) => {
                let fixedLeftResults = res[0];
                let fixedRightResults = res[1];
                resolve([
                    { ...fixedLeftResults[0], ...fixedRightResults[0] },
                    { ...fixedLeftResults[1], ...fixedRightResults[1] }
                ]);
            })
        });
    }

    setFixedLeft(
        fixedAdjustments: Record<string, number>,
        columnHeaderStyles: Record<string, Record<string, string>>,
        columnBodyStyles: Record<string, Record<string, string>>,
        fixedAdjustmentKeys: string[]
    ) {
        return new Promise<Record<string, Record<string, string>>[]>(resolve => {
            let culumativeLeftOffset = 0;
            this.fixedLeft = this.fixedLeft.filter(column => {
                return fixedAdjustmentKeys.includes(column)
            })

            let fixedLeftColumns = this.displayKeys.filter(column => {
                return this.fixedLeft.includes(column);
            });

            let fixedLeftColumnsProcessed = 0;
            fixedLeftColumns.forEach((column, i) => {
                if (Number.isNaN(fixedAdjustments[column])) {
                    fixedAdjustments[column] = column.length * 8;
                }
                //Add 10.5 to compensate for padding
                let addToAdjustment = fixedAdjustments[column] + 10.5;
                culumativeLeftOffset += addToAdjustment;
                columnHeaderStyles[column] = {
                    position: "sticky",
                    zIndex: "11",
                    borderLeft: "1px solid #c0c0c0",
                    borderRight: i == this.fixedLeft.length - 1 ? "1px solid #777777ff" : "0px",
                    ...columnHeaderStyles[column],
                    left: (culumativeLeftOffset - addToAdjustment) + "px"
                }
                columnBodyStyles[column] = {
                    position: "sticky",
                    zIndex: "11",
                    borderLeft: "1px solid #c0c0c0",
                    borderRight: i == this.fixedLeft.length - 1 ? "1px solid #777777ff" : "0px",
                    ...columnBodyStyles[column],
                    left: (culumativeLeftOffset - addToAdjustment) + "px"
                }
                fixedLeftColumnsProcessed++;
                if (fixedLeftColumnsProcessed === fixedLeftColumns.length) {
                    resolve([columnHeaderStyles, columnBodyStyles]);
                }
            })
        });
    }

    setFixedRight(
        fixedAdjustments: Record<string, number>,
        columnHeaderStyles: Record<string, Record<string, string>>,
        columnBodyStyles: Record<string, Record<string, string>>,
        fixedAdjustmentKeys: string[]
    ) {
        return new Promise<Record<string, Record<string, string>>[]>(resolve => {
            let culumativeRightOffset = 0;
            this.fixedRight = this.fixedRight.filter(column => {
                return fixedAdjustmentKeys.includes(column)
            })
            this.fixedButtons = this.fixedButtons.filter(column => {
                return this.fixedRight.includes(column)
            })

            let fixedRightColumns = [
                ...this.fixedButtons,
                ...this.displayKeys.filter(column => {
                    return this.fixedRight.includes(column);
                }).reverse()
            ];

            let fixedRightColumnsProcessed = 0;
            fixedRightColumns.forEach((column, i) => {
                if (Number.isNaN(fixedAdjustments[column])) {
                    fixedAdjustments[column] = column.length * 8;
                }
                //Add 10.5 to compensate for padding
                let addToAdjustment = fixedAdjustments[column] + 10.5;
                culumativeRightOffset += addToAdjustment;
                columnHeaderStyles[column] = {
                    position: "sticky",
                    zIndex: "11",
                    borderLeft: i == this.fixedRight.length - 1 ? "1px solid #777777ff" : "1px solid #c0c0c0",
                    borderRight: i == 0 ? "1px solid #c0c0c0" : "0px",
                    ...columnHeaderStyles[column],
                    right: (culumativeRightOffset - addToAdjustment) + "px"
                }
                columnBodyStyles[column] = {
                    position: "sticky",
                    borderLeft: i == this.fixedRight.length - 1 ? "1px solid #777777ff" : "1px solid #c0c0c0",
                    borderRight: i == 0 ? "1px solid #c0c0c0" : "0px",
                    zIndex: "11",
                    ...columnBodyStyles[column],
                    right: (culumativeRightOffset - addToAdjustment) + "px"
                }
                fixedRightColumnsProcessed++;
                // console.log(this.columnHeaderStyles)
                if (fixedRightColumnsProcessed === fixedRightColumns.length) {
                    resolve([columnHeaderStyles, columnBodyStyles]);
                }
            })
        });
    }

    async exportGrid() {
        if (this.onExport.observed) {
            this.onExport.emit(this.activeDataset);
        } else {
            this.exportGridDefault()
        }
    }

    async exportGridDefault() {
        this.loading = true;
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet(this.exportFileName);

        // Define columns (headers)
        // worksheet.columns = Object.keys(this.allDisplayNames)
        worksheet.columns = this.displayKeys.map(key => {
            let maxLength = (
                [
                    this.allDisplayNames[key],
                    ...(this.distinctColumnValues[key] ?? [])
                ].reduce((lastVal, currentVal) => {
                    return (lastVal + "").length > (currentVal + "").length ?
                        (lastVal + "") :
                        (currentVal + "");
                }).length // * 1.3
            ) + 6;
            return {
                header: this.allDisplayNames[key],
                key,
                width: maxLength
            }
        })


        this.dataset.forEach(item => worksheet.addRow(item));

        worksheet.views = [{ state: 'frozen', ySplit: 1 }];


        worksheet.columns.forEach((column: Partial<Column>, i: number) => {
            if (column && column.eachCell) {
                column.eachCell({ includeEmpty: true }, function (cell, rowNumber) {
                    if (rowNumber === 1) {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'c7c7c7' }
                        }
                    }
                    // if (cell.value === 'AABAFI22XXX') { // change test as needed
                    //     cell.fill = {
                    //         type: 'pattern',
                    //         pattern: 'solid',
                    //         fgColor: { argb: 'FFFF0000' } // red fill
                    //     };
                    // }
                });
            }
        })

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Save as Excel file
        const blob = new Blob([buffer], {
            type:
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        saveAs(blob, this.exportFileName + '.xlsx');

        this.loading = false;
    }



    @HostListener("document:click")
    closeContextMenu() {
        setTimeout(() => {
            if (!this.contextClicked) {
                this.toggleContextMenu(false, "");
            }
        }, 10)
    }

    contextClick() {
        this.contextClicked = true;
        setTimeout(() => {
            this.contextClicked = false;
        }, 40)
    }
}