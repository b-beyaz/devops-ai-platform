from app.scenarios.base import Scenario, ScenarioStep

scenario = Scenario(
    id="slow_deploy",
    title="Deploy Sonrası Sistem Yavaş",
    description="Son deploy sonrası payment-service yanıt süreleri kritik eşiği aştı.",
    severity="high",
    affected_service="payment-service",
    opening_step=ScenarioStep(
        member_id="deniz",
        delay=2.0,
        context="""Senaryo: Bugün saat 14:30'da yapılan deploy sonrası 
payment-service çok yavaş çalışmaya başladı. 
Müşteriler ödeme sayfasının 10-15 saniye geç açıldığını söylüyor, 
bazıları işlem tamamlanamıyor diyor.
Sen support engineer olarak bu şikayetleri aldın ve durumu fark ettin.
@DevOps'u etiketleyerek kısa ve net bildir:
- Ne zaman başladı
- Hangi servis etkileniyor  
- Kullanıcı etkisi ne
Maksimum 3 cümle.""",
    ),
    hints=[
        "kubectl top pods -n production ile CPU/memory'e bak",
        "kubectl logs payment-service-xxx -n production --tail=50",
        "DB connection pool dolmuş olabilir — @Ahmet'e sor",
        "Son deploy'da image değişti mi kontrol et",
    ],
    expected_mentions=["@Ali", "@Ahmet"],
    tags=["kubernetes", "performance", "deploy", "payment"],
)
