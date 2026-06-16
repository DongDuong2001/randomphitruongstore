# Contributing to random.phitruong

Tài liệu này quy định workflow chung cho ba thành viên. Mọi thay đổi cần đi
qua branch riêng và Pull Request; không commit trực tiếp lên `main`.

## 1. Chuẩn bị

```bash
git switch main
git pull --ff-only origin main
npm install
```

Tạo file `.env.local` từ `.env.example` — **dùng `.env.local`, không phải `.env`**:

```bash
cp .env.example .env.local
```

Điền các giá trị thật vào `.env.local`. File này bị gitignore, không bao giờ được commit.

### Biến môi trường bắt buộc

| Biến | Lấy ở đâu |
| --- | --- |
| `DATABASE_URL` | Connection string PostgreSQL local (xem compose.yaml) |
| `DIRECT_URL` | Giống `DATABASE_URL` khi chạy local |
| `ADMIN_PASSWORD` | Tự đặt, dùng để đăng nhập `/admin` |
| `ADMIN_SESSION_SECRET` | Chuỗi ngẫu nhiên dài ≥ 32 ký tự |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → anon/public key |

### PostgreSQL/Prisma local setup

Khởi động PostgreSQL bằng Docker Compose (cần **Docker Desktop** đang chạy):

```bash
docker compose up -d
```

Sau khi PostgreSQL chạy, chuẩn bị Prisma và seed dữ liệu mẫu:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Seed phải idempotent: chạy `npm run prisma:seed` nhiều lần không được tạo trùng
dữ liệu. Dữ liệu seed hiện tại cần có sản phẩm thuộc đủ các giá trị
`ProductCategory`: `SUKAJAN`, `BOMBER`, `HOODIE`, `JACKET`, `SEASONAL`.

Mở Prisma Studio để kiểm tra dữ liệu:

```bash
npm run db:studio
```

Chỉ reset database khi đang trỏ tới database local/dev. Luôn kiểm tra
`DATABASE_URL` trước khi reset, và không chạy reset với production hoặc database
shared của team.

Reset local database bằng Prisma:

```bash
npx prisma migrate reset
```

Nếu Docker volume local bị lỗi hoặc cần dựng lại hoàn toàn, có thể xóa volume và
chạy lại migration/seed:

```bash
docker compose down -v
docker compose up -d postgres
npm run prisma:migrate
npm run prisma:seed
```

`docker compose down -v` sẽ xóa toàn bộ dữ liệu PostgreSQL local trong Docker
volume. Không dùng lệnh này nếu còn dữ liệu local cần giữ lại.

### Supabase setup

Project dùng **Supabase Auth** cho customer authentication. Cần có Supabase project riêng.

