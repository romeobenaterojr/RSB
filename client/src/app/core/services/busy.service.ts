import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BusyService {
  loading = false;
  busyResquestCount =0;
  busy() {
    this.busyResquestCount++;
    this.loading =true;
  }

  idle() {
    this.busyResquestCount--;
    if(this.busyResquestCount <= 0) {
      this.busyResquestCount = 0;
      this.loading =false;
    }
  }
  
}
