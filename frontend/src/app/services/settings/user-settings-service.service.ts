
import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Subject }  from "rxjs";
import { UserSettings } from "../../models/settings/user-settings.model";


@Injectable({ providedIn: 'root' })
export class UserSettingsService {
    userSettingsHaveChanged: Subject<void> = new Subject<void>();
    userSettingsSelectionHaveChanged: Subject<void> = new Subject<void>();
    

    userSettingsList: UserSettings[] = []; 
    
    emptyUserSettings: UserSettings = {
        userId: 0,
        profilePrivacyMode: "Friends Only",
        ethnicityPrivacyMode: "Public",
        religionPrivacyMode: "Public",
        politicalPrivacyMode: "Public",
        sexualOrientationPrivacyMode: "Public",
        pronounsPrivacyMode: "Public",
        birthdayPrivacyMode: "Public",
        cityStatePrivacyMode: "Public",
        emailPrivacyMode: "Private",
        phonePrivacyMode: "Private",
        defaultActivityPrivacyMode: "Private",
        darkMode: false,
        hasPreschoolKids: false,
        hasElementaryKids: false,
        hasMiddleSchoolKids: false,
        hasHighSchoolKids: false,
        hasCollegeKids: false,
        hasKidsPrivacyMode: "Public",
        insertDate: new Date(),
        updateDate: new Date(),
    }

    dropdownInfo: Record<string, any> = {
        "user": {
            optionListKey: "userInfo",
            displayKeys: ["userId"],
            fieldMap: {
                "userId": "userId" 
            }
        }
    }

    
    userSettingsForUpsert: UserSettings = { ...this.emptyUserSettings };
    
    
    constructor(
        private http: HttpClient
    ) { }
    
    
    getUserSettings(
        searchTerm: string,
        userId: number
    ) {
        let apiRoute = "v1/UserSettings/GetUserSettings";
        let searchParams = {
            searchTerm,
            userId
        }
        
        return this.http.post<UserSettings[]>(
            apiRoute,
            searchParams
        ).pipe(map((results: UserSettings[]) => {
            return results;
        }));
    }
    
    getUserSettingsSingle(
        primaryKeyValues: any
    ) {
        let apiRoute = "v1/UserSettings/GetUserSettingsSingle";
        
        return this.http.post<UserSettings>(
            apiRoute,
            primaryKeyValues
        ).pipe(map((results: UserSettings) => {
            return results;
        }));
    }
    
    upsertUserSettings(
        userSettings: UserSettings
    ) {
        let apiRoute = "v1/UserSettings/UpsertUserSettings";
        
        return this.http.post(
            apiRoute,
            userSettings
        ).pipe(map((results: any) => {
            return results;
        }));
    }
    
    deleteUserSettings(
        userSettings: UserSettings
    ) {
        let apiRoute = "v1/UserSettings/DeleteUserSettings";
        
        return this.http.post(
            apiRoute,
            userSettings
        ).pipe(map((results: any) => {
            return results;
        }));
    }  
   
} 
