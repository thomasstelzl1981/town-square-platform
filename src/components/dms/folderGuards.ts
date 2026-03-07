/**
 * folderGuards — SSOT for folder mutability
 * 
 * Determines which folders can be renamed, deleted, or moved.
 * System folders, root folders, and entity dossier roots are immutable.
 */

const IMMUTABLE_TEMPLATES = [
  'PROPERTY_DOSSIER_V1',
  'VEHICLE_DOSSIER_V1',
  'LISTING_DOSSIER_V1',
  'TRASH_ROOT',
];

export interface FolderGuardNode {
  node_type: string;
  template_id: string | null;
}

/**
 * Returns true if the folder can be renamed, deleted, or moved (as source).
 * Immutable folders: system nodes, *_ROOT templates, entity dossier roots, trash.
 */
export function isFolderMutable(node: FolderGuardNode): boolean {
  if (node.node_type === 'system') return false;
  if (node.template_id?.endsWith('_ROOT')) return false;
  if (node.template_id && IMMUTABLE_TEMPLATES.includes(node.template_id)) return false;
  return true;
}

/**
 * Convenience: check from FileManagerItem-like shape
 */
export function isItemMutable(item: { type: string; nodeType?: string; templateId?: string }): boolean {
  if (item.type !== 'folder') return true; // files are always mutable
  return isFolderMutable({
    node_type: item.nodeType || 'folder',
    template_id: item.templateId || null,
  });
}
