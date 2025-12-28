# 3 Cách Push Code Lên GitHub

## OPTION 1: Push TOÀN BỘ (Backend + Frontend + CMS) - KHUYẾN NGHỊ ⭐

**Ưu điểm:**
- ✅ Đơn giản nhất - 1 repo duy nhất
- ✅ Render + Cloudflare đều build từ 1 repo
- ✅ CI/CD đã config sẵn trong .github/workflows/
- ✅ Quản lý version dễ dàng (1 commit cho toàn hệ thống)

**Cách làm:**
```bash
# Kiểm tra những gì sẽ push (chỉ xem, không push)
git status

# Push lên (sau khi tạo repo GitHub)
git remote add origin https://github.com/YOUR_USERNAME/aristia-shop.git
git push -u origin main
```

**Những gì được push:**
- ✅ online-clothing-store/ (backend source code)
- ✅ frontend-clothing-shop/ (frontend source code)  
- ✅ my-cms/ (CMS source code)
- ✅ deploy/ (configs: render.yaml, docker-compose.yml, nginx, scripts)
- ✅ .github/workflows/ (CI/CD configs)
- ✅ Documentation files

**Những gì KHÔNG được push (đã ignore):**
- ❌ node_modules/ (mọi folder)
- ❌ dist/ (build outputs)
- ❌ .env (secrets)
- ❌ *.db, *.sqlite (databases)
- ❌ backups/
- ❌ logs/

**Sau đó:**
- Render build backend/CMS từ Docker images (GHCR)
- Cloudflare Pages build frontend từ `frontend-clothing-shop/` subfolder

---

## OPTION 2: Push CHỈ Backend + CMS (KHÔNG có Frontend)

**Nếu bạn muốn tách riêng:**

```bash
# Thêm frontend vào .gitignore tạm thời
echo "frontend-clothing-shop/" >> .gitignore

# Kiểm tra (frontend sẽ không xuất hiện)
git status

# Push
git add .
git commit -m "feat: Backend + CMS only"
git remote add origin https://github.com/YOUR_USERNAME/aristia-backend.git
git push -u origin main
```

**Tạo repo riêng cho frontend:**
```bash
cd frontend-clothing-shop

# Init git riêng cho frontend
git init
git add .
git commit -m "feat: Frontend initial commit"
git remote add origin https://github.com/YOUR_USERNAME/aristia-frontend.git
git push -u origin main
```

**Nhược điểm:**
- ⚠️ Phải quản lý 2 repos
- ⚠️ CI/CD phức tạp hơn
- ⚠️ Sync version khó hơn

---

## OPTION 3: Push TOÀN BỘ nhưng CHỈ deploy Backend lên Render

**Nếu bạn không muốn Cloudflare Pages:**

```bash
# Push toàn bộ (như Option 1)
git remote add origin https://github.com/YOUR_USERNAME/aristia-shop.git
git push -u origin main

# Trên Render:
# - Chỉ deploy backend + CMS (từ render.yaml)
# - KHÔNG deploy frontend

# Frontend tự build local:
cd frontend-clothing-shop
npm run build
# Upload dist/ lên hosting khác (Netlify, Vercel, VPS...)
```

---

## 🎯 KHUYẾN NGHỊ: Chọn OPTION 1

**Lý do:**
1. ✅ Setup của bạn đã hoàn hảo cho monorepo (1 repo chứa tất cả)
2. ✅ render.yaml đã config build từ subfolder `online-clothing-store/`, `my-cms/`
3. ✅ Cloudflare Pages build từ subfolder `frontend-clothing-shop/`
4. ✅ CI/CD đã setup sẵn: GitHub Actions → GHCR → Render auto pull
5. ✅ Tất cả rác đã ignore đầy đủ (.env, node_modules, dist, logs...)

**Kiểm tra trước khi push:**
```bash
# Xem danh sách file sẽ được commit
git ls-files

# Đếm số file sẽ push
git ls-files | wc -l

# Xem kích thước repo
du -sh .git
```

---

## ❓ Câu hỏi thường gặp

**Q: node_modules có bị push không?**
A: KHÔNG. Đã ignore bởi `.gitignore` line 8-9

**Q: dist/ có bị push không?**
A: KHÔNG. Đã ignore bởi `.gitignore` line 12

**Q: .env có bị push không?**
A: KHÔNG. Đã ignore bởi `.gitignore` line 1-5

**Q: Tại sao push cả frontend nếu Cloudflare Pages tự build?**
A: Cloudflare cần source code để build. Nó sẽ chạy `npm ci && npm run build` trên repo của bạn.

**Q: File backup có bị push không?**
A: KHÔNG. Đã ignore bởi `.gitignore` line 49

**Q: Logs có bị push không?**
A: KHÔNG. Đã ignore bởi `.gitignore` line 18-21

---

## ✅ Checklist trước khi push

- [ ] Đã check `git status` (xem file nào sẽ commit)
- [ ] Đã check `.gitignore` (đảm bảo ignore đúng)
- [ ] Đã xóa/rotate secrets trong .env cũ (nếu có commit trước đó)
- [ ] Tạo GitHub repo (Private nếu có secrets)
- [ ] Sẵn sàng push

