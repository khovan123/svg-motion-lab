# SVG Motion Lab 🚀

Dự án phát triển công cụ biến **Figma Prototype** thành các file **animated SVG** hoặc **HTML** chất lượng cao và nhẹ bằng cách biên dịch, nội suy geometry/path và matching layer tự động giữa các trạng thái (states).

Tài liệu này hướng dẫn chi tiết quy trình sử dụng từ lúc clone project về máy, cài đặt plugin Figma, xuất file `motion-manifest.json` cho đến bước biên dịch trên web để tạo sản phẩm SVG hoàn chỉnh.

---

## 📋 Mục lục

1. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
2. [Bước 1: Clone dự án & Thiết lập môi trường](#bước-1-clone-dự-án--thiết-lập-môi-trường)
3. [Bước 2: Cài đặt Plugin vào Figma Desktop](#bước-2-cài-đặt-plugin-vào-figma-desktop)
4. [Bước 3: Thiết lập Figma & Xuất Motion Manifest](#bước-3-thiết-lập-figma--xuất-motion-manifest)
5. [Bước 4: Sử dụng giao diện Web để tạo Animated SVG](#bước-4-sử-dụng-giao-diện-web-để-tạo-animated-svg)
6. [Tùy chọn: Sử dụng giao diện Dòng lệnh (CLI)](#tùy-chọn-sử-dụng-giao-diện-dòng-lệnh-cli)
7. [Các tính năng hiệu chỉnh tự động](#các-tính-năng-hiệu-chỉnh-tự-động)

---

## 💻 Yêu cầu hệ thống

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã được cài đặt:
- **Git** (để clone repository)
- **Node.js** (phiên bản v16 trở lên để chạy server/CLI tool)
- **Figma Desktop App** (để nạp manifest plugin cục bộ)

---

## 🛠️ Bước 1: Clone dự án & Thiết lập môi trường

Mở Terminal (hoặc PowerShell / Command Prompt trên Windows) và chạy các lệnh sau:

```bash
# 1. Clone repository về máy của bạn
git clone https://github.com/khovan123/svg-motion-lab.git

# 2. Di chuyển vào thư mục dự án
cd svg-motion-lab
```

*Lưu ý: Dự án không sử dụng các dependencies cồng kềnh, cấu trúc nhẹ tối ưu.*

---

## 🎨 Bước 2: Cài đặt Plugin vào Figma Desktop

Để trích xuất dữ liệu chuyển động từ Figma prototype của bạn, chúng ta cần nạp plugin có sẵn trong thư mục `figma-plugin/`.

1. Khởi động ứng dụng **Figma Desktop**.
2. Bấm vào logo Figma (góc trên bên trái màn hình) hoặc bấm chuột phải vào canvas, chọn:
   **Plugins** ➡️ **Development** ➡️ **Import plugin from manifest...**
3. Cửa sổ duyệt file xuất hiện, tìm đến thư mục dự án vừa clone:
   `svg-motion-lab/figma-plugin/manifest.json`
4. Chọn file `manifest.json` này và bấm **Open**.
5. Figma sẽ thêm plugin **SVG Motion Manifest Exporter** vào danh sách phát triển của bạn thành công.

---

## 📤 Bước 3: Thiết lập Figma & Xuất Motion Manifest

Đảm bảo Figma frame hoặc component của bạn đã được liên kết thông qua prototype chuẩn:

1. Thiết lập các liên kết Prototype giữa các Frame tương ứng các State khác nhau (State A ➡️ State B ➡️ State C...).
2. Chọn các State Frame/Component theo đúng thứ tự chuyển động mong muốn.
3. Kích hoạt plugin: Bấm chuột phải ➡️ **Plugins** ➡️ **Development** ➡️ **SVG Motion Manifest Exporter**.
4. Giao diện Plugin sẽ hiện ra:
   - Plugin tự động quét các layer và tạo đường dẫn semantic dựa trên phân cấp và tên layer.
   - *Mẹo tối ưu matching:* Để matching các layer giữa các state chuẩn xác 100%, bạn có thể gán dữ liệu plugin chung `svg-motion-lab/motion-id` cho layer mong muốn.
5. Nhấp nút **Export Manifest** trong giao diện plugin và lưu file với tên `motion-manifest.json` về máy của bạn.

---

## 🌐 Bước 4: Sử dụng giao diện Web để tạo Animated SVG

Trang web xử lý hoàn toàn cục bộ trên trình duyệt (client-side), đảm bảo không tải dữ liệu thiết kế của bạn lên bất kỳ máy chủ nào.

### 1. Khởi chạy giao diện Web cục bộ
Do một số chính sách bảo mật (CORS), bạn không nên mở trực tiếp file HTML bằng cách double-click. Hãy chạy HTTP server tĩnh cục bộ bằng các câu lệnh NPM đã được tích hợp sẵn:

**Cách A: Sử dụng NPM Script (Khuyên dùng - yêu cầu Node.js)**
```bash
# Chạy dự án bằng lệnh start hoặc dev
npm start
# hoặc:
npm run dev
```
Hệ thống sẽ khởi tạo một server tĩnh trỏ vào thư mục `web` thông qua công cụ `serve`. Bạn mở trình duyệt truy cập: `http://localhost:3000` (hoặc cổng hiển thị trên terminal).

**Cách B: Chạy thủ công bằng `npx`**
```bash
npx serve web
```
Sau đó mở trình duyệt truy cập: `http://localhost:3000` (hoặc cổng hiển thị trên terminal).

**Cách C: Sử dụng Python (nếu có sẵn)**
```bash
python -m http.server -d web 8080
```
Sau đó mở trình duyệt truy cập: `http://localhost:8080`

### 2. Tạo chuyển động (Compile)
1. Kéo và thả file `motion-manifest.json` vừa xuất từ Figma vào vùng nét đứt **"Thả manifest vào đây"** trên trang web (hoặc nhấp chuột vào để chọn file).
2. Xem các thông tin tổng quan của thiết kế ở bảng **Summary** (số States, Reactions, Snapshots,...).
3. Tại phần **Custom animation** (nếu cần thiết):
   - Thay đổi **Tổng duration** của chuyển động.
   - Bật/tắt chế độ lặp vô tận (**Infinite play**).
   - Tùy chỉnh chi tiết thời gian **Hold** (thời gian đứng yên) và **Transition** (thời gian chuyển động) của từng State.
4. Nhấp nút **Compile & Preview** ở cột bên trái.
5. Xem trước trực quan chuyển động hoạt hình SVG ở khung **Preview** bên phải.
6. Sử dụng các nút tải xuống:
   - **Tải SVG**: Nhận file `.svg` hoạt hình độc lập chứa CSS Keyframe animation (nhẹ và tương thích rộng rãi).
   - **Tải HTML**: Nhận file `.html` đóng gói sẵn demo SVG để chia sẻ hoặc nhúng nhanh.
   - **Tải Report**: Tải file báo cáo phân tích chi tiết hiệu chỉnh.

---

## ⌨️ Tùy chọn: Sử dụng giao diện Dòng lệnh (CLI)

Nếu bạn là lập trình viên và muốn biên dịch nhanh file manifest trực tiếp bằng script Node.js:

```bash
# Biên dịch file motion-manifest.json mặc định và xuất kết quả ra thư mục /dist
npm run build

# Biên dịch bằng file manifest cụ thể với nhiều tùy chọn cấu hình hơn
node compile.js --manifest motion-manifest.json --out-dir dist --mode semantic
```

**Các tham số CLI khả dụng:**
- `--manifest <path>`: Đường dẫn tới file manifest.json.
- `--out-dir <path>`: Thư mục chứa file SVG/HTML đầu ra (mặc định: `dist`).
- `--mode <prototype|semantic>`: Chế độ matching và biên dịch chuyển động.
- `--hold <number>`: Thiết lập thời gian dừng mặc định (giây).
- `--duration <number>`: Thiết lập thời gian chuyển cảnh mặc định (giây).
- `--no-loop`: Tắt vòng lặp vô tận.

---

## ⚡ Các tính năng hiệu chỉnh tự động

Hệ thống biên dịch (compiler) tự động xử lý các thuộc tính chuyển động phức tạp từ Figma:
* **Geometry:** Nội suy các thuộc tính vị trí, kích thước (`x`, `y`, `width`, `height`, `rx`), bán kính ellipse và ma trận biến đổi (`transform`) của path tương quan với state gốc.
* **Gradient:** Ánh xạ vector gradient của Figma sang SVG `userSpaceOnUse`; tự động nội suy handle, điểm stop offset, màu sắc và độ mờ opacity.
* **Easing:** Chuyển đổi chính xác các preset easing của Figma thành đường cong Cubic Bézier.
* **Spring Animation:** Tự động lấy mẫu (sampling) các công thức lò xo phức tạp của Figma (Mass, Stiffness, Damping) thành các chuỗi keyframe số mịn màng.
* **Path Morphing:** Morph hình học thông minh khi cấu trúc điểm (topology) giữa 2 state tương thích.
