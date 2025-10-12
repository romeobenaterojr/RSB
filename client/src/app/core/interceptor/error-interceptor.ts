import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SnackbarService } from '../services/snackbar.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const snackbar = inject(SnackbarService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      let message = 'An unexpected error occurred';

      if (err.error) {
        if (typeof err.error === 'string') {
          message = err.error;
        } else if (err.error.title) {
          message = err.error.title;
        } else if (err.error.errors) {
          // ✅ Skip snackbar here → let component handle it
          return throwError(() => err);
        } else if (err.message) {
          message = err.message;
        }
      }

      switch (err.status) {
        case 400:
          snackbar.error(message);
          break;

        case 401:
          snackbar.error(message || 'Unauthorized');
          break;
        case 403:
          snackbar.error(message || 'Forbidden');
          break;

        case 404:
          router.navigateByUrl('/not-found');
          break;

        case 500:
          const navigationExtras: NavigationExtras = {state: {error: err.error}}
          router.navigateByUrl('/server-error', navigationExtras);
          break;

        default:
          snackbar.error(message);
          break;
      }

      return throwError(() => err);
    })
  );
};
