import { NgClass, NgStyle } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-custom-checkbox',
    imports: [
        FormsModule,
        NgStyle,
        NgClass
    ],
    templateUrl: './custom-checkbox.component.html',
    styleUrl: './custom-checkbox.component.css'
})
export class CustomCheckboxComponent implements OnInit {
    @Input() value: boolean = false;
    @Output() valueChange = new EventEmitter<boolean>();

    @Input() label: string = "";
    @Input() disabled: boolean = false;
    @Input() softDisabled: boolean = false;
    @Input() size: any = "16px";
    @Input() labelStyles: string = "";

    styles: Record<string, string> = {};


    ngOnInit(): void {
        this.styles["height"] = this.size;
        this.styles["width"] = this.size;
    }

    toggle(event: MouseEvent): void {
        // event.preventDefault();
        if (!this.disabled && !this.softDisabled) {
            this.value = !this.value;
        } else {
            event.preventDefault();
            // this.value = !this.value;
            // this.value = !this.value;
        }
        this.valueChange.emit(this.value);
    }
}