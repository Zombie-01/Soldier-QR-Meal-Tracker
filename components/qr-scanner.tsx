'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, CameraOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, parseQRCode, getCurrentMealType, Soldier, MealType } from '@/lib/supabase';
import { savePendingScan, isOnline } from '@/lib/offline-storage';

export function QRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = 'qr-reader';

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop();
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrCodeRegionId);
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        undefined
      );

      setIsScanning(true);
      toast.info('Камер идэвхжлээ', {
        description: 'QR код уншихад бэлэн',
      });
    } catch (error) {
      console.error('Error starting scanner:', error);
      toast.error('Камер ашиглах боломжгүй', {
        description: 'Камерын зөвшөөрөл шаардлагатай',
      });
    }
  };

  const stopScanning = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
        setIsScanning(false);
        toast.info('Камер зогссон');
      }
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    if (decodedText === lastResult) {
      return;
    }

    setLastResult(decodedText);
    setTimeout(() => setLastResult(''), 3000);

    await stopScanning();

    
    const trimmedText = decodedText.trim();
    alert(trimmedText)
    const parsed = parseQRCode(trimmedText);

    if (!parsed) {
      toast.error('Буруу QR код', {
        description: 'QR кодны формат буруу байна',
      });
      return;
    }

      const mealType = getCurrentMealType();

    if (!mealType) {
      toast.error('Хоолны цаг биш', {
        description: 'Хоолны цагийн хугацаанд скан хийнэ үү',
      });
      return;
    }


    if (!isOnline()) {
      savePendingScan({
        soldier_id: parsed.soldier_id,
        name: parsed.name,
        mealType,
        timestamp: new Date().toISOString(),
      });
      toast.warning('Офлайн горимд хадгалагдлаа', {
        description: 'Интернет холбогдсоны дараа синк хийгдэнэ',
      });
      return;
    }

    await processScan(parsed.soldier_id, parsed.name, mealType);
  };

  const processScan = async (soldier_id: string, name: string, mealType: MealType) => {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('soldiers')
        .select('*')
        .eq('soldier_id', soldier_id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!existing) {
        const { error: insertError } = await supabase.from('soldiers').insert({
          soldier_id,
          name,
          total_meals: 1,
          [mealType]: true,
          last_scan: new Date().toISOString(),
        });

        if (insertError) throw insertError;

        toast.success('Амжилттай бүртгэгдлээ! 🎉', {
          description: `${name} - ${getMealTypeMongolian(mealType)}`,
        });
        return;
      }

      if ((existing as Soldier)[mealType]) {
        toast.error('Давхардсан', {
          description: `${name} ${getMealTypeMongolian(mealType)}-г аль хэдийн идсэн`,
        });
        return;
      }

      if ((existing as Soldier).total_meals >= 3) {
        toast.error('Хязгаарт хүрсэн', {
          description: `${name} өдрийн лимитэд хүрсэн (3/3)`,
        });
        return;
      }

      const { error: updateError } = await supabase
        .from('soldiers')
        .update({
          total_meals: (existing as Soldier).total_meals + 1,
          [mealType]: true,
          last_scan: new Date().toISOString(),
        })
        .eq('soldier_id', soldier_id);

      if (updateError) throw updateError;

      toast.success('Амжилттай! ✅', {
        description: `${name} - ${getMealTypeMongolian(mealType)} (${(existing as Soldier).total_meals + 1}/3)`,
      });
    } catch (error) {
      console.error('Scan processing error:', error);
      toast.error('Алдаа гарлаа', {
        description: 'Дахин оролдоно уу',
      });
    }
  };

  const getMealTypeMongolian = (meal: MealType): string => {
    switch (meal) {
      case 'breakfast':
        return 'Өглөөний цай';
      case 'lunch':
        return 'Өдрийн хоол';
      case 'dinner':
        return 'Оройн хоол';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div
          id={qrCodeRegionId}
          className="w-full rounded-lg overflow-hidden bg-gray-100"
          style={{ minHeight: isScanning ? '300px' : '0px' }}
        />

        <div className="flex justify-center">
          {!isScanning ? (
            <Button onClick={startScanning} size="lg" className="w-full max-w-xs">
              <Camera className="mr-2 h-5 w-5" />
              Скан эхлүүлэх
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="destructive" size="lg" className="w-full max-w-xs">
              <CameraOff className="mr-2 h-5 w-5" />
              Скан зогсоох
            </Button>
          )}
        </div>

        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>Цэргийн QR кодыг камер руу чиглүүлэн скан хийнэ үү</p>
          <div className="flex justify-center gap-4 pt-2">
            <div className="text-xs">
              <span className="font-semibold">Өглөө:</span> 06:00-10:00
            </div>
            <div className="text-xs">
              <span className="font-semibold">Өдөр:</span> 11:00-15:00
            </div>
            <div className="text-xs">
              <span className="font-semibold">Орой:</span> 17:00-21:00
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
