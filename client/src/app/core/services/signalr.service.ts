import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { Order } from '../../shared/models/order';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SignalrService {
  private hubConnection!: signalR.HubConnection;

  // BehaviorSubject to store the current order
  private orderSource = new BehaviorSubject<Order | null>(null);

  // Expose as Observable for components
  public order$: Observable<Order | null> = this.orderSource.asObservable();

  createHubConnection(email?: string) {
    // 👇 build hub URL using environment
    let url = `${environment.apiUrl}${environment.hubUrl}`;
    if (email) {
      url += `?email=${encodeURIComponent(email)}`;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(url)
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => console.log(`✅ SignalR connected → ${url}`))
      .catch(err => console.error('❌ SignalR connection error:', err));

    this.hubConnection.on('OrderCompleteNotification', (order: Order) => {
      console.log('📦 OrderCompleteNotification received:', order);
      this.orderSource.next(order);
    });
  }

  stopHubConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
      console.log('🛑 SignalR disconnected');
    }
  }

  clearOrder() {
    this.orderSource.next(null);
  }
}
