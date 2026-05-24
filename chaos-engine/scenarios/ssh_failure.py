from app.scenarios.base import Scenario, ScenarioStep

scenario = Scenario(
    id="ssh_failure",
    title="Makineye SSH Bağlantısı Kurulamıyor",
    description="Production node'larına SSH erişimi kesildi, uzaktan yönetim mümkün değil.",
    severity="critical",
    affected_service="production-nodes",
    opening_step=ScenarioStep(
        member_id="deniz",
        delay=2.0,
        context="""Senaryo: Ekipten biri production sunucularına SSH ile bağlanamadığını söyledi.
Birden fazla node'da aynı sorun var. 
VPN üzerinden denendi, yine olmadı.
Monitoring dashboardu da veri gelmiyor diyor.
Sen support engineer olarak durumu öğrendin.
@DevOps'u etiketleyerek bildir:
- SSH bağlantısı tamamen kesilmiş
- Kaç node etkileniyor
- VPN'de de denendi, sonuç yok
- Monitoring da etkilenmiş
Kısa ve net, maksimum 3 cümle.""",
    ),
    hints=[
        "Firewall kurallarını kontrol et — @Zeynep'e sor",
        "SSH port (22) erişilebilir mi: nc -zv <ip> 22",
        "Cloud provider security group değişikliği olabilir",
        "Bastion host üzerinden denendi mi?",
    ],
    expected_mentions=["@Zeynep", "@Ali"],
    tags=["ssh", "network", "firewall", "access"],
)
