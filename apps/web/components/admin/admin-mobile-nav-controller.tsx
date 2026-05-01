'use client';

import { useState, useEffect } from 'react';
import { Drawer, DrawerContent } from '@heroui/react';
import { AdminSidebar } from './admin-sidebar';
import { HeaderRole } from '@/lib/site-header-state';

interface AdminMobileNavControllerProps {
  workspaceName?: string | null;
  workspacePlan?: string;
  userProfileName?: string | null;
  userEmail?: string | null;
  userAvatarUrl?: string | null;
  unreadNotifications?: number;
  role: HeaderRole;
  activeWorkspaceSlug: string | null | undefined;
  isPlatformAdmin: boolean;
}

export function AdminMobileNavController(props: AdminMobileNavControllerProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    window.addEventListener('toggle-admin-drawer', handleToggle);
    window.addEventListener('open-admin-drawer', handleOpen);
    window.addEventListener('close-admin-drawer', handleClose);

    return () => {
      window.removeEventListener('toggle-admin-drawer', handleToggle);
      window.removeEventListener('open-admin-drawer', handleOpen);
      window.removeEventListener('close-admin-drawer', handleClose);
    };
  }, []);

  return (
    <Drawer 
      isOpen={isOpen} 
      onOpenChange={setIsOpen} 
      placement="left"
      size="xs"
      classNames={{
        base: "bg-[#0f0d14] border-r border-white/10",
        wrapper: "z-[100]"
      }}
    >
      <DrawerContent>
        {(onClose) => (
          <div className="h-full overflow-y-auto">
             <AdminSidebar {...props} onMobileClose={onClose} isMobile />
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
