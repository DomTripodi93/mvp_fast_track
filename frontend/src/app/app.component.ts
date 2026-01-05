import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuComponent } from './shared/menu/menu.component';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { MenuService } from './services/menu-service.service';
import { SettingsService } from './services/settings-service.service';
import { AuthService } from './services/auth-service.service';
import { OptionService } from './services/option-service.service';
import { CustomConfirmComponent } from './elements/custom-confirm/custom-confirm.component';
import { HelperService } from './services/helper-service.service';

@Component({
    selector: 'app-root',
    imports: [
        RouterOutlet,
        MenuComponent,
        HeaderComponent,
        FooterComponent,
        CustomConfirmComponent
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent {
    title: string = 'Tethee';

    constructor(
        public menuService: MenuService,
        public authServ: AuthService,
        public settingsService: SettingsService,
        public optionServ: OptionService,
        public helperServ: HelperService
    ) { }

    ngOnInit(): void {
        this.onResize();
        this.subscribeAuthChanged();
        this.checkAuth();
        this.optionServ.subscribeOptionsHaveChanged();
    }

    subscribeAuthChanged() {
        this.authServ.authChanged.subscribe(() => {
            if (this.authServ.isAuthenticated) {
                this.optionServ.seedAllOptions();
            }
        })
    }

    checkAuth() {
        this.authServ.checkLoggedIn()
    }

    @HostListener("document:click")
    closeContextMenu() {
        if (this.menuService.menuVisible) {
            setTimeout(() => {
                if (!this.menuService.contextClicked) {
                    this.menuService.toggleMenu(false);
                }
            }, 10)
        }
    }

    @HostListener('window:resize')
    onResize() {
        if (window.innerWidth < 800) {
            this.settingsService.isMobileView = true;
            this.settingsService.videoHeight = `${window.innerWidth * 0.6}px`;
            this.settingsService.videoWidth = `${window.innerWidth * 0.9}px`;

        } else if (window.innerWidth > 800 && window.innerWidth <= 1500) {
            this.settingsService.isMobileView = false;
            this.settingsService.videoHeight = `${window.innerWidth * 0.4}px`;
            this.settingsService.videoWidth = `${window.innerWidth * 0.6}px`;
        }
        else if (window.innerWidth > 1500) {
            this.settingsService.isMobileView = false;
            this.settingsService.videoWidth = "900px";
            this.settingsService.videoHeight = "550px";
        }
    }
}
