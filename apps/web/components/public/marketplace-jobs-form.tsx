'use client';

import { useMemo, useState } from 'react';
import { Button, Input, Select, SelectItem, Textarea } from '@heroui/react';

interface ShopOption {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
}

interface MarketplaceJobsFormProps {
  shops: ShopOption[];
}

const NETWORK_SCOPE = 'network';

export function MarketplaceJobsForm({ shops }: MarketplaceJobsFormProps) {
  const [target, setTarget] = useState<string>(NETWORK_SCOPE);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [experienceYears, setExperienceYears] = useState('1');
  const [availability, setAvailability] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedTargetLabel = useMemo(() => {
    if (target === NETWORK_SCOPE) {
      return 'Bolsa general del marketplace';
    }

    const shop = shops.find((item) => item.id === target);
    if (!shop) {
      return 'Barberia seleccionada';
    }

    return [shop.name, shop.city || shop.region].filter(Boolean).join(' - ');
  }, [shops, target]);
  const targetOptions = useMemo(
    () => [
      {
        id: NETWORK_SCOPE,
        label: 'Bolsa general del marketplace',
      },
      ...shops.map((shop) => ({
        id: shop.id,
        label: [shop.name, shop.city || shop.region].filter(Boolean).join(' - '),
      })),
    ],
    [shops],
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!file) {
      setError('Adjunta tu CV para continuar.');
      return;
    }

    if (!name.trim() || !phone.trim() || !email.trim() || !availability.trim()) {
      setError('Completa los campos obligatorios antes de enviar.');
      return;
    }

    const payload = {
      ...(target === NETWORK_SCOPE ? {} : { shop_id: target }),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      instagram: instagram.trim() || null,
      experience_years: Number(experienceYears),
      availability: availability.trim(),
    };

    const formData = new FormData();
    formData.set('payload', JSON.stringify(payload));
    formData.set('cv', file);

    setLoading(true);
    const response = await fetch(
      (target === NETWORK_SCOPE ? '/api/jobs/network' : '/api/jobs/apply') as string,
      {
        method: 'POST',
        body: formData,
      },
    );

    if (!response.ok) {
      setLoading(false);
      setError(await response.text());
      return;
    }

    setLoading(false);
    setMessage(
      target === NETWORK_SCOPE
        ? 'Tu CV ya esta en la bolsa general del marketplace.'
        : 'Postulacion enviada a la barberia seleccionada.',
    );
    setName('');
    setPhone('');
    setEmail('');
    setInstagram('');
    setExperienceYears('1');
    setAvailability('');
    setFile(null);
    setTarget(NETWORK_SCOPE);
  }

  return (
    <form className="bg-[#141218] space-y-6 rounded-[2rem] border border-white/5 p-6 sm:p-8" onSubmit={onSubmit}>
      <div>
        <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold uppercase text-white tracking-widest">
          SOLICITUD DE INGRESO
        </h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          id="name"
          label="NOMBRE COMPLETO"
          labelPlacement="inside"
          classNames={{ inputWrapper: "bg-white/[0.04] border border-white/5 h-14", label: "text-slate-400 text-[9px] font-bold uppercase tracking-widest", input: "text-white text-sm" }}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          className="md:col-span-2"
        />
        <Select
          id="availability"
          label="ESPECIALIDAD"
          labelPlacement="inside"
          classNames={{ trigger: "bg-white/[0.04] border border-white/5 h-14", label: "text-slate-400 text-[9px] font-bold uppercase tracking-widest", value: "text-white text-sm" }}
          selectedKeys={availability ? [availability] : []}
          onChange={(event) => setAvailability(event.target.value)}
          required
        >
          <SelectItem key="Taper Fade y Texturizado">Taper Fade y Texturizado</SelectItem>
          <SelectItem key="Cortes clásicos">Cortes clásicos</SelectItem>
          <SelectItem key="Colorimetría">Colorimetría</SelectItem>
          <SelectItem key="Diseño urbano">Diseño urbano</SelectItem>
          <SelectItem key="Otro">Otro</SelectItem>
        </Select>
        <Input
          id="experience"
          type="number"
          min={0}
          max={60}
          label="EXPERIENCIA (AÑOS)"
          labelPlacement="inside"
          classNames={{ inputWrapper: "bg-white/[0.04] border border-white/5 h-14", label: "text-slate-400 text-[9px] font-bold uppercase tracking-widest", input: "text-white text-sm" }}
          value={experienceYears}
          onChange={(event) => setExperienceYears(event.target.value)}
          required
        />
        <Input
          id="phone"
          label="TELÉFONO"
          labelPlacement="inside"
          classNames={{ inputWrapper: "bg-white/[0.04] border border-white/5 h-14", label: "text-slate-400 text-[9px] font-bold uppercase tracking-widest", input: "text-white text-sm" }}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
        />
        <Input
          id="email"
          type="email"
          label="EMAIL"
          labelPlacement="inside"
          classNames={{ inputWrapper: "bg-white/[0.04] border border-white/5 h-14", label: "text-slate-400 text-[9px] font-bold uppercase tracking-widest", input: "text-white text-sm" }}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Input
          id="instagram"
          label="PORTAFOLIO / INSTAGRAM"
          labelPlacement="inside"
          classNames={{ inputWrapper: "bg-white/[0.04] border border-white/5 h-14", label: "text-slate-400 text-[9px] font-bold uppercase tracking-widest", input: "text-white text-sm" }}
          value={instagram}
          onChange={(event) => setInstagram(event.target.value)}
          className="md:col-span-2"
        />
        <Input
          id="cv"
          type="file"
          label="CV (PDF/DOC HASTA 5MB)"
          labelPlacement="inside"
          classNames={{ inputWrapper: "bg-white/[0.04] border border-white/5 h-14", label: "text-slate-400 text-[9px] font-bold uppercase tracking-widest", input: "text-white text-sm" }}
          accept=".pdf,.doc,.docx"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          className="md:col-span-2"
        />
      </div>

      <Select
        id="job-target"
        aria-label="Destino de la postulacion"
        label="DESTINO / BOLSA GENERAL"
        labelPlacement="inside"
        classNames={{ trigger: "bg-white/[0.04] border border-white/5 h-14", label: "text-slate-400 text-[9px] font-bold uppercase tracking-widest", value: "text-white text-sm" }}
        selectedKeys={target ? [target] : []}
        onChange={(event) => setTarget(event.target.value)}
      >
        {targetOptions.map((option) => (
          <SelectItem key={option.id}>{option.label}</SelectItem>
        ))}
      </Select>

      {error ? <p className="text-sm text-rose-400 px-4 py-3 bg-rose-400/10 rounded-xl">{error}</p> : null}
      {message ? <p className="text-sm text-teal-400 px-4 py-3 bg-teal-400/10 rounded-xl">{message}</p> : null}

      <Button
        type="submit"
        disabled={loading}
        className="w-full justify-center px-5 h-14 rounded-xl bg-[#c5b4ff] hover:bg-[#b09afa] text-[13px] font-bold tracking-widest text-[#23005c] uppercase transition-colors"
      >
        {loading ? 'Enviando...' : 'Enviar candidatura'}
      </Button>
    </form>
  );
}
