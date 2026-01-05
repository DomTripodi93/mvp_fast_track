import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './shared/auth-guard.gaurd';
import { UserInfoSingleComponent } from './user/user-info/user-info-single/user-info-single-component.component';

// //FeedbackComponents
// import { CustomerFeedbackComponent } from './feedback/customer-feedback/customer-feedback-component.component';
// import { CustomerRequestComponent } from './feedback/customer-request/customer-request-component.component';
// import { CustomerTicketComponent } from './feedback/customer-ticket/customer-ticket-component.component';
// //ChatComponents
// import { ChatMessageComponent } from './chat/chat-message/chat-message-component.component';
// import { EncryptedPrivateKeysForTransferComponent } from './chat/encrypted-private-keys-for-transfer/encrypted-private-keys-for-transfer-component.component';
// import { PubKeysComponent } from './chat/pub-keys/pub-keys-component.component';
// import { EmergencyKeysComponent } from './chat/emergency-keys/emergency-keys-component.component';
// //UserComponents
// import { UserSettingsComponent } from './settings/user-settings/user-settings-component.component';
// import { UserInfoComponent } from './settings/user-info/user-info-component.component';
// import { UserConnectionComponent } from './user/user-connection/user-connection-component.component';


export const routes: Routes = [
    { path: "login", component: LoginComponent },
    // {path: "register", component: RegisterComponent},
    {
        path: "", canActivate: [authGuard], children: [
            //FeedbackComponents
            // { path: "customer-ticket", component: CustomerTicketComponent, pathMatch: "full" },
            // { path: "customer-request", component: CustomerRequestComponent, pathMatch: "full" },
            // { path: "customer-feedback", component: CustomerFeedbackComponent, pathMatch: "full" },
            
            // //ChatComponents
            // { path: "emergency-keys", component: EmergencyKeysComponent, pathMatch: "full" },
            // { path: "pub-keys", component: PubKeysComponent, pathMatch: "full" },
            // { path: "encrypted-private-keys-for-transfer", component: EncryptedPrivateKeysForTransferComponent, pathMatch: "full" },
            // { path: "chat-message", component: ChatMessageComponent, pathMatch: "full" },
            // //UserComponents
            { path: "profile", component: UserInfoSingleComponent, pathMatch: "full" },
            // { path: "user-info", component: UserInfoComponent, pathMatch: "full" },
            // { path: "user-settings", component: UserSettingsComponent, pathMatch: "full" },
            // { path: "user-connection", component: UserConnectionComponent, pathMatch: "full" },
            //FullCustomComponents
            { path: "**", redirectTo: "profile" },
        ]
    },
    { path: "", redirectTo: "login", pathMatch: "full" },
    { path: "**", redirectTo: "login" }
]
