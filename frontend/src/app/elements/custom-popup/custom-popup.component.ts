import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-custom-popup',
  imports: [],
  templateUrl: './custom-popup.component.html',
  styleUrl: './custom-popup.component.css'
})
export class CustomPopupComponent {
  @Input() width: string = '500px';
  @Input() height: string = 'auto';
  @Input() headerText: string = '';
  @Input() showCloseButton: boolean = true;
  @Input() closeOnClickAway: boolean = true;
  
  @Output() onClose = new EventEmitter<void>();

  closePopup(): void {
    this.onClose.emit();
  }

  handleOverlayClick(event: MouseEvent): void {
    if (this.closeOnClickAway) {
      this.onClose.emit();
    }
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }
}
