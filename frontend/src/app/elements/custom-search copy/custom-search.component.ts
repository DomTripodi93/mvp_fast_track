import { NgClass, NgStyle } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { CustomInputComponent } from '../custom-input/custom-input.component';
import { CustomCheckboxComponent } from '../custom-checkbox/custom-checkbox.component';

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
export class CustomSearchComponent implements OnInit {
    @Input() optionList: any[] = [];
    @Input() valueKey: string = 'value';
    @Input() displayKey: string = 'label';
    @Input() displayKeys: string[] = [];
    @Input() placeholder: string = 'Select an option';
    @Input() startingValue: any[] = [];
    @Input() value: string | number | null = '';
    @Input() dropdownWidth: string = '100%';
    @Input() showSelection: boolean = true;
    @Input() multiSelect: boolean = false;
    @Input() showClearSelection: boolean = true;
    @Output() valueChange = new EventEmitter<any>();
    @Input() startOpen: boolean = false;
    @Input() boxShadow: boolean = true;

    isOpen: boolean = false;

    createTime: number = Date.now();

    options: any[] = [];
    stringOptions: boolean = false;
    selectedValues: any[] = [''];
    selectedLabels: string[] = [];
    highlightedIndex = -1;
    searchTerm: string = '';

    constructor(private eRef: ElementRef) { }

    ngOnInit(): void {
        this.setOptions().then(() => {
            if (this.startOpen) {
                this.isOpen = true;
            }
            this.setSelected();
        })
    }

    setOptions(searchTerm: string | number = '') {
        this.searchTerm = searchTerm + "";
        return new Promise<void>(resolve => {
            if (this.optionList.length > 0 && typeof (this.optionList[0]) === "string") {
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
                this.options = [...this.optionList]
                this.options = this.options.filter(option => {
                    return option[this.displayKey].toLowerCase().includes(this.searchTerm.toLowerCase());
                })
                resolve();
            }
        })
    }

    setSelected() {
        if (this.startingValue.length !== 0) {
            this.selectedValues = [...this.startingValue];
            if (this.stringOptions) {
                this.selectedLabels = [...this.startingValue]
            } else {
                this.selectedLabels = this.startingValue.map(row => {
                    return row[this.displayKey];
                });
            }
        }
    }

    toggleDropdown(): void {
        console.log("toggle dropdown")
        this.isOpen = !this.isOpen;
        this.createTime = Date.now();
    }

    selectOption(option: any): void {
        // this.isOpen = false;
        if (this.multiSelect) {
            if (option === 'clear') {
                this.selectedValues = [];
                this.selectedLabels = [];
            } else if (this.selectedValues.includes(option[this.valueKey])) {
                this.selectedValues = this.selectedValues.filter(value => {
                    return value !== option[this.valueKey]
                });
                this.selectedLabels = this.selectedLabels.filter(label => {
                    return label !== option[this.displayKey]
                })
            } else {
                this.selectedValues.push(option[this.valueKey]);
                this.selectedLabels.push(option[this.displayKey]);
            }
            // console.log(this.selectedValues)
            this.valueChange.emit(this.selectedValues);
        } else {
            this.selectedValues = [option[this.valueKey]];
            this.selectedLabels = [option[this.displayKey]];
            console.log(this.selectedLabels)
            this.valueChange.emit(this.selectedValues[0]);
        }
        // this.isOpen = false;
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