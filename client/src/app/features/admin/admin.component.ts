import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import { from } from 'rxjs';
import { Order } from '../../shared/models/order';
import { AdminService } from '../../core/services/admin.service';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { OrderParams } from '../../shared/models/orderParams';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {MatLabel, MatSelectChange, MatSelectModule} from '@angular/material/select';
import { CurrencyPipe, DatePipe } from '@angular/common';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatTabsModule} from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { DialogService } from '../../core/services/dialog.service';


@Component({
  selector: 'app-admin',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSelectModule,
    MatTooltipModule,
    MatTabsModule,
    // MatButton,
    MatIcon,
    DatePipe,
    CurrencyPipe
    // MatLabel
    ,
    MatButtonModule,
    RouterLink,
    
],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements  OnInit{
  ngOnInit(): void {
    this.loadOrders();
  }
  dispalyColumns: string[] =['id', 'buyerEmail', 'orderDate', 'status','total', 'action'];
  dataSource = new MatTableDataSource<Order>([]);
  private adminService = inject(AdminService);
  orderParams = new OrderParams();
  private dialogService = inject(DialogService);
  totalItems = 0;
  statusOptions = ['All', 'PaymentReceived', 'PaymentMismatch', 'Refunded', 'Pending'];



  loadOrders() {
    this.adminService.getOrders(this.orderParams).subscribe({
      next: response => {
        if (response.data) {
          this.dataSource.data = response.data;
          this.totalItems = response.count;
        }
      }
    })
  }
  onPageChange(event: PageEvent) {
    this.orderParams.pageNumber = event.pageIndex + 1;
    this.orderParams.pageSize = event.pageSize;
    this.loadOrders();
  }

  onFilterSelect(event: MatSelectChange) {
    this.orderParams.filter = event.value;
    this.orderParams.pageNumber = 1;
    this.loadOrders();
  }

  async openConfirmDiaglog(id: number) {
    const confirmed = await this.dialogService.confirm(
      'Confirm Refund',
      'Are you sure you want to issue this refund? this cannot be undone'

    )

    if (confirmed) this.refundOrder(id);
  } 

  refundOrder(id: number) {
    this.adminService.refundOrder(id).subscribe({
      next: order => {
        this.dataSource.data = this.dataSource.data.map(o => o.id === id ? order : o)
      }
    })
  }
  
}
