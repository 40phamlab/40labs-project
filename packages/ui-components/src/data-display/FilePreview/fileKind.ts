export type FileKind =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'docx'
  | 'sheet'
  | 'csv'
  | 'text'
  | 'code'
  | 'archive'
  | 'slides'
  | 'legacy-office'
  | 'unknown';

export function resolveFileKind(fileName: string, mimeType?: string): FileKind {
  if (mimeType) {
    const mime = mimeType.toLowerCase().trim();
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime === 'application/pdf') return 'pdf';
    if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
    if (mime === 'application/msword' || mime.includes('wordprocessing')) return 'legacy-office';
    if (mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || mime === 'application/vnd.ms-excel') return 'sheet';
    if (mime === 'text/csv' || mime === 'application/csv') return 'csv';
    if (mime === 'application/json' || mime === 'text/json' || mime.includes('javascript') || mime === 'text/html' || mime === 'text/css' || mime === 'application/xml') return 'code';
    if (mime.startsWith('text/')) return 'text';
    if (mime.includes('zip') || mime.includes('tar') || mime.includes('compressed') || mime.includes('gzip')) return 'archive';
    if (mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || mime.includes('presentation')) return 'slides';
  }

  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1 || lastDot === fileName.length - 1) return 'unknown';
  const ext = fileName.slice(lastDot + 1).toLowerCase();

  switch (ext) {
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'svg':
    case 'bmp':
    case 'ico':
      return 'image';
    case 'mp4':
    case 'webm':
    case 'ogg':
    case 'mov':
    case 'avi':
      return 'video';
    case 'mp3':
    case 'wav':
    case 'm4a':
    case 'aac':
    case 'flac':
      return 'audio';
    case 'pdf':
      return 'pdf';
    case 'docx':
      return 'docx';
    case 'doc':
    case 'dot':
      return 'legacy-office';
    case 'xlsx':
    case 'xls':
      return 'sheet';
    case 'csv':
      return 'csv';
    case 'txt':
    case 'md':
    case 'log':
      return 'text';
    case 'json':
    case 'js':
    case 'ts':
    case 'tsx':
    case 'jsx':
    case 'html':
    case 'css':
    case 'xml':
    case 'yml':
    case 'yaml':
      return 'code';
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return 'archive';
    case 'pptx':
    case 'ppt':
      return 'slides';
    default:
      return 'unknown';
  }
}

export function isPreviewable(kind: FileKind): boolean {
  return (
    kind === 'image' ||
    kind === 'video' ||
    kind === 'audio' ||
    kind === 'pdf' ||
    kind === 'docx' ||
    kind === 'sheet' ||
    kind === 'csv' ||
    kind === 'text' ||
    kind === 'code'
  );
}
