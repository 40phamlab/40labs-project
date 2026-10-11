import * as React from 'react';
import {
  FileImage,
  FileVideo,
  FileAudio,
  FileType,
  FileText,
  FileSpreadsheet,
  FileCode,
  FileJson,
  FileArchive,
  Presentation,
  File,
} from 'lucide-react';
import { FileKind, resolveFileKind } from './fileKind';

export interface FileTypeIconProps {
  fileName: string;
  mimeType?: string;
  size?: number;
  className?: string;
}

export const FileTypeIcon: React.FC<FileTypeIconProps> = ({
  fileName,
  mimeType,
  size = 20,
  className = '',
}) => {
  const kind: FileKind = resolveFileKind(fileName, mimeType);

  let IconComponent = File;
  let colorClass = 'text-text-muted';

  switch (kind) {
    case 'image':
      IconComponent = FileImage;
      colorClass = 'text-success';
      break;
    case 'video':
      IconComponent = FileVideo;
      colorClass = 'text-warning';
      break;
    case 'audio':
      IconComponent = FileAudio;
      colorClass = 'text-warning';
      break;
    case 'pdf':
      IconComponent = FileType;
      colorClass = 'text-danger';
      break;
    case 'docx':
    case 'legacy-office':
      IconComponent = FileText;
      colorClass = 'text-info';
      break;
    case 'sheet':
    case 'csv':
      IconComponent = FileSpreadsheet;
      colorClass = 'text-success';
      break;
    case 'text':
      IconComponent = FileText;
      colorClass = 'text-text-secondary';
      break;
    case 'code':
      IconComponent = fileName.toLowerCase().endsWith('.json') ? FileJson : FileCode;
      colorClass = 'text-primary';
      break;
    case 'archive':
      IconComponent = FileArchive;
      colorClass = 'text-warning';
      break;
    case 'slides':
      IconComponent = Presentation;
      colorClass = 'text-warning';
      break;
    default:
      IconComponent = File;
      colorClass = 'text-text-muted';
      break;
  }

  return <IconComponent size={size} className={`shrink-0 ${colorClass} ${className}`} />;
};
