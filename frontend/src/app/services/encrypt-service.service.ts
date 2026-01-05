

import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import * as forge from 'node-forge';
// import * as CryptoJS from 'crypto-js';
import { HelperService } from "./helper-service.service";
import { HttpClient } from "@angular/common/http";

@Injectable({ providedIn: "root" })
export class EncryptService {

    constructor(
        private httpServ: HttpClient,
        private helperServ: HelperService
    ) { }


    async encryptString(plainText: string): Promise<string> {
        return new Promise<string>(resolve => {
            this.getPublicKey().subscribe({
                next: (pubKeyObj: Record<string, string>) => {
                    resolve(this.encryptStringWithKey(plainText, pubKeyObj["encryptionKey"]));
                },
                error: (err) => {
                    console.log(err);
                }
            })
        })
    }

    getPublicKey() {
        let pubKeyRoute = "v1/auth/ljwei03984345woldui485lwjeot40298dlsapiortjw49wi782hfuwe72dk";
        return this.httpServ.get<Record<string, string>>(pubKeyRoute)
    }

    encryptStringWithKey(plainText: string, pubKeyString: string): string {
        const publicKey = forge.pki.publicKeyFromPem(pubKeyString);

        // const utf8Bytes = forge.util.encodeUtf8(plainText);  // Encode as UTF-8
        // const encrypted = publicKey.encrypt(utf8Bytes, 'RSA-OAEP');
        const encrypted = publicKey.encrypt(plainText, 'RSA-OAEP');
        // let encryptedBase64 = ""
        const encryptedBase64 = forge.util.encode64(encrypted);

        return encryptedBase64;
    }
}