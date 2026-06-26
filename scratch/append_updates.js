const fs = require('fs');

const walkthroughPath = 'C:\\Users\\minh\\.gemini\\antigravity\\brain\\54946c11-6a52-4931-bfbe-76886b05ce88\\walkthrough.md';
let walkthrough = fs.readFileSync(walkthroughPath, 'utf8');

const newSection = `
### 11. Sửa lỗi icon spinner không xoay và màu pie chart bị nhạt/sai
- **Nguyên nhân**:
  1. **Icon spinner không xoay**: Do Script 0 (multi-track Smart Animate) và Script 1 (rotor engine) cùng tranh chấp thiết lập thuộc tính \`transform\` trên phần tử rotor (\`data-refresh-rotor\`) trong \`requestAnimationFrame\`. Thay đổi tĩnh từ Script 0 đè lên chuyển động xoay của Script 1.
  2. **Màu Pie Chart bị nhạt/sai**: 
     - Lỗi cross-fade opacity: Ở các phiên bản trước, phân đoạn pie chart của trạng thái cũ (\`from\`) giữ nguyên opacity = 1 suốt chuyển cảnh thay vì fade out, trong khi phân đoạn của trạng thái mới (\`to\`) fade in lên 1. Hai pie chart lệch góc chồng đè lên nhau gây xỉn màu và giật hình khi kết thúc transition.
     - Nhân bản thẻ mask trùng ID: Trình thu thập \`ringElements\` của \`semantic-14.js\` sao chép cả thẻ \`<mask>\` vào \`<g data-exact-ring>\`, tạo ra các ID mask trùng lặp với thẻ mask nằm trong \`<defs>\`, làm trình duyệt render sai lệch.
- **Giải pháp**:
  1. **Chống tranh chấp Rotor**: Thêm điều kiện bỏ qua các phần tử có thuộc tính \`data-refresh-rotor\` hoặc \`data-exact-ring\` trong vòng lặp render chính của Script 0 (\`semantic-15.js\`), nhường toàn quyền điều khiển transform cho script chuyên biệt.
  2. **Cross-fade Opacity chuẩn**: Sửa lại cơ chế đặt opacity trong \`semantic-14.js\` (exact ring) và \`semantic-13.js\` (fallback) để thực hiện fading ngược hướng: trạng thái cũ fade out từ 1 về 0 (\`1 - p\`), trạng thái mới fade in từ 0 lên 1 (\`p\`).
  3. **Loại bỏ Mask trùng lặp**: Cập nhật \`ringElements\` trong \`semantic-14.js\` để không sao chép thẻ \`<mask>\` vào nhóm cảnh, chỉ để mask duy nhất tồn tại và hoạt động ổn định trong \`<defs>\`.

Kết quả là icon spinner xoay mượt mà liên tục, các lát bánh Pie Chart chuyển màu sắc chính xác, không còn bị nhạt hay chồng lấp bóng mờ.
`;

fs.writeFileSync(walkthroughPath, walkthrough + newSection, 'utf8');
console.log("Updated walkthrough.md successfully.");

const taskPath = 'C:\\Users\\minh\\.gemini\\antigravity\/\/brain\\54946c11-6a52-4931-bfbe-76886b05ce88\\task.md';
let task = fs.readFileSync(taskPath, 'utf8');

const newTasks = `
- [x] Fix spinner rotation conflict in semantic-15.js by ignoring data-refresh-rotor/data-exact-ring in main runtime loop
- [x] Fix pie chart color issues in semantic-14.js by implementing correct cross-fade (fading out start state)
- [x] Remove duplicate masks from exact-ring tree in semantic-14.js to resolve ID collision issues
`;

fs.writeFileSync(taskPath, task + newTasks, 'utf8');
console.log("Updated task.md successfully.");
