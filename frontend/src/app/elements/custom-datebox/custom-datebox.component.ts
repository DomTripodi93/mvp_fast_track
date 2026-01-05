import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { HelperService } from '../../services/helper-service.service';

@Component({
    selector: 'app-custom-datebox',
    imports: [
        FormsModule,
        NgClass
    ],
    templateUrl: './custom-datebox.component.html',
    styleUrl: './custom-datebox.component.css'
})
export class CustomDateboxComponent {
    @Input() value: Date | null = null;
    @Input() disabled: boolean = false;
    @Input() softDisabled: boolean = false;
    @Input() boxShadow: boolean = true;
    @Output() valueChange = new EventEmitter<Date | null>();
    @Output() onValueChanged = new EventEmitter<Date | null>();

    @Input() label: string = "";
    @Input() placeholder?: string;
    @Input() min?: string; // still a string in yyyy-MM-dd
    @Input() max?: string;

    constructor(
        private helperServ: HelperService
    ){}

    // Converts Date → yyyy-MM-dd
    get displayValue(): string {
        return (this.value ? this.helperServ.setURLDateString(this.value) : '') + "";
    }

    // Handles input from native date input (which is a yyyy-MM-dd string)
    onInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        let newValue: Date | null = null;
        
        if (input.value) {
            // Parse as local date to avoid timezone issues
            const [year, month, day] = input.value.split('-').map(Number);
            newValue = new Date(year, month - 1, day);
        }
        
        this.valueChange.emit(newValue);
        this.onValueChanged.emit(newValue);
    }
}