import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-picture-screen',
  imports: [],
  templateUrl: './picture-screen.component.html',
  styleUrl: './picture-screen.component.css'
})
export class PictureScreenComponent {
  @Input() width: string = 'auto';
  @Input() height: string = 'auto';
  @Input() imgSrc: string = '';
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
