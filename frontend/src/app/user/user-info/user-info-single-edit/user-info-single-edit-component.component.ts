
import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { UserInfoService } from '../../../services/settings/user-info-service.service';
import { ErrorService } from '../../../services/error-service.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserInfo } from '../../../models/settings/user-info.model';
import { AuthService } from '../../../services/auth-service.service';
import { OptionService } from '../../../services/option-service.service';
import { LoadingSpinnerComponent } from '../../../elements/loading-spinner/loading-spinner.component';
import { CustomInputComponent } from '../../../elements/custom-input/custom-input.component';
import { CustomCheckboxComponent } from '../../../elements/custom-checkbox/custom-checkbox.component';
import { ErrorInfo } from '../../../models/error-info.model';
import { ErrorMessageComponent } from '../../../elements/error-message/error-message.component';
import { HelperService } from '../../../services/helper-service.service';
import { CustomSearchComponent } from "../../../elements/custom-search/custom-search.component";
import { CustomDateboxComponent } from "../../../elements/custom-datebox/custom-datebox.component";
import { UserSettings } from '../../../models/settings/user-settings.model';
import { UserSettingsService } from '../../../services/settings/user-settings-service.service';
import { CustomToggleComponent } from '../../../elements/custom-toggle/custom-toggle.component';
import { ZipCodeInfo } from '../../../models/zip-code/zip-code-info.model';
import { CustomLargeInputComponent } from '../../../elements/custom-large-input/custom-large-input.component';

@Component({
    selector: 'app-user-info-single-edit',
    standalone: true,
    imports: [
        CustomInputComponent,
        CustomCheckboxComponent,
        LoadingSpinnerComponent,
        ErrorMessageComponent,
        CustomSearchComponent,
        CustomDateboxComponent,
        CustomToggleComponent,
        CustomLargeInputComponent
    ],
    templateUrl: './user-info-single-edit-component.component.html',
    styleUrl: '../user-info-component.component.css'
})
export class UserInfoSingleEditComponent implements OnInit, OnChanges {
    @Input() registrationUserValid: boolean = false;
    @Output() registrationUserValidChange: EventEmitter<boolean> = new EventEmitter<boolean>;
    @Input() selectedUserInfo: UserInfo = {
        ... this.userInfoServ.emptyUserInfo
    };
    @Input() selectedUserSettings: UserSettings = {
        ... this.userSettingsServ.emptyUserSettings
    };
    selectedUserId: number = 0

    @Input() hasKids: boolean = false;
    userIsOverEighteen: boolean = false;
    @Input() canSubmit: boolean = false;
    @Output() canSubmitChange: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() onSubmit: EventEmitter<void> = new EventEmitter<void>();
    @Output() onCancelEdit: EventEmitter<void> = new EventEmitter<void>();
    zipIsFocused: boolean = false;
    invalidZip: boolean = false;
    errorInfo: ErrorInfo = this.errorServ.resetErrorMessage();
    originalUserInfo: UserInfo = {
        ... this.userInfoServ.emptyUserInfo
    };
    originalUserSettings: UserSettings = {
        ... this.userSettingsServ.emptyUserSettings
    };

    @Output() selectedUserInfoChange: EventEmitter<UserInfo> = new EventEmitter<UserInfo>();
    @Output() selectedUserSettingsChange: EventEmitter<UserSettings> = new EventEmitter<UserSettings>();
    @Input() allowEditing: boolean = false;
    noEditFields: string[] = [
        "emailAddress"
    ];
    @Output() onCloseSingleComponent: EventEmitter<any> = new EventEmitter<any>();

    routeParamsSubscription: Subscription = new Subscription();
    userInfoHasChangedSubscription: Subscription = new Subscription();


    resultsLoaded: boolean = true;
    savingChanges: boolean = false;
    @Input() registration: boolean = false;
    @Input() editMode: boolean = false;
    @Output() editModeChange = new EventEmitter<any>();

    constructor(
        private route: ActivatedRoute,
        private errorServ: ErrorService,
        public userInfoServ: UserInfoService,
        public auth: AuthService,
        public optionServ: OptionService,
        public userSettingsServ: UserSettingsService,
        public helperServ: HelperService
    ) { }

    ngOnInit(): void {
        this.initializeNewSelection();
        this.validateBirthday();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['selectedUserInfo']) {
            this.initializeNewSelection();
        }
    }

    submitUpdate(){
        this.onSubmit.emit();
    }


    cancelUpdate(){
        this.onCancelEdit.emit();
    }

    initializeNewSelection() {
        this.errorInfo = this.errorServ.resetErrorMessage();
        this.storeOriginalValue();
    }

    storeOriginalValue() {
        this.originalUserInfo = { ...this.selectedUserInfo };
    }

    restoreOriginalValue() {
        this.selectedUserInfo = { ...this.originalUserInfo };
    }

    clearHasKids(){
        if (!this.hasKids) {
            this.selectedUserSettings.hasElementaryKids = false;
            this.selectedUserSettings.hasMiddleSchoolKids = false;
            this.selectedUserSettings.hasHighSchoolKids = false;
        }
    }
    
    setCityStateFromZip() {
        this.zipIsFocused = true;
        this.registrationUserValid = false;
        this.canSubmit = false;
        let latestZipCode = this.selectedUserInfo.zipCode;
        setTimeout(() => {
            if (latestZipCode === this.selectedUserInfo.zipCode) {
                this.userInfoServ.getCityStateFromZip(this.selectedUserInfo.zipCode).subscribe({
                    next: (data: ZipCodeInfo[]) => {
                        if (data.length > 0) {
                            this.selectedUserInfo.userCity = data[0].city;
                            this.selectedUserInfo.userState = data[0].stateKey;
                            this.invalidZip = false;
                        } else {
                            this.selectedUserInfo.userCity = "";
                            this.selectedUserInfo.userState = "";
                            this.invalidZip = true;
                        }
                        this.checkUserIsValid();
                    },
                    error: (err) => {
                        console.log("Error fetching city/state:", err);
                        // this.selectedUserInfo.userCity = "";
                        // this.selectedUserInfo.userState = "";
                        this.errorInfo = this.errorServ.getErrorMessage("Location Fetch Error", "Could not retrieve city and state from zip code.");
                        this.invalidZip = true;
                        this.checkUserIsValid();
                    }
                })
            }
        }, 1000);
    }

    validateBirthday() {
        let eighteenAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 18)).getTime();
        let birthdayTime = new Date(this.selectedUserInfo.birthday).getTime();

        this.userIsOverEighteen = birthdayTime <= eighteenAgo;

        this.checkUserIsValid();
    }

    checkUserIsValid() {
        if (
            !this.selectedUserInfo.zipCode ||
            this.invalidZip ||
            !this.userIsOverEighteen
        ) {
            this.registrationUserValid = false;
            this.canSubmit = false;
            this.canSubmitChange.emit(this.canSubmit);
        } else {
            this.registrationUserValid = true;
            this.canSubmit = true;
            this.canSubmitChange.emit(this.canSubmit);
        }
    }

    closeSingleComponent() {
        this.onCloseSingleComponent.emit();
    }

    setEditMode(editMode: boolean) {
        if (this.registration) {
            this.closeSingleComponent();
        } else {
            if (!editMode) {
                this.restoreOriginalValue();
            }
            this.editMode = editMode;
            this.editModeChange.emit(this.editMode);
        }
    }


    onZipFocusOut() {
        this.zipIsFocused = false;
    }

}


