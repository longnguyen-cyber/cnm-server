/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { Empty } from './empty';

export interface ChannelCreateDto {
  name: string;
  isPublic: boolean;
  userCreated: string;
}

export interface Channel {
  id: string;
  name: string;
  isPublic: boolean;
  userCreated: string;
  userId: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Channels {
  channels: Channel[];
}

export interface FindChannel {
  id: string;
}

export interface ChannelUpdateDto {
  id: string;
  name: string;
  isPublic: boolean;
}
export interface AddUserToChannelDto {
  users: string[];
  channelId: string;
}

export interface RemoveUserFromChannelDto extends AddUserToChannelDto {}

export const CHANNEL_PACKAGE_NAME = 'channel';

export interface ChannelServiceClient {
  createChannel(request: ChannelCreateDto): Observable<Channel>;

  updateChannel(request: ChannelUpdateDto): Observable<Channel>;

  deleteChannel(request: FindChannel): Observable<Channel>;

  getAllChannels(request: Empty): Observable<Channels>;

  getChannelById(request: FindChannel): Observable<Channel>;

  addUserToChannel(request: AddUserToChannelDto): Observable<Channel>;

  removeUserFromChannel(request: RemoveUserFromChannelDto): Observable<Channel>;
}

export interface ChannelServiceController {
  createChannel(
    request: ChannelCreateDto,
  ): Promise<Channel> | Observable<Channel> | Channel;

  updateChannel(
    request: ChannelUpdateDto,
  ): Promise<Channel> | Observable<Channel> | Channel;

  deleteChannel(
    request: FindChannel,
  ): Promise<Channel> | Observable<Channel> | Channel;

  getAllChannels(
    request: Empty,
  ): Promise<Channels> | Observable<Channels> | Channels;

  getChannelById(
    request: FindChannel,
  ): Promise<Channel> | Observable<Channel> | Channel;

  addUserToChannel(
    request: AddUserToChannelDto,
  ): Promise<Channel> | Observable<Channel> | Channel;

  removeUserFromChannel(
    request: RemoveUserFromChannelDto,
  ): Promise<Channel> | Observable<Channel> | Channel;
}

export function ChannelServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = [
      'getAllChannels',
      'getChannelById',
      'createChannel',
      'updateChannel',
      'deleteChannel',
      'addUserToChannel',
      'removeUserFromChannel',
    ];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcMethod('ChannelService', method)(
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
      GrpcStreamMethod('ChannelService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
}

export const CHANNEL_SERVICE_NAME = 'ChannelService';
