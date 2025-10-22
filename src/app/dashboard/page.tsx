// Bu sayfa artık kullanılmıyor, yönlendirme layout'ta yapılıyor.
// Ancak olası bir durumda fallback olarak kalabilir.
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  // Layout'taki useEffect yönlendirmeyi halledecektir.
  // Bu sayfanın direkt yüklenmesi pek olası değil.
  // Ama yine de bir fallback oluşturalım.
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
      <div className="flex flex-col items-center gap-2 text-center">
        <h3 className="text-2xl font-bold tracking-tight">
          Proje Yükleniyor...
        </h3>
        <p className="text-sm text-muted-foreground">
          Başlamak için bir proje seçin veya yeni bir tane oluşturun.
        </p>
      </div>
    </div>
  )
}
