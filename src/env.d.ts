/// <reference types="astro/client" />

declare namespace Astro {
  interface Locals {
    user?: {
      id: string;
      email: string;
      name: string;
      role: 'owner' | 'admin' | 'analyst' | 'viewer';
    };
    company?: {
      id: string;
      name: string;
      industry: string | null;
      region: string | null;
      apiTicket: string | null;
    };
  }
}
