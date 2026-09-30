# Roadmap

Bu dosya, repodaki mevcut duruma bakarak yapılması gereken işleri adım adım sıralar. Her madde repodaki bir dosyaya veya eksikliğe dayanır. Ayrıntılı durum analizi için [`project-status.md`](project-status.md) dosyasına bakılabilir.

İşler iki gruba ayrılmıştır:

- **🔴 Acil (Kritik):** Güvenlik açığı oluşturan veya sistemin çalışmasını engelleyen işler. Diğer işlere geçmeden önce yapılmalı.
- **🟠 Sonraki (Yapılmalı):** Platformun hedeflenen akışını tamamlayan ve kaliteyi artıran işler. Acil işler bittikten sonra sırayla yapılmalı.

---

## 🔴 Aşama 1: Acil (Kritik) İşler

### Adım 1. Sealed Secrets private key'ini repodan kaldır
- `infra/k8s/base/sealed-secrets-key-backup.yaml` git'e commit edilmiş. Repoya erişimi olan herkes tüm SealedSecret'ların şifresini çözebilir.
- Yapılacaklar:
  1. Sealed Secrets controller key'ini yenile (rotate).
  2. Dosyayı repodan ve git geçmişinden sil (`git filter-repo` vb.), `.gitignore`'a ekle.
  3. Key yedeğini repo dışında (güvenli bir kasada) sakla.
  4. `dropbox-secret`'ı yeni key ile tekrar seal et.

### Adım 2. Senaryoları backend'e bağla
- `routers/webhook.py` ve `agents/scenario_engine.py` `SCENARIOS` değişkenini kullanıyor ama import satırı yorum satırı. `/scenario/start` ve `/scenario/list` çağrılınca `NameError` alınır.
- Senaryolar `chaos-engine/scenarios/` altında ama `from app.scenarios...` diye import ediyor; `ai-platform/backend/app/scenarios/` içinde sadece bir README var.
- Yapılacaklar:
  1. Senaryoların backend'e nasıl yükleneceğine karar ver: paket olarak mı, `PYTHONPATH` ile mi, yoksa kopyalayarak mı.
  2. Import satırını düzelt ve iki endpoint'in çalıştığını doğrula.

### Adım 3. Logger çağrılarını düzelt
- `logger` standart `logging.Logger`, ama `logger.warning("webhook", f"...")` gibi iki argümanla çağrılıyor (`webhook.py`, `scenario_engine.py`). Log mesajı kayboluyor ve formatlama hatası basılıyor.
- Yapılacak: Çağrıları tek mesaj argümanı alacak şekilde düzelt.

### Adım 4. GitOps bootstrap'ı tamamla
- `setup.sh` "6. Create Generic SSH Key If Not Exist" yazdırıyor ama `create-deploy-ssh-key.sh` çağrılmıyor. Bu yüzden Image Updater git'e write-back yapamaz.
- Image Updater `pullsecret:argocd/dockerhub-creds` kullanıyor, ama bu secret'ı oluşturan bir script yok.
- Yapılacaklar:
  1. `setup.sh` içinde `create-deploy-ssh-key.sh` çağrısını ekle.
  2. `dockerhub-creds` secret'ını oluşturan bir script ekle ve `setup.sh`'e bağla.

### Adım 5. Uygulamadaki güvenlik ve doğruluk hatalarını düzelt
- `POST /users/create` şifreyi encode etmeden kaydediyor; şifre düz metin tutuluyor ve cevapta geri dönüyor (`UserController.java`, `UserService.java`).
- `/upload` için CSRF koruması kapalı (`SecurityConfig.java`).
- `/actuator/health` `show-details=always` ile herkese açık; `/actuator/prometheus` da açık.
- Paylaşım linki `http://localhost:8080/uploads/<filename>` üretiyor; uygulama 8085'te dinliyor ve `/uploads/{id}` sayısal ID bekliyor.
- `POST /users/register` bir `@RestController` içinde olduğu için yönlendirme yerine `"redirect:/login"` metnini döndürüyor.

### Adım 6. Bekleyen değişiklikleri commit et
- Commit edilmemiş değişiklikler: `agent_service.py` (mention ile yönlendirme, model değişikliği), `Sidebar.tsx` (support rolü), `chatStore.ts` (Deniz karakteri).
- Git'e eklenmemiş: `observability/`, `chaos-engine/context.md`, `docs/`.
- `observability/signoz/README.md` silinmiş olarak stage'de bekliyor.
- Yapılacak: Değişiklikleri test et ve anlamlı commit'ler halinde gönder.

---

## 🟠 Aşama 2: Sonraki (Yapılmalı) İşler

