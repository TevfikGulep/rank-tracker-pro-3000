"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLogo } from '@/components/app-logo';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Simulate successful authentication
    document.cookie = 'auth=true; path=/; max-age=3600'; // Expires in 1 hour
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <AppLogo />
          <CardTitle className="text-2xl pt-4">Hoş Geldiniz</CardTitle>
          <CardDescription>
            Devam etmek için bilgilerinizi girin
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" type="email" placeholder="ornek@mail.com" required defaultValue="demo@ranktracker.pro" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input id="password" type="password" required defaultValue="demopassword" />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">Giriş Yap</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
