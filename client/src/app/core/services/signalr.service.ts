import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { Order } from '../../shared/models/order';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SignalrService {
  private hubConnection!: signalR.HubConnection;

  // Holds the latest order received
  private orderSource = new BehaviorSubject<Order | null>(null);
  public order$: Observable<Order | null> = this.orderSource.asObservable();

  createHubConnection(email?: string) {
    // ✅ Use your local SignalR hub URL from environment
    let hubUrl = environment.hubUrl;
    if (email) {
      hubUrl += `?email=${encodeURIComponent(email)}`;
    }

    console.log(`🔗 Connecting to SignalR hub → ${hubUrl}`);

    // ✅ Configure SignalR connection for local development
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        withCredentials: true, // Allow cookies/credentials when running locally
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // ✅ Start connection
    this.hubConnection
      .start()
      .then(() => console.log(`✅ Connected to SignalR hub at ${hubUrl}`))
      .catch(err => console.error('❌ SignalR connection error:', err));

    // ✅ Listen for "OrderCompleteNotification"
    this.hubConnection.on('OrderCompleteNotification', (order: Order) => {
      console.log('📦 OrderCompleteNotification received:', order);
      this.orderSource.next(order);
    });
  }

  stopHubConnection() {
    if (this.hubConnection) {
      this.hubConnection
        .stop()
        .then(() => console.log('🛑 SignalR connection stopped'))
        .catch(err => console.error('⚠️ Error stopping SignalR:', err));
    }
  }

  clearOrder() {
    this.orderSource.next(null);
  }
}
