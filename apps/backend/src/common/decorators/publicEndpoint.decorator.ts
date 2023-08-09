import { SetMetadata } from '@nestjs/common';

export const PUBLIC_ENDPOINT = 'public';

// Use this decorator @Public() to declare a public endpoint and bypass auth
export const Public = () => SetMetadata(PUBLIC_ENDPOINT, true);
