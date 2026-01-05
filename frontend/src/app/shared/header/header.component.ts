import { Component } from '@angular/core';
import { MenuService } from '../../services/menu-service.service';
import { AuthService } from '../../services/auth-service.service';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [],
    templateUrl: './header.component.html',
    styleUrl: './header.component.css'
})
export class HeaderComponent {
    constructor(
        public menuServ: MenuService,
        public authServ: AuthService
    ) { }
}
