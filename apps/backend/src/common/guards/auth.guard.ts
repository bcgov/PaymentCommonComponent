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
import { PUBLIC_ENDPOINT } from './../decorators/publicEndpoint.decorator';

/**
 * AuthGuard
 * Globally applied guard to ensure that a valid client id and secret are passed into each request
 * Uses basic auth to accept the id and secret
 */
@Injectable()
export class AuthGuard implements CanActivate {
  axiosInstance: AxiosInstance;

  constructor(private readonly reflector: Reflector) {
    this.axiosInstance = axios.create({
      baseURL: process.env.AUTH_BASE_URL,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Bypass auth for public endpoint
    const publicEndpoint = this.reflector.getAllAndOverride<boolean>(
      PUBLIC_ENDPOINT,
      [context.getHandler(), context.getClass()]
    );
    if (publicEndpoint) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const credentials = this.extractAuthClientCredentials(req);
    try {
      // make request to api
      const authResponse = await this.axiosInstance.post(
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

  /**
   * Extracts a client id and secret from basic auth passed into the request
   * @param request Express Request
   * @returns { clientId: string, clientSecret: string } extracted from request
   */
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

  /**
   * Decodes a jwt and throws errors for issues on the token
   * Checks issuer, audience, and role
   * @param token string
   */
  validateToken(token: string) {
    const decoded = jwt.decode(token);
    if (!decoded) {
      throw new UnauthorizedException('Invalid JWT returned from Auth Client');
    }
    const payload = decoded as jwt.JwtPayload;
    if (payload.iss !== process.env.AUTH_BASE_URL) {
      throw new UnauthorizedException(
        'Incorrect issuer returned from Auth Client'
      );
    }

    if (payload.aud !== 'ap-payment-authorization-dev') {
      throw new UnauthorizedException(
        'Incorrect Audience returned from Auth Client'
      );
    }

    // Error if no roles. Expand this for RBAC
    if (
      !payload['resource_access']?.['ap-payment-authorization-dev']?.roles
        ?.length
    ) {
      throw new ForbiddenException('Invalid roles for user');
    }
  }
}
