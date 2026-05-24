from app.scenarios.base import Scenario, ScenarioStep

scenario = Scenario(
    id="service_503",
    title="Website 503 Service Unavailable",
    description="Ana website 503 döndürüyor, kullanıcılar siteye erişemiyor.",
    severity="critical",
    affected_service="web-frontend",
    opening_step=ScenarioStep(
        member_id="deniz",
        delay=1.5,
        context="""Senaryo: Web sitesi tamamen çöktü, 503 hatası veriyor.
Müşteri hizmetleri telefon hatları dolup taştı, sosyal medyada şikayetler var.
5 dakikadır erişilemiyor.
Sen support engineer olarak durumu fark ettin.
@DevOps'u etiketleyerek acil bildir:
- Site tamamen erişilemez durumda
- 503 Service Unavailable hatası
- Kaç dakikadır devam ettiği
- Müşteri etkisi
Çok acil ve kısa yaz, maksimum 2 cümle.""",
    ),
    hints=[
        "kubectl get pods -n production ile pod durumlarına bak",
        "Ingress controller loglarını kontrol et",
        "Load balancer health check'leri başarısız olabilir — @Zeynep'e sor",
        "kubectl get events -n production --sort-by='.lastTimestamp'",
    ],
    expected_mentions=["@Ali", "@Zeynep"],
    tags=["outage", "503", "ingress", "critical"],
)
