'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Wifi, WifiOff, Upload } from 'lucide-react';
import { getPendingScans, clearPendingScans, isOnline } from '@/lib/offline-storage';
import { supabase, MealType } from '@/lib/supabase';

export function OfflineSync() {
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const status = isOnline();
      setOnline(status);
      if (status && pendingCount > 0) {
        syncPendingScans();
      }
    };

    const updatePendingCount = () => {
      setPendingCount(getPendingScans().length);
    };

    updateOnlineStatus();
    updatePendingCount();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    const interval = setInterval(updatePendingCount, 2000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, [pendingCount]);

  const syncPendingScans = async () => {
    if (syncing || !isOnline()) return;

    const pending = getPendingScans();
    if (pending.length === 0) return;

    setSyncing(true);
    let successCount = 0;
    let failedCount = 0;

    for (const scan of pending) {
      try {
        const { data: existing, error: fetchError } = await supabase
          .from('soldiers')
          .select('*')
          .eq('soldier_id', scan.soldier_id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!existing) {
          const { error: insertError } = await supabase.from('soldiers').insert({
            soldier_id: scan.soldier_id,
            name: scan.name,
            total_meals: 1,
            [scan.mealType]: true,
            last_scan: scan.timestamp,
          });

          if (insertError) throw insertError;
          successCount++;
        } else {
          if (existing[scan.mealType as MealType] || existing.total_meals >= 3) {
            failedCount++;
            continue;
          }

          const { error: updateError } = await supabase
            .from('soldiers')
            .update({
              total_meals: existing.total_meals + 1,
              [scan.mealType]: true,
              last_scan: scan.timestamp,
            })
            .eq('soldier_id', scan.soldier_id);

          if (updateError) throw updateError;
          successCount++;
        }
      } catch (error) {
        console.error('Sync error:', error);
        failedCount++;
      }
    }

    if (failedCount === 0) {
      clearPendingScans();
      setPendingCount(0);
      toast.success('Синк амжилттай', {
        description: `${successCount} скан синк хийгдлээ`,
      });
    } else {
      toast.warning('Зарим скан синк хийгдсэнгүй', {
        description: `Амжилттай: ${successCount}, Амжилтгүй: ${failedCount}`,
      });
    }

    setSyncing(false);
  };

  if (online && pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border p-4 space-y-3 max-w-xs">
        <div className="flex items-center gap-2">
          {online ? (
            <Wifi className="h-5 w-5 text-green-600" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-600" />
          )}
          <span className="font-medium">
            {online ? 'Онлайн' : 'Офлайн'}
          </span>
          {pendingCount > 0 && (
            <Badge variant="secondary">{pendingCount} хүлээгдэж байна</Badge>
          )}
        </div>

        {pendingCount > 0 && (
          <>
            <p className="text-sm text-muted-foreground">
              {online
                ? 'Интернэт холбогдсон. Синк хийх боломжтой.'
                : 'Интернэт холбогдоогүй. Скан локал хадгалагдсан.'}
            </p>
            {online && (
              <Button
                onClick={syncPendingScans}
                disabled={syncing}
                size="sm"
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {syncing ? 'Синк хийж байна...' : 'Одоо синк хийх'}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
