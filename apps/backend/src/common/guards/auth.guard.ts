import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import axios, { AxiosInstance } from 'axios';
import { Request } from 'express';
import jwt from 'jsonwebtoken';

let axiosInstance: AxiosInstance;

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {
    axiosInstance = axios.create({
      baseURL: process.env.AUTH_BASE_URL,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const credentials = this.extractAuthClientCredentials(req);
    try {
      // make request to api
      const authResponse = await axiosInstance.post(
        '/protocol/openid-connect/token',
        {
          grant_type: 'client_credentials',
          scopes: 'openid',
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
        }
      );
      const token = authResponse.data.access_token;
      // check returned token for AUD, role
      this.validateToken(token);
      return true;
    } catch (error) {
      return false;
    }
  }

  extractAuthClientCredentials(request: Request): {
    clientId: string;
    clientSecret: string;
  } {
    if (
      !request.headers.authorization ||
      !request.headers.authorization.includes('Basic ')
    ) {
      throw new UnauthorizedException('Unauthorized user without credentials');
    }
    const combinedCredentials = Buffer.from(
      request.headers.authorization.split(' ')[1],
      'base64'
    ).toString();
    if (!combinedCredentials.includes(':')) {
      throw new UnauthorizedException(
        'Unauthorized user, incorrectly formatted credentials'
      );
    }
    const clientId = combinedCredentials.split(':')[0];
    const clientSecret = combinedCredentials.split(':')[1];
    return { clientId, clientSecret };
  }

  validateToken(token: string) {
    const decoded = jwt.decode(token);
    if (!decoded) {
      throw new UnauthorizedException('Invalid JWT returned from Auth Client');
    }
    const payload = decoded as jwt.JwtPayload;
    if (payload.iss !== 'https://dev.loginproxy.gov.bc.ca/auth/realms/apigw') {
      throw new UnauthorizedException(
        'Incorrect issuer returned from Auth Client'
      );
    }
    if (payload.aud !== 'ap-payment-authorization-dev') {
      throw new UnauthorizedException(
        'Incorrect Audience returned from Auth Client'
      );
    }
    if (
      !payload['resource_access']?.['ap-payment-authorization-dev']?.roles
        ?.length
    ) {
      throw new ForbiddenException('Invalid roles for user');
    }
  }
}
