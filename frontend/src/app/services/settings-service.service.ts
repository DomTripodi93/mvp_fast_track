import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable({ providedIn: 'root' })
export class SettingsService {
    videoWidth: string = "900px";
    videoHeight: string = "550px";
    isMobileView: boolean = false;

    constructor(
        public http: HttpClient
    ) { }
}
