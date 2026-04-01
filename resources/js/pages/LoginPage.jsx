import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

export default function LoginPage({ errors = [] }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const csrfToken =
    document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content") ?? "";

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>管理员登录</CardTitle>
        </CardHeader>
        <CardContent>
          {errors && errors.length > 0 && (
            <div className="mb-4 text-sm text-destructive">{errors[0]}</div>
          )}

          <form method="POST" action="/login" className="space-y-4">
            <input type="hidden" name="_token" value={csrfToken} />

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="username">
                用户名
              </label>
              <Input
                type="text"
                name="username"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                密码
              </label>
              <Input
                type="password"
                name="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              登录
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
