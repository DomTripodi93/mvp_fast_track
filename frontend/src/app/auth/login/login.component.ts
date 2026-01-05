import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TokenResponse } from '../../models/token-response.model';
import { AuthService } from '../../services/auth-service.service';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { Subscription } from 'rxjs';
import { EncryptService } from '../../services/encrypt-service.service';
import { Encryptable } from '../../models/encryptable.model';
import { CustomInputComponent } from '../../elements/custom-input/custom-input.component';
import { CustomButtonComponent } from '../../elements/custom-button/custom-button.component';
import { ErrorInfo } from '../../models/error-info.model';
import { ErrorService } from '../../services/error-service.service';
import { ErrorMessageComponent } from '../../elements/error-message/error-message.component';
import { RegisterComponent } from '../register/register.component';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        FormsModule,
        NgClass,
        CustomInputComponent,
        CustomButtonComponent,
        ErrorMessageComponent,
        RegisterComponent
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, OnDestroy {
    @ViewChild('passwordBox') passwordBox: CustomInputComponent | undefined;
    errorInfo: ErrorInfo = this.errorServ.resetErrorMessage();

    emailInvalid: boolean = false;
    loading: boolean = false;
    registration: boolean = false;
    emailIsFocused: boolean = false;

    constructor(
        public router: Router,
        public authServ: AuthService,
        private encryptServ: EncryptService,
        private errorServ: ErrorService
    ) { }

    ngOnInit(): void {
        let tokenFromStorage = localStorage.getItem("token") + "";
        if (tokenFromStorage != "") {
            this.router.navigate(["profile"]);
        }
    }

    cancelRegistration(){
        this.registration = false;
    }

    submitLogin() {
        this.errorInfo = this.errorServ.resetErrorMessage();
        this.loading = true;

        let loginString: string = JSON.stringify(this.authServ.login);

        this.encryptServ.encryptString(loginString).then(encrypted => {
            let loginPayload: Encryptable = {
                encrypted,
                decrypted: ""
            }
            this.authServ.postLogin(loginPayload).subscribe({
                next: (res: TokenResponse) => {
                    // console.log(res);
                    this.authServ.handleLogin(res.token).then(() => {
                        this.router.navigate(["profile"]);
                        this.loading = false;
                    });
                },
                error: (err: any) => {
                    this.loading = false;
                    let errorMessage = "Login Failed";
                    this.errorInfo = this.errorServ.getErrorMessage(errorMessage, "That email and password combination is incorrect.");
                    console.log(err);
                }
            })
        })
    }

    focusPassword() {
        if (this.passwordBox) {
            this.passwordBox.focus();
        }
    }

    //   onUsernameEnter() {
    //     if (this.passwordBox != null) {
    //       this.passwordBox.instance.focus();
    //     }
    //   }

    emailChanged() {
        this.emailIsFocused = true;
        if (
            this.authServ.login.emailAddress.includes("@") &&
            this.authServ.login.emailAddress.split("@")[1].includes(".")
        ) {
            this.emailInvalid = false;
        } else {
            this.emailInvalid = true;
        }
    }

    onEmailFocusOut(){
        this.emailIsFocused = false;
    }

    beginRegistration(event: Event) {
        event.preventDefault();
        this.registration = true;
    }

    ngOnDestroy(): void {
    }
}
