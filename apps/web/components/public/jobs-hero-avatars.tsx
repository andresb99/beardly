'use client';

import { Avatar, AvatarGroup } from '@heroui/react';

export function JobsHeroAvatars() {
  return (
    <div className="mt-10 flex items-center gap-4">
      <AvatarGroup isBordered max={3} className="justify-start">
        <Avatar src="https://i.pravatar.cc/150?u=a042581f4e29026024d" className="border-[#0b090c]" />
        <Avatar src="https://i.pravatar.cc/150?u=a04258a2462d826712d" className="border-[#0b090c]" />
        <Avatar src="https://i.pravatar.cc/150?u=a042581f4e29026704d" className="border-[#0b090c]" />
      </AvatarGroup>
      <span className="text-[10px] font-bold tracking-[0.15em] text-slate-500 max-w-[120px] leading-tight">
        +40 BARBEROS YA SE UNIERON ESTE MES
      </span>
    </div>
  );
}
