import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Registration } from "../models/registration.model";
import { Login } from "../models/login.model";
import { TokenResponse } from "../models/token-response.model";
import { jwtDecode } from "jwt-decode";
import { Router } from "@angular/router";
import { AuthCreation } from "../models/auth-creation.model";
import { Subject } from "rxjs";
import { Encryptable } from "../models/encryptable.model";
import { UserInfo } from "../models/settings/user-info.model";
import { UserSettings } from "../models/settings/user-settings.model";
import { UserInfoService } from "./settings/user-info-service.service";
import { UserSettingsService } from "./settings/user-settings-service.service";

@Injectable({ providedIn: "root" })
export class AuthService {
    registrationCancelled: Subject<void> = new Subject();
    authChanged: Subject<void> = new Subject();
    registrationJustCompleted: boolean = false;

    emptyLogin: Login = {
        emailAddress: "",
        password: ""
    }
    login: Login = { ...this.emptyLogin }

    emptyAuthCreation: AuthCreation = {
        emailAddress: "",
        password: "",
        passwordConfirm: ""
    }

    authCreation: AuthCreation = { ...this.emptyAuthCreation }

    emptyEncrypted: Encryptable = {
        encrypted: "",
        decrypted: ""
    }

    registration: Registration = {
        userSettings: { ...this.userSettingsServ.emptyUserSettings },
        userInfo: { ...this.userInfoServ.emptyUserInfo },
        encryptedAuth: { ...this.emptyEncrypted }
    }

    displayName: string = "";
    userId: number = 0;
    username: string = "";
    isAuthenticated: boolean = false;
    token: string = "";

    constructor(
        public httpServ: HttpClient,
        private router: Router,
        private userInfoServ: UserInfoService,
        private userSettingsServ: UserSettingsService
    ) { }

    checkLoggedIn() {
        let tokenFromStorage = localStorage.getItem("token") + "";
        if (tokenFromStorage != "") {
            this.token = tokenFromStorage;
            this.isAuthenticated = true;

            this.refreshToken();
        } else {
            this.logout();
        }
    }

    refreshToken() {
        this.getRefreshToken().subscribe({
            next: (res: TokenResponse) => {
                this.handleLogin(res.token).then(() => {
                    this.authChanged.next();
                });
            },
            error: (err: any) => {
                console.log(err);
                this.logout();
            }
        })

    }

    handleLogin(token: string) {
        return new Promise<void>(resolve => {
            localStorage.setItem("token", token);
            let tokenInfo: any = jwtDecode(token);
            // console.log(tokenInfo);
            this.displayName = tokenInfo["displayName"];
            this.userId = tokenInfo["userId"];
            this.username = tokenInfo["username"];

            this.token = token;
            this.isAuthenticated = true;

            this.authChanged.next();
            resolve();
        })
    }

    logout() {
        localStorage.setItem("token", "");

        this.isAuthenticated = false;
        this.displayName = "";
        this.userId = 0;
        this.username = "";
        this.token = "";

        this.authChanged.next();
        this.router.navigate(["/login"]);
        // this.router.navigate(["/"]);
    }

    resetRegistration() {
        this.registration = {
            userSettings: { ...this.userSettingsServ.emptyUserSettings },
            userInfo: { ...this.userInfoServ.emptyUserInfo },
            encryptedAuth: { ...this.emptyEncrypted }
        }
        this.authCreation = { ...this.emptyAuthCreation }
    }

    postRegistration(userForRegister: Registration) {
        return this.httpServ.post("v1/auth/registerEncrypted", userForRegister)
    }

    postLogin(userForLogin: Encryptable) {
        return this.httpServ.post<TokenResponse>("v1/auth/loginEncrypted", userForLogin)
    }

    getRefreshToken() {
        return this.httpServ.get<TokenResponse>("v1/auth/refreshToken")
    }
}