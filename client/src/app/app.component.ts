import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { SignalrService } from './core/services/signalr.service';
import { AccountService } from './core/services/account.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  protected readonly title = 'RSB';

  constructor(
    private readonly signalrService: SignalrService,
    private readonly accountService: AccountService
  ) {}

  ngOnInit(): void {
    console.log('👤 Checking user info...');

    this.accountService.getUserInfo().subscribe({
      next: user => {
        if (user) {
          console.log('👤 User loaded, starting SignalR connection...');
          this.signalrService.createHubConnection(user.email);
        } else {
          console.log('⚠️ No user found, skipping SignalR connection.');
        }
      },
      error: err => {
        console.error('❌ Failed to load user info:', err);
      }
    });
  }
}