### Adım 7. CI'a test ve güvenlik taraması ekle
- `ci.yml` testleri koşturmadan image build edip push ediyor; Dockerfile `-DskipTests` kullanıyor.
- "Scan Image" adımı sadece `echo` yapıyor.
- Yapılacaklar:
  1. `mvn test` (veya `mvn verify`) adımı ekle.
  2. Boş olan `FileControllerTests.java` dosyasını sil (`FileControllerTest.java` ile tekrar ediyor).
  3. Gerçek Trivy taraması ekle.
  4. Image'ı tek sefer build et (`test-build` + push yerine).
  5. `dockerize-branch` tetikleyicisinin hâlâ gerekli olup olmadığını kontrol et.

### Adım 8. Observability stack'ini kur
- Prometheus, Grafana, Loki ve Alloy values dosyaları var ama bunları kuran bir script veya ArgoCD Application yok.
- Yapılacaklar:
  1. Her bileşen için ArgoCD Application (veya kurulum scripti) ekle.
  2. Grafana'ya Prometheus ve Loki datasource'larını ekle (şu an `datasources: {}`), persistence'ı aç.
  3. dropbox-app için JVM/HTTP/MySQL dashboard'ları ekle.

### Adım 9. Alert akışını uçtan uca kur
- Prometheus'ta alert kuralı yok (`alertmanagers: []`). Platformun "alert → AI ekip" akışı buna dayanıyor.
- Yapılacaklar:
  1. dropbox-app için Prometheus alert kuralları yaz (pod down, yüksek hata oranı, yüksek gecikme vb.).
  2. Alertmanager receiver'ını ai-platform'daki `POST /webhook` ucuna bağla.
  3. `decide_responder` içinde `alert_context`'in kullanılmasını sağla.
  4. Akışı uçtan uca test et: Prometheus kuralı → Alertmanager → `/webhook` → AI ekip.

### Adım 10. Helm chart hatalarını düzelt
- `templates/secret.yaml` `.Values.createSecret` değerine bakıyor, oysa `values.yaml` içinde `image.createSecret` tanımlı.
- MySQL Deployment uygulamanın `replicaCount` değerini kullanıyor; prod'da tek RWO PVC üzerinde 2 MySQL pod'u açılır. Checksum annotation'ı MySQL'in değil uygulamanın `configmap.yaml` dosyasına bakıyor.
- Sealed secret'ta mail kullanıcı adı/şifresi yok, Deployment'a mail env değişkenleri verilmiyor.
- Yapılacaklar:
  1. `createSecret` anahtarını düzelt.
  2. MySQL için ayrı replica değeri ve doğru checksum kullan; StatefulSet'e geçir, liveness/readiness probe ekle.
  3. Mail bilgilerini sealed secret'a ve Deployment env'ine ekle.

### Adım 11. Chaos engine'e gerçek fault injection ekle
- `fault-library/` ve `blast-radius-controller/` boş klasörler. Senaryolar cluster'da gerçekten bir arıza oluşturmuyor.
- Senaryolar `web-frontend`, `payment-service` ve `-n production` gibi hedeflere atıf yapıyor; cluster'da yalnızca `dropbox` uygulaması ve `dropbox-dev` namespace'i var.
- Yapılacaklar:
  1. Her senaryo için somut bir arıza aksiyonu tanımla: pod silme, gecikme veya 503 enjeksiyonu, kaynak kısıtlama vb.
  2. Blast-radius sınırı (namespace/label kısıtı) ve geri alma (rollback) mekanizması ekle.
  3. Senaryoları `dropbox` uygulamasına ve `dropbox-dev` namespace'ine uyarla.
  4. `context.md` dosyasını chaos engine'in amacını ve yapısını anlatacak şekilde doldur.

### Adım 12. Scenario engine'i tamamla
- Engine sadece açılış adımını çalıştırıyor. `hints`, `expected_mentions` ve `tags` alanları hiçbir yerde kullanılmıyor.
- Yapılacaklar: Çok adımlı akış, ipucu verme, doğru kişiyi etiketleme kontrolü ve puanlama ekle.

### Adım 13. Lokal geliştirme ortamını düzelt
- docker-compose `./docker/mysql/init.sql` ve `./nginx/...` dosyalarını mount ediyor ama bu dosyalar `infra/docker/` ve `infra/nginx/` altında.
- Nginx `dropbox-app-dev` ve `dropbox-app-prod` host'larına yönleniyor, compose'daki servis adı ise `app`.
- `application-docker.properties` `server.port` değerini iki kez tanımlıyor (8080, sonra 8085).
- `pom.xml` Java 17, Dockerfile Temurin 21 kullanıyor; tek sürümde birleşilmeli.
- SigNoz kalıntısı: compose'daki OTEL değişkenleri `signoz-otel-collector` ve harici `signoz-net` ağını gösteriyor. SigNoz kullanılmaya devam edilecek mi, karar verilmeli.

