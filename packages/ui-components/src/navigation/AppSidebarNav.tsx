'use client';

import React from 'react';
import { Sidebar, SidebarSection, SidebarItem } from './Sidebar';
import { useAppShell, NavigationState } from '../layout/AppShell';

export interface NavItem<T extends string = string> {
  id: T;
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

export interface AppSidebarNavProps<T extends string = string> {
  activeRoute: T;
  navState?: NavigationState | string;
  onNavigate: (routeId: T) => void;
  onNavStateChange?: (state: NavigationState) => void;
  items: NavItem<T>[];
  pinnedBottomItems?: NavItem<T>[];
  userProfile?: UserSessionData;
  tenantBranding?: BrandConfig;
}

const normalizeState = (state: string | undefined, defaultState: NavigationState = 'open'): NavigationState => {
  if (state === 'closed' || state === 'icon' || state === 'open') return state;
  if (state === 'expanded') return 'open';
  if (state === 'compact') return 'icon';
  if (state === 'hidden') return 'closed';
  return defaultState;
};

export function AppSidebarNav<T extends string = string>({
  activeRoute,
  navState: propNavState,
  onNavigate,
  onNavStateChange,
  items,
  pinnedBottomItems = [],
  userProfile,
  tenantBranding: _tenantBranding,
}: AppSidebarNavProps<T>) {
  const shell = useAppShell();

  const currentNavState: NavigationState = normalizeState((propNavState as string) ?? shell.navState);

  const isCompact = currentNavState === 'icon';
  const isClosed = currentNavState === 'closed';

  if (isClosed) {
    return null;
  }

  const handleStateChange = (newState: NavigationState) => {
    if (onNavStateChange) {
      onNavStateChange(newState);
    } else if (shell.setNavState) {
      shell.setNavState(newState);
    }
  };

  const handleItemClick = (itemId: T) => {
    const isCurrentActive = activeRoute === itemId;
    const isOpen = currentNavState === 'open';

    if (currentNavState === 'icon') {
      // Clicking an icon in icon-only state selects that section while keeping sidebar in icon state
      onNavigate(itemId);
    } else if (isOpen) {
      if (isCurrentActive) {
        // Clicking the same active icon again collapses back to icon-only
        handleStateChange('icon');
      } else {
        // Clicking a different icon switches panel content without closing
        onNavigate(itemId);
      }
    } else {
      onNavigate(itemId);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      !item.permissionRequired ||
      userProfile?.permissions.includes(item.permissionRequired)
  );

  return (
    <Sidebar navState={currentNavState} className="h-full bg-sidebar border-r border-border">
      {/* Primary Navigation Section */}
      <SidebarSection className="flex-1 overflow-y-auto no-scrollbar overscroll-contain py-2">
        {filteredItems.map((item) => {
          const isActiveSection = activeRoute === item.id;
          const isOpenState = currentNavState === 'open';

          return (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={isActiveSection}
              onClick={() => handleItemClick(item.id)}
              badge={item.badgeCount}
              navState={currentNavState}
              aria-expanded={isOpenState && isActiveSection}
            />
          );
        })}
      </SidebarSection>

      {/* Pinned Bottom Items & User Profile */}
      <div className="mt-auto shrink-0 border-t border-border-subtle">
        {pinnedBottomItems.length > 0 && (
          <SidebarSection className="py-2">
            {pinnedBottomItems.map((item) => {
              const isActiveSection = activeRoute === item.id;
              const isOpenState = currentNavState === 'open';

              return (
                <SidebarItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={isActiveSection}
                  onClick={() => handleItemClick(item.id)}
                  badge={item.badgeCount}
                  navState={currentNavState}
                  aria-expanded={isOpenState && isActiveSection}
                />
              );
            })}
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
