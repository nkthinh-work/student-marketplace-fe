# Deploy frontend với Docker Compose

Repo: `student-marketplace-fe` (React + TypeScript + Vite). Bộ cấu hình này chỉ triển khai frontend dưới dạng static site (Nginx); API, Redis, PostgreSQL và worker không được đưa vào Compose frontend.

## 1. Chuẩn bị

Server cần Docker Engine + Docker Compose plugin, tên miền (nếu dùng HTTPS), và quyền truy cập backend đang chạy.

```bash
git clone <URL_REPO_FRONTEND>
cd student-marketplace-fe
cp .env.docker.example .env.docker
```

Chỉnh `.env.docker`:
- Điền `VITE_FIREBASE_*` theo file `.env` đang dùng của frontend. Chỉ lấy cấu hình **Firebase Web**; không đưa Firebase service-account JSON hoặc API secret backend vào frontend.
- `VITE_API_BASE_URL` phải là **origin backend được trình duyệt truy cập được**, ví dụ `https://api.choptiters.id.vn`, KHÔNG phải `http://localhost:8000` hay hostname Docker nội bộ khi BE chạy trên một server khác.
- `VITE_WS_BASE_URL` có thể để trống; code hiện tại tự chuyển API `https://` thành WebSocket `wss://` cùng hostname.
- Mặc định container chỉ publish trên `127.0.0.1:8080` để đặt sau reverse proxy có HTTPS. Có thể đổi `FRONTEND_PORT` nếu cổng đã dùng.

File `.env.docker` đã được `.gitignore` hiện tại bỏ qua (`.env.*`); không commit file thật.

## 2. Build và chạy

```bash
docker compose --env-file .env.docker config
docker compose --env-file .env.docker up -d --build
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f frontend
```

Kiểm tra trên host server:

```bash
curl -I http://127.0.0.1:8080/
curl -I http://127.0.0.1:8080/products/123
curl http://127.0.0.1:8080/healthz
```

Đường `/products/123` trả về SPA HTML thay vì 404 (không đảm bảo ID thực sự tồn tại).

## 3. Cấu hình tên miền và backend

Trỏ domain FE về server của bạn, cấu hình HTTPS tại reverse proxy (Caddy, Nginx Proxy Manager, hoặc Nginx trên host) để proxy tới `http://127.0.0.1:8080`. TLS không do container FE cấp sẵn.

Nếu dùng reverse proxy Nginx trên host, ví dụ **bên trong `server` đã có TLS**:

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Chú ý:
1. Backend FastAPI phải thêm **origin frontend mới**, ví dụ `https://fe.example.com`, vào `BACKEND_CORS_ORIGINS` và khởi động lại backend (nếu khác origin).
2. Firebase Authentication phải cho phép hostname FE mới trong **Firebase Console → Authentication → Settings → Authorized domains**; cần HTTPS cho FCM/service worker (ngoại lệ localhost).
3. Backend/WSS phải truy cập được công khai qua HTTPS/WSS. Nếu reverse proxy backend, phải hỗ trợ WebSocket Upgrade.
4. Không thay đổi code API hay Firebase khi triển khai FE; chỉ cấu hình đúng biến môi trường.

Nếu muốn mở trực tiếp `http://SERVER_IP:8080` để thử **HTTP không phù hợp cho Google Auth/push ở production**: đổi `FRONTEND_BIND=0.0.0.0` và chỉ mở firewall nếu thực sự cần.

## 4. Cập nhật hoặc dừng

```bash
git pull
docker compose --env-file .env.docker up -d --build
# Dừng khi cần:
docker compose --env-file .env.docker down
```

**Lưu ý quan trọng:** Các biến `VITE_*` được **đóng vào JS bundle lúc build**. Thay `.env.docker` thì cần chạy lại `up -d --build`; `docker restart` không cập nhật địa chỉ API/Firebase trong trình duyệt.

## 5. Giải thích file

- `Dockerfile`: `npm ci`, `npm run build` bằng Node 22, rồi copy `dist/` sang Nginx.
- `docker-compose.yml`: cấp build arguments và public port của frontend, healthcheck.
- `nginx.conf`: phục vụ React Router deep link, asset caching và service worker.
- `.dockerignore`: không gửi `node_modules`, `.git`, `.env` lên Docker build context.
- `.env.docker.example`: mẫu cấu hình; sao chép thành `.env.docker` trước khi build.

Không cần `npm run dev`, `vite preview`, hoặc chạy port 3000 trong production.
