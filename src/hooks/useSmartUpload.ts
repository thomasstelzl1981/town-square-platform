/**
 * useSmartUpload — DEPRECATED. Re-exports useUniversalUpload.
 *
 * All new upload code MUST use useUniversalUpload directly.
 * This file exists only for backwards compatibility.
 *
 * @see useUniversalUpload for the canonical 2-Phase Upload Contract.
 */
export { useUniversalUpload as useSmartUpload } from './useUniversalUpload';
export type {
  UniversalUploadOptions as SmartUploadOptions,
  UniversalUploadResult as SmartUploadResult,
  UploadProgress,
  UploadStatus,
} from './useUniversalUpload';
