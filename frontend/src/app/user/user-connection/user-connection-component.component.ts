
import { Component, OnDestroy, OnInit, Input } from '@angular/core';
import { UserConnectionService } from '../../services/user/user-connection-service.service';
import { ErrorService } from '../../services/error-service.service';
import { ErrorInfo } from '../../models/error-info.model';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserConnection } from '../../models/user/user-connection.model';
import { AuthService } from '../../services/auth-service.service';
import { OptionService } from '../../services/option-service.service';
import { CustomButtonComponent } from '../../elements/custom-button/custom-button.component';
import { LoadingSpinnerComponent } from '../../elements/loading-spinner/loading-spinner.component';
import { CustomInputComponent } from '../../elements/custom-input/custom-input.component';
import { UserConnectionSingleComponent } from './user-connection-single/user-connection-single-component.component';
import { ErrorMessageComponent } from '../../elements/error-message/error-message.component';
import { CustomSearchComponent } from "../../elements/custom-search/custom-search.component";

@Component({
    selector: 'app-user-connection',
    standalone: true,
    imports: [
        CustomButtonComponent,
        CustomInputComponent,
        LoadingSpinnerComponent,
        UserConnectionSingleComponent,
        ErrorMessageComponent,
        CustomSearchComponent,
    ],
    templateUrl: './user-connection-component.component.html',
    styleUrl: './user-connection-component.component.css'
})
export class UserConnectionComponent implements OnInit, OnDestroy {
    @Input() onlyMine: boolean = false;
    @Input() selectedRequestUserId: number = 0;
	@Input() selectedRecipientUserId: number = 0;
    //Page Defaults:
    errorInfo: ErrorInfo = this.errorServ.resetErrorMessage();
    pageModel: string = "UserConnection";
    pageName: string = "User Connection";
    routeParamsSubscription: Subscription = new Subscription();
    userConnectionHasChangedSubscription: Subscription = new Subscription();
    fieldTypes: Record<string, string> = {
        isActive: "boolean",
		requestUserId: "number",
		recipientUserId: "number",
		isRequestorAnonymous: "boolean",
		isRecipientAnonymous: "boolean",
		isAccepted: "boolean",
		isBlock: "boolean"
    }

    //Page State:
    singleSelection: boolean = false;
    selectedUserConnection: UserConnection = {
        ... this.userConnectionServ.emptyUserConnection
    };
    searchTerm: string = '';
    initialSearchStarted: boolean = false;
    resultsLoaded: boolean = false;
    savingChanges: boolean = false;
    editMode: boolean = false;
    addMode: boolean = false;
    
    constructor(
        private route: ActivatedRoute,
        private errorServ: ErrorService,
        public userConnectionServ: UserConnectionService,
        public auth: AuthService,
        public optionServ: OptionService
    ) {}

    ngOnInit(): void {
        
        this.subscribeUserConnectionHasChanged();
    }
    
    subscribeUserConnectionHasChanged() {
        this.userConnectionHasChangedSubscription = this.userConnectionServ.userConnectionsHaveChanged.subscribe(() => {
            this.getUserConnection();
        })
    }
    
    setRequestUserFilter(event: any) {
        // console.log(event)
        this.selectedRequestUserId = event.requestUserId
    }
	
    setRecipientUserFilter(event: any) {
        // console.log(event)
        this.selectedRecipientUserId = event.recipientUserId
    } 
    
    setDropdownValue(event: any) {
        let eventValue = event.value;
        let eventColumn = event.column;
        let eventObject = event.object;
    }

    openCreateUserConnection() {
        this.setSingleEdit(this.userConnectionServ.emptyUserConnection, true, true)
    }

    setSingleEdit(selectedUserConnection: UserConnection, singleSelection: boolean, addMode: boolean = false) {
        if (
            !singleSelection || 
            !this.singleSelection || 
            !this.editMode ||
            confirm("Are you sure you want to change user connection details without saving your changes?")
        ) {
            this.addMode = addMode;
            this.editMode = addMode;
            if (singleSelection) {
                this.selectedUserConnection = { ...selectedUserConnection };
            } else {
                this.selectedUserConnection = { ...this.userConnectionServ.emptyUserConnection };
            }
            this.singleSelection = singleSelection;
        }
    }

      
    
    openEditForm(event: any) {
        event.component.editRow(event.rowIndex)
    }

    setUpdateComplete() {
        this.resultsLoaded = true;   
    }

    getUserConnection() {
        this.initialSearchStarted = true;
        this.resultsLoaded = false;
        this.errorInfo = this.errorServ.resetErrorMessage();
        this.userConnectionServ.getUserConnection(
            this.searchTerm, 
            this.selectedRequestUserId,
			this.selectedRecipientUserId
        ).subscribe({
            next: res => {
                this.userConnectionServ.userConnectionList = res;
                this.setUpdateComplete();
            },
            error: (err: any) => {
                console.log(err);
                this.setUpdateComplete();
                let errorMessage = "An error occurred while loading the User Connection data. Please try again later.";
                let errorInner = JSON.stringify(err.error.errors, null, "\t")
                    
                this.errorInfo = this.errorServ.getErrorMessage(errorMessage, errorInner);
            }
        });
    }

    upsertUserConnection(event: any) {
        let userConnectionForUpsert = event
        this.savingChanges = true;
        this.errorInfo = this.errorServ.resetErrorMessage();
        this.userConnectionServ.upsertUserConnection(userConnectionForUpsert).subscribe({
            next: () => {
                this.savingChanges = false;
                this.getUserConnection();
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

    deleteUserConnection(event: any) {
        this.errorInfo = this.errorServ.resetErrorMessage();
        let userConnectionForDelete = event
        this.userConnectionServ.deleteUserConnection(userConnectionForDelete).subscribe({
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
    
    
