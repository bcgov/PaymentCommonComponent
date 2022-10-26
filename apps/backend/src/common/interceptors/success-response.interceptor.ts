/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SuccessResponse } from '../ro/success-response.ro';

export class SuccessResponseInterceptor implements NestInterceptor {
  /**
   * Interceptors do not have a global ignore
   * nor a decorator to ignore certain routes,
   * this array serves as a black list.
   */
  private static ignoreRoutes: string[] = [];

  /**
   * Check if the response body already contains a valid data field and returns it accordingly
   *
   * @param responseBody: The object returned by a controller
   * @returns the response body as a SuccessResponse
   */
  getContainedSuccessResponse(responseBody: object): SuccessResponse | null {
    const successResponse = responseBody as SuccessResponse;
    if (successResponse && successResponse.data) {
      return successResponse;
    }
    return null;
  }
  /**
   * Wrap the response body in the data key
   * or return the response body if it is already a SuccessResponse
   *
   * @param responseBody: The object returned by a controller
   * @returns the response body as a SuccessResponse
   */
  transformSuccess(responseBody: object): SuccessResponse {
    const containedSuccessResponse = this.getContainedSuccessResponse(responseBody);
    if (containedSuccessResponse) {
      return containedSuccessResponse;
    }
    return { data: responseBody || {} };
  }
  /**
   * Wraps a controller method. It calls the controller method
   * and transforms the response accordingly.
   *
   * @param context: The execution context of a controller method
   * @param next: The function which will be called next in the method chain
   * @returns The call handler for the controller execution
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    /** Ignore transform on ignore routes[] */
    const request = context.switchToHttp().getRequest();
    const url = request.originalUrl;
    if (SuccessResponseInterceptor.ignoreRoutes.includes(url)) {
      return next.handle();
    }

    return next.handle().pipe(map(responseBody => this.transformSuccess(responseBody)));
  }
}
