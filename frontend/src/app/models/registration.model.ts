import { Encryptable } from "./encryptable.model";
import { UserInfo } from "./settings/user-info.model";
import { UserSettings } from "./settings/user-settings.model";

export interface Registration {
    userSettings: UserSettings;
    userInfo: UserInfo;
    encryptedAuth: Encryptable
}
