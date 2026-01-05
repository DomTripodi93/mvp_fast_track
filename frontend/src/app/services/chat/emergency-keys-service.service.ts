
import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Subject }  from "rxjs";
import { EmergencyKeys } from "../../models/chat/emergency-keys.model";


@Injectable({ providedIn: 'root' })
export class EmergencyKeysService {
    emergencyKeyssHaveChanged: Subject<void> = new Subject<void>();
    emergencyKeysSelectionHaveChanged: Subject<void> = new Subject<void>();
    

    emergencyKeysList: EmergencyKeys[] = []; 
    
    emptyEmergencyKeys: EmergencyKeys = {
        keyId: 0,
		userId: 0,
		keyValue: "",
        insertDate: new Date(),
        updateDate: new Date(),
    }

    dropdownInfo: Record<string, any> = {
        "user": {
            optionListKey: "userInfo",
            displayKeys: ["userId"],
            fieldMap: {
                "userId": "userId" 
            }
        }
    }

    
    emergencyKeysForUpsert: EmergencyKeys = { ...this.emptyEmergencyKeys };
    
    
    constructor(
        private http: HttpClient
    ) { }
    
    
    getEmergencyKeys(
        searchTerm: string,
        userId: number
    ) {
        let apiRoute = "v1/EmergencyKeys/GetEmergencyKeys";
        let searchParams = {
            searchTerm,
            userId
        }
        
        return this.http.post<EmergencyKeys[]>(
            apiRoute,
            searchParams
        ).pipe(map((results: EmergencyKeys[]) => {
            return results;
        }));
    }
    
    getEmergencyKeysSingle(
        primaryKeyValues: any
    ) {
        let apiRoute = "v1/EmergencyKeys/GetEmergencyKeysSingle";
        
        return this.http.post<EmergencyKeys>(
            apiRoute,
            primaryKeyValues
        ).pipe(map((results: EmergencyKeys) => {
            return results;
        }));
    }
    
    upsertEmergencyKeys(
        emergencyKeys: EmergencyKeys
    ) {
        let apiRoute = "v1/EmergencyKeys/UpsertEmergencyKeys";
        
        return this.http.post(
            apiRoute,
            emergencyKeys
        ).pipe(map((results: any) => {
            return results;
        }));
    }
    
    deleteEmergencyKeys(
        emergencyKeys: EmergencyKeys
    ) {
        let apiRoute = "v1/EmergencyKeys/DeleteEmergencyKeys";
        
        return this.http.post(
            apiRoute,
            emergencyKeys
        ).pipe(map((results: any) => {
            return results;
        }));
    }  
   
} 
