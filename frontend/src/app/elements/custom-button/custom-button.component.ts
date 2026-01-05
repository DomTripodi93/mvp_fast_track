import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { NgClass, NgStyle } from '@angular/common';

@Component({
    selector: 'app-custom-button',
    imports: [
        LoadingSpinnerComponent,
        NgClass,
        NgStyle
    ],
    templateUrl: './custom-button.component.html',
    styleUrl: './custom-button.component.css'
})
export class CustomButtonComponent {
    @Input() type: 'button' | 'submit' | 'reset' = 'button';
    @Input() variant: 'primary' | 'secondary' | 'gray1' | 'gray2' | 'danger' | 'info' | 'success' = 'primary';
    @Input() disabled: boolean = false;
    @Input() width: string = '';
    @Input() customClass: string = '';
    @Output() buttonClick = new EventEmitter<Event>();
    @Input() loading: boolean = false;
    @Input() square: boolean = false;
    @Input() boxShadow: boolean = true;
    //   @Input() loading: boolean = true;

    ripples: { x: number, y: number }[] = [];

    get btnClass(): string {
        return this.customClass === "" ? `btn-${this.variant}` : this.customClass;
        // return `btn-${this.variant}`;
    }

    onClick(event: Event): void {
        if (!this.disabled) {
            this.buttonClick.emit(event);
        }
    }
}