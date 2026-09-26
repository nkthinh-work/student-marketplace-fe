# Hướng dẫn Quản trị viên thêm Video Hướng dẫn mới (Tutorial Center)

Tính năng **Tutorial Center** trên Chợ PTITers được thiết kế theo tư duy **Mobile-First**, tối ưu cho các video quay màn hình điện thoại tỉ lệ dọc **9:16**.

Tất cả video được lưu trữ và phân phối trực tiếp qua Cloudinary. Dữ liệu bài hướng dẫn được cấu hình dưới dạng metadata tĩnh tại `src/features/tutorials/tutorialsData.ts`, **không cần cơ sở dữ liệu, API backend hay phân quyền Admin CMS**.

---

## Quy trình 8 bước thêm/cập nhật video hướng dẫn:

### Bước 1: Quay video
- Sử dụng điện thoại để quay màn hình thao tác thực tế một tính năng hoặc luồng công việc cụ thể trên Chợ PTITers (thời lượng khuyến nghị: 30 giây đến 2 phút).
- Tỉ lệ quay chuẩn: **Dọc 9:16**.

### Bước 2: Chỉnh sửa & Xuất video
- Xuất video định dạng **MP4**, chuẩn nén **H.264**, âm thanh **AAC** (nếu có lồng tiếng/thuyết minh).
- Đảm bảo tỉ lệ khung hình là **9:16** (ví dụ: 720×1280 hoặc 1080×1920). Không xoay ngang hay kéo dãn video.

### Bước 3: Tải video lên Cloudinary
- Đăng nhập bảng điều khiển Cloudinary.
- Tải tệp video vào đúng thư mục cấu trúc:
  ```text
  student-marketplace/tutorials/...
  ```
  *(Ví dụ: `student-marketplace/tutorials/products/dang-ban-san-pham.mp4`)*

### Bước 4: Chuẩn bị ảnh bìa (Poster - Tùy chọn)
- Chụp một khung hình đẹp tỉ lệ dọc 9:16 hoặc thiết kế thumbnail 9:16.
- Tải ảnh lên Cloudinary và lấy URL công khai.

### Bước 5: Sao chép URL phân phối công khai
- Lấy đường dẫn phân phối HTTPS công khai của video và ảnh bìa từ Cloudinary.
  - Ví dụ `videoUrl`: `https://res.cloudinary.com/.../tutorials/products/dang-ban.mp4`
  - Ví dụ `posterUrl`: `https://res.cloudinary.com/.../tutorials/products/dang-ban.jpg`

### Bước 6: Cập nhật cấu hình Frontend
- Mở tệp `src/features/tutorials/tutorialsData.ts`.
- Tìm bài hướng dẫn tương ứng trong mảng `TUTORIALS_CONFIG` (hoặc thêm một đối tượng `TutorialItem` mới):
  ```typescript
  {
    slug: 'cach-dang-ban-san-pham',
    title: 'Cách đăng bán sản phẩm',
    description: 'Từng bước chọn danh mục, chụp/tải ảnh, đặt giá bán và mô tả tình trạng món đồ thanh lý.',
    category: 'PRODUCTS',
    videoUrl: 'https://res.cloudinary.com/.../video.mp4',
    posterUrl: 'https://res.cloudinary.com/.../poster.jpg',
    durationLabel: '1:15',
    order: 3,
    published: true,
  }
  ```

### Bước 7: Đặt trạng thái xuất bản
- Đảm bảo `published: true` và `videoUrl` đã được điền chính xác.
- *Lưu ý*: Các bài có `published: false` hoặc `videoUrl` trống sẽ tự động bị ẩn khỏi danh sách và trang chi tiết.

### Bước 8: Build và Deploy Frontend
- Chạy kiểm tra build:
  ```bash
  npm run build
  ```
- Triển khai phiên bản frontend mới. Hoàn toàn **không cần deploy backend hay di trú CSDL**.
