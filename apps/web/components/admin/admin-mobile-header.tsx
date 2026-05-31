'use client';
import { useState } from 'react';
import NextLink from 'next/link';
import { Menu, Bell } from 'lucide-react';
import { Button } from '@heroui/button';
import { Drawer, DrawerContent } from '@heroui/react';
import { HeaderBrand } from '@/components/public/header-brand';
import { AdminSidebar } from './admin-sidebar';

interface AdminMobileHeaderProps {
  workspaceName?: string | null;
  workspacePlan?: string;
  userProfileName?: string | null;
  userEmail?: string | null;
  userAvatarUrl?: string | null;
  unreadNotifications?: number;
  role: 'admin' | 'staff' | 'user';
  activeWorkspaceSlug: string | null;
  isPlatformAdmin: boolean;
}

export function AdminMobileHeader(props: AdminMobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/5 bg-[#121016]/80 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Button
          isIconOnly
          variant="light"
          className="text-white"
          onPress={() => setIsOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <NextLink href="/" className="block max-w-[80px]">
          <HeaderBrand />
        </NextLink>
      </div>

      <div className="flex items-center gap-2">
        <Button
          isIconOnly
          variant="light"
          size="sm"
          className="relative text-slate-400"
        >
          <Bell className="h-5 w-5" />
          {props.unreadNotifications && props.unreadNotifications > 0 ? (
            <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-violet-500" />
          ) : null}
        </Button>
      </div>

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
    </div>
  );
}
