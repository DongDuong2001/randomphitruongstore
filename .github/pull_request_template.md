## Summary

<!-- Mô tả ngắn gọn thay đổi và lý do. -->

## Related issue

Closes #

## Change type

- [ ] Feature
- [ ] Bug fix
- [ ] Chore / documentation
- [ ] Database migration

## What changed

- <!-- Describe one concrete change per bullet. -->

## Verification

- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Tests liên quan đã chạy hoặc lý do chưa chạy được đã được ghi rõ
- [ ] Luồng UI/API bị ảnh hưởng đã được kiểm tra thủ công

## Security and data

- [ ] Đã kiểm tra staged files bằng `git diff --cached --name-only`
- [ ] Không có `.env`, token, password, private key hoặc dữ liệu khách hàng
- [ ] Secret scan chỉ báo placeholder hợp lệ trong `.env.example`
- [ ] Input mới được validate phía server

## Database checklist

- [ ] Không có thay đổi database
- [ ] Có migration tương ứng và đã chạy `npm run prisma:generate`
- [ ] Seed data vẫn idempotent
- [ ] Đã mô tả migration/rollback impact

## UI evidence

<!-- Thêm screenshot hoặc recording cho thay đổi giao diện. Nếu không áp dụng, ghi N/A. -->

## Reviewer notes

<!-- Nêu file nhạy cảm, trade-off hoặc phần cần reviewer chú ý. -->
