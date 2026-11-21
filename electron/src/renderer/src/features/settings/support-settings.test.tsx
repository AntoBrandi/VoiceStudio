import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ open: vi.fn().mockResolvedValue(undefined), navigate: vi.fn() }));
vi.mock('@/components/bridge', () => ({
  getBridge: () => ({ files: { openExternal: mock.open } }),
}));
vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useSearch: () => ({}),
  useNavigate: () => mock.navigate,
}));
import { SupportSettings } from './support-settings';
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it('asks for no money: no donation, payment or sponsor links', () => {
  const { container } = render(<SupportSettings />);
  for (const name of ['PayPal', 'Ko-fi', 'GitHub Sponsors', 'support.sponsors_become'])
    expect(screen.queryByRole('link', { name })).toBeNull();
  for (const link of container.querySelectorAll('a'))
    expect(link.getAttribute('href')).not.toMatch(/paypal|ko-fi|sponsor/i);
  expect(container.querySelector('.support-giving')).toBeNull();
});

it('keeps contact, community and Pro actions and opens only the explicit destination', () => {
  render(<SupportSettings />);
  expect(mock.open).not.toHaveBeenCalled();
  expect(screen.getByRole('heading', { level: 1, name: 'support.tab_support' })).toBeVisible();
  const security = screen.getByRole('link', { name: 'contact.security_cta' });
  expect(security).toHaveAttribute(
    'href',
    'https://github.com/debpalash/VoiceStudio/security/advisories/new',
  );
  expect(screen.getByRole('link', { name: 'support.join_discord' })).toBeVisible();
  fireEvent.click(security);
  expect(mock.open).toHaveBeenCalledOnce();
  expect(mock.open).toHaveBeenCalledWith(
    'https://github.com/debpalash/VoiceStudio/security/advisories/new',
  );
  fireEvent.click(screen.getByRole('button', { name: 'supportPlans.get_pro' }));
  expect(mock.navigate).toHaveBeenCalledWith({ to: '/pro' });
});
