# SigNoz

SigNoz kaynak kodu bu repoda bulunmaz.
Kurulum için resmi yöntemi kullan:

```bash
# Docker ile kurulum
git clone https://github.com/SigNoz/signoz.git
cd signoz/deploy/docker/clickhouse-setup
docker-compose up -d
```

## Konfigürasyon
Proje özelinde konfigürasyonlar bu klasörde tutulur:
- `docker-compose.yaml` — override dosyası
- `helm/` — k8s kurulumu için helm values
