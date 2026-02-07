/**
 * FutureRoom.tsx — Re-export of FutureRoomLayout for backward compatibility
 * 
 * This file now simply re-exports the layout component.
 * The actual layout with <Outlet /> is in futureroom/FutureRoomLayout.tsx
 * 
 * Routing is handled via explicit nested routes in ManifestRouter.tsx
 */
export { default } from './futureroom/FutureRoomLayout';

