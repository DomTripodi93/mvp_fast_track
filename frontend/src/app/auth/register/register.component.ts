import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service.service';
import { FormsModule } from '@angular/forms';
import { EncryptService } from '../../services/encrypt-service.service';
import { Encryptable } from '../../models/encryptable.model';
import { CustomInputComponent } from '../../elements/custom-input/custom-input.component';
import { CustomButtonComponent } from '../../elements/custom-button/custom-button.component';
import { ErrorInfo } from '../../models/error-info.model';
import { ErrorService } from '../../services/error-service.service';
import { ErrorMessageComponent } from '../../elements/error-message/error-message.component';
import { OptionService } from '../../services/option-service.service';
// import { UserSettingsService } from '../../services/settings/user-settings-service.service';
import { CustomCheckboxComponent } from '../../elements/custom-checkbox/custom-checkbox.component';
import { CustomDateboxComponent } from '../../elements/custom-datebox/custom-datebox.component';
import { CustomSearchComponent } from '../../elements/custom-search/custom-search.component';
import { LoadingSpinnerComponent } from '../../elements/loading-spinner/loading-spinner.component';
import { CustomToggleComponent } from '../../elements/custom-toggle/custom-toggle.component';
import { UserInfoService } from '../../services/settings/user-info-service.service';
import { ZipCodeInfo } from '../../models/zip-code/zip-code-info.model';


