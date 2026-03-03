import type { DocumentPickerAsset } from 'expo-document-picker';
import { env } from './env';

type BookingPayload = {
  shop_id: string;
  service_id: string;
  staff_id: string;
  start_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null | undefined;
  notes?: string | null | undefined;
};

type ModelRegistrationPayload = {
  shop_id?: string | undefined;
  session_id?: string | undefined;
  full_name: string;
  phone: string;
  email?: string | null | undefined;
  instagram?: string | null | undefined;
  preferences: string[];
  consent_photos_videos: boolean;
  marketing_opt_in: boolean;
};

type DirectJobPayload = {
  shop_id: string;
  name: string;
  phone: string;
  email: string;
  instagram?: string | null | undefined;
  experience_years: number;
  availability: string;
};

type NetworkJobPayload = Omit<DirectJobPayload, 'shop_id'>;

function getApiUrl(path: string) {
  if (!env.EXPO_PUBLIC_API_BASE_URL) {
    return null;
  }

  return `${env.EXPO_PUBLIC_API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'La solicitud no se pudo completar.');
  }

  return (await response.json()) as T;
}

function appendCvFile(formData: FormData, file: DocumentPickerAsset) {
  formData.append('cv', {
    uri: file.uri,
    name: file.name || 'cv.pdf',
    type: file.mimeType || 'application/octet-stream',
  } as never);
}

export const hasExternalApi = Boolean(env.EXPO_PUBLIC_API_BASE_URL);

export async function submitBookingViaApi(payload: BookingPayload) {
  const url = getApiUrl('/api/bookings');
  if (!url) {
    return null;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<{ appointment_id: string; start_at: string }>(response);
}

export async function submitModelRegistrationViaApi(payload: ModelRegistrationPayload) {
  const url = getApiUrl('/api/modelos/registro');
  if (!url) {
    return null;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<{
    marketplace_model_id: string | null;
    model_id: string | null;
    application_id: string | null;
  }>(response);
}

export async function submitDirectJobApplicationViaApi(
  payload: DirectJobPayload,
  file: DocumentPickerAsset,
) {
  const url = getApiUrl('/api/jobs/apply');
  if (!url) {
    return null;
  }

  const formData = new FormData();
  formData.append('payload', JSON.stringify(payload));
  appendCvFile(formData, file);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  return parseResponse<{ application_id: string }>(response);
}

export async function submitNetworkJobApplicationViaApi(
  payload: NetworkJobPayload,
  file: DocumentPickerAsset,
) {
  const url = getApiUrl('/api/jobs/network');
  if (!url) {
    return null;
  }

  const formData = new FormData();
  formData.append('payload', JSON.stringify(payload));
  appendCvFile(formData, file);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  return parseResponse<{ profile_id: string }>(response);
}
