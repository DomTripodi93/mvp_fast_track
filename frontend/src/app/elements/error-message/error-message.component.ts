import { Component, Input } from '@angular/core';
import { ErrorInfo } from '../../models/error-info.model';

@Component({
  selector: 'app-error-message',
  imports: [],
  templateUrl: './error-message.component.html',
  styleUrl: './error-message.component.css'
})
export class ErrorMessageComponent {
  @Input() errorInfo: ErrorInfo = {
    isError: false,
    errorMessage: "",
    innerError: ""
  };

}
