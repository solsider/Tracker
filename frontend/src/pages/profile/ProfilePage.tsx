import { useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { useUpdateProfile, useChangePassword, useSetup2FA, useEnable2FA, useDisable2FA } from '../../hooks/useProfile';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { SYSTEM_ROLE_LABELS } from '../../types';
import type { SystemRole } from '../../types';

const TIMEZONE_OPTIONS = [
  { value: 'Europe/Moscow', label: 'Москва (UTC+3)' },
  { value: 'Europe/Kaliningrad', label: 'Калининград (UTC+2)' },
  { value: 'Asia/Yekaterinburg', label: 'Екатеринбург (UTC+5)' },
  { value: 'Asia/Novosibirsk', label: 'Новосибирск (UTC+7)' },
  { value: 'Asia/Krasnoyarsk', label: 'Красноярск (UTC+7)' },
  { value: 'Asia/Irkutsk', label: 'Иркутск (UTC+8)' },
  { value: 'Asia/Yakutsk', label: 'Якутск (UTC+9)' },
  { value: 'Asia/Vladivostok', label: 'Владивосток (UTC+10)' },
  { value: 'Europe/London', label: 'Лондон (UTC+0/+1)' },
  { value: 'Europe/Berlin', label: 'Берлин (UTC+1/+2)' },
  { value: 'America/New_York', label: 'Нью-Йорк (UTC-5/-4)' },
  { value: 'America/Los_Angeles', label: 'Лос-Анджелес (UTC-8/-7)' },
  { value: 'UTC', label: 'UTC' },
];

const LANGUAGE_OPTIONS = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

const ROLE_OPTIONS = (Object.entries(SYSTEM_ROLE_LABELS) as [SystemRole, string][]).map(
  ([value, label]) => ({ value, label }),
);

type Tab = 'profile' | 'security';

function UserAvatarLarge({ name, avatar }: { name: string; avatar: string | null }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="w-20 h-20 rounded-full object-cover ring-4 ring-dash-border"
      />
    );
  }
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className="w-20 h-20 rounded-full bg-dash-accent/20 border-2 border-dash-accent/30 flex items-center justify-center text-2xl font-bold text-dash-accent">
      {initials}
    </div>
  );
}

