
import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Subject }  from "rxjs";
import { EncryptedPrivateKeysForTransfer } from "../../models/chat/encrypted-private-keys-for-transfer.model";


@Injectable({ providedIn: 'root' })
export class EncryptedPrivateKeysForTransferService {
    encryptedPrivateKeysForTransfersHaveChanged: Subject<void> = new Subject<void>();
    encryptedPrivateKeysForTransferSelectionHaveChanged: Subject<void> = new Subject<void>();
    

    encryptedPrivateKeysForTransferList: EncryptedPrivateKeysForTransfer[] = []; 
    
    emptyEncryptedPrivateKeysForTransfer: EncryptedPrivateKeysForTransfer = {
        keyId: 0,
		encryptedById: 0,
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
        },
		"encryptedBy": {
            optionListKey: "pubKeys",
            displayKeys: ["encryptedById"],
            fieldMap: {
                "encryptedById": "encryptedById" 
            }
        }
    }

    
    encryptedPrivateKeysForTransferForUpsert: EncryptedPrivateKeysForTransfer = { ...this.emptyEncryptedPrivateKeysForTransfer };
    
    
    constructor(
        private http: HttpClient
    ) { }
    
    
    getEncryptedPrivateKeysForTransfer(
        searchTerm: string,
        userId: number,
		encryptedById: number
    ) {
        let apiRoute = "v1/EncryptedPrivateKeysForTransfer/GetEncryptedPrivateKeysForTransfer";
        let searchParams = {
            searchTerm,
            userId,
			encryptedById
        }
        
        return this.http.post<EncryptedPrivateKeysForTransfer[]>(
            apiRoute,
            searchParams
        ).pipe(map((results: EncryptedPrivateKeysForTransfer[]) => {
            return results;
        }));
    }
    
    getEncryptedPrivateKeysForTransferSingle(
        primaryKeyValues: any
    ) {
        let apiRoute = "v1/EncryptedPrivateKeysForTransfer/GetEncryptedPrivateKeysForTransferSingle";
        
        return this.http.post<EncryptedPrivateKeysForTransfer>(
            apiRoute,
            primaryKeyValues
        ).pipe(map((results: EncryptedPrivateKeysForTransfer) => {
            return results;
        }));
    }
    
    upsertEncryptedPrivateKeysForTransfer(
        encryptedPrivateKeysForTransfer: EncryptedPrivateKeysForTransfer
    ) {
        let apiRoute = "v1/EncryptedPrivateKeysForTransfer/UpsertEncryptedPrivateKeysForTransfer";
        
        return this.http.post(
            apiRoute,
            encryptedPrivateKeysForTransfer
        ).pipe(map((results: any) => {
            return results;
        }));
    }
    
    deleteEncryptedPrivateKeysForTransfer(
        encryptedPrivateKeysForTransfer: EncryptedPrivateKeysForTransfer
    ) {
        let apiRoute = "v1/EncryptedPrivateKeysForTransfer/DeleteEncryptedPrivateKeysForTransfer";
        
        return this.http.post(
            apiRoute,
            encryptedPrivateKeysForTransfer
        ).pipe(map((results: any) => {
            return results;
        }));
    }  
   
} 
