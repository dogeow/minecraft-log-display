import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

export default function LoginPage({ errors = [], initialUsername = "" }) {
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    const resetPending = () => setSubmitting(false);
    window.addEventListener("pageshow", resetPending);
    return () => window.removeEventListener("pageshow", resetPending);
  }, []);
  const csrfToken =
    document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content") ?? "";

  return (
    <main className="archive-login-wrap">
      <section className="archive-login-card">
        <div className="archive-login-icon">
          <ShieldCheck size={26} aria-hidden="true" />
        </div>
        <p className="archive-eyebrow">SERVER ARCHIVE</p>
        <h1>管理员登录</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          使用已有管理员账号进入服务器档案控制台
        </p>
        {errors.length > 0 && (
          <div className="archive-error" role="alert" id="login-errors">
            {errors.map((error, i) => (
              <p key={i}>{error}</p>
            ))}
          </div>
        )}
        <form
          method="POST"
          action="/login"
          className="space-y-5"
          onSubmit={(event) => {
            if (submitting) event.preventDefault();
            else setSubmitting(true);
          }}
        >
          <input type="hidden" name="_token" value={csrfToken} />
          <label className="block">
            <span className="archive-field-label">用户名</span>
            <Input
              type="text"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              autoFocus
              aria-describedby={errors.length ? "login-errors" : undefined}
            />
          </label>
          <label className="block">
            <span className="archive-field-label">密码</span>
            <span className="relative block">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={password}
                className="pr-11"
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-2.5"
                aria-label={showPassword ? "隐藏密码" : "显示密码"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "正在登录…" : "进入管理控制台"}
          </Button>
        </form>
        <p className="my-5 text-xs text-muted-foreground">
          只有已授予管理员权限的账号可以登录
        </p>
        <Link to="/" className="archive-back">
          <ArrowLeft size={14} aria-hidden="true" />
          返回服务器首页
        </Link>
      </section>
    </main>
  );
}
