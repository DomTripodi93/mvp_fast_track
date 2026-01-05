
import { Component, OnInit, Input, OnDestroy, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { UserConnectionService } from '../../../services/user/user-connection-service.service';
import { ErrorService } from '../../../services/error-service.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserConnection } from '../../../models/user/user-connection.model';
import { AuthService } from '../../../services/auth-service.service';
import { OptionService } from '../../../services/option-service.service';
import { CustomButtonComponent } from '../../../elements/custom-button/custom-button.component';
import { LoadingSpinnerComponent } from '../../../elements/loading-spinner/loading-spinner.component';
import { CustomCheckboxComponent } from '../../../elements/custom-checkbox/custom-checkbox.component';
import { ErrorInfo } from '../../../models/error-info.model';
import { ErrorMessageComponent } from '../../../elements/error-message/error-message.component';
import { HelperService } from '../../../services/helper-service.service';
import { CustomSearchComponent } from "../../../elements/custom-search/custom-search.component";
// import { CustomDateboxComponent } from "../../../elements/custom-datebox/custom-datebox.component";

@Component({
    selector: 'app-user-connection-single',
    standalone: true,
    imports: [
        CustomButtonComponent,
        CustomCheckboxComponent,
        LoadingSpinnerComponent,
        ErrorMessageComponent,
        CustomSearchComponent,
        // CustomDateboxComponent,
    ],
    templateUrl: './user-connection-single-component.component.html',
    styleUrl: '../user-connection-component.component.css'
})
export class UserConnectionSingleComponent implements OnInit, OnDestroy, OnChanges {
    canSubmit: boolean = false;
    errorInfo: ErrorInfo = this.errorServ.resetErrorMessage();
    @Input() selectedUserConnection: UserConnection = { 
        ... this.userConnectionServ.emptyUserConnection 
    };
    originalUserConnection: UserConnection = { 
        ... this.userConnectionServ.emptyUserConnection 
    };

    @Output() selectedUserConnectionChange: EventEmitter<UserConnection> = new EventEmitter<UserConnection>();
    @Input() allowDeleting: boolean = false;
    @Input() allowEditing: boolean = false;
    noEditFields: string[] = [
        "requestUser",
		"recipientUser"
    ];
    @Output() onCloseSingleComponent: EventEmitter<any> = new EventEmitter<any>();

    routeParamsSubscription: Subscription = new Subscription();
    userConnectionHasChangedSubscription: Subscription = new Subscription();
    defaultPrimaryKeys: Record<string, any> = {
        "requestUserId": 0,
		"recipientUserId": 0
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
        public userConnectionServ: UserConnectionService,
        public auth: AuthService,
        public optionServ: OptionService,
        public helperServ: HelperService
    ) {}

    ngOnInit(): void {
        this.subscribeUserConnectionHasChanged();
        this.subscribeParams();
        this.initializeNewSelection();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['selectedUserConnection']) {
            this.initializeNewSelection();
        }
    }

    initializeNewSelection() {
        this.errorInfo = this.errorServ.resetErrorMessage();
        this.setPrimaryKeys();
        this.storeOriginalValue();
    }

    storeOriginalValue() {
        this.originalUserConnection = { ...this.selectedUserConnection };
    }

    restoreOriginalValue() {
        this.selectedUserConnection = { ...this.originalUserConnection };
    }

    setPrimaryKeys() {
        this.selectedPrimaryKeys["requestUserId"] = this.selectedUserConnection.requestUserId;
		this.selectedPrimaryKeys["recipientUserId"] = this.selectedUserConnection.recipientUserId;
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
            let isDuplicate = this.optionServ.optionLists["userConnection"].filter(option => {
                return option.requestUserId == this.selectedPrimaryKeys["requestUserId"] &&
					option.recipientUserId == this.selectedPrimaryKeys["recipientUserId"]
            }).length > 0;
            if (isDuplicate) {
                let errorMessage = "A User Connection already exists with the provided values: \n" + 
                    `Request User Id: ${this.selectedPrimaryKeys["requestUserId"]}, ` + 
					`Recipient User Id: ${this.selectedPrimaryKeys["recipientUserId"]}`;
                
                this.errorInfo = this.errorServ.getErrorMessage(errorMessage);
                // alert(errorMessage);
                resolve(false);
            } else {
                resolve(true);
            }
        });
    }

    
    setRequestUser(event: any) {
        // console.log(event)
        this.selectedUserConnection.requestUserId = event.requestUserId
		this.setPrimaryKeys();
    }

	
    setRecipientUser(event: any) {
        // console.log(event)
        this.selectedUserConnection.recipientUserId = event.recipientUserId
		this.setPrimaryKeys();
    }
    
    subscribeUserConnectionHasChanged() {
        this.userConnectionHasChangedSubscription = this.userConnectionServ.userConnectionsHaveChanged.subscribe(() => {
            this.addMode = false;
            this.editMode = false;
            this.getUserConnection();
        })
    }

    closeSingleComponent() {
        this.onCloseSingleComponent.emit();
    }

    subscribeParams() {
        this.routeParamsSubscription = this.route.params.subscribe(params => {
            // console.log(params);
            let paramsSupplied = false;
            if (params["requestUserId"]) {
                paramsSupplied = true;
                this.selectedPrimaryKeys["requestUserId"] = params["requestUserId"];
            }
			if (params["recipientUserId"]) {
                paramsSupplied = true;
                this.selectedPrimaryKeys["recipientUserId"] = params["recipientUserId"];
            }
            if (paramsSupplied) {
                this.getUserConnection();
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

    getUserConnection() {
        this.errorInfo = this.errorServ.resetErrorMessage();
        this.resultsLoaded = false;
        this.userConnectionServ.getUserConnectionSingle(this.selectedPrimaryKeys).subscribe({
            next: res => {
                this.selectedUserConnection = res;
                this.selectedUserConnectionChange.emit(this.selectedUserConnection)
                this.setUpdateComplete();
            },
            error: err => {
                this.setUpdateComplete();
                console.log(err);
                let errorMessage = "An error occurred while loading the User Connection data. Please try again later.";
                let errorInner = JSON.stringify(err.error.errors, null, "\t")
                    
                this.errorInfo = this.errorServ.getErrorMessage(errorMessage, errorInner);
            }
        });
    }

    upsertUserConnection() {
        this.errorInfo = this.errorServ.resetErrorMessage();
        this.savingChanges = true;
        this.userConnectionServ.upsertUserConnection(this.selectedUserConnection).subscribe({
            next: () => {
                this.savingChanges = false;
                this.getUserConnection();
                this.userConnectionServ.userConnectionsHaveChanged.next();
            },
            error: (err: any) => {
                this.savingChanges = false;
                console.log(err);
                let errorMessage = "An error occurred while saving the User Connection. Please try again later.";
                let errorInner = JSON.stringify(err.error.errors, null, "\t")
                    
                this.errorInfo = this.errorServ.getErrorMessage(errorMessage, errorInner);
            }
        });
    }

    deleteUserConnection() {
        this.errorInfo = this.errorServ.resetErrorMessage();
        this.userConnectionServ.deleteUserConnection(this.selectedUserConnection).subscribe({
            next: () => {
                this.getUserConnection();
            },
            error: (err: any) => {
                console.log(err);
                let errorMessage = "An error occurred while deleting the User Connection. Please try again later.";
                let errorInner = JSON.stringify(err.error.errors, null, "\t")
                    
                this.errorInfo = this.errorServ.getErrorMessage(errorMessage, errorInner);
            }
        });
    }
    
    ngOnDestroy(): void {
        this.routeParamsSubscription.unsubscribe();
        this.userConnectionHasChangedSubscription.unsubscribe();
    }
    
}
    
        
