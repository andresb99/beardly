'use client'

import React, { useTransition } from 'react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { Filter, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StaffItem {
  id: string;
  name: string;
  href: string;
}

interface StaffFilterProps {
  staff: StaffItem[];
  selectedStaffName?: string | undefined;
  allStaffHref: string;
}

export function StaffFilter({ staff, selectedStaffName, allStaffHref }: StaffFilterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function shortenStaffName(value: string) {
    const trimmed = String(value || '').trim();
    if (!trimmed) return 'Sin nombre';
    if (trimmed.length <= 12) return trimmed;
    return `${trimmed.slice(0, 12)}...`;
  }

  const items = [
    { id: 'all', name: 'Todos los barberos', href: allStaffHref },
    ...staff
  ];

  const handleAction = (key: React.Key) => {
    const item = items.find(i => i.id === key);
    if (item) {
      startTransition(() => {
        router.push(item.href);
      });
    }
  };

  return (
    <Dropdown className="bg-[#18161f] border border-white/5" placement="bottom-end">
      <DropdownTrigger>
        <button 
          disabled={isPending}
          className="flex items-center gap-2 bg-[#18161f] h-9 px-4 rounded-xl border border-white/5 text-[11px] font-bold text-white transition-all hover:bg-white/[0.04] disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
          ) : (
            <Filter className="w-3.5 h-3.5 text-slate-400" />
          )}
          Barbero: {selectedStaffName ? shortenStaffName(selectedStaffName) : 'Todos'}
        </button>
      </DropdownTrigger>
      <DropdownMenu 
        aria-label="Filtrar por staff"
        items={items}
        onAction={handleAction}
      >
        {(item: StaffItem) => (
          <DropdownItem 
            key={item.id} 
            textValue={item.name}
            className="text-slate-300"
          >
            {item.name}
          </DropdownItem>
        )}
      </DropdownMenu>
    </Dropdown>
  );
}
