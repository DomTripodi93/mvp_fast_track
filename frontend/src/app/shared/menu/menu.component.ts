import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MenuService } from '../../services/menu-service.service';
import { NgClass } from '@angular/common';
import { state, style, transition, animate, trigger } from '@angular/animations';
import { AuthService } from '../../services/auth-service.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [NgClass],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css',
  animations: [
    // trigger('fadeInOut', [
    //   transition(':enter', [  // When the element is added to the DOM
    //     style({ opacity: 0 }),
    //     animate('1000ms ease-in', style({ opacity: 1 }))
    //   ]),
    //   transition(':leave', [  // When the element is removed from the DOM
    //     animate('500ms ease-out', style({ opacity: 0 }))
    //   ])
    // ]),
    trigger('accordionAnimation', [
      state('void', style({ height: '0px', opacity: 0, overflow: 'hidden' })),
      state('*', style({ height: '*', opacity: 1, overflow: 'hidden' })),
      transition('void <=> *', animate('300ms ease-in-out')),
    ])
  ]
})
export class MenuComponent {
  dayOfMonth = new Date().getDate();
  
  constructor(
    private router: Router,
    public menuService: MenuService,
    public auth: AuthService
  ) { }

  contextClick() {
    this.menuService.contextClicked = true;
    setTimeout(() => {
      this.menuService.contextClicked = false;
    }, 20)
  }
}
