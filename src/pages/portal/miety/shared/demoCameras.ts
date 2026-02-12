/**
 * Demo camera data for Miety SmartHome showcase.
 * DEMO-MODE: These are intentional showcase entries displayed when no
 * real Eufy account is connected. Once eufy-connect is active, this
 * file should be replaced by live camera data from miety_eufy_accounts.
 */
import camEntrance from '@/assets/miety/cam-entrance.jpg';
import camGarden from '@/assets/miety/cam-garden.jpg';
import camIndoor from '@/assets/miety/cam-indoor.jpg';

export const demoCameras = [
  { id: 'cam-1', name: 'Eingang', status: 'online' as const, image: camEntrance },
  { id: 'cam-2', name: 'Garten', status: 'online' as const, image: camGarden },
  { id: 'cam-3', name: 'Innen', status: 'offline' as const, image: camIndoor },
];
