import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-test-error',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './test-error.component.html',
  styleUrls: ['./test-error.component.scss']
})
export class TestErrorComponent {
  private http = inject(HttpClient);

  baseUrl = environment.apiUrl;
  validationErrors?: string[];

  get404Error() {
    this.http.get(this.baseUrl + 'buggy/notfound').subscribe({
      next: res => console.log('404 test success:', res),
      error: (err: HttpErrorResponse) => console.error('404 error:', err)
    });
  }

  get400Error() {
    this.http.get(this.baseUrl + 'buggy/badrequest').subscribe({
      next: res => console.log('400 test success:', res),
      error: (err: HttpErrorResponse) => console.error('400 error:', err)
    });
  }

  get401Error() {
    this.http.get(this.baseUrl + 'buggy/unauthorized').subscribe({
      next: res => console.log('401 test success:', res),
      error: (err: HttpErrorResponse) => console.error('401 error:', err)
    });
  }

  get500Error() {
    this.http.get(this.baseUrl + 'buggy/internalerror').subscribe({
      next: res => console.log('500 test success:', res),
      error: (err: HttpErrorResponse) => console.error('500 error:', err)
    });
  }

get400ValidationError() {
  this.validationErrors = []; // reset before new request
  this.http.post(this.baseUrl + 'buggy/validationerror', {}).subscribe({
    next: res => console.log('Validation test success:', res),
    error: (err: HttpErrorResponse) => {
      if (err.error?.errors) {
        // flatten and cast to string[]
        this.validationErrors = Object.values(err.error.errors).flat() as string[];
      } else {
        console.error('Validation error response:', err);
      }
    }
  });
}
}
