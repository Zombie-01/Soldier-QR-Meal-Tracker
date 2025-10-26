'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase, Soldier, getCurrentMealType } from '@/lib/supabase';
import { toast } from 'sonner';
import { LogOut, RefreshCw, Users, UtensilsCrossed } from 'lucide-react';
import { useAuth } from './auth-provider';
import { QRScanner } from './qr-scanner';
import { format } from 'date-fns';

export function Dashboard() {
  const [soldiers, setSoldiers] = useState<Soldier[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const { signOut } = useAuth();

  const loadSoldiers = async () => {
    try {
      const { data, error } = await supabase
        .from('soldiers')
        .select('*')
        .order('last_scan', { ascending: false });

      if (error) throw error;
      setSoldiers(data || []);
    } catch (error) {
      console.error('Error loading soldiers:', error);
      toast.error('Мэдээлэл ачаалах алдаа');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSoldiers();

    const channel = supabase
      .channel('soldiers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'soldiers' }, () => {
        loadSoldiers();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleManualReset = async () => {
    if (!confirm('Бүх өгөгдлийг шинэчлэх үү? Энэ үйлдлийг буцаах боломжгүй.')) {
      return;
    }

    setResetting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/daily-reset`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Reset failed');

      toast.success('Амжилттай шинэчлэгдлээ');
      await loadSoldiers();
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('Шинэчлэх алдаа гарлаа');
    } finally {
      setResetting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.info('Гарлаа');
    } catch (error) {
      toast.error('Гарах үед алдаа гарлаа');
    }
  };

  const getTotalMealsServed = () => {
    return soldiers.reduce((sum, soldier) => sum + soldier.total_meals, 0);
  };

  const getMealTypeLabel = (type: 'breakfast' | 'lunch' | 'dinner') => {
    switch (type) {
      case 'breakfast':
        return 'Өглөө';
      case 'lunch':
        return 'Өдөр';
      case 'dinner':
        return 'Орой';
    }
  };

  const currentMealType = getCurrentMealType();

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto p-4 max-w-7xl space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Хоолны хяналтын систем</h1>
            <p className="text-slate-600 mt-1">
              {currentMealType ? (
                <>
                  Одоогийн цаг: <Badge variant="default">{getMealTypeLabel(currentMealType)}</Badge>
                </>
              ) : (
                <span className="text-amber-600">Хоолны цаг биш</span>
              )}
            </p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Гарах
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Нийт цэрэг</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{soldiers.length}</div>
              <p className="text-xs text-muted-foreground">Өнөөдөр идсэн</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Хоолны тоо</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalMealsServed()}</div>
              <p className="text-xs text-muted-foreground">Нийт хуваарилсан</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Дундаж</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {soldiers.length > 0 ? (getTotalMealsServed() / soldiers.length).toFixed(1) : '0'}
              </div>
              <p className="text-xs text-muted-foreground">Хоол/цэрэг</p>
            </CardContent>
          </Card>
        </div>

        <QRScanner />

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Өнөөдрийн тайлан</CardTitle>
                <CardDescription>Бүх цэргийн хоолны бүртгэл</CardDescription>
              </div>
              <div className="space-x-2">
                <Button onClick={loadSoldiers} variant="outline" size="sm" disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Шинэчлэх
                </Button>
                <Button onClick={handleManualReset} variant="destructive" size="sm" disabled={resetting}>
                  {resetting ? 'Шинэчилж байна...' : 'Бүгдийг арилгах'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Ачааллаж байна...</div>
            ) : soldiers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Өнөөдөр хоол идсэн цэрэг байхгүй байна
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Нэр</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead className="text-center">Өглөө</TableHead>
                      <TableHead className="text-center">Өдөр</TableHead>
                      <TableHead className="text-center">Орой</TableHead>
                      <TableHead className="text-center">Нийт</TableHead>
                      <TableHead>Сүүлд скан хийсэн</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {soldiers.map((soldier) => (
                      <TableRow key={soldier.id}>
                        <TableCell className="font-medium">{soldier.name}</TableCell>
                        <TableCell className="text-muted-foreground">{soldier.soldier_id}</TableCell>
                        <TableCell className="text-center">
                          {soldier.breakfast ? (
                            <Badge variant="default" className="bg-green-600">
                              ✓
                            </Badge>
                          ) : (
                            <Badge variant="outline">-</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {soldier.lunch ? (
                            <Badge variant="default" className="bg-green-600">
                              ✓
                            </Badge>
                          ) : (
                            <Badge variant="outline">-</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {soldier.dinner ? (
                            <Badge variant="default" className="bg-green-600">
                              ✓
                            </Badge>
                          ) : (
                            <Badge variant="outline">-</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={soldier.total_meals === 3 ? 'default' : 'secondary'}
                            className={soldier.total_meals === 3 ? 'bg-blue-600' : ''}
                          >
                            {soldier.total_meals}/3
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(soldier.last_scan), 'HH:mm:ss')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
