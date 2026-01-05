import { NgStyle } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-custom-select',
  imports: [NgStyle],
  templateUrl: './custom-select.component.html',
  styleUrl: './custom-select.component.css'
})
export class CustomSelectComponent implements OnInit {
  @Input() optionList: any[] = [];
  @Input() valueKey: string = 'value';
  @Input() displayKey: string = 'label';
  @Input() placeholder: string = 'Select an option';
  @Input() startingValue: any = '';
  @Input() dropdownWidth: string = '100%';
  @Output() valueChange = new EventEmitter<any>();
  
  options: any[] = [];
  isOpen = false;
  stringOptions = false;
  selectedValue: any;
  selectedLabel: string | null = null;
  highlightedIndex = -1;

  constructor(private eRef: ElementRef) { }

  ngOnInit(): void {
    this.setOptions().then(()=>{
      this.setSelected();
    })
  }

  setOptions(){
    return new Promise<void>(resolve => {
      if (this.optionList.length > 0 && typeof (this.optionList[0]) === "string") {
        this.options = this.optionList.map(option =>{
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

  setSelected(){
    if (this.startingValue !== ""){
      this.selectedValue = this.startingValue;
      if (this.stringOptions){
        this.selectedLabel = this.startingValue
      } else {
        this.selectedLabel = this.startingValue[this.displayKey];
      }
    }
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  selectOption(option: any): void {
    // this.isOpen = false;
    this.selectedValue = option[this.valueKey];
    this.selectedLabel = option[this.displayKey];
    this.valueChange.emit(option[this.valueKey]);
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