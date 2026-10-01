import * as React from 'react';
import {
  PageViewport,
  PageContent,
  SubNavSection,
} from '@40labs/ui-components';
import { SubNavLayout } from '../../components/SubNavLayout';
import {
  Building2,
  Users,
  Palette,
  Puzzle,
  Smartphone,
  ShieldCheck,
  Lock,
  Database,
} from 'lucide-react';
import type { Branch } from '@40labs/types';
import {
  useBusiness,
  type UpdateBusinessPayload,
  type CreateBranchPayload,
  type UpdateBranchPayload,
} from '../../hooks/useBusiness';
import { BusinessProfileForm } from './components/BusinessProfileForm';
import { BranchesTable } from './components/BranchesTable';
import { BranchFormModal } from './components/BranchFormModal';
import { UsersRolesPanel } from './components/UsersRolesPanel';
import { AppearancePanel } from './components/AppearancePanel';
import { IntegrationsPanel } from './components/IntegrationsPanel';
import { DevicesPanel } from './components/DevicesPanel';
import { SecurityPanel } from './components/SecurityPanel';
import { BackupPanel } from './components/BackupPanel';
import { CompliancePanel } from './components/CompliancePanel';

export type SettingsTab =
  | 'business'
  | 'users-roles'
  | 'appearance'
  | 'integrations'
  | 'devices'
  | 'compliance'
  | 'security'
  | 'backup';

const SETTINGS_SUBNAV_SECTIONS: SubNavSection[] = [
  {
    id: 'settings',
    items: [
      { id: 'business', label: 'Business & Branches', icon: <Building2 size={16} /> },
      { id: 'users-roles', label: 'Users & Roles', icon: <Users size={16} /> },
      { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
      { id: 'integrations', label: 'Integrations', icon: <Puzzle size={16} /> },
      { id: 'devices', label: 'Devices', icon: <Smartphone size={16} /> },
      { id: 'compliance', label: 'Compliance', icon: <ShieldCheck size={16} /> },
      { id: 'security', label: 'Security', icon: <Lock size={16} /> },
      { id: 'backup', label: 'Backup', icon: <Database size={16} /> },
    ],
  },
];

const SETTINGS_TAB_TITLES: Record<SettingsTab, { title: string; subtitle: string }> = {
  'business': { title: 'Business Profile & Branches', subtitle: 'Configure institutional details and physical operating locations.' },
  'users-roles': { title: 'Users & Roles', subtitle: 'Manage staff accounts, access permissions, and RBAC policies.' },
  'appearance': { title: 'Appearance & Theme', subtitle: 'Customize light and dark display mode preferences.' },
  'integrations': { title: 'Integrations', subtitle: 'Configure external SMS, WhatsApp, and API webhook integrations.' },
  'devices': { title: 'Devices & Orbit Worker', subtitle: 'Manage paired POS terminals, local servers, and hardware trust.' },
  'compliance': { title: 'Regulatory Compliance', subtitle: 'TMDA and Pharmacy Council reporting and licensing configuration.' },
  'security': { title: 'Security & PINs', subtitle: 'Manage master admin PINs, passwords, and security audit settings.' },
  'backup': { title: 'Backup & Restore', subtitle: 'Local SQLite snapshot backups and cloud export schedules.' },
};

export const SettingsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<SettingsTab>('business');

  const {
    business,
    isLoadingBusiness,
    isErrorBusiness,
    refetchBusiness,
    branches,
    isLoadingBranches,
    isErrorBranches,
    refetchBranches,
    updateBusiness,
    createBranch,
    updateBranch,
    isUpdatingBusiness,
    isCreatingBranch,
    isUpdatingBranch,
    isBranchModalOpen,
    selectedBranchForEdit,
    openAddBranchModal,
    openEditBranchModal,
    closeBranchModal,
  } = useBusiness();

  const handleSaveBusiness = async (payload: UpdateBusinessPayload) => {
    await updateBusiness(payload);
  };

  const handleSaveBranch = async (payload: CreateBranchPayload | UpdateBranchPayload) => {
    if (selectedBranchForEdit) {
      await updateBranch(selectedBranchForEdit.id, payload as UpdateBranchPayload);
    } else {
      await createBranch(payload as CreateBranchPayload);
    }
  };

  const handleDeactivateBranch = async (branch: Branch) => {
    const newStatus = branch.status === 'active' ? 'inactive' : 'active';
    await updateBranch(branch.id, { status: newStatus });
  };

  const renderActivePanel = () => {
    if (activeTab === 'business') {
      return (
        <div className="flex flex-col gap-6 pb-8">
          {isErrorBusiness && (
            <div className="p-3 bg-danger/10 text-danger text-xs rounded-card flex items-center justify-between">
              <span>Failed to load business profile.</span>
              <button onClick={() => refetchBusiness()} className="underline font-bold">Retry</button>
            </div>
          )}
          <BusinessProfileForm
            business={business}
            onSave={handleSaveBusiness}
            isLoading={isLoadingBusiness || isUpdatingBusiness}
          />
          <BranchesTable
            branches={branches}
            onAddBranch={openAddBranchModal}
            onEditBranch={openEditBranchModal}
            onDeactivateBranch={handleDeactivateBranch}
            loading={isLoadingBranches}
            error={isErrorBranches ? 'Failed to load branches.' : null}
            onRetry={() => refetchBranches()}
          />
        </div>
      );
    }

    if (activeTab === 'users-roles') {
      return <UsersRolesPanel />;
    }

    if (activeTab === 'appearance') {
      return (
        <AppearancePanel
          business={business}
          onToggle={handleSaveBusiness}
          isLoading={isLoadingBusiness || isUpdatingBusiness}
        />
      );
    }

    if (activeTab === 'integrations') {
      return <IntegrationsPanel />;
    }

    if (activeTab === 'devices') {
      return <DevicesPanel />;
    }

    if (activeTab === 'security') {
      return <SecurityPanel onNavigateToDevices={() => setActiveTab('devices')} />;
    }

    if (activeTab === 'compliance') {
      return <CompliancePanel />;
    }

    if (activeTab === 'backup') {
      return <BackupPanel />;
    }

    return null;
  };

  return (
    <PageViewport>
      <PageContent scrollable={false} variant="transparent" padding="none">
        <SubNavLayout
          storageKey="settings"
          widthClass="w-56"
          className="p-3"
          contentClassName="pl-2 pr-1"
          sections={SETTINGS_SUBNAV_SECTIONS}
          activeItemId={activeTab}
          onSelect={(id) => setActiveTab(id as SettingsTab)}
        >
          <div className="mb-4">
            <h1 className="text-lg font-bold text-text-primary">{SETTINGS_TAB_TITLES[activeTab].title}</h1>
            <p className="text-xs text-text-muted">{SETTINGS_TAB_TITLES[activeTab].subtitle}</p>
          </div>
          {renderActivePanel()}
        </SubNavLayout>
      </PageContent>

      <BranchFormModal
        isOpen={isBranchModalOpen}
        onClose={closeBranchModal}
        branch={selectedBranchForEdit}
        onSave={handleSaveBranch}
        isLoading={isCreatingBranch || isUpdatingBranch}
      />
    </PageViewport>
  );
};