1. Tạo project tại [supabase.com](https://supabase.com)
2. Vào **Project Settings → API**, copy **Project URL** và **anon/public key** vào `.env.local`
3. Vào **Authentication → Sign In / Providers → Supabase Auth**, tắt **Confirm email** khi dev local để tránh rate limit

### Chạy dev server

```bash
npm run dev
```

App chạy tại `http://localhost:3000`.

### Test nhanh các API endpoints

**Products (không cần auth):**
```bash
curl http://localhost:3000/api/products
```

**Customer register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456","fullName":"Test User"}'
```

**Customer login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

**Admin login** — dùng `ADMIN_PASSWORD` trong `.env.local`:
```bash
curl -X POST http://localhost:3000/api/admin/session \
  -H "Content-Type: application/json" \
  -d '{"password":"your-admin-password"}'
```

### Các trang chính

| URL | Mô tả |
| --- | --- |
| `http://localhost:3000` | Homepage |
| `http://localhost:3000/shop` | Danh sách sản phẩm |
| `http://localhost:3000/register` | Đăng ký customer |
| `http://localhost:3000/login` | Đăng nhập customer |
| `http://localhost:3000/admin` | Admin panel (cần login) |
| `http://localhost:5555` | Prisma Studio — xem/sửa DB trực tiếp (`npm run db:studio`) |

## 2. Branch naming

Chỉ dùng một trong ba prefix:

| Prefix | Khi sử dụng | Ví dụ |
| --- | --- | --- |
| `feat/` | Tính năng hoặc hành vi mới | `feat/5-vietnam-checkout` |
| `fix/` | Sửa bug hoặc regression | `fix/12-order-total` |
| `chore/` | Tooling, docs, CI hoặc bảo trì | `chore/1-pr-workflow` |

Tên branch phải:

- Viết thường và dùng dấu gạch ngang.
- Có issue number khi công việc xuất phát từ GitHub Issue.
- Chỉ chứa một phạm vi công việc có thể review độc lập.

## 3. Development workflow

1. Nhận hoặc tự assign GitHub Issue.
2. Tạo branch từ `main` mới nhất.
3. Đọc code liên quan trước khi sửa.
4. Giữ thay đổi nhỏ, không refactor ngoài scope của issue.
5. Cập nhật test hoặc tài liệu khi hành vi thay đổi.
6. Chạy verification trước khi push.
7. Mở Pull Request và ghi `Closes #<issue-number>` trong phần mô tả.
8. Chờ CODEOWNER review nếu thay đổi file được bảo vệ.
9. Chỉ merge khi checks pass và review comments đã được xử lý.

Không force-push lên branch của người khác nếu chưa thống nhất.

## 4. Conventional Commits

Định dạng:

```text
<type>(<scope>): <description>
```

Các `type` được chấp nhận:

- `feat`: thêm tính năng.
- `fix`: sửa lỗi.
- `docs`: chỉ thay đổi tài liệu.
- `test`: thêm hoặc sửa test.
- `refactor`: thay đổi cấu trúc nhưng không đổi hành vi.
- `perf`: cải thiện hiệu năng.
- `chore`: tooling, dependencies hoặc bảo trì.
- `ci`: workflow CI/CD.

Ví dụ:

```text
feat(checkout): validate product options server-side
fix(admin): archive products referenced by orders
docs: document local database setup
```

Description dùng thể mệnh lệnh, viết thường, không thêm dấu chấm cuối.

## 5. Protected ownership

`CODEOWNERS` yêu cầu review từ owner cho:

- `prisma/**` và `prisma.config.ts`.
- `.env.example`.
- `src/lib/validations.ts`.
- `src/types/**`.
- `package.json` và `package-lock.json`.

`@DongDuong2001` là owner tạm thời. Cập nhật
`.github/CODEOWNERS` sau khi hai thành viên còn lại đã được thêm vào repo.

Không sửa Prisma schema hoặc shared contracts trong PR không liên quan. Nếu
thay đổi bắt buộc, mô tả migration impact và các consumer bị ảnh hưởng trong PR.

## 6. Pull Request requirements

Pull Request cần:

- Tiêu đề theo Conventional Commits.
- Liên kết GitHub Issue.
- Mô tả hành vi trước và sau thay đổi.
- Screenshot cho thay đổi UI.
- Migration notes cho thay đổi database.
- Không chứa generated output không cần thiết hoặc secret.
- Có checklist verification hoàn chỉnh.

Giữ PR tập trung; nếu có nhiều thay đổi không phụ thuộc nhau, tách thành các PR.

## 7. Required verification

```bash
npm run lint
npm run build
```

Khi thay đổi Prisma:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Kiểm tra file sẽ được commit:

```bash
git status --short
git diff --cached --check
git diff --cached --name-only
```

Secret scan tối thiểu:

```bash
git grep -n -E "(BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|AKIA[0-9A-Z]{16}|github_pat_|gh[pousr]_|sk-[A-Za-z0-9_-]{20,}|DATABASE_URL[[:space:]]*=|ADMIN_PASSWORD[[:space:]]*=|ADMIN_SESSION_SECRET[[:space:]]*=)" -- . ':(exclude)CONTRIBUTING.md'
```

Kết quả chỉ được phép chứa placeholder trong `.env.example`. Nếu secret thật đã
được commit, không chỉ xóa file: phải rotate/revoke secret và báo ngay cho owner.

## 8. Review and merge

- Tác giả PR không tự approve PR của mình.
- Reviewer ưu tiên correctness, security, regression và test coverage.
- Dùng squash merge để giữ một Conventional Commit rõ ràng trên `main`.
- Xóa branch sau khi merge.
