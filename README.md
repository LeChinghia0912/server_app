## Giao diện React gọi API backend localhost:3000

Cấu trúc đã được tạo bằng Vite + React (JSX) và cấu hình proxy để gọi API qua đường dẫn `/api` tới backend `http://localhost:3000`.

### Cấu trúc thư mục chính

- `src/api/client.js`: wrapper cho fetch (GET/POST/PUT/DELETE)
- `src/pages/Home.jsx`: trang mẫu gọi endpoint `/api/v1/health`
- `vite.config.js`: cấu hình proxy `/api` → `http://localhost:3000`

### Chạy dự án

1. Cài dependencies:
   ```bash
   npm install
   ```
2. Chạy dev server:
   ```bash
   npm run dev
   ```
3. Mở trình duyệt tới URL mà Vite in ra (thường là `http://localhost:5173`).

### Gọi API backend

- Khi gọi từ frontend, dùng đường dẫn bắt đầu bằng `/api`.
- Ví dụ trong `Home.jsx`, client gọi `api.get('/v1/health')` → thực tế request tới `http://localhost:3000/api/v1/health` (proxy giữ nguyên tiền tố `/api`).

### Gợi ý mở rộng

- Thêm quản lý trạng thái (React Query/Zustand)
- Tổ chức routes (React Router)
- Thêm biến môi trường `.env` nếu cần phân tách base URL từng môi trường

## Sass (SCSS)

Đã cài đặt và cấu hình Sass. Bạn có thể chỉnh nhanh gutter/header tại:

- `src/styles/_variables.scss`:
  - `$header-max-width`: null hoặc đặt giá trị như `1320px`
  - `$header-padding-x-xs`, `$header-padding-x-sm`, `$header-padding-x-xxl`
- `src/styles/_mixins.scss`: mixin `header-gutters` và `clamp-container`
- `src/styles/main.scss`: import tất cả, đang áp dụng cho `.header-container`

Vite hỗ trợ SCSS mặc định, chỉ cần chạy `npm run dev` và chỉnh file `.scss` sẽ tự cập nhật.
