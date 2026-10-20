import { describe, it, expect } from 'vitest';
import { validateFile, ImportError } from '../src/lib/import';

describe('validateFile', () => {
  const MB = 1024 * 1024;

  it('accepts .txt files', () => {
    expect(validateFile('notes.txt', 'text/plain', 100)).toBe('txt');
  });

  it('accepts .md files', () => {
    expect(validateFile('readme.md', 'text/markdown', 100)).toBe('md');
  });

  it('accepts .docx files', () => {
    expect(validateFile(
      'doc.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      100
    )).toBe('docx');
  });

  it('rejects unsupported extension', () => {
    expect(() => validateFile('image.png', 'image/png', 100))
      .toThrow(ImportError);
  });

  it('rejects .pdf extension', () => {
    expect(() => validateFile('file.pdf', 'application/pdf', 100))
      .toThrow(ImportError);
  });

  it('rejects files over 2 MB', () => {
    expect(() => validateFile('big.txt', 'text/plain', 3 * MB))
      .toThrow(ImportError);
  });

  it('accepts files exactly at 2 MB limit', () => {
    expect(validateFile('exact.txt', 'text/plain', 2 * MB)).toBe('txt');
  });

  it('throws UNSUPPORTED_TYPE with the right code', () => {
    try {
      validateFile('file.exe', 'application/octet-stream', 100);
    } catch (e) {
      expect(e).toBeInstanceOf(ImportError);
      expect((e as ImportError).code).toBe('UNSUPPORTED_TYPE');
    }
  });

  it('throws TOO_LARGE with the right code', () => {
    try {
      validateFile('big.md', 'text/markdown', 3 * MB);
    } catch (e) {
      expect(e).toBeInstanceOf(ImportError);
      expect((e as ImportError).code).toBe('TOO_LARGE');
    }
  });
});
