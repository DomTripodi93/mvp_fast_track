
import { Component, OnInit, Input, OnDestroy, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { UserInfoService } from '../../../services/settings/user-info-service.service';
import { ErrorService } from '../../../services/error-service.service';
import { ActivatedRoute } from '@angular/router';
import { PartialObserver, Subscription } from 'rxjs';
import { UserInfo } from '../../../models/settings/user-info.model';
import { AuthService } from '../../../services/auth-service.service';
import { OptionService } from '../../../services/option-service.service';
import { LoadingSpinnerComponent } from '../../../elements/loading-spinner/loading-spinner.component';
import { ErrorInfo } from '../../../models/error-info.model';
import { ErrorMessageComponent } from '../../../elements/error-message/error-message.component';
import { HelperService } from '../../../services/helper-service.service';
import { UserSettings } from '../../../models/settings/user-settings.model';
import { UserSettingsService } from '../../../services/settings/user-settings-service.service';
import { UserFull } from '../../../models/user/user-full';
import { UserInfoSingleViewComponent } from '../user-info-single-view/user-info-single-view-component.component';
import { UserInfoSingleEditComponent } from '../user-info-single-edit/user-info-single-edit-component.component';
import { CustomInputComponent } from '../../../elements/custom-input/custom-input.component';
import { UserName } from '../../../models/settings/user-name.model';
import { UserPictureComponent } from '../user-picture/user-picture-component.component';


@Component({
    selector: 'app-user-info-single',
    standalone: true,
    imports: [
        // CustomButtonComponent,
        LoadingSpinnerComponent,
        ErrorMessageComponent,
        UserInfoSingleViewComponent,
        UserInfoSingleEditComponent,
        // CustomPopupComponent,
        // PictureScreenComponent,
        CustomInputComponent,
        // CustomUploadComponent,
        // CustomSearchComponent,
        // ImageCropperModule
        UserPictureComponent
    ],
    templateUrl: './user-info-single-component.component.html',
    styleUrl: '../user-info-component.component.css'
})
export class UserInfoSingleComponent implements OnInit, OnDestroy, OnChanges {
    @Input() registrationUserValid: boolean = false;
    @Output() registrationUserValidChange: EventEmitter<boolean> = new EventEmitter<boolean>;
    @Input() selectedUserInfo: UserInfo = {
        ... this.userInfoServ.emptyUserInfo
    };
    @Input() selectedUserSettings: UserSettings = {
        ... this.userSettingsServ.emptyUserSettings
    };
    @Input() selectedUserInfoForEdit: UserInfo = {
        ... this.userInfoServ.emptyUserInfo
    };
    @Input() selectedUserSettingsForEdit: UserSettings = {
        ... this.userSettingsServ.emptyUserSettings
    };
    @Input() selectedUserName: UserName = {
        firstName: "",
        lastName: "",
        pronouns: ""
    }
    profilePictureCropped: string = '/assets/DefaultProPic.png';
    selectedUserId: number = 0
    kidsAreIn: string[] = []

    proPicUpdated: boolean = false;
    hasKids: boolean = false;
    canSubmit: boolean = false;
    userIsReady: boolean = false;

    isViewingProPic: boolean = false;
    isEditingProPic: boolean = false;
    isEditingName: boolean = false;

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
    @Output() onCloseSingleComponent: EventEmitter<any> = new EventEmitter<any>();

    routeParamsSubscription: Subscription = new Subscription();
    userInfoHasChangedSubscription: Subscription = new Subscription();


    resultsLoaded: boolean = true;
    savingChanges: boolean = false;
    @Input() registration: boolean = false;
    @Input() editMode: boolean = false;
    // @Input() editMode: boolean = true;
    @Output() editModeChange = new EventEmitter<any>();
    tempProPicUrl: string = "";

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
        this.subscribeUserInfoHasChanged();
        this.subscribeParams();
        this.initializeNewSelection();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['selectedUserInfo']) {
            this.initializeNewSelection();
        }
    }

    initializeNewSelection(forUpdate: boolean = false) {
        this.proPicUpdated = false;
        if (forUpdate || JSON.stringify(this.selectedUserInfo) === JSON.stringify(this.userInfoServ.emptyUserInfo)) {
            this.isViewingProPic = false;
            this.isEditingProPic = false;
            this.getUserInfo();
        } else {
            this.errorInfo = this.errorServ.resetErrorMessage();
            this.storeOriginalValue();
        }
    }

    storeOriginalValue() {
        this.selectedUserName.firstName = this.selectedUserInfo.firstName;
        this.selectedUserName.lastName = this.selectedUserInfo.lastName;
        this.originalUserInfo = { ...this.selectedUserInfo };
        this.originalUserSettings = { ...this.selectedUserSettings };
        this.userIsReady = true;
    }

    restoreOriginalValue() {
        this.selectedUserName.firstName = this.originalUserInfo.firstName;
        this.selectedUserName.lastName = this.originalUserInfo.lastName;
        this.selectedUserInfo = { ...this.originalUserInfo };
        this.selectedUserSettings = { ...this.originalUserSettings };
    }

    subscribeUserInfoHasChanged() {
        this.userInfoHasChangedSubscription = this.userInfoServ.userInfosHaveChanged.subscribe(() => {
            this.registration = false;
            this.editMode = false;
            this.getUserInfo();
        })
    }

    closeSingleComponent() {
        this.onCloseSingleComponent.emit();
    }

    subscribeParams() {
        this.routeParamsSubscription = this.route.params.subscribe(params => {
            // console.log(params);
            let paramsSupplied = false;
            if (params["userId"]) {
                paramsSupplied = true;
                this.selectedUserId = params["userId"];
                this.getUserInfo();
            }
        })
    }

    onClickEditProPic() {
        this.isEditingProPic = true;
        this.isViewingProPic = true;
    }

    onCloseEditProPic() {
        this.isEditingProPic = false;
        this.isViewingProPic = false;
        this.tempProPicUrl = "";
        if (this.proPicUpdated) {
            this.initializeNewSelection(true);
        }
    }

    onProPicChanged() {
        this.proPicUpdated = true;
        this.getUserInfo();
    }

    onClickViewProPic() {
        this.isViewingProPic = true;
    }

    onClickEditName() {
        this.isEditingName = true;
    }

    onCloseEditName() {
        this.isEditingName = false;
    }

    setEditMode(editMode: boolean) {
        // console.log(this.selectedUserInfo)
        // console.log(this.selectedUserSettings)
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

    setUpdateComplete() {
        this.setHasKids();
        this.resultsLoaded = true;
    }

    getUserInfo() {
        this.userIsReady = false;
        this.resultsLoaded = false;
        this.tempProPicUrl = "";

        this.errorInfo = this.errorServ.resetErrorMessage();

        let responseHandler: PartialObserver<UserFull> = {
            next: res => {
                this.selectedUserInfo = res.userInfo;
                if (this.selectedUserInfo.profilePicture != '') {
                    this.profilePictureCropped = this.selectedUserInfo.profilePicture
                        .split('appimages/').join('appimages/cropped_')
                        + '?t=' + new Date().getTime();
                }
                this.selectedUserInfoChange.emit(this.selectedUserInfo)

                this.selectedUserSettings = res.userSettings;
                this.selectedUserSettingsChange.emit(this.selectedUserSettings)
                this.setUpdateComplete();
                this.initializeNewSelection();
            },
            error: err => {
                this.setUpdateComplete();
                console.log(err);
                let errorMessage = "An error occurred while loading the User Info data. Please try again later.";
                let errorInner = JSON.stringify(err.error.errors, null, "\t")

                this.errorInfo = this.errorServ.getErrorMessage(errorMessage, errorInner);
            }
        }

        if (this.selectedUserId == 0) {
            this.allowEditing = true;
            this.userInfoServ.getMyUserInfo().subscribe(responseHandler);
        } else {
            this.allowEditing = false;
            this.userInfoServ.getUserInfoSingle(this.selectedUserId).subscribe(responseHandler);
        }
    }

    onConfirmUpsertUserInfo() {
        this.helperServ.showConfirm = true;
        this.helperServ.confirmationMessage = "Are you sure you want to save the changes to your profile?";
        this.helperServ.confirmationCallback = (confirmed: boolean) => {
            this.helperServ.showConfirm = false;
            if (confirmed) {
                this.upsertUserInfo();
            }
        }
    }

    onConfirmCancelEditUserInfo() {
        this.helperServ.showConfirm = true;
        this.helperServ.confirmationMessage = "Are you sure you want to cancel without saving the changes to your profile?";
        this.helperServ.confirmationCallback = (confirmed: boolean) => {
            this.helperServ.showConfirm = false;
            if (confirmed) {
                this.setEditMode(false);
            }
        }
    }

    upsertUserInfo() {
        this.errorInfo = this.errorServ.resetErrorMessage();
        this.savingChanges = true;
        this.userInfoServ.upsertUserInfo(this.selectedUserInfo, this.selectedUserSettings).subscribe({
            next: () => {
                this.savingChanges = false;
                this.getUserInfo();
                this.userInfoServ.userInfosHaveChanged.next();
            },
            error: (err: any) => {
                this.savingChanges = false;
                console.log(err);
                let errorMessage = "An error occurred while saving the User Info. Please try again later.";
                let errorInner = JSON.stringify(err.error.errors, null, "\t")

                this.errorInfo = this.errorServ.getErrorMessage(errorMessage, errorInner);
            }
        });
    }

    setHasKids() {
        this.kidsAreIn = [];
        this.hasKids = this.selectedUserSettings.hasPreschoolKids
            || this.selectedUserSettings.hasElementaryKids
            || this.selectedUserSettings.hasMiddleSchoolKids
            || this.selectedUserSettings.hasHighSchoolKids
            || this.selectedUserSettings.hasCollegeKids;

        if (this.selectedUserSettings.hasPreschoolKids) {
            this.kidsAreIn.push("Preschool");
        }
        if (this.selectedUserSettings.hasElementaryKids) {
            this.kidsAreIn.push("Elementary School");
        }
        if (this.selectedUserSettings.hasMiddleSchoolKids) {
            this.kidsAreIn.push("Middle School");
        }
        if (this.selectedUserSettings.hasHighSchoolKids) {
            this.kidsAreIn.push("High School");
        }
        if (this.selectedUserSettings.hasCollegeKids) {
            this.kidsAreIn.push("College");
        }
    }

    onCloseViewProPic() {
        this.isViewingProPic = false;
        this.isEditingProPic = false;
    }

    ngOnDestroy(): void {
        this.routeParamsSubscription.unsubscribe();
        this.userInfoHasChangedSubscription.unsubscribe();
    }

}


