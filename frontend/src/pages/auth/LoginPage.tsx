import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogin } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password, twoFactorCode: twoFactorCode || undefined },
      {
        onError: (error: any) => {
          const message = error?.response?.data?.message;
          if (message === 'Two-factor code required') {
            setShowTwoFactor(true);
          }
        },
      },
    );
  };

  const errorMessage = (() => {
    const msg = (login.error as any)?.response?.data?.message;
    if (!msg || msg === 'Two-factor code required') return null;
    if (msg === 'Invalid credentials') return 'Неверный email или пароль';
    if (msg === 'Invalid two-factor code') return 'Неверный код 2FA';
    return msg;
  })();

  return (
    <div className="min-h-screen flex items-center justify-center bg-dash-bg px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-dash-accent/20 border border-dash-accent/30 mb-4">
            <svg className="w-6 h-6 text-dash-accent" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-dash-text tracking-tight">Tracker</h1>
          <p className="text-sm text-dash-muted mt-1">Система управления задачами</p>
        </div>

        <div className="bg-dash-panel border border-dash-border rounded-card p-8 shadow-glow-sm">
          <h2 className="text-lg font-semibold text-dash-text mb-6">Вход в систему</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@company.com"
              disabled={login.isPending}
            />
            <Input
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={login.isPending}
            />

            {showTwoFactor && (
              <div className="animate-in slide-in-from-top-2">
                <Input
                  label="Код двухфакторной аутентификации"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  hint="Введите 6-значный код из приложения аутентификатора"
                  autoFocus
                />
              </div>
            )}

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
              loading={login.isPending}
            >
              {showTwoFactor ? 'Подтвердить' : 'Войти'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-dash-muted">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-dash-accent hover:text-blue-400 font-medium transition-colors">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
