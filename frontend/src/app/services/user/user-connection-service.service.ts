
import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Subject } from "rxjs";
import { UserConnection } from "../../models/user/user-connection.model";
import { UserConnectionOption } from "../../models/user/user-connection-option.model";


@Injectable({ providedIn: 'root' })
export class UserConnectionService {
    userConnectionsHaveChanged: Subject<void> = new Subject<void>();
    userConnectionSelectionHaveChanged: Subject<void> = new Subject<void>();
    userConnectionOptionsHaveChanged: Subject<void> = new Subject<void>();


    userConnectionList: UserConnection[] = [];

    emptyUserConnection: UserConnection = {
        requestUserId: 0,
        recipientUserId: 0,
        isRequestorAnonymous: false,
        isRecipientAnonymous: false,
        isAccepted: false,
        isActive: true,
        isBlock: false,
        insertDate: new Date(),
        updateDate: new Date(),
    }

    dropdownInfo: Record<string, any> = {
        "requestUser": {
            optionListKey: "userInfo",
            displayKeys: ["requestUserId"],
            fieldMap: {
                "requestUserId": "requestUserId"
            }
        },
        "recipientUser": {
            optionListKey: "userInfo",
            displayKeys: ["recipientUserId"],
            fieldMap: {
                "recipientUserId": "recipientUserId"
            }
        }
    }


    userConnectionForUpsert: UserConnection = { ...this.emptyUserConnection };


    constructor(
        private http: HttpClient
    ) { }


    getUserConnectionOptions() {
        let apiRoute = "v1/UserConnection/GetUserConnectionOptions";

        return this.http.get<UserConnectionOption[]>(
            apiRoute
        ).pipe(map((results: UserConnectionOption[]) => {
            return results;
        }));
    }


    getUserConnection(
        searchTerm: string,
        requestUserId: number,
        recipientUserId: number
    ) {
        let apiRoute = "v1/UserConnection/GetUserConnection";
        let searchParams = {
            searchTerm,
            requestUserId,
            recipientUserId
        }

        return this.http.post<UserConnection[]>(
            apiRoute,
            searchParams
        ).pipe(map((results: UserConnection[]) => {
            return results;
        }));
    }

    getUserConnectionSingle(
        primaryKeyValues: any
    ) {
        let apiRoute = "v1/UserConnection/GetUserConnectionSingle";

        return this.http.post<UserConnection>(
            apiRoute,
            primaryKeyValues
        ).pipe(map((results: UserConnection) => {
            return results;
        }));
    }

    upsertUserConnection(
        userConnection: UserConnection
    ) {
        let apiRoute = "v1/UserConnection/UpsertUserConnection";

        return this.http.post(
            apiRoute,
            userConnection
        ).pipe(map((results: any) => {
            return results;
        }));
    }

    deleteUserConnection(
        userConnection: UserConnection
    ) {
        let apiRoute = "v1/UserConnection/DeleteUserConnection";

        return this.http.post(
            apiRoute,
            userConnection
        ).pipe(map((results: any) => {
            return results;
        }));
    }

} 
