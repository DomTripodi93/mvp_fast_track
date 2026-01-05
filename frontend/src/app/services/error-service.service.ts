import { Injectable } from '@angular/core';
import { ErrorInfo } from '../models/error-info.model';

@Injectable({ providedIn: 'root' })
export class ErrorService {

    constructor() { }


    resetErrorMessage(): ErrorInfo {
        return {
            isError: false,
            errorMessage: "",
            innerError: ""
        };
    }

    getErrorMessage(errorMessage: string, innerError: string = ""): ErrorInfo {
        return {
            isError: true,
            errorMessage,
            innerError
        };
    }

}