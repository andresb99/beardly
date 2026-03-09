import Link from 'next/link';
import type { ShopPaymentAccountSummary } from '@/lib/shop-payment-accounts.server';

interface MercadoPagoSettingsPanelProps {
  shopSlug: string;
  account: ShopPaymentAccountSummary | null;
  message: string | null;
}

export function MercadoPagoSettingsPanel({
  shopSlug,
  account,
  message,
}: MercadoPagoSettingsPanelProps) {
  const isConnected = Boolean(account?.isActive && account?.status === 'connected');

  return (
    <div className="space-y-5">
      {message ? (
        <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-slate-100">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
            Estado
          </p>
          <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
            {isConnected ? 'Mercado Pago conectado' : 'Sin cuenta conectada'}
          </p>
          <p className="mt-2 text-sm text-slate/80 dark:text-slate-300">
            {isConnected
              ? 'Las reservas online de esta barberia se cobran en la cuenta conectada.'
              : 'Conecta la cuenta del dueño para que las reservas se cobren directo en su Mercado Pago.'}
          </p>
        </div>

        <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60 dark:text-slate-400">
            Cuenta
          </p>
          <p className="mt-2 text-lg font-semibold text-ink dark:text-slate-100">
            {account?.nickname || account?.email || 'No conectada'}
          </p>
          <p className="mt-2 text-sm text-slate/80 dark:text-slate-300">
            {account?.email || 'El dueño iniciara sesion en Mercado Pago y autorizara la conexion.'}
          </p>
          {account?.connectedAt ? (
            <p className="mt-3 text-xs text-slate/60 dark:text-slate-400">
              Conectada el {new Date(account.connectedAt).toLocaleString('es-UY')}
            </p>
          ) : null}
          {account?.lastError ? (
            <p className="mt-2 text-xs text-amber-200">
              Ultimo error: {account.lastError}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/api/admin/payments/mercadopago/connect?shop=${encodeURIComponent(shopSlug)}`}
          className="action-primary inline-flex rounded-full px-5 py-2.5 text-sm font-semibold no-underline"
        >
          {isConnected ? 'Reconectar Mercado Pago' : 'Conectar Mercado Pago'}
        </Link>

        {account?.isActive ? (
          <form method="post" action={`/api/admin/payments/mercadopago/disconnect?shop=${encodeURIComponent(shopSlug)}`}>
            <button
              type="submit"
              className="action-secondary inline-flex rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              Desconectar
            </button>
          </form>
        ) : null}
      </div>

      <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-slate/80 dark:text-slate-300">
        <p className="font-semibold text-ink dark:text-slate-100">Como funciona</p>
        <ol className="mt-3 list-decimal space-y-1 pl-5">
          <li>Haz click en Conectar Mercado Pago.</li>
          <li>El dueño inicia sesion y autoriza la app.</li>
          <li>Las reservas online nuevas se cobran en esa cuenta.</li>
          <li>Los reembolsos tambien salen de esa misma cuenta.</li>
        </ol>
      </div>
    </div>
  );
}
