'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, EyeOff } from 'lucide-react';
import { Sidebar, SidebarSection, SidebarItem } from './Sidebar';
import { IconButton } from '../primitives/IconButton';
import { useAppShell, NavigationState } from '../layout/AppShell';

export interface NavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  route?: string;
  permissionRequired?: string;
  badgeCount?: string | number;
}

export interface UserSessionData {
  name: string;
  role: string;
  avatarUrl?: string;
  permissions: string[];
}

export interface BrandConfig {
  logo?: React.ReactNode;
  brandName: string;
  brandTagline?: string;
  themeColor?: string;
}

export interface AppSidebarNavProps {
  activeRoute: string;
  collapsed?: boolean;
  navState?: NavigationState;
  onNavigate: (routeId: string) => void;
  onToggleCollapse?: () => void;
  onNavStateChange?: (state: NavigationState) => void;
  items: NavItem[];
  pinnedBottomItems?: NavItem[];
  userProfile?: UserSessionData;
  tenantBranding?: BrandConfig;
  collapseLabel?: string;
  expandLabel?: string;
  hideLabel?: string;
}

export function AppSidebarNav({
  activeRoute,
  collapsed,
  navState: propNavState,
  onNavigate,
  onToggleCollapse,
  onNavStateChange,
  items,
  pinnedBottomItems = [],
  userProfile,
  tenantBranding,
  collapseLabel = 'Collapse sidebar',
  expandLabel = 'Expand sidebar',
  hideLabel = 'Hide sidebar',
}: AppSidebarNavProps) {
  const shell = useAppShell();

  // Resolve state prioritizing propNavState -> collapsed boolean -> AppShellContext
  const currentNavState: NavigationState =
    propNavState ??
    (collapsed !== undefined ? (collapsed ? 'compact' : 'expanded') : shell.navState);

  const isCompact = currentNavState === 'compact';
  const isHidden = currentNavState === 'hidden';

  const handleCollapse = () => {
    if (onNavStateChange) {
      onNavStateChange('compact');
    } else if (shell.collapseSidebar) {
      shell.collapseSidebar();
    } else {
      onToggleCollapse?.();
    }
  };

  const handleExpand = () => {
    if (onNavStateChange) {
      onNavStateChange('expanded');
    } else if (shell.expandSidebar) {
      shell.expandSidebar();
    } else {
      onToggleCollapse?.();
    }
  };

  const handleHide = () => {
    if (onNavStateChange) {
      onNavStateChange('hidden');
    } else if (shell.hideSidebar) {
      shell.hideSidebar();
    } else {
      onToggleCollapse?.();
    }
  };

  if (isHidden) {
    return null;
  }

  const filteredItems = items.filter(
    (item) =>
      !item.permissionRequired ||
      userProfile?.permissions.includes(item.permissionRequired)
  );

  return (
    <Sidebar compact={isCompact} navState={currentNavState} className="h-full bg-sidebar border-r border-border">
      {/* Top Header / Branding & Navigation Controls */}
      <div
        className={`flex items-center h-12 px-3 border-b border-border-subtle ${
          isCompact ? 'justify-center gap-1 px-1' : 'justify-between'
        }`}
      >
        {!isCompact && (
          <div className="flex items-center gap-2 min-w-0">
            {tenantBranding?.logo ? (
              <div
                className="w-6 h-6 rounded bg-action-primary flex items-center justify-center text-text-inverse font-bold text-xs shrink-0"
                style={tenantBranding.themeColor ? { backgroundColor: tenantBranding.themeColor } : undefined}
              >
                {tenantBranding.logo}
              </div>
            ) : null}
            {tenantBranding?.brandName && (
              <span className="font-heading font-bold text-xs tracking-tight text-text-primary truncate">
                {tenantBranding.brandName}{' '}
                {tenantBranding.brandTagline && (
                  <span className="text-action-primary font-normal">{tenantBranding.brandTagline}</span>
                )}
              </span>
            )}
          </div>
        )}

        {/* Action Controls for Navigation State */}
        <div className="flex items-center gap-1 shrink-0">
          {isCompact ? (
            <>
              <IconButton
                icon={<ChevronRight size={16} />}
                onClick={handleExpand}
                intent="ghost"
                size="sm"
                label={expandLabel}
                title={expandLabel}
              />
              <IconButton
                icon={<EyeOff size={15} />}
                onClick={handleHide}
                intent="ghost"
                size="sm"
                label={hideLabel}
                title={hideLabel}
              />
            </>
          ) : (
            <>
              <IconButton
                icon={<ChevronLeft size={16} />}
                onClick={handleCollapse}
                intent="ghost"
                size="sm"
                label={collapseLabel}
                title={collapseLabel}
              />
              <IconButton
                icon={<EyeOff size={15} />}
                onClick={handleHide}
                intent="ghost"
                size="sm"
                label={hideLabel}
                title={hideLabel}
              />
            </>
          )}
        </div>
      </div>

      {/* Primary Navigation Section */}
      <SidebarSection className="flex-1 overflow-y-auto custom-scrollbar py-2">
        {filteredItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeRoute === item.id}
            onClick={() => onNavigate(item.id)}
            badge={item.badgeCount}
            compact={isCompact}
            navState={currentNavState}
          />
        ))}
      </SidebarSection>

      {/* Pinned Bottom Items & User Profile */}
      <div className="mt-auto shrink-0 border-t border-border-subtle">
        {pinnedBottomItems.length > 0 && (
          <SidebarSection className="py-2">
            {pinnedBottomItems.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activeRoute === item.id}
                onClick={() => onNavigate(item.id)}
                badge={item.badgeCount}
                compact={isCompact}
                navState={currentNavState}
              />
            ))}
          </SidebarSection>
        )}

        {userProfile && (
          <div
            className={`p-2.5 border-t border-border-subtle flex items-center gap-2.5 ${
              isCompact ? 'justify-center' : ''
            }`}
            title={isCompact ? `${userProfile.name} (${userProfile.role})` : undefined}
          >
            <div className="w-7 h-7 rounded-full bg-surface-elevated flex items-center justify-center overflow-hidden shrink-0 border border-border-subtle">
              {userProfile.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[10px] font-bold text-text-secondary">
                  {userProfile.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {!isCompact && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-text-primary truncate leading-tight">
                  {userProfile.name}
                </p>
                <p className="text-[10px] text-text-muted truncate leading-tight">
                  {userProfile.role}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Sidebar>
  );
}