@Component({
    selector: 'app-register',
    standalone: true,
    imports: [
        FormsModule,
        CustomInputComponent,
        CustomButtonComponent,
        ErrorMessageComponent,

        CustomCheckboxComponent,
        LoadingSpinnerComponent,
        CustomSearchComponent,
        CustomDateboxComponent,
        CustomToggleComponent

    ],
    templateUrl: './register.component.html',
    styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
    @Output() onCancelRegistration: EventEmitter<any> = new EventEmitter<any>();
    @ViewChild('passwordBox') passwordBox: CustomInputComponent | undefined;
    @ViewChild('passwordConfirmBox') passwordConfirmBox: CustomInputComponent | undefined;
    errorInfo: ErrorInfo = this.errorServ.resetErrorMessage();

    savingChanges: boolean = false;
    hasKids: boolean = false;
    emailInvalid: boolean = false;
    loading: boolean = false;
    registration: boolean = false;
    registrationUserValid: boolean = false;
    emailIsFocused: boolean = false;
    zipIsFocused: boolean = false;
    invalidZip: boolean = false;
    passwordsMatch: boolean = false;
    passwordStrength: string = '';
    passwordHasCapital: boolean = false;
    passwordHasSymbol: boolean = false;
    passwordHasNumber: boolean = false;
    userIsOverEighteen: boolean = false;

    constructor(
        public router: Router,
        public authServ: AuthService,
        private encryptServ: EncryptService,
        private errorServ: ErrorService,
        public optionServ: OptionService,
        private userInfoServ: UserInfoService
    ) { }

    ngOnInit(): void {
        this.authServ.resetRegistration();
    }

    validateBirthday() {
        let eighteenAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 18)).getTime();
        let birthdayTime = new Date(this.authServ.registration.userInfo.birthday).getTime();

        this.userIsOverEighteen = birthdayTime <= eighteenAgo;

        this.checkUserIsValid();
    }

    validatePasswords(): void {
        this.passwordsMatch = this.authServ.authCreation.password === this.authServ.authCreation.passwordConfirm;

        // Password strength check with capital letter, symbol, and number requirement
        let password = this.authServ.authCreation.password;
        this.passwordHasCapital = /[A-Z]/.test(password);
        this.passwordHasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        this.passwordHasNumber = /[0-9]/.test(password);

        if (password.length === 0) {
            this.passwordStrength = '';
        } else if (password.length < 8 || !this.passwordHasCapital || !this.passwordHasSymbol || !this.passwordHasNumber) {
            this.passwordStrength = 'weak';
        } else if (password.length < 12) {
            this.passwordStrength = 'medium';
        } else {
            this.passwordStrength = 'strong';
        }
        this.checkUserIsValid();
    }

    checkUserIsValid() {
        if (
            !this.passwordHasCapital ||
            !this.passwordHasSymbol ||
            !this.passwordHasNumber ||
            !this.passwordsMatch ||
            !this.authServ.authCreation.emailAddress ||
            this.emailInvalid ||
            !this.authServ.registration.userInfo.zipCode ||
            this.invalidZip ||
            !this.userIsOverEighteen
        ) {
            this.registrationUserValid = false;
        } else {
            this.registrationUserValid = true;
        }
    }

    setCityStateFromZip() {
        this.zipIsFocused = true;
        this.registrationUserValid = false;
        let latestZipCode = this.authServ.registration.userInfo.zipCode;
        setTimeout(() => {
            if (latestZipCode === this.authServ.registration.userInfo.zipCode) {
                this.userInfoServ.getCityStateFromZip(this.authServ.registration.userInfo.zipCode).subscribe({
                    next: (data: ZipCodeInfo[]) => {
                        if (data.length > 0) {
                            this.authServ.registration.userInfo.userCity = data[0].city;
                            this.authServ.registration.userInfo.userState = data[0].stateKey;
                            this.invalidZip = false;
                        } else {
                            this.authServ.registration.userInfo.userCity = "";
                            this.authServ.registration.userInfo.userState = "";
                            this.invalidZip = true;
                        }
                        this.checkUserIsValid();
                    },
                    error: (err) => {
                        console.log("Error fetching city/state:", err);
                        // this.authServ.registration.userInfo.userCity = "";
                        // this.authServ.registration.userInfo.userState = "";
                        this.errorInfo = this.errorServ.getErrorMessage("Location Fetch Error", "Could not retrieve city and state from zip code.");
                        this.invalidZip = true;
                        this.checkUserIsValid();
                    }
                })
            }
        }, 1000);
    }

    onZipFocusOut() {
        this.zipIsFocused = false;
    }

    submitRegistration() {
        this.errorInfo = this.errorServ.resetErrorMessage();
        this.loading = true;

        let authCreationString: string = JSON.stringify(this.authServ.authCreation);

        this.encryptServ.encryptString(authCreationString).then(encrypted => {
            let encryptedAuth: Encryptable = {
                encrypted,
                decrypted: ""
            }
            this.authServ.registration.encryptedAuth = encryptedAuth;
            this.savingChanges = true;
            this.authServ.postRegistration(this.authServ.registration).subscribe({
                next: () => {
                    this.authServ.registrationJustCompleted = true;
                    this.authServ.login.emailAddress = this.authServ.authCreation.emailAddress
                    this.savingChanges = false;
                    this.onCancelRegistration.emit();
                    // this.router.navigate(["login"]);
                    // console.log(res);
                },
                error: (err: any) => {
                    this.loading = false;
                    let errorMessage = "Registration Failed";
                    this.errorInfo = this.errorServ.getErrorMessage(errorMessage, "A user has already been registered with that Email.");
                    // console.log(err);
                }
            })
        })
    }

    cancelRegistration() {
        this.onCancelRegistration.emit();
    }

    focusPassword() {
        if (this.passwordBox) {
            this.passwordBox.focus();
        }
    }

    focusPasswordConfirm() {
        if (this.passwordConfirmBox) {
            this.passwordConfirmBox.focus();
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
            this.authServ.authCreation.emailAddress.includes("@") &&
            this.authServ.authCreation.emailAddress.split("@")[1].includes(".")
        ) {
            this.emailInvalid = false;
        } else {
            this.emailInvalid = true;
        }
        this.checkUserIsValid();
    }

    onEmailFocusOut() {
        this.emailIsFocused = false;
    }
}
