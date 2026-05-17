import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRegister } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { SYSTEM_ROLE_LABELS } from '../../types';
import type { SystemRole } from '../../types';

const ROLE_OPTIONS = (Object.entries(SYSTEM_ROLE_LABELS) as [SystemRole, string][]).map(
  ([value, label]) => ({ value, label }),
);

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [systemRole, setSystemRole] = useState<SystemRole>('DEVELOPER');
  const [confirmError, setConfirmError] = useState('');
  const register = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setConfirmError('Пароли не совпадают');
      return;
    }
    setConfirmError('');
    register.mutate({ name, email, password, systemRole });
  };

  const errorMessage = (() => {
    const msg = (register.error as any)?.response?.data?.message;
    if (!msg) return null;
    if (msg === 'User with this email already exists') return 'Пользователь с таким email уже существует';
    return msg;
  })();

  return (
    <div className="min-h-screen flex items-center justify-center bg-dash-bg px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-dash-accent/20 border border-dash-accent/30 mb-4">
            <svg className="w-6 h-6 text-dash-accent" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-dash-text tracking-tight">Tracker</h1>
          <p className="text-sm text-dash-muted mt-1">Создайте аккаунт, чтобы начать</p>
        </div>

        <div className="bg-dash-panel border border-dash-border rounded-card p-8 shadow-glow-sm">
          <h2 className="text-lg font-semibold text-dash-text mb-6">Регистрация</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Полное имя"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              autoComplete="name"
              placeholder="Иван Иванов"
              disabled={register.isPending}
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@company.com"
              disabled={register.isPending}
            />

            <Select
              label="Роль в команде"
              value={systemRole}
              onChange={(e) => setSystemRole(e.target.value as SystemRole)}
              options={ROLE_OPTIONS}
              disabled={register.isPending}
            />

            <Input
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Минимум 8 символов"
              hint="Минимум 8 символов"
              disabled={register.isPending}
            />

            <Input
              label="Подтверждение пароля"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmError) setConfirmError('');
              }}
              required
              autoComplete="new-password"
              placeholder="Повторите пароль"
              error={confirmError}
              disabled={register.isPending}
            />

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <svg className="w-4 h-4 text-red-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-400">{errorMessage}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={register.isPending}
            >
              Создать аккаунт
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-dash-muted">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-dash-accent hover:text-blue-400 font-medium transition-colors">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
