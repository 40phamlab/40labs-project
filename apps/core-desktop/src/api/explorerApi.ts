import { isUsingTauriIpc, invokeCommand } from './client';
import { open as openDialog } from '@tauri-apps/plugin-dialog';

export interface ExplorerItemMetadata {
  name: string;
  path: string;
  is_dir: boolean;
  is_symlink: boolean;
  size_bytes: number;
  extension: string;
  modified_at: number; // Epoch milliseconds
}

export interface ExplorerDirectoryContent {
  current_path: string;
  parent_path: string | null;
  items: ExplorerItemMetadata[];
}

export const explorerApi = {
  /**
   * Gets the default workspace directory ($DOCUMENT/40Labs).
   */
  getDefaultDirectory: async (): Promise<string> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<string>('explorer_get_default_dir');
    }
    return '/mock/Documents/40Labs';
  },

  /**
   * Reads directory content and metadata for a given path.
   */
  readDirectory: async (path: string): Promise<ExplorerDirectoryContent> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<ExplorerDirectoryContent>('explorer_read_dir', { path });
    }
    return {
      current_path: path,
      parent_path: null,
      items: [],
    };
  },

  /**
   * Reads text content of a file with a size limit (default 5MB).
   */
  readTextFile: async (path: string, maxBytes?: number): Promise<string> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<string>('explorer_read_file_text', { path, maxBytes });
    }
    return 'Mock text content';
  },

  /**
   * Creates a folder inside parentPath.
   */
  createDirectory: async (parentPath: string, name: string): Promise<string> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<string>('explorer_create_dir', { parentPath, name });
    }
    return `${parentPath}/${name}`;
  },

  /**
   * Renames a file or folder.
   */
  renameItem: async (oldPath: string, newName: string): Promise<string> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<string>('explorer_rename_path', { oldPath, newName });
    }
    return newName;
  },

  /**
   * Copies a file to target directory.
   */
  copyFile: async (sourcePath: string, targetDir: string): Promise<string> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<string>('explorer_copy_file', { sourcePath, targetDir });
    }
    return `${targetDir}/copy`;
  },

  /**
   * Deletes a file or directory.
   */
  deleteItem: async (path: string): Promise<void> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<void>('explorer_delete_path', { path });
    }
  },

  /**
   * Reveals file/folder in OS file manager.
   */
  revealInFileManager: async (path: string): Promise<void> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<void>('explorer_reveal_in_file_manager', { path });
    }
  },

  /**
   * Opens native directory picker and returns selected directory path.
   */
  selectDirectory: async (defaultPath?: string): Promise<string | null> => {
    if (isUsingTauriIpc()) {
      const selected = await openDialog({
        directory: true,
        multiple: false,
        defaultPath,
      });
      if (selected && typeof selected === 'string') {
        return selected;
      }
    }
    return null;
  },
};
