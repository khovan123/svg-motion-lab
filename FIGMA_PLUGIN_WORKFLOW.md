# Figma plugin → standalone SVG/HTML

## 1. Cài plugin local

Trong Figma Desktop:

1. Plugins → Development → Import plugin from manifest.
2. Chọn `figma-plugin/manifest.json`.
3. Chọn các state frame/component theo đúng thứ tự prototype.
4. Chạy **SVG Motion Manifest Exporter** và tải `motion-manifest.json`.

Để matching ổn định tuyệt đối, gán shared plugin data `svg-motion-lab/motion-id` cho layer tương ứng. Nếu chưa có, exporter tự tạo semantic path từ tên và hierarchy.

## 2. Build

```bash
npm run build
```

Hoặc:

```bash
node generate-animate.js --manifest motion-manifest.json --out-dir dist
```

Output chính:

```text
dist/animation.svg
dist/animation.html
```

Compiler cũng tạo `dist/calibration-report.json` để liệt kê số layer matched, gradient tracks, path morph và fallback.

## Tự động hiệu chỉnh

- **Geometry:** nội suy `x`, `y`, `width`, `height`, `rx`, ellipse radii và path transform từ bounds tương đối với state root.
- **Gradient:** đổi gradient handle Figma từ tọa độ chuẩn hóa sang SVG `userSpaceOnUse`; nội suy handle, stop offset, stop color và opacity.
- **Easing:** map preset Figma sang cubic Bézier; giữ nguyên custom cubic Bézier.
- **Spring:** lấy mẫu công thức mass/stiffness/damping/initialVelocity thành keyframe số.
- **Timing:** dùng `AFTER_TIMEOUT.timeout`, `transition.duration` và graph `destinationId`; thiếu dữ liệu mới dùng giá trị fallback CLI.
- **Path:** morph khi topology tương thích; nếu không tương thích thì giữ transform/opacity và ghi warning trong report.
- **Unsupported effect/image:** manifest giữ metadata (image fills theo `imageHash`) và có thể giữ SVG snapshot của state; report chỉ rõ phần cần renderer fallback.

## Lưu ý về độ chính xác

Pipeline tự động dùng dữ liệu thật từ Figma thay vì đoán từ các SVG export rời. Tuy nhiên blur, blend mode, font rasterization và một số effect đặc thù vẫn có thể khác renderer Figma; kiểm tra `calibration-report.json` trước khi nghiệm thu pixel-perfect.
