# vero 的 MkDocs 网站

这是一个使用 Material for MkDocs 构建的静态网站。网站源码位于 `master` 分支，构建后的网页发布到 `gh-pages` 分支。

## 日常写作

1. 在 `docs/` 中新建或修改 Markdown 文件。
2. 如果新页面需要出现在导航栏，在 `mkdocs.yml` 的 `nav` 中添加它。
3. 本地预览：

   ```powershell
   mkdocs serve
   ```

4. 浏览器打开终端显示的本地地址，通常是 `http://127.0.0.1:8000/`。

如果只修改文字，没有新增 JPG/PNG 图片，不需要运行图片优化脚本。

## 新增图片

建议将照片放在：

```text
docs/assets/img/
```

在 Markdown 中可以先正常引用 JPG 或 PNG：

```html
<img src="/assets/img/new-photo.jpg" width="800" alt="图片说明">
```

写完后，在仓库根目录运行：

```powershell
python tools\optimize_images.py
```

脚本会自动：

- 把图片最长边限制为 1600px；
- 转换为质量 80 的 WebP；
- 将 Markdown 和模板中的图片引用改为 `.webp`；
- 将原图移到 `source-images/` 中保存；
- 保证原图不会被 MkDocs 发布。

例如：

```text
docs/assets/img/new-photo.jpg
```

会变为：

```text
docs/assets/img/new-photo.webp
source-images/docs/assets/img/new-photo.jpg
```

图片文件名尽量保持唯一，例如 `shanghai-2026-01.jpg`，避免在不同目录中使用同名图片。

已经是 WebP 或 SVG 的图片不需要处理。PDF 和网站字体也不会被脚本修改。

## 图片懒加载

`hooks.py` 会在 MkDocs 构建时自动给文章图片增加：

```html
loading="lazy" decoding="async"
```

因此平时写 Markdown 时不需要手动添加这两个属性。首页 CSS 背景图不受影响。

## 构建网站

只构建，不发布：

```powershell
mkdocs build --clean
```

构建结果会生成在 `site/` 中。不要直接修改 `site/` 内的文件，因为下次构建时会被重新生成。

如果新增了照片，建议的完整构建流程是：

```powershell
python tools\optimize_images.py
mkdocs build --clean
```

## 发布到 GitHub Pages

确认本地预览没有问题后，运行：

```powershell
mkdocs gh-deploy
```

该命令会：

1. 重新构建网站；
2. 生成一个本地 `gh-pages` 提交；
3. 将该提交推送到 GitHub 的 `gh-pages` 分支。

分支用途：

- `master`：网站源码，平时只在这个分支编辑；
- `gh-pages`：构建后的网站成品，不要在这里编辑 Markdown。

## 发布时 GitHub 连接失败

如果构建成功，但出现以下错误：

```text
Recv failure: Connection was reset
Failed to connect to github.com port 443
```

这通常是 GitHub HTTPS 连接或代理问题，不是 MkDocs 构建失败。

可先测试：

```powershell
git ls-remote origin HEAD
```

如果 `mkdocs gh-deploy` 已经在本地生成了 `gh-pages` 提交，网络恢复后可以直接推送：

```powershell
git push origin gh-pages
```

这条命令不会切换当前分支。也可以在 GitHub Desktop 中切换到 `gh-pages` 后点击 **Push origin**，然后立即切回 `master`。

## 常用命令速查

```powershell
# 本地预览
mkdocs serve

# 优化新增图片
python tools\optimize_images.py

# 干净构建
mkdocs build --clean

# 构建并发布
mkdocs gh-deploy

# 只推送已经生成的 gh-pages 提交
git push origin gh-pages
```

## 推荐的完整流程

```powershell
# 1. 编辑 Markdown，放入新图片

# 2. 如果新增了 JPG/PNG
python tools\optimize_images.py

# 3. 本地预览
mkdocs serve

# 4. 检查 Git 修改并提交 master 分支
git status

# 5. 发布网站
mkdocs gh-deploy
```
