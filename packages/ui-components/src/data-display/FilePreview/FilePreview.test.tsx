import { describe, it, expect } from 'vitest';
import { resolveFileKind, isPreviewable } from './fileKind';

describe('fileKind resolver', () => {
  it('resolves by mime type first', () => {
    expect(resolveFileKind('unknown.txt', 'application/pdf')).toBe('pdf');
    expect(resolveFileKind('report.pdf', 'image/png')).toBe('image');
  });

  it('resolves by extension fallback when mime is absent', () => {
    expect(resolveFileKind('image.PNG')).toBe('image');
    expect(resolveFileKind('video.mp4')).toBe('video');
    expect(resolveFileKind('audio.mp3')).toBe('audio');
    expect(resolveFileKind('document.docx')).toBe('docx');
    expect(resolveFileKind('sheet.XLSX')).toBe('sheet');
    expect(resolveFileKind('data.csv')).toBe('csv');
    expect(resolveFileKind('notes.txt')).toBe('text');
    expect(resolveFileKind('script.ts')).toBe('code');
    expect(resolveFileKind('archive.zip')).toBe('archive');
  });

  it('handles wrong extension, no extension, and uppercase', () => {
    expect(resolveFileKind('noext')).toBe('unknown');
    expect(resolveFileKind('.dotfile')).toBe('unknown');
    expect(resolveFileKind('FILE.PDF')).toBe('pdf');
  });

  it('determines previewability correctly', () => {
    expect(isPreviewable('pdf')).toBe(true);
    expect(isPreviewable('image')).toBe(true);
    expect(isPreviewable('archive')).toBe(false);
    expect(isPreviewable('unknown')).toBe(false);
  });
});