### Adım 14. Prod ortamını tanımla
- `values-prod.yaml` mevcut, ancak onu kullanan bir ArgoCD Application yok. Sealed secret sadece `dropbox-dev` için var. Ingress host'u placeholder (`dropbox.yourdomain.com`).
- Yapılacaklar: Prod ArgoCD Application'ı, prod sealed secret'ı ve gerçek ingress host'unu ekle.

### Adım 15. AI platformu paketle ve güvenli hale getir
- ai-platform için Dockerfile, Helm chart veya CI adımı yok.
- CORS `allow_origins=["*"]`; WebSocket ve webhook uçlarında kimlik doğrulama yok. Erişebilen herkes alert enjekte edebilir veya Claude API kredisi harcayabilir.
- Frontend'de `ws://localhost:8002/ws` sabit yazılmış.
- Yapılacaklar:
  1. Dockerfile, Helm chart ve CI adımı ekle.
  2. CORS'u kısıtla, WebSocket ve webhook uçlarına kimlik doğrulama ekle.
  3. Endpoint adreslerini yapılandırılabilir yap.
  4. Konuşma geçmişini kalıcı bir depoya taşı (şu an yalnızca bellekte, `conversation_store`).
  5. Boş `app/models/` ve `app/services/` modüllerini ve `backend/main.py` entrypoint'ini netleştir.

### Adım 16. Setup scriptlerini taşınabilir yap
- Scriptler sabit mutlak yollara (`/mnt/c/devops-ai-platform`, `/home/adminlocal`) bağlı.
- Minikube kurulumu ve addon'lar (ingress, metrics-server) scriptlerde yok; HPA ve Ingress bunlara bağlı.
- Yapılacaklar: Yolları göreli/parametrik yap, minikube başlatma ve addon adımlarını ekle.

### Adım 17. Teknik borcu azalt ve dokümantasyonu tamamla
- Bağımlılıkları güncelle: `c3p0 0.9.1.2`, `json-lib 2.4`, `hibernate-c3p0 7.0.0.CR1` (release candidate), Spring Boot 3.1.5.
- `spring.main.allow-circular-references=true` ile gizlenen döngüsel bağımlılığı çöz.
- Observability values dosyalarını sadece değiştirilen değerleri tutacak şekilde sadeleştir.
- Ekip listesini tek kaynakta topla (`roles.py` ve `chatStore.ts` arasında isimler ayrışmış: "Deniz Şahin" / "Deniz Sahin").
- Alert ve WebSocket mesaj şemalarını `shared/schemas` ve `shared/events` altına ortak kontrat olarak taşı.
- Kök `README.md`'ye kurulum, çalıştırma ve mimari anlatımı ekle; `frontend/README.md` Vite şablonunu değiştir.

---

## Özet Sıra

| Aşama | Adım | İş |
|---|---|---|
| 🔴 Acil | 1 | Sealed Secrets key'ini rotate et ve repodan kaldır |
| 🔴 Acil | 2 | `SCENARIOS` bağlantısını düzelt |
| 🔴 Acil | 3 | Logger çağrılarını düzelt |
| 🔴 Acil | 4 | `setup.sh` 6. adımı ve `dockerhub-creds` secret'ı |
| 🔴 Acil | 5 | Uygulama güvenlik ve doğruluk hataları |
| 🔴 Acil | 6 | Bekleyen değişiklikleri commit et |
| 🟠 Sonraki | 7 | CI'a test ve Trivy ekle |
| 🟠 Sonraki | 8 | Observability stack'ini kur |
| 🟠 Sonraki | 9 | Alert akışını uçtan uca kur |
| 🟠 Sonraki | 10 | Helm chart hatalarını düzelt |
| 🟠 Sonraki | 11 | Chaos engine fault injection |
| 🟠 Sonraki | 12 | Scenario engine'i tamamla |
| 🟠 Sonraki | 13 | Lokal geliştirme ortamını düzelt |
| 🟠 Sonraki | 14 | Prod ortamını tanımla |
| 🟠 Sonraki | 15 | AI platformu paketle ve güvenli hale getir |
| 🟠 Sonraki | 16 | Setup scriptlerini taşınabilir yap |
| 🟠 Sonraki | 17 | Teknik borç ve dokümantasyon |
