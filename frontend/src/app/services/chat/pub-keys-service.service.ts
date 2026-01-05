
import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Subject }  from "rxjs";
import { PubKeys } from "../../models/chat/pub-keys.model";


@Injectable({ providedIn: 'root' })
export class PubKeysService {
    pubKeyssHaveChanged: Subject<void> = new Subject<void>();
    pubKeysSelectionHaveChanged: Subject<void> = new Subject<void>();
    

    pubKeysList: PubKeys[] = []; 
    
    emptyPubKeys: PubKeys = {
        keyId: 0,
		userId: 0,
		keyIsActive: false,
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

    
    pubKeysForUpsert: PubKeys = { ...this.emptyPubKeys };
    
    
    constructor(
        private http: HttpClient
    ) { }
    
    
    getPubKeys(
        searchTerm: string,
        userId: number
    ) {
        let apiRoute = "v1/PubKeys/GetPubKeys";
        let searchParams = {
            searchTerm,
            userId
        }
        
        return this.http.post<PubKeys[]>(
            apiRoute,
            searchParams
        ).pipe(map((results: PubKeys[]) => {
            return results;
        }));
    }
    
    getPubKeysSingle(
        primaryKeyValues: any
    ) {
        let apiRoute = "v1/PubKeys/GetPubKeysSingle";
        
        return this.http.post<PubKeys>(
            apiRoute,
            primaryKeyValues
        ).pipe(map((results: PubKeys) => {
            return results;
        }));
    }
    
    upsertPubKeys(
        pubKeys: PubKeys
    ) {
        let apiRoute = "v1/PubKeys/UpsertPubKeys";
        
        return this.http.post(
            apiRoute,
            pubKeys
        ).pipe(map((results: any) => {
            return results;
        }));
    }
    
    deletePubKeys(
        pubKeys: PubKeys
    ) {
        let apiRoute = "v1/PubKeys/DeletePubKeys";
        
        return this.http.post(
            apiRoute,
            pubKeys
        ).pipe(map((results: any) => {
            return results;
        }));
    }  
   
} 
