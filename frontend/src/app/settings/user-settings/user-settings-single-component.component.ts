
import { Component, OnInit, Input, OnDestroy, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { UserSettingsService } from '../../services/settings/user-settings-service.service';
import { ErrorService } from '../../services/error-service.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserSettings } from '../../models/settings/user-settings.model';
import { AuthService } from '../../services/auth-service.service';
import { OptionService } from '../../services/option-service.service';
import { CustomButtonComponent } from '../../elements/custom-button/custom-button.component';
import { LoadingSpinnerComponent } from '../../elements/loading-spinner/loading-spinner.component';
import { CustomInputComponent } from '../../elements/custom-input/custom-input.component';
import { CustomCheckboxComponent } from '../../elements/custom-checkbox/custom-checkbox.component';
import { ErrorInfo } from '../../models/error-info.model';
import { ErrorMessageComponent } from '../../elements/error-message/error-message.component';
import { HelperService } from '../../services/helper-service.service';
// import { CustomDateboxComponent } from "../../elements/custom-datebox/custom-datebox.component";

@Component({
    selector: 'app-user-settings-single',
    standalone: true,
    imports: [
        CustomButtonComponent,
        CustomInputComponent,
        CustomCheckboxComponent,
        LoadingSpinnerComponent,
        ErrorMessageComponent,
        // CustomDateboxComponent,
    ],
    templateUrl: './user-settings-single-component.component.html',
    styleUrl: './user-settings-single-component.component.css'
})
export class UserSettingsSingleComponent implements OnInit, OnDestroy, OnChanges {
    canSubmit: boolean = false;
    errorInfo: ErrorInfo = this.errorServ.resetErrorMessage();
    @Input() selectedUserSettings: UserSettings = { 
        ... this.userSettingsServ.emptyUserSettings 
    };
    originalUserSettings: UserSettings = { 
        ... this.userSettingsServ.emptyUserSettings 
    };

    @Output() selectedUserSettingsChange: EventEmitter<UserSettings> = new EventEmitter<UserSettings>();
    @Input() allowDeleting: boolean = false;
    @Input() allowEditing: boolean = false;
    noEditFields: string[] = [
        "user"
    ];
    @Output() onCloseSingleComponent: EventEmitter<any> = new EventEmitter<any>();

    routeParamsSubscription: Subscription = new Subscription();
    userSettingsHasChangedSubscription: Subscription = new Subscription();
    defaultPrimaryKeys: Record<string, any> = {
        "userId": 0
    }
    selectedPrimaryKeys: Record<string, any> = {
        ...this.defaultPrimaryKeys
    }
    
    
    resultsLoaded: boolean = true;
    savingChanges: boolean = false;
    @Input() nested: boolean = false;
    @Input() addMode: boolean = false;
    @Output() addModeChange = new EventEmitter<any>();
    @Input() editMode: boolean = false;
    @Output() editModeChange = new EventEmitter<any>();
    
    constructor(
        private route: ActivatedRoute,
        private errorServ: ErrorService,
        public userSettingsServ: UserSettingsService,
        public auth: AuthService,
        public optionServ: OptionService,
        public helperServ: HelperService
    ) {}

    ngOnInit(): void {
        this.subscribeUserSettingsHasChanged();
        this.subscribeParams();
        this.initializeNewSelection();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['selectedUserSettings']) {
            this.initializeNewSelection();
        }
    }

    initializeNewSelection() {
        this.errorInfo = this.errorServ.resetErrorMessage();
        this.setPrimaryKeys();
        this.storeOriginalValue();
    }

    storeOriginalValue() {
        this.originalUserSettings = { ...this.selectedUserSettings };
    }

    restoreOriginalValue() {
        this.selectedUserSettings = { ...this.originalUserSettings };
    }

    setPrimaryKeys() {
        this.selectedPrimaryKeys["userId"] = this.selectedUserSettings.userId;
        if (this.addMode) {    
            this.checkPrimaryKeysValid();
        } else {
            this.canSubmit = true;
        }
    }

    checkPrimaryKeysValid() {
        Promise.all([
            this.primaryKeysNotDuplicated(), 
            this.helperServ.primaryKeysHaveValues(
                this.selectedPrimaryKeys, 
                this.defaultPrimaryKeys
            )
        ]).then((results) => {
            if (results.every(result => result)) {
                this.canSubmit = true;
            } else {
                this.canSubmit = false;
            }
        });
    }

    primaryKeysNotDuplicated() {
        return new Promise<boolean>(resolve => {
            let isDuplicate = this.optionServ.optionLists["userSettings"].filter(option => {
                return option.userId == this.selectedPrimaryKeys["userId"]
            }).length > 0;
            if (isDuplicate) {
                let errorMessage = "A User Settings already exists with the provided values: \n" + 
                    `User Id: ${this.selectedPrimaryKeys["userId"]}`;
                
                this.errorInfo = this.errorServ.getErrorMessage(errorMessage);
                // alert(errorMessage);
                resolve(false);
            } else {
                resolve(true);
            }
        });
    }

    
    setUser(event: any) {
        // console.log(event)
        this.selectedUserSettings.userId = event.userId
		this.setPrimaryKeys();
    }
    
    subscribeUserSettingsHasChanged() {
        this.userSettingsHasChangedSubscription = this.userSettingsServ.userSettingsHaveChanged.subscribe(() => {
            this.addMode = false;
            this.editMode = false;
            this.getUserSettings();
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
                this.selectedPrimaryKeys["userId"] = params["userId"];
            }
            if (paramsSupplied) {
                this.getUserSettings();
            }
        })
    }

    setEditMode(editMode: boolean) {
        if (this.addMode) {
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
        this.resultsLoaded = true;   
    }

    getUserSettings() {
        this.errorInfo = this.errorServ.resetErrorMessage();
        this.resultsLoaded = false;
        this.userSettingsServ.getUserSettingsSingle(this.selectedPrimaryKeys).subscribe({
            next: res => {
                this.selectedUserSettings = res;
                this.selectedUserSettingsChange.emit(this.selectedUserSettings)
                this.setUpdateComplete();
            },
            error: err => {
                this.setUpdateComplete();
                console.log(err);
                let errorMessage = "An error occurred while loading the User Settings data. Please try again later.";
                let errorInner = JSON.stringify(err.error.errors, null, "\t")
                    
                this.errorInfo = this.errorServ.getErrorMessage(errorMessage, errorInner);
            }
        });
    }

    upsertUserSettings() {
        this.errorInfo = this.errorServ.resetErrorMessage();
        this.savingChanges = true;
        this.userSettingsServ.upsertUserSettings(this.selectedUserSettings).subscribe({
            next: () => {
                this.savingChanges = false;
                this.getUserSettings();
                this.userSettingsServ.userSettingsHaveChanged.next();
            },
            error: (err: any) => {
                this.savingChanges = false;
                console.log(err);
                let errorMessage = "An error occurred while saving the User Settings. Please try again later.";
                let errorInner = JSON.stringify(err.error.errors, null, "\t")
                    
                this.errorInfo = this.errorServ.getErrorMessage(errorMessage, errorInner);
            }
        });
    }

    deleteUserSettings() {
        this.errorInfo = this.errorServ.resetErrorMessage();
        this.userSettingsServ.deleteUserSettings(this.selectedUserSettings).subscribe({
            next: () => {
                this.getUserSettings();
            },
            error: (err: any) => {
                console.log(err);
                let errorMessage = "An error occurred while deleting the User Settings. Please try again later.";
                let errorInner = JSON.stringify(err.error.errors, null, "\t")
                    
                this.errorInfo = this.errorServ.getErrorMessage(errorMessage, errorInner);
            }
        });
    }
    
    ngOnDestroy(): void {
        this.routeParamsSubscription.unsubscribe();
        this.userSettingsHasChangedSubscription.unsubscribe();
    }
    
}
    
        
