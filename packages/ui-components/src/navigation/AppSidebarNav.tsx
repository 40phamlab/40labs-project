import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Sidebar, SidebarSection, SidebarItem } from './Sidebar';
import { IconButton } from '../primitives/IconButton';

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
  onNavigate: (routeId: string) => void;
  onToggleCollapse?: () => void;
  items: NavItem[];
  pinnedBottomItems?: NavItem[];
  userProfile?: UserSessionData;
  tenantBranding?: BrandConfig;
  collapseLabel?: string;
  expandLabel?: string;
}

export function AppSidebarNav({
  activeRoute,
  collapsed = false,
  onNavigate,
  onToggleCollapse,
  items,
  pinnedBottomItems = [],
  userProfile,
  tenantBranding,
  collapseLabel = 'Collapse sidebar',
  expandLabel = 'Expand sidebar',
}: AppSidebarNavProps) {
  const filteredItems = items.filter(
    (item) =>
      !item.permissionRequired ||
      userProfile?.permissions.includes(item.permissionRequired)
  );

  return (
    <Sidebar compact={collapsed} className="h-full bg-sidebar border-r border-border">
      {/* Top Header / Branding & Collapse Button */}
      <div className={`flex items-center h-12 px-3 border-b border-border-subtle ${
        collapsed ? 'justify-center' : 'justify-between'
      }`}>
        {!collapsed && (
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
        <IconButton
          icon={collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          onClick={onToggleCollapse}
          intent="ghost"
          size="sm"
          label={collapsed ? expandLabel : collapseLabel}
        />
      </div>

      {/* Primary Navigation Section */}
      <SidebarSection className="flex-1 overflow-y-auto no-scrollbar py-2">
        {filteredItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeRoute === item.id}
            onClick={() => onNavigate(item.id)}
            badge={item.badgeCount}
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
              />
            ))}
          </SidebarSection>
        )}

        {userProfile && (
          <div
            className={`p-2.5 border-t border-border-subtle flex items-center gap-2.5 ${
              collapsed ? 'justify-center' : ''
            }`}
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
            {!collapsed && (
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
