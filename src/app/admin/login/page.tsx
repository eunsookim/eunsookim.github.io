"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Terminal } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("이메일 또는 비밀번호가 올바르지 않습니다");
      setIsLoading(false);
      return;
    }

    // Use hard navigation so the middleware can properly read the new auth
    // cookies on the next request (router.push would use client-side nav
    // and the middleware would not see the updated session).
    window.location.href = "/admin";
  }

  return (
    <div className="flex min-h-[calc(100svh-8rem)] items-center justify-center px-4">
      <Card className="w-full max-w-sm border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Terminal className="size-5 text-primary" />
          </div>
          <CardTitle className="font-mono text-xl text-primary">
            Admin Login
          </CardTitle>
          <CardDescription className="font-mono text-xs text-muted-foreground">
            $ sudo authenticate --admin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="font-mono text-xs">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@eunsookim.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="font-mono"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="font-mono text-xs">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="font-mono"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full font-mono"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
