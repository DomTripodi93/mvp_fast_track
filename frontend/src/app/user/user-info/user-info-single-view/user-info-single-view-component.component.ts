
import { Component, Input, OnInit } from '@angular/core';
import { UserInfoService } from '../../../services/settings/user-info-service.service';
import { UserInfo } from '../../../models/settings/user-info.model';
import { AuthService } from '../../../services/auth-service.service';
import { HelperService } from '../../../services/helper-service.service';
import { UserSettings } from '../../../models/settings/user-settings.model';
import { UserSettingsService } from '../../../services/settings/user-settings-service.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';

@Component({
    selector: 'app-user-info-single-view',
    standalone: true,
    imports: [
    ],
    templateUrl: './user-info-single-view-component.component.html',
    styleUrl: '../user-info-component.component.css'
})
export class UserInfoSingleViewComponent implements OnInit {
    @Input() selectedUserInfo: UserInfo = {
        ... this.userInfoServ.emptyUserInfo
    };

    @Input() selectedUserSettings: UserSettings = {
        ... this.userSettingsServ.emptyUserSettings
    };

    @Input() hasKids: boolean = false;
    @Input() kidsAreIn: string[] = []

    constructor(
        public userInfoServ: UserInfoService,
        public auth: AuthService,
        public userSettingsServ: UserSettingsService,
        public helperServ: HelperService,
        private sanitizer: DomSanitizer
    ) { }

    ngOnInit(): void {
        // this.setHasKids();
    }

    formatIntroText(text: string | SafeHtml): SafeHtml {
        // text = text.split('font').join('div').split('style=\"').join('style=\"display:inline-block;');
        // console.log(text);
        text = text.toString().split("size=\"3\"").join("style=\"font-size:12px;display:inline-block;\"")

        text = DOMPurify.sanitize(
            text.toString(),
            {
                ALLOWED_TAGS: [
                    'div',
                    'span',
                    'font',
                    'br'
                ],
                ALLOWED_ATTR: [
                    'style',
                    'color',
                    'size',
                    'background-color'
                ]
            }
        );

        text = this.sanitizer.bypassSecurityTrustHtml(text.toString());

        return text;
    }

    formatKidsAreIn(): string {
        return this.kidsAreIn.length <= 1
            ? this.kidsAreIn.join('')
            : this.kidsAreIn.slice(0, -1).join(', ') 
                + ' and ' 
                + this.kidsAreIn.slice(-1)[0];
    }

}


