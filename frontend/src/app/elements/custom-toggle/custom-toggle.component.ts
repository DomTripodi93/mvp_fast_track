import { NgStyle, NgClass } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-custom-toggle',
    imports: [
        FormsModule,
        NgStyle,
        NgClass
    ],
    templateUrl: './custom-toggle.component.html',
    styleUrls: ['./custom-toggle.component.css']
})
export class CustomToggleComponent implements OnInit {
    @Input() value: boolean = false;
    @Input() label: string = '';
    @Input() disabled: boolean = false;
    @Input() softDisabled: boolean = false;
    @Input() size: any = "14px";
    @Input() labelStyles: any = {};
    @Output() valueChange = new EventEmitter<boolean>();

    sizeNumber: number = 14;
    toggleStyles: Record<string, string> = {};
    knobStyles: Record<string, string> = {};

    ngOnInit(): void {
        this.sizeNumber = +this.size.replace(/[^0-9.]/g, '');
        this.setToggleSizeStyles();
        this.setKnobSizeStyles();
    }

    setToggleSizeStyles() {
        let width = (this.sizeNumber * 2) + "px";
        let height = this.sizeNumber + "px";

        this.toggleStyles["height"] = height;
        this.toggleStyles["width"] = width;
        this.toggleStyles["width"] = width;
    }

    setKnobSizeStyles() {
        this.knobStyles = {
            width: (this.sizeNumber - 4) + "px",
            height: (this.sizeNumber - 4) + "px",
            left: this.value ? (this.sizeNumber + 2) + "px" : '2px',
            top: '2px'
        };
    }

    toggle(event: Event) {
        if (this.disabled) {
            event.preventDefault();
            return;
        }
        this.value = !this.value;
        this.valueChange.emit(this.value);
        this.setKnobSizeStyles();
    }
}
