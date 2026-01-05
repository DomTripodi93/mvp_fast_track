
import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Subject } from "rxjs";
import { UserInfo } from "../../models/settings/user-info.model";
import { ZipCodeInfo } from "../../models/zip-code/zip-code-info.model";
import { UserFull } from "../../models/user/user-full";
import { UserSettings } from "../../models/settings/user-settings.model";
import { ImageUpload } from "../../models/image-upload.model";


@Injectable({ providedIn: 'root' })
export class UserInfoService {
    userInfosHaveChanged: Subject<void> = new Subject<void>();
    userInfoSelectionHaveChanged: Subject<void> = new Subject<void>();


    userInfoList: UserInfo[] = [];

    emptyUserInfo: UserInfo = {
        userId: 0,
        emailAddress: "",
        phoneNumber: "",
        firstName: "",
        lastName: "",
        displayName: "",
        zipCode: "",
        userAddress: "",
        userCountry: "United States",
        userCity: "",
        userState: "",
        introText: "",
        birthday: null,
        pronouns: "",
        sexualOrientation: "",
        religion: "",
        politicalAffiliation: "",
        ethnicity: "",
        ethnicitySub: "",
        profilePicture: "",
        lastAccessedDate: new Date(),
        isActive: true,
        insertDate: new Date(),
        updateDate: new Date(),
        isVerifiedEmail: false,
        isVerifiedIdentity: false
    }



    userInfoForUpsert: UserInfo = { ...this.emptyUserInfo };


    constructor(
        private http: HttpClient
    ) { }

    getUserInfo(
        searchTerm: string,

    ) {
        let apiRoute = "v1/UserInfo/GetUserInfo";
        let searchParams = {
            searchTerm,

        }

        return this.http.post<UserInfo[]>(
            apiRoute,
            searchParams
        ).pipe(map((results: UserInfo[]) => {
            return results;
        }));
    }

    getUserInfoSingle(
        selectedUserId: number
    ) {
        let apiRoute = "v1/UserInfo/GetUserInfoSingle";
        let searchParams = {
            userId: selectedUserId
        }

        return this.http.post<UserFull>(
            apiRoute,
            searchParams
        ).pipe(map((results: UserFull) => {
            return results;
        }));
    }

    getMyUserInfo() {
        let apiRoute = "v1/UserInfo/GetMyUserInfo";

        return this.http.get<UserFull>(
            apiRoute
        ).pipe(map((results: UserFull) => {
            return results;
        }));
    }

    getCityStateFromZip(zipCode: string) {
        let apiRoute = "v1/UserInfo/GetZipCodeInfo";
        let searchParams = {
            zipCode,
        }

        return this.http.post<ZipCodeInfo[]>(
            apiRoute,
            searchParams
        ).pipe(map((results: ZipCodeInfo[]) => {
            return results;
        }));

    }


    upsertUserInfo(
        userInfo: UserInfo,
        userSettings: UserSettings
    ) {
        let apiRoute = "v1/UserInfo/UpsertUserInfo";
        let userInfoFull: UserFull = {
            userInfo: userInfo,
            userSettings: userSettings
        }

        // console.log(userInfoFull);

        return this.http.post(
            apiRoute,
            userInfoFull
        ).pipe(map((results: any) => {
            return results;
        }));
    }

    deleteUserInfo(
        userInfo: UserInfo
    ) {
        let apiRoute = "v1/UserInfo/DeleteUserInfo";

        return this.http.post(
            apiRoute,
            userInfo
        ).pipe(map((results: any) => {
            return results;
        }));
    }

    updateProPic(
        imageUpload: ImageUpload,
        cropped: boolean = false
    ) {
        let apiRoute = "v1/Images/UploadProPic/" + cropped;

        return this.http.post(
            apiRoute,
            imageUpload
        ).pipe(map((results: any) => {
            return results;
        }));
    }

} 
