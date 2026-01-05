import { NgStyle } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { CustomInputComponent } from '../custom-input/custom-input.component';
import { CustomCheckboxComponent } from '../custom-checkbox/custom-checkbox.component';

@Component({
    selector: 'app-custom-multi-select',
    imports: [
        NgStyle,
        CustomCheckboxComponent
    ],
    templateUrl: './custom-multi-select.component.html',
    styleUrl: './custom-multi-select.component.css'
})
export class CustomMultiSelectComponent implements OnInit {
    @Input() optionList: any[] = [];
    @Input() valueKey: string = 'value';
    @Input() displayKey: string = 'label';
    @Input() placeholder: string = 'Select an option';
    @Input() startingValue: any[] = [];
    @Input() dropdownWidth: string = '100%';
    @Input() multiSelect: boolean = false;
    @Output() valueChange = new EventEmitter<any>();

    options: any[] = [];
    isOpen: boolean = false;
    stringOptions: boolean = false;
    selectedValues: any[] = [''];
    selectedLabels: string[] = [];
    highlightedIndex = -1;

    constructor(private eRef: ElementRef) { }

    ngOnInit(): void {
        this.setOptions().then(() => {
            this.setSelected();
        })
    }

    setOptions() {
        return new Promise<void>(resolve => {
            if (this.optionList.length > 0 && typeof (this.optionList[0]) === "string") {
                this.options = this.optionList.map(option => {
                    return {
                        [this.valueKey]: option,
                        [this.displayKey]: option
                    }
                })
                this.stringOptions = true;
                resolve();
            } else {
                this.options = [...this.optionList]
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
        this.isOpen = !this.isOpen;
    }

    selectOption(option: any): void {
        // this.isOpen = false;
        if (this.multiSelect) {
            if (this.selectedValues.includes(option[this.valueKey])) {
                this.selectedValues = this.selectedValues.filter(value => {
                    return value !== option[this.valueKey]
                });
            } else {
                this.selectedValues.push(option[this.valueKey]);
            }
            this.valueChange.emit(this.selectedValues);
        } else {
            this.selectedValues = [option[this.valueKey]];
            this.selectedLabels = [option[this.displayKey]];
            this.valueChange.emit(this.selectedValues[0]);
        }
        // this.isOpen = false;
    }

    @HostListener('document:click', ['$event'])
    closeDropdown(event: Event): void {
        if (!this.eRef.nativeElement.contains(event.target)) {
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