import { FastifyRequest } from 'fastify';

export type AuthPayload = {
  address: string;
  tgId: string;
};

export type RequestWithAuth = FastifyRequest & AuthPayload;