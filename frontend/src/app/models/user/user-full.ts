import { UserInfo } from "../settings/user-info.model";
import { UserSettings } from "../settings/user-settings.model";


export interface UserFull {
    userSettings: UserSettings;
    userInfo: UserInfo;
}
