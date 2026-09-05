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
  collapseLabel = 'Collapse',
  expandLabel = 'Expand',
}: AppSidebarNavProps) {
  // Filter items based on user permissions if userProfile is provided
  const filteredItems = items.filter(item =>
    !item.permissionRequired || (userProfile?.permissions.includes(item.permissionRequired))
  );

  return (
    <Sidebar
      compact={collapsed}
      className={`h-screen border-none shadow-surface-pop z-20 ${
        collapsed ? 'bg-surface' : 'bg-surface-strong'
      }`}
    >
      <div className="flex items-center justify-between p-4 mb-4">
        {!collapsed && tenantBranding && (
          <div className="flex items-center gap-2">
            {tenantBranding.logo && (
              <div
                className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-surface elevation-raised"
                style={{ backgroundColor: tenantBranding.themeColor }}
              >
                {tenantBranding.logo}
              </div>
            )}
            <span className="font-heading font-bold text-sm tracking-tight text-text">
              {tenantBranding.brandName} {tenantBranding.brandTagline && <span className="text-primary">{tenantBranding.brandTagline}</span>}
            </span>
          </div>
        )}
        <IconButton
          icon={collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          onClick={onToggleCollapse}
          intent="ghost"
          size="sm"
          className={collapsed ? 'mx-auto' : ''}
          label={collapsed ? expandLabel : collapseLabel}
        />
      </div>

      <SidebarSection className="flex-1 overflow-y-auto no-scrollbar">
        {filteredItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeRoute === item.id}
            onClick={() => onNavigate(item.id)}
            badge={item.badgeCount}
            className={`
              mb-1 transition-all duration-200
              ${activeRoute === item.id
                ? 'rounded-full scale-105 shadow-surface-pop'
                : 'hover:rounded-full'
              }
            `}
          />
        ))}
      </SidebarSection>

      <div className="mt-auto space-y-1">
        {pinnedBottomItems.length > 0 && (
          <SidebarSection className="border-t border-border/10 pt-4 pb-2">
            {pinnedBottomItems.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activeRoute === item.id}
                onClick={() => onNavigate(item.id)}
                badge={item.badgeCount}
                className={`
                  transition-all duration-200
                  ${activeRoute === item.id
                    ? 'rounded-full scale-105 shadow-surface-pop'
                    : 'hover:rounded-full'
                  }
                `}
              />
            ))}
          </SidebarSection>
        )}

        {userProfile && !collapsed && (
          <div className="p-4 border-t border-border/10 flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-panel-strong flex items-center justify-center overflow-hidden">
                {userProfile.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt={userProfile.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-text-muted">{userProfile.name.charAt(0)}</span>
                )}
             </div>
             <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-text truncate">{userProfile.name}</p>
                <p className="text-[10px] text-text-muted truncate">{userProfile.role}</p>
             </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
