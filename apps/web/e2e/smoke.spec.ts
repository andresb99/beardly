import { expect, test } from '@playwright/test';

test('redirects the home route into the marketplace and shows mock shops', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/\/shops$/);
  await expect(
    page.getByRole('heading', {
      name: /Descubre barberias, compara perfiles/i,
    }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Navaja Centro' }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Navaja Pocitos' }).first()).toBeVisible();
  await page.screenshot({
    path: 'test-results/marketplace-home.png',
    fullPage: true,
  });
});

test('filters the marketplace list down to a matching shop', async ({ page }) => {
  await page.goto('/shops', { waitUntil: 'domcontentloaded' });

  await page.getByPlaceholder('Buscar por barrio, ciudad o nombre').fill('Pocitos');

  await expect(page.getByRole('heading', { name: 'Navaja Pocitos' }).first()).toBeVisible();
  await expect(page.getByText('1 resultados')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Reservar' }).first()).toHaveAttribute(
    'href',
    '/shops/navaja-pocitos/book',
  );
});

test('renders the booking marketplace hub with deterministic mock data', async ({ page }) => {
  await page.goto('/book', { waitUntil: 'domcontentloaded' });

  await expect(
    page.getByRole('heading', {
      name: /Selecciona una barberia y entra a su agenda/i,
    }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Agendar aqui' }).first()).toHaveAttribute(
    'href',
    '/shops/navaja-centro/book',
  );
});

test('renders the marketplace jobs route with deterministic mock data', async ({ page }) => {
  await page.goto('/jobs', { waitUntil: 'domcontentloaded' });

  await expect(
    page.getByRole('heading', {
      name: /Postulate a una barberia o deja tu CV en la bolsa general/i,
    }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Navaja Centro' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Enviar CV directo' }).first()).toHaveAttribute(
    'href',
    '/shops/navaja-centro/jobs',
  );
});

test('renders login mode transitions without depending on live auth', async ({ page }) => {
  await page.goto('/login?mode=register', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'Crear cuenta' })).toBeVisible();
  await page.getByTestId('auth-mode-recover').click();
  await expect(page.getByRole('heading', { name: 'Recuperar acceso' })).toBeVisible();
});

test('shows the empty search state for unmatched marketplace queries', async ({ page }) => {
  await page.goto('/shops', { waitUntil: 'domcontentloaded' });

  await page.getByPlaceholder('Buscar por barrio, ciudad o nombre').fill('Atlantida Norte');

  await expect(
    page.getByText(
      'No encontramos barberias para ese filtro. Prueba con otra ciudad o limpia la busqueda.',
    ),
  ).toBeVisible();
});
