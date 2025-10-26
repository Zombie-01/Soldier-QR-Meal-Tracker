'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from './auth-provider';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';
import Link from 'next/link';


export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false); // toggle between login/register
  const { signIn, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password);
        toast.success('Бүртгэл амжилттай боллоо');
      } else {
        await signIn(email, password);
        toast.success('Амжилттай нэвтэрлээ');
      }
      setEmail('');
      setPassword('');
    } catch (error: any) {
      toast.error(isRegister ? 'Бүртгэл амжилтгүй' : 'Нэвтрэх амжилтгүй', {
        description: error.message || (isRegister ? 'И-мэйл аль хэдийн бүртгэгдсэн байна' : 'И-мэйл эсвэл нууц үг буруу байна'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">{isRegister ? 'Шинэ хэрэглэгчийн бүртгэл' : 'Жижүүрийн нэвтрэлт'}</CardTitle>
          <CardDescription>
            Хоолны хуваарилалтын систем
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">И-мэйл хаяг</Label>
              <Input
                id="email"
                type="email"
                placeholder="sergent@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Нууц үг</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (isRegister ? 'Бүртгүүлж байна...' : 'Нэвтэрч байна...') : (isRegister ? 'Бүртгүүлэх' : 'Нэвтрэх')}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            {isRegister ? 'Өмнө нь бүртгүүлсэн үү?' : 'Шинэ хэрэглэгч үү?'}{' '}
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-blue-600 hover:underline"
            >
              {isRegister ? 'Нэвтрэх' : 'Бүртгүүлэх'}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
