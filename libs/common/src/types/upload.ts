/* eslint-disable @typescript-eslint/ban-types */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';

export const protobufPackage = 'upload';

export const UPLOAD_PACKAGE_NAME = 'upload';

export interface Upload {
  fileName: string;
  file: Buffer;
}

export interface Empty {}

export interface Update {
  fileName: string;
  file: Buffer;
  oldFileName: string;
}

export interface Delete {
  fileName: string;
}

export interface Uploads {
  uploads: Upload[];
}

export interface Deletes {
  deletes: Delete[];
}
export interface UploadServiceClient {
  upload(request: Upload): Observable<Empty>;
  update(request: Update): Observable<Empty>;
  delete(request: Delete): Observable<Empty>;
  uploads(request: Uploads): Observable<Empty>;
  deletes(request: Deletes): Observable<Empty>;
}

export interface UploadServiceController {
  upload(request: Upload): Promise<Empty> | Observable<Empty> | Empty;
  update(request: Update): Promise<Empty> | Observable<Empty> | Empty;
  delete(request: Delete): Promise<Empty> | Observable<Empty> | Empty;
  uploads(request: Uploads): Promise<Empty> | Observable<Empty> | Empty;
  deletes(request: Deletes): Promise<Empty> | Observable<Empty> | Empty;
}

export function UploadServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = [
      'upload',
      'update',
      'delete',
      'uploads',
      'deletes',
    ];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcMethod('UploadService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcStreamMethod('UploadService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
}

export const UPLOAD_SERVICE_NAME = 'UploadService';
