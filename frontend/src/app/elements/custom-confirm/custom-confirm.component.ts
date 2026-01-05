import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CustomButtonComponent } from "../custom-button/custom-button.component";

@Component({
  selector: 'app-custom-confirm',
  imports: [
    CustomButtonComponent
  ],
  templateUrl: './custom-confirm.component.html',
  styleUrl: './custom-confirm.component.css'
})
export class CustomConfirmComponent {
  @Input() message: string = 'Are you sure?';
  @Input() confirmText: string = 'Confirm';
  @Input() denyText: string = 'Cancel';
  @Output() handleResult = new EventEmitter<boolean>();

  onConfirm(): void {
    this.handleResult.emit(true);
  }

  onDeny(): void {
    this.handleResult.emit(false);
  }
}
