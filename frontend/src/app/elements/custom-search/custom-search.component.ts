import { NgClass, NgStyle } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CustomInputComponent } from '../custom-input/custom-input.component';
import { CustomCheckboxComponent } from '../custom-checkbox/custom-checkbox.component';
import { OptionService } from '../../services/option-service.service';

@Component({
    selector: 'app-custom-search',
    imports: [
        NgStyle,
        NgClass,
        CustomInputComponent,
        CustomCheckboxComponent
    ],
    templateUrl: './custom-search.component.html',
    styleUrl: './custom-search.component.css'
})
export class CustomSearchComponent implements OnInit, OnChanges {
    @Input() optionList: any[] = [];
    @Input() valueKey: string = 'value';
    @Input() optionListKey: string = 'label';
    @Input() displayKey: string = 'label';
    @Input() displayKeys: string[] = [];
    @Input() placeholder: string = 'Select an option';
    @Input() startingValue: any[] = [];
    @Input() valueSingle: any = null;
    @Output() valueSingleChange = new EventEmitter<any>();
    // @Input() value: string | number | null = '';
    @Input() dropdownWidth: string = '100%';
    @Input() showSelection: boolean = true;
    @Input() closeOnSelect: boolean = true;
    @Input() multiSelect: boolean = false;
    @Input() showSearch: boolean = false;
    @Input() showClearSelection: boolean = true;
    @Output() valueChange = new EventEmitter<any>();
    @Input() startOpen: boolean = false;
    @Input() boxShadow: boolean = true;
    @Input() wholeObjectValue: boolean = false;
    @Input() softDisabled: boolean = false;
    @Input() disabled: boolean = false;
    @Input() fieldNameMappings: Record<string, string> = {}

    isOpen: boolean = false;
    isBlank: boolean = false;
    dropdownPosition: 'below' | 'above' = 'below';

    createTime: number = Date.now();

    options: any[] = [];
    stringOptions: boolean = false;
    selectedValues: any[] = [''];
    selectedLabels: string[] = [];
    highlightedIndex = -1;
    searchTerm: string = '';

    constructor(
        private eRef: ElementRef,
        private optionServ: OptionService
    ) { }

    ngOnInit(): void {
        // console.log(this.optionListKey);
        // console.log(this.displayKeys);
        this.initializeOptions();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['startingValue'] || changes['optionListKey'] || changes['optionList']) {
            this.initializeOptions();
        }
    }

    public initializeOptions() {
        this.setOptions().then(() => {
            if (this.startOpen) {
                this.isOpen = true;
            }
            // console.log(this.stringOptions)
            if (this.stringOptions) {
                this.setStringSelections();
            } else {
                this.setObjectSelections();
            }
        })
    }

    setOptions(searchTerm: string | number = '') {
        this.searchTerm = searchTerm + "";
        return new Promise<void>(resolve => {
            if (this.displayKeys.length > 0) {
                if (this.optionServ.optionLists[this.optionListKey]) {
                    this.options = [...this.optionServ.optionLists[this.optionListKey]]
                    // console.log(this.options);
                } else if (this.optionList) {
                    this.options = [...this.optionList]
                }
                // console.log(this.optionList)
                // console.log(this.options)
                // console.log(this.searchTerm)
                // console.log(this.displayKeys)

                this.options = this.options.filter(option => {
                    let optionIsRelevant = false;
                    this.displayKeys.forEach(key => {
                        if (option[key].toLowerCase().includes(this.searchTerm.toLowerCase())) {
                            optionIsRelevant = true;
                        }
                    })
                    return optionIsRelevant;
                })
                resolve();
            } else if (this.optionList && this.optionList.length > 0 && typeof (this.optionList[0]) === "string") {
                this.options = this.optionList.map(option => {
                    return {
                        [this.valueKey]: option,
                        [this.displayKey]: option
                    }
                })
                this.stringOptions = true;
                this.options = this.options.filter(option => {
                    return option[this.displayKey].toLowerCase().includes(this.searchTerm.toLowerCase());
                })
                resolve();
            } else {
                if (this.optionList){
                    this.options = [...this.optionList]
                } else {
                    this.options = [];
                }
                this.options = this.options.filter(option => {
                    return option[this.displayKey].toLowerCase().includes(this.searchTerm.toLowerCase());
                })
                resolve();
            }
        })
    }

    setStringSelections() {
        if (this.startingValue.length !== 0) {
            this.selectedValues = [...this.startingValue];
            this.selectedLabels = [...this.startingValue];
        } else if (this.valueSingle) {
            this.selectedValues = [this.valueSingle];
            this.selectedLabels = [this.valueSingle];
        }
    }

    addMappedKeys(row: any, fieldMapKeys: string[]) {
        return new Promise<any[]>(resolve => {
            if (fieldMapKeys.length > 0) {
                let rowToEdit = { ...row };
                let fieldKeysProcessed = 0;
                fieldMapKeys.forEach(key => {
                    rowToEdit[this.fieldNameMappings[key]] = rowToEdit[key];
                    fieldKeysProcessed++
                    if (fieldKeysProcessed == fieldMapKeys.length) {
                        resolve(rowToEdit);
                    }
                })
            } else {
                resolve(row);
            }
        })
    }

    setObjectSelections() {
        // console.log(this.startingValue);
        let selectedValues = [];
        // let rowsChecked = 0;


        let fieldMapKeys = Object.keys(this.fieldNameMappings);
        if (this.startingValue.length !== 0) {
            let startingValuesProcessed = 0;
            this.startingValue.forEach(row => {
                this.addMappedKeys(row, fieldMapKeys).then(updatedRow => {
                    row = updatedRow;
                    // console.log(row);
                    let relatedOptions = this.options.filter(option => {
                        let keys = Object.keys(option);
                        let keysProcessed = 0;
                        keys.forEach(key => {
                            if (option[key] !== row[key]) {
                                return false;
                            }
                            keysProcessed++;
                            if (keysProcessed === keys.length) {
                                return true;
                            }
                        })
                    })
                    if (relatedOptions.length > 0) {
                        selectedValues.push(relatedOptions[0]);
                    } else if (this.options.length > 0) {
                        let optionToAdd: any = {};

                        let keys = Object.keys(this.options[0]);
                        let keysProcessed = 0;
                        let hasCurrentValue = false;
                        keys.forEach(key => {
                            optionToAdd[key] = row[key];
                            if (!!row[key]) {
                                hasCurrentValue = true;
                            }
                            keysProcessed++;
                            if (keysProcessed === keys.length) {
                                if (hasCurrentValue) {
                                    this.options.push(optionToAdd);
                                    selectedValues.push(optionToAdd)
                                } else {
                                    this.selectedValues = [];
                                    this.selectedLabels = [];
                                }
                            }
                        })
                    } else {
                        this.options.push(row);
                        selectedValues.push(row);
                    }
                    startingValuesProcessed++
                    if (startingValuesProcessed === this.startingValue.length) {
                        this.selectedValues = selectedValues;
                        // console.log("hitStartLabels")
                        this.setObjectSelectedLabels();
                    }
                })
            })
        }
    }

    setObjectSelectedLabels() {
        this.selectedLabels = [];
        this.selectedValues.forEach(row => {
            this.selectOption(row);
        })
    }

    toggleDropdown(): void {
        if (!this.softDisabled && !this.disabled) {
            // console.log("toggle dropdown")
            this.isOpen = !this.isOpen;
            this.createTime = Date.now();
            
            if (this.isOpen) {
                // Calculate dropdown position after DOM update
                setTimeout(() => this.calculateDropdownPosition(), 0);
            }
        }
    }

    calculateDropdownPosition(): void {
        const selectElement = this.eRef.nativeElement.querySelector('.custom-select') || this.eRef.nativeElement.querySelector('.search-anchor');
        const dropdownElement = this.eRef.nativeElement.querySelector('.options');
        
        if (!selectElement || !dropdownElement) return;

        const rect = selectElement.getBoundingClientRect();
        const dropdownRect = dropdownElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        const dropdownHeight = dropdownRect.height;

        // Position above if not enough space below and more space above
        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
            this.dropdownPosition = 'above';
        } else {
            this.dropdownPosition = 'below';
        }
    }

    selectOption(option: any): void {
        // this.isOpen = false;

        if (option === 'clear') {
            this.selectedValues = [];
            this.selectedLabels = [];
            this.valueSingle = null;
            this.valueChange.emit(this.selectedValues);
            this.valueSingleChange.emit(this.valueSingle);
        } else if (this.multiSelect) {
            if (this.selectedValues.includes(option[this.valueKey])) {
                this.selectedValues = this.selectedValues.filter(value => {
                    return value !== option[this.valueKey]
                });
                this.setOptionLabel(option, true)
            } else {
                this.selectedValues.push(option[this.valueKey]);
                this.setOptionLabel(option)
            }
            // console.log(this.selectedValues)
            // this.valueChange.emit(this.selectedValues);
        } else {
            if (this.wholeObjectValue) {
                this.selectedValues = [option];
                this.valueSingle = option;
            } else {
                this.selectedValues = [option[this.valueKey]];
                this.valueSingle = option[this.valueKey];
            }

            this.setOptionLabel(option)
            // this.valueChange.emit(this.selectedValues[0]);
        }
        // this.isOpen = false;
    }

    setOptionLabel(option: any, remove: boolean = false) {
        // this.isOpen = false;
        if (!this.multiSelect || option === 'clear') {
            this.selectedLabels = [];
        }

        if (option !== 'clear') {
            let labelForOption = "";
            if (this.displayKeys.length === 0) {
                labelForOption = option[this.displayKey];
            } else {
                this.displayKeys.forEach((key, i) => {
                    labelForOption += option[key] + (i + 1 < this.displayKeys.length ? ', ' : '')
                })
            }

            if (remove) {
                this.selectedLabels = this.selectedLabels.filter(label => {
                    return label !== labelForOption
                })
            } else {
                this.selectedLabels.push(labelForOption);
            }
        }
        // console.log(this.selectedValues)
        if (this.valueSingle) {
            this.valueSingleChange.emit(this.valueSingle);
        } else if (this.multiSelect) {
            this.valueChange.emit(this.selectedValues);
        } else if (this.selectedValues.length > 0) {
            this.isOpen = false;
            this.valueChange.emit(this.selectedValues[0]);
        }
        if (this.closeOnSelect){
            this.isOpen = false;
        }

    }

    @HostListener('document:click', ['$event'])
    closeDropdown(event: Event): void {
        let nowTime = Date.now();
        let elapsedMilliseconds = nowTime - this.createTime;
        let elapsedSeconds = elapsedMilliseconds / 1000;

        if (!this.eRef.nativeElement.contains(event.target) && elapsedSeconds > .5) {
            this.isOpen = false;
        }
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyboardNavigation(event: KeyboardEvent): void {
        if (!this.isOpen) return;

        if (event.key === 'ArrowDown') {
            this.highlightedIndex = (this.highlightedIndex + 1) % this.options.length;
        } else if (event.key === 'ArrowUp') {
            this.highlightedIndex = (this.highlightedIndex - 1 + this.options.length) % this.options.length;
        } else if (event.key === 'Enter' && this.highlightedIndex >= 0) {
            this.selectOption(this.options[this.highlightedIndex]);
        }
    }

}