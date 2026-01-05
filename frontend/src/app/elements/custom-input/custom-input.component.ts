import { NgClass } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Component({
    selector: 'app-custom-input',
    imports: [
        NgClass,
        FormsModule,
        LoadingSpinnerComponent
    ],
    templateUrl: './custom-input.component.html',
    styleUrl: './custom-input.component.css'
})
export class CustomInputComponent {
    @Input() type: string = 'text';
    @Input() label: string = "";
    @Input() placeholder: string = '';
    @Input() value: string | number | null = '';
    @Input() disabled: boolean = false;
    @Input() softDisabled: boolean = false;
    @Input() required: boolean = false;
    @Input() iconStart: string = "";
    @Input() iconEnd: string = "";
    @Input() loading: boolean = false;
    @Input() boxShadow: boolean = true;

    @Output() valueChange = new EventEmitter<string | number>();
    @Output() onValueChanged = new EventEmitter<string | number>();
    @Output() onEnter = new EventEmitter<void>();
    @Output() iconEndClick = new EventEmitter<string | number>();
    @Output() iconStartClick = new EventEmitter<string | number>();
    @Output() valueChangeDefault = new EventEmitter<string>();
    
    @ViewChild("thisinput") thisInput!: ElementRef<HTMLInputElement> | undefined;
    showPassword: boolean = false;

    setPassword(showPassword: boolean) {
        this.showPassword = showPassword;
    }

    onInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (this.type === 'number' && input.value === ""){
            input.value = "0";
        }
        
        if (this.type.toLowerCase() === 'phone') {
            input.value = this.formatPhoneNumber(input.value);
        }
        
        this.valueChange.emit(input.value);
        this.valueChangeDefault.emit((event.target as HTMLInputElement).value);
        this.onValueChanged.emit(input.value);
    }

    private formatPhoneNumber(value: string): string {
        // Remove all non-digit characters
        const digits = value.replace(/\D/g, '');
        
        // Limit to 10 digits
        const limitedDigits = digits.substring(0, 10);
        
        // Format based on number of digits
        if (limitedDigits.length <= 3) {
            return limitedDigits ? `(${limitedDigits}` : limitedDigits;
        } else if (limitedDigits.length <= 6) {
            return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`;
        } else {
            return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
        }
    }

    focus() {
        if (this.thisInput) {
            this.thisInput.nativeElement.focus();
        }
    }


}