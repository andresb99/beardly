import { CalendarRange, Clock3, Scissors, ShieldCheck, UserRoundPlus, type LucideIcon } from 'lucide-react';
import { AdminStaffForms } from '@/components/admin/staff-forms';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Container } from '@/components/heroui/container';

const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

const inviteStatusLabel: Record<string, string> = {
  invited: 'Pendiente',
  active: 'Activa',
  disabled: 'Deshabilitada',
};

const inviteStatusTone: Record<string, 'warning' | 'success' | 'danger' | undefined> = {
  invited: 'warning',
  active: 'success',
  disabled: 'danger',
};

interface StaffPageProps {
  searchParams: Promise<{ shop?: string }>;
}

interface SummaryCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}

interface StaffMemberCardData {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  isActive: boolean;
  scheduleItems: Array<{
    id: string;
    dayLabel: string;
    startTime: string;
    endTime: string;
  }>;
  recentTimeOffCount: number;
  assignedServices: Array<{ id: string; name: string }>;
}

function formatStaffDateTime(value: string, timeZone: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('es-UY', { timeZone });
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return 'ST';
  }

  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
}

function formatRoleLabel(value: string) {
  const normalized = value.trim().toLowerCase();

  if (normalized === 'admin') {
    return 'Administrador';
  }

  if (normalized === 'staff') {
    return 'Barbero';
  }

  return value || 'Personal';
}

function formatMembershipRoleLabel(value: string) {
  return formatRoleLabel(value);
}

function formatScheduleChip(dayLabel: string, startTime: string, endTime: string) {
  return `${dayLabel.slice(0, 3)} ${startTime}-${endTime}`;
}

function SummaryCard({ icon: Icon, label, value, detail }: SummaryCardProps) {
  return (
    <article className="data-card rounded-[1.7rem] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-ink dark:text-slate-100">
            {value}
          </p>
          <p className="mt-2 text-sm text-slate/80 dark:text-slate-300">{detail}</p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.1rem] border border-white/70 bg-white/75 text-ink shadow-[0_18px_30px_-24px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}

function StaffQuickAction({ icon: Icon, label, href }: { icon: LucideIcon; label: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 rounded-xl border border-white/60 bg-white/40 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate/70 transition hover:bg-white/80 hover:text-ink dark:border-white/5 dark:bg-white/[0.02] dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-slate-100"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}

function StaffMemberCard({
  name,
  role,
  phone,
  isActive,
  scheduleItems,
  recentTimeOffCount,
  assignedServices,
}: StaffMemberCardData) {
  const visibleScheduleItems = scheduleItems.slice(0, 4);
  const remainingScheduleItems = Math.max(scheduleItems.length - visibleScheduleItems.length, 0);

  return (
    <article className="data-card rounded-[1.75rem] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] border border-white/65 bg-white/75 text-base font-semibold text-ink shadow-[0_18px_28px_-24px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-100">
            {getInitials(name)}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-ink dark:text-slate-100">{name}</p>
            <p className="mt-1 text-sm text-slate/75 dark:text-slate-300">
              {phone || 'Sin telefono cargado'}
            </p>
          </div>
        </div>

        <span className="meta-chip" data-tone={isActive ? 'success' : undefined}>
          {isActive ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="meta-chip">{formatRoleLabel(role)}</span>
        <span className="meta-chip" data-tone={scheduleItems.length ? 'success' : undefined}>
          {scheduleItems.length ? `${scheduleItems.length} bloques semanales` : 'Sin horario'}
        </span>
        {recentTimeOffCount ? (
          <span className="meta-chip" data-tone="danger">
            {recentTimeOffCount} bloqueos recientes
          </span>
        ) : null}
      </div>

      <div className="mt-5 rounded-[1.35rem] border border-white/65 bg-white/50 px-4 py-4 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
          Cobertura semanal
        </p>

        {scheduleItems.length ? (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
              {visibleScheduleItems.map((entry) => (
                <span
                  key={entry.id}
                  className="rounded-full border border-white/65 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-slate/85 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200"
                >
                  {formatScheduleChip(entry.dayLabel, entry.startTime, entry.endTime)}
                </span>
              ))}
            </div>

            {remainingScheduleItems ? (
              <p className="mt-3 text-xs text-slate/70 dark:text-slate-400">
                +{remainingScheduleItems} bloques adicionales cargados.
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-3 text-sm text-slate/75 dark:text-slate-400">
            Aun no tiene horarios laborales configurados.
          </p>
        )}
      </div>

      <div className="mt-4 rounded-[1.35rem] border border-white/65 bg-white/50 px-4 py-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
            Servicios asignados
          </p>
          <Scissors className="h-3.5 w-3.5 text-slate/40" />
        </div>

        {assignedServices.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {assignedServices.map((service) => (
              <span
                key={service.id}
                className="rounded-full border border-white/65 bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-slate/80 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300"
              >
                {service.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate/75 dark:text-slate-400 italic">
            Sin servicios asignados. No aparecera en el gestor de reservas.
          </p>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-slate/10 dark:border-white/5 flex flex-wrap gap-2">
        <StaffQuickAction icon={Clock3} label="Horarios" href="#manage-hours" />
        <StaffQuickAction icon={Scissors} label="Servicios" href="#manage-services" />
        <StaffQuickAction icon={CalendarRange} label="Bloqueos" href="#manage-timeoff" />
      </div>
    </article>
  );
}

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const params = await searchParams;
  const ctx = await requireAdmin({ shopSlug: params.shop });
  const supabase = await createSupabaseServerClient();
  const [
    { data: staff },
    { data: workingHours },
    { data: timeOff },
    { data: memberships },
    { data: services },
    { data: staffServices },
  ] = await Promise.all([
    supabase
      .from('staff')
      .select('id, name, role, phone, is_active')
      .eq('shop_id', ctx.shopId)
      .order('name'),
    supabase
      .from('working_hours')
      .select('id, staff_id, day_of_week, start_time, end_time, staff(name)')
      .eq('shop_id', ctx.shopId)
      .order('day_of_week'),
    supabase
      .from('time_off')
      .select('id, staff_id, start_at, end_at, reason, staff(name)')
      .eq('shop_id', ctx.shopId)
      .order('start_at', { ascending: false })
      .limit(20),
    supabase
      .from('shop_memberships')
      .select('id, user_id, role, membership_status, created_at')
      .eq('shop_id', ctx.shopId)
      .in('role', ['admin', 'staff'])
      .order('created_at', { ascending: false }),
    supabase
      .from('services')
      .select('id, name, is_active')
      .eq('shop_id', ctx.shopId)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('staff_services')
      .select('id, staff_id, service_id')
      .eq('shop_id', ctx.shopId),
  ]);

  const membershipUserIds = Array.from(
    new Set((memberships || []).map((item) => String(item.user_id || '')).filter(Boolean)),
  );
  const { data: membershipProfiles } = membershipUserIds.length
    ? await supabase
        .from('user_profiles')
        .select('auth_user_id, full_name')
        .in('auth_user_id', membershipUserIds)
    : { data: [] as Array<{ auth_user_id: string; full_name: string | null }> };
  const membershipProfilesByUserId = new Map(
    (membershipProfiles || []).map((item) => [
      String(item.auth_user_id),
      (typeof item.full_name === 'string' && item.full_name.trim()) || null,
    ]),
  );

  const activeStaffCount = (staff || []).filter((item) => item.is_active).length;
  const inactiveStaffCount = Math.max((staff || []).length - activeStaffCount, 0);
  const pendingInvitesCount = (memberships || []).filter(
    (item) => String(item.membership_status) === 'invited',
  ).length;
  const groupedWorkingHours = new Map<
    string,
    {
      staffId: string;
      staffName: string;
      items: Array<{
        id: string;
        dayLabel: string;
        startTime: string;
        endTime: string;
      }>;
    }
  >();
  const timeOffCountByStaffId = new Map<string, number>();

  for (const entry of workingHours || []) {
    const staffId = String(entry.staff_id || 'unknown');
    const staffName = String((entry.staff as { name?: string } | null)?.name || 'Personal');

    if (!groupedWorkingHours.has(staffId)) {
      groupedWorkingHours.set(staffId, {
        staffId,
        staffName,
        items: [],
      });
    }

    groupedWorkingHours.get(staffId)?.items.push({
      id: String(entry.id),
      dayLabel: weekdays[Number(entry.day_of_week || 0)] || 'Dia',
      startTime: String(entry.start_time),
      endTime: String(entry.end_time),
    });
  }

  for (const entry of timeOff || []) {
    const staffId = String(entry.staff_id || 'unknown');
    timeOffCountByStaffId.set(staffId, (timeOffCountByStaffId.get(staffId) || 0) + 1);
  }
  const staffCards: StaffMemberCardData[] = (staff || []).map((item) => {
    const staffId = String(item.id);
    const scheduleGroup = groupedWorkingHours.get(staffId);
    const staffAssignedServices = (staffServices || [])
      .filter((ss) => String(ss.staff_id) === staffId)
      .map((ss) => {
        const service = (services || []).find((s) => String(s.id) === String(ss.service_id));
        return { id: String(ss.service_id), name: service?.name || 'Servicio desconocido' };
      });

    return {
      id: staffId,
      name: String(item.name),
      role: String(item.role || ''),
      phone: item.phone ? String(item.phone) : null,
      isActive: Boolean(item.is_active),
      scheduleItems: scheduleGroup?.items || [],
      recentTimeOffCount: timeOffCountByStaffId.get(staffId) || 0,
      assignedServices: staffAssignedServices,
    };
  });

  return (
    <section className="space-y-6">
      <Container variant="pageHeader" className="px-6 py-7 md:px-8 md:py-9">
        <div className="relative z-10 space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
            <div>
              <p className="hero-eyebrow uppercase tracking-[0.2em] text-[10px] opacity-60">
                Operations / Team
              </p>
              <h1 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-bold text-ink md:text-[2.75rem] leading-[1.1] dark:text-slate-100">
                Staff Management & <br />
                <span className="text-brand-primary">Operational Roster</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate/70 dark:text-slate-400">
                Controla la capacidad operativa de tu barbería. Gestiona horarios rotativos, 
                asigna especialidades por barbero y supervisa la disponibilidad en tiempo real.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="meta-chip border-slate/20 bg-slate/5 text-slate/80 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  {staffCards.length} Profesionales
                </span>
                <span className="meta-chip border-slate/20 bg-slate/5 text-slate/80 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  {groupedWorkingHours.size} Con Horario Causal
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SummaryCard
                icon={ShieldCheck}
                label="Staff Activo"
                value={String(activeStaffCount)}
                detail={`${inactiveStaffCount} perfiles en pausa`}
              />
              <SummaryCard
                icon={UserRoundPlus}
                label="Invitaciones"
                value={String((memberships || []).length)}
                detail={`${pendingInvitesCount} esperando acción`}
              />
              <SummaryCard
                icon={Clock3}
                label="Cobertura Semanal"
                value={String((workingHours || []).length)}
                detail="Bloques operativos totales"
              />
              <SummaryCard
                icon={CalendarRange}
                label="Bloqueos"
                value={String((timeOff || []).length)}
                detail="Excepciones recientes"
              />
            </div>
          </div>
        </div>
      </Container>

      <AdminStaffForms
        shopId={ctx.shopId}
        shopSlug={ctx.shopSlug}
        weekdays={weekdays}
        staff={(staff || []).map((item) => ({
          id: String(item.id),
          name: String(item.name),
        }))}
        services={(services || []).map((s) => ({ id: String(s.id), name: String(s.name) }))}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <section className="surface-card rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate/5 dark:border-white/5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between border-b border-slate/10 dark:border-white/5 pb-6">
            <div>
              <p className="hero-eyebrow uppercase tracking-[0.2em] text-[10px] opacity-60">
                Staff Registry
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink dark:text-slate-100 italic">
                Equipo de Trabajo
              </h2>
              <p className="mt-2 text-sm text-slate/60 dark:text-slate-400">
                Resumen ejecutivo por barbero, especialidades y bloques semanales.
              </p>
            </div>
          </div>

          {!staffCards.length ? (
            <div className="mt-10 rounded-[2rem] border border-dashed border-slate/20 bg-slate/5 py-16 text-center dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-slate/50 dark:text-slate-500">
                Todavía no has registrado personal para esta barbería.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {staffCards.map((item) => (
                <StaffMemberCard key={item.id} {...item} />
              ))}
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="surface-card rounded-[2rem] p-6 md:p-8 border border-slate/5 dark:border-white/5">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="hero-eyebrow uppercase tracking-[0.2em] text-[10px] opacity-60">
                  Access Control
                </p>
                <h3 className="mt-1 text-lg font-bold text-ink dark:text-slate-100">Invitaciones</h3>
              </div>
              <span className="meta-chip text-[10px] uppercase font-bold tracking-widest bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                {pendingInvitesCount} Pendientes
              </span>
            </div>

            <div className="space-y-3">
              {(memberships || []).length === 0 ? (
                <p className="text-sm text-slate/50 dark:text-slate-500 py-4 italic">
                  No hay invitaciones activas.
                </p>
              ) : (
                (memberships || []).map((item) => {
                  const membershipStatus = String(item.membership_status || 'invited');
                  const profileName =
                    membershipProfilesByUserId.get(String(item.user_id || '')) ||
                    `User ${String(item.user_id || '').slice(0, 8)}`;

                  return (
                    <article
                      key={String(item.id)}
                      className="rounded-[1.5rem] border border-slate/5 bg-slate/5 p-4 dark:border-white/5 dark:bg-white/[0.02] flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-ink dark:text-slate-100 truncate">
                          {profileName}
                        </p>
                        <p className="text-[10px] text-slate/50 uppercase font-bold tracking-tight mt-0.5">
                          {formatMembershipRoleLabel(String(item.role))}
                        </p>
                      </div>
                      <span className="meta-chip text-[9px] px-2 py-0.5" data-tone={inviteStatusTone[membershipStatus]}>
                        {inviteStatusLabel[membershipStatus] || membershipStatus}
                      </span>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          <section className="surface-card rounded-[2rem] p-6 md:p-8 border border-slate/5 dark:border-white/5">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="hero-eyebrow uppercase tracking-[0.2em] text-[10px] opacity-60">
                  Agenda Logs
                </p>
                <h3 className="mt-1 text-lg font-bold text-ink dark:text-slate-100">Ausencias Recientes</h3>
              </div>
            </div>

            <div className="space-y-4">
              {(timeOff || []).length === 0 ? (
                <p className="text-sm text-slate/50 dark:text-slate-500 py-4 italic">
                  Sin bloqueos registrados.
                </p>
              ) : (
                (timeOff || []).map((item) => (
                  <article
                    key={String(item.id)}
                    className="group rounded-[1.5rem] border border-slate/5 bg-slate/5 p-4 dark:border-white/5 dark:bg-white/[0.02]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-ink dark:text-slate-100">
                          {String((item.staff as { name?: string } | null)?.name || 'Personal')}
                        </p>
                        <div className="mt-2 space-y-1">
                          <p className="text-[10px] text-slate/50 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500/50" />
                            {formatStaffDateTime(String(item.start_at), ctx.shopTimezone)}
                          </p>
                          <p className="text-[10px] text-slate/50 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-500/30" />
                            {formatStaffDateTime(String(item.end_at), ctx.shopTimezone)}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-rose-500/10 px-2 py-0.5 text-[9px] font-bold text-rose-600 uppercase tracking-widest dark:text-rose-400">
                        Off
                      </span>
                    </div>
                    {item.reason && (
                      <p className="mt-3 text-xs leading-relaxed text-slate/60 dark:text-slate-400 italic">
                        "{item.reason}"
                      </p>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <section className="surface-card rounded-[2rem] p-6 md:p-8 border border-slate/5 dark:border-white/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
          <div>
            <p className="hero-eyebrow uppercase tracking-[0.2em] text-[10px] opacity-60">
              Coverage Mapping
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink dark:text-slate-100">
              Disponibilidad Agrupada
            </h2>
            <p className="mt-2 text-sm text-slate/60 dark:text-slate-400">
              Vista rápida de la fuerza laboral disponible por franjas horarias.
            </p>
          </div>
        </div>

        {groupedWorkingHours.size === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate/20 bg-slate/5 py-12 text-center dark:border-white/10 dark:bg-white/5">
            <p className="text-sm text-slate/50 dark:text-slate-500 text-center">
              Sin bloques horarios configurados.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from(groupedWorkingHours.values()).map((group) => (
              <article 
                key={group.staffId} 
                className="data-card rounded-[1.8rem] p-5 border border-slate/5 dark:border-white/5 flex flex-col"
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] border border-white/60 bg-white/72 text-sm font-bold text-ink dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-100 shadow-sm transition group-hover:scale-105">
                    {getInitials(group.staffName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-ink dark:text-slate-100 truncate">
                      {group.staffName}
                    </p>
                    <p className="text-[10px] text-slate/50 uppercase font-bold tracking-widest mt-1">
                      {group.items.length} Bloques / Semana
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-auto">
                  {group.items.map((entry) => (
                    <span
                      key={entry.id}
                      className="rounded-full border border-slate/5 bg-slate/5 px-3 py-1.5 text-[10px] font-bold text-slate/70 dark:border-white/5 dark:bg-white/[0.04] dark:text-slate-300"
                    >
                      {formatScheduleChip(entry.dayLabel, entry.startTime, entry.endTime)}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
