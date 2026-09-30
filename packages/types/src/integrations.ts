import { BaseEntity } from './common';

export interface CollaboratorRef {
  user_id: string;
  full_name: string;
  scope: 'view' | 'manage';
}

export interface IntegrationsConfig extends BaseEntity {
  email_connected: boolean;
  email_address: string | null;
  whatsapp_connected: boolean;
  whatsapp_number: string | null;
  web_apps_connected: string[];   // e.g. ['Web App', 'Admin']
  mobile_phone: string | null;
  collaborators: CollaboratorRef[];
}
