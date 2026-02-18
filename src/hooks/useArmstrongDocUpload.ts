/**
 * useArmstrongDocUpload — Upload + Parse documents for Armstrong chat context
 * 
 * Flow: File → Base64 → sot-document-parser → extracted_text → Armstrong advisor
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DocumentContext {
  extracted_text: string;
  filename: string;
  content_type: string;
  confidence: number;
}

interface UseArmstrongDocUploadReturn {
  /** Upload and parse a file, returns extracted document context */
  uploadAndParse: (file: File) => Promise<DocumentContext | null>;
  /** Currently attached document context (ready to send with next message) */
  documentContext: DocumentContext | null;
  /** Clear the attached document */
  clearDocument: () => void;
  /** Is currently uploading/parsing */
  isParsing: boolean;
  /** Error message if parsing failed */
  parseError: string | null;
  /** Attached file info for UI display */
  attachedFile: { name: string; size: number; type: string } | null;
}

const SUPPORTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // For images, keep the full data URL; for others, extract base64
      if (file.type.startsWith('image/')) {
        resolve(result);
      } else {
        // Remove data URL prefix for non-image files
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useArmstrongDocUpload(): UseArmstrongDocUploadReturn {
  const [documentContext, setDocumentContext] = useState<DocumentContext | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: number; type: string } | null>(null);

  const uploadAndParse = useCallback(async (file: File): Promise<DocumentContext | null> => {
    // Validate file type
    if (!SUPPORTED_TYPES.includes(file.type)) {
      setParseError(`Dateityp "${file.type}" wird nicht unterstützt. Erlaubt: PDF, Bilder, DOCX, Excel, CSV.`);
      return null;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setParseError('Datei ist zu groß (max. 10 MB).');
      return null;
    }

    setIsParsing(true);
    setParseError(null);
    setAttachedFile({ name: file.name, size: file.size, type: file.type });

    try {
      // Convert to base64
      const content = await fileToBase64(file);

      // Call sot-document-parser
      const { data, error } = await supabase.functions.invoke('sot-document-parser', {
        body: {
          content,
          contentType: file.type,
          filename: file.name,
          parseMode: 'general',
        },
      });

      if (error) throw new Error(error.message || 'Parser-Fehler');
      if (!data?.success) throw new Error(data?.error || 'Parsing fehlgeschlagen');

      const parsed = data.parsed;
      
      // Build extracted text from parsed data
      let extractedText = '';
      
      if (parsed.data?.raw_text) {
        extractedText = parsed.data.raw_text;
      } else {
        // Build text from structured data
        const parts: string[] = [];
        
        if (parsed.data?.detected_type) {
          parts.push(`Dokumenttyp: ${parsed.data.detected_type}`);
        }
        
        if (parsed.data?.properties?.length) {
          parts.push(`\nImmobilien:\n${JSON.stringify(parsed.data.properties, null, 2)}`);
        }
        
        if (parsed.data?.contacts?.length) {
          parts.push(`\nKontakte:\n${JSON.stringify(parsed.data.contacts, null, 2)}`);
        }
        
        if (parsed.data?.financing?.length) {
          parts.push(`\nFinanzierung:\n${JSON.stringify(parsed.data.financing, null, 2)}`);
        }
        
        extractedText = parts.join('\n') || JSON.stringify(parsed.data, null, 2);
      }

      const ctx: DocumentContext = {
        extracted_text: extractedText,
        filename: file.name,
        content_type: file.type,
        confidence: parsed.confidence || 0.5,
      };

      setDocumentContext(ctx);
      return ctx;
    } catch (err) {
      console.error('[useArmstrongDocUpload] Error:', err);
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setParseError(`Dokument konnte nicht analysiert werden: ${msg}`);
      setAttachedFile(null);
      return null;
    } finally {
      setIsParsing(false);
    }
  }, []);

  const clearDocument = useCallback(() => {
    setDocumentContext(null);
    setAttachedFile(null);
    setParseError(null);
  }, []);

  return {
    uploadAndParse,
    documentContext,
    clearDocument,
    isParsing,
    parseError,
    attachedFile,
  };
}
