import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from "./layout/header/header.component";
import { HttpClient } from '@angular/common/http';
import { Product } from './shared/models/product';
import { Pagination } from './shared/models/pagination';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent], 
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent  implements OnInit{
 
  baseUrl = 'https://localhost:5001/api/'
  private http = inject(HttpClient)
  protected title = 'RSB';
  products : Product[] = [];

  
   ngOnInit(): void {
     this.http.get<Pagination<Product>>(this.baseUrl + 'products').subscribe({
     next: response => this.products = response.data, 
     complete: () => console.log('complete')
  });

  }


}
