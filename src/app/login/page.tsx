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
import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from '@/lib/firebase/client';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("demo@ranktracker.pro");
  const [password, setPassword] = useState("demopassword");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` },
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        throw new Error('Failed to create session.');
      }
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // If user does not exist, create a new user
        try {
          const newUserCredential = await createUserWithEmailAndPassword(auth, email, password);
          const idToken = await newUserCredential.user.getIdToken();
          
          const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${idToken}` },
          });

          if (response.ok) {
            router.push('/dashboard');
          } else {
            throw new Error('Failed to create session for new user.');
          }
        } catch (createError: any) {
          toast({ variant: "destructive", title: "Hesap Oluşturma Hatası", description: createError.message });
        }
      } else {
        toast({ variant: "destructive", title: "Giriş Hatası", description: error.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <AppLogo />
          <CardTitle className="text-2xl pt-4">Hoş Geldiniz</CardTitle>
          <CardDescription>
            Devam etmek için bilgilerinizi girin. Demo hesabı otomatik olarak oluşturulacaktır.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" type="email" placeholder="ornek@mail.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
              {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