function ProfileTab() {
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();

  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    avatar: user?.avatar ?? '',
    position: user?.position ?? '',
    department: user?.department ?? '',
    timezone: user?.timezone ?? 'Europe/Moscow',
    language: user?.language ?? 'ru',
    bio: user?.bio ?? '',
  });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(
      {
        name: form.name || undefined,
        email: form.email || undefined,
        avatar: form.avatar || undefined,
        position: form.position || undefined,
        department: form.department || undefined,
        timezone: form.timezone || undefined,
        language: form.language || undefined,
        bio: form.bio || undefined,
      },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        },
      },
    );
  };

  const errorMsg = (() => {
    const msg = (updateProfile.error as any)?.response?.data?.message;
    if (!msg) return null;
    if (msg === 'Email already in use') return 'Этот email уже используется';
    return msg;
  })();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar section */}
      <div className="flex items-center gap-6 p-5 bg-dash-bg rounded-card border border-dash-border">
        <UserAvatarLarge name={user?.name ?? ''} avatar={user?.avatar ?? null} />
        <div className="flex-1">
          <p className="text-sm font-medium text-dash-text mb-1">Фото профиля</p>
          <p className="text-xs text-dash-muted mb-3">Укажите URL изображения для аватара</p>
          <Input
            placeholder="https://example.com/avatar.jpg"
            value={form.avatar}
            onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
          />
        </div>
      </div>

      {/* Basic info */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-dash-muted uppercase tracking-wider">Основная информация</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Полное имя"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            minLength={2}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Должность"
            placeholder="Senior Developer"
            value={form.position}
            onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
          />
          <Input
            label="Команда / Отдел"
            placeholder="Backend Team"
            value={form.department}
            onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dash-muted mb-1.5">О себе</label>
          <textarea
            rows={3}
            className="block w-full rounded-lg bg-dash-bg border border-dash-border px-3 py-2.5 text-sm text-dash-text placeholder-dash-muted/60 focus:outline-none focus:ring-2 focus:ring-dash-accent/30 focus:border-dash-accent resize-none transition-colors"
            placeholder="Краткая информация о себе..."
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          />
        </div>
      </div>

      {/* Role (read-only — assigned by admin) */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-dash-muted uppercase tracking-wider">Роль</h3>
        <Select
          label="Системная роль"
          value={user?.systemRole ?? 'DEVELOPER'}
          options={ROLE_OPTIONS}
          disabled
          hint="Роль назначается администратором системы"
        />
      </div>

      {/* Preferences */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-dash-muted uppercase tracking-wider">Настройки</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Часовой пояс"
            value={form.timezone}
            onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
            options={TIMEZONE_OPTIONS}
          />
          <Select
            label="Язык интерфейса"
            value={form.language}
            onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
            options={LANGUAGE_OPTIONS}
          />
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <svg className="w-4 h-4 text-red-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-400">{errorMsg}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={updateProfile.isPending}>
          Сохранить изменения
        </Button>
        {saved && (
          <span className="text-sm text-green-400 flex items-center gap-1.5">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Сохранено
          </span>
        )}
      </div>
    </form>
  );
}

function SecurityTab() {
  const { user } = useAuthStore();
  const changePassword = useChangePassword();
  const setup2FA = useSetup2FA();
  const enable2FA = useEnable2FA();
  const disable2FA = useDisable2FA();

  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwdError, setPwdError] = useState('');
  const [pwdSaved, setPwdSaved] = useState(false);

  const [twoFAData, setTwoFAData] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [twoFACode, setTwoFACode] = useState('');

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdError('Пароли не совпадают');
      return;
    }
    if (pwdForm.newPassword.length < 8) {
      setPwdError('Минимум 8 символов');
      return;
    }
    setPwdError('');
    changePassword.mutate(
      { currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword },
      {
        onSuccess: () => {
          setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setPwdSaved(true);
          setTimeout(() => setPwdSaved(false), 3000);
        },
        onError: (error: any) => {
          const msg = error?.response?.data?.message;
          if (msg === 'Current password is incorrect') {
            setPwdError('Неверный текущий пароль');
          } else {
            setPwdError(msg || 'Ошибка при смене пароля');
          }
        },
      },
    );
  };

  const handleSetup2FA = () => {
    setup2FA.mutate(undefined, {
      onSuccess: (data) => setTwoFAData(data),
    });
  };

  const handleEnable2FA = (e: React.FormEvent) => {
    e.preventDefault();
    enable2FA.mutate(twoFACode, {
      onSuccess: () => {
        setTwoFAData(null);
        setTwoFACode('');
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Password Change */}
      <section>
        <h3 className="text-sm font-semibold text-dash-muted uppercase tracking-wider mb-4">Смена пароля</h3>
        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-sm">
          <Input
            label="Текущий пароль"
            type="password"
            value={pwdForm.currentPassword}
            onChange={(e) => setPwdForm((f) => ({ ...f, currentPassword: e.target.value }))}
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
          <Input
            label="Новый пароль"
            type="password"
            value={pwdForm.newPassword}
            onChange={(e) => {
              setPwdForm((f) => ({ ...f, newPassword: e.target.value }));
              if (pwdError) setPwdError('');
            }}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Минимум 8 символов"
          />
          <Input
            label="Подтверждение нового пароля"
            type="password"
            value={pwdForm.confirmPassword}
            onChange={(e) => {
              setPwdForm((f) => ({ ...f, confirmPassword: e.target.value }));
              if (pwdError) setPwdError('');
            }}
            required
            autoComplete="new-password"
            placeholder="Повторите пароль"
            error={pwdError}
          />
          <div className="flex items-center gap-3">
            <Button type="submit" loading={changePassword.isPending}>
              Сменить пароль
            </Button>
            {pwdSaved && (
              <span className="text-sm text-green-400 flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Пароль изменён
              </span>
            )}
          </div>
        </form>
      </section>

      {/* 2FA Section */}
      <section>
        <h3 className="text-sm font-semibold text-dash-muted uppercase tracking-wider mb-4">
          Двухфакторная аутентификация
        </h3>

        {user?.twoFactorEnabled ? (
          <div className="flex items-start gap-4 p-4 rounded-card bg-green-500/10 border border-green-500/20 max-w-md">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-400">2FA включена</p>
              <p className="text-xs text-dash-muted mt-0.5 mb-3">
                Ваш аккаунт защищён двухфакторной аутентификацией
              </p>
              <Button
                variant="danger"
                size="sm"
                loading={disable2FA.isPending}
                onClick={() => disable2FA.mutate()}
              >
                Отключить 2FA
              </Button>
            </div>
          </div>
        ) : twoFAData ? (
          <div className="space-y-4 max-w-sm">
            <p className="text-sm text-dash-text">
              Отсканируйте QR-код в приложении Google Authenticator или Яндекс.Ключ:
            </p>
            <div className="p-4 bg-white rounded-lg inline-block">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(twoFAData.otpauthUrl)}&size=160x160`}
                alt="QR code"
                className="w-40 h-40"
              />
            </div>
            <p className="text-xs text-dash-muted">
              Или введите секрет вручную:{' '}
              <code className="bg-dash-border px-1 py-0.5 rounded text-dash-text font-mono">
                {twoFAData.secret}
              </code>
            </p>
            <form onSubmit={handleEnable2FA} className="space-y-3">
              <Input
                label="Код из приложения"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
              />
              {enable2FA.error && (
                <p className="text-xs text-red-400">Неверный код</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" loading={enable2FA.isPending} disabled={twoFACode.length !== 6}>
                  Подтвердить
                </Button>
                <Button type="button" variant="ghost" onClick={() => setTwoFAData(null)}>
                  Отмена
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex items-start gap-4 p-4 rounded-card bg-dash-bg border border-dash-border max-w-md">
            <div className="w-8 h-8 rounded-full bg-dash-border flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-dash-muted" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-dash-text">2FA не настроена</p>
              <p className="text-xs text-dash-muted mt-0.5 mb-3">
                Включите двухфакторную аутентификацию для защиты аккаунта
              </p>
              <Button size="sm" loading={setup2FA.isPending} onClick={handleSetup2FA}>
                Настроить 2FA
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Account info */}
      <section>
        <h3 className="text-sm font-semibold text-dash-muted uppercase tracking-wider mb-4">
          Информация об аккаунте
        </h3>
        <div className="p-4 rounded-card bg-dash-bg border border-dash-border max-w-md space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-dash-muted">ID пользователя</span>
            <span className="font-mono text-xs text-dash-text">{user?.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-dash-muted">Дата регистрации</span>
            <span className="text-dash-text">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

export function ProfilePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Профиль' },
    { key: 'security', label: 'Безопасность' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dash-text">Личный кабинет</h1>
        <p className="text-sm text-dash-muted mt-1">
          {user?.email} · {SYSTEM_ROLE_LABELS[user?.systemRole ?? 'DEVELOPER']}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-dash-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? 'border-dash-accent text-dash-accent'
                : 'border-transparent text-dash-muted hover:text-dash-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-dash-panel border border-dash-border rounded-card p-6">
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'security' && <SecurityTab />}
      </div>
    </div>
  );
}
