/**
 * Zone-1 API Provider Registry
 * External API providers for future integrations.
 */

export interface ApiProvider {
  id: string;
  name: string;
  baseUrl: string;
  authType: 'api_key' | 'oauth2' | 'bearer';
  endpoints: Record<string, string>;
  status: 'planned' | 'connected' | 'error';
  description: string;
  website?: string;
  logoUrl?: string;
}

export const API_PROVIDERS: Record<string, ApiProvider> = {
  vimcar: {
    id: 'vimcar',
    name: 'Vimcar Fleet',
    baseUrl: 'https://api.vimcar.com/v1',
    authType: 'api_key',
    endpoints: {
      trips: '/trips',
      vehicles: '/vehicles',
      sync: '/sync',
      mileage: '/mileage',
    },
    status: 'planned',
    description: 'Automatisches Fahrtenbuch & Fuhrpark-Management',
    website: 'https://www.vimcar.de',
    logoUrl: 'https://www.vimcar.de/hubfs/vimcar-logo.svg',
  },
};
