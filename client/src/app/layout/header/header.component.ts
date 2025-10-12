import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Needed for *ngIf
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { BusyService } from '../../core/services/busy.service';
import { CartService } from '../../core/services/cart.service';
import { AccountService } from '../../core/services/account.service';
import { IsAdmin } from '../../shared/directives/is-admin';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,      
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatProgressBarModule,
    MatMenuModule,
    MatDividerModule,
    IsAdmin
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'] // Correct plural
})
export class HeaderComponent {
  busyServices = inject(BusyService);
  carService = inject(CartService);
  accountService = inject(AccountService);
  private router = inject(Router);

  logout() {
    this.accountService.logout().subscribe({
      next: () => {
        this.accountService.currentUser.set(null);
        this.router.navigateByUrl('/');
      }
    });
  }
}
