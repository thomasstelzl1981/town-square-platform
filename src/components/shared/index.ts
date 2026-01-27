// Shared UI Components for Zone 2 Modules
export { DataTable, type Column } from './DataTable';
export { FormSection, FormField, FormInput, FormTextarea, FormRow } from './FormSection';
export { DetailDrawer } from './DetailDrawer';
export { FileUploader, FilePreview } from './FileUploader';
export { StatusBadge, StatusDot } from './StatusBadge';
export { EmptyState, EmptyDocuments, EmptyContacts, EmptyProperties, EmptyFolder } from './EmptyState';
export { SubTabNav } from './SubTabNav';
export { SenderSelector, type SenderOption } from './SenderSelector';
export { CreateContextDialog } from './CreateContextDialog';
export { AddBankAccountDialog } from './AddBankAccountDialog';
export { 
  PropertyTable, 
  PropertyCodeCell, 
  PropertyAddressCell, 
  PropertyCurrencyCell,
  PropertyStatusCell,
  type PropertyTableColumn,
  type PropertyTableProps,
  type PropertyTableEmptyState 
} from './PropertyTable';
