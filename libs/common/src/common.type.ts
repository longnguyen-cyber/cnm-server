import { PrismaService } from './prisma';

export type Tx = Omit<
  PrismaService,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

export type Res = {
  success: boolean;
  message: string;
  errors: string;
  data?: any;
};
