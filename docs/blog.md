# ✍️ Blog

All blog posts are located in:

```
src/blog/<slug>/
```

Each post lives in its own folder, identified by a unique `<slug>` (e.g. `sensors-social-roadmap`).

## 🚀 Adding a New Post

Follow these steps to create and publish a new blog post.

1. Create a new directory using your desired slug:

```sh
mkdir -p src/blog/my-post
```

> 💡 Choose a short, URL-friendly slug (lowercase, hyphen-separated).

2. Create the Post File

Inside your new folder, add an `index.md` file:

```md
---
title: "My post title"
date: 2026-04-08
published: true
locale: "en"
tags: ["Announcements", "sensors.social"]
cover_image: ./images/cover.webp
description: "Short description used on the blog list page."
abstract: "A short lede shown under the cover on the post page."
---

Markdown body here…
```

| Field         | Description                                        |
| ------------- | -------------------------------------------------- |
| `title`       | Title of the blog post (required)                  |
| `date`        | Publication date (YYYY-MM-DD) (required)           |
| `published`   | Controls visibility (`false` = draft) (required)   |
| `locale`      | Language code (e.g. `en`, `ru`) (required)         |
| `tags`        | List of categories or topics                       |
| `cover_image` | Path to the main image (required)                  |
| `description` | Short summary for blog listings (very recommended) |
| `abstract`    | Intro text shown under the cover on the post page  |

3. Add Images

Create an `images/` folder inside your post directory:

```
src/blog/sensors-social-roadmap/images/cover.webp
src/blog/sensors-social-roadmap/images/another-image.webp
```

**Guidelines:**

- Use **relative paths**:
  ```
  ./images/cover.webp
  ```
- Prefer **optimized formats** like `.webp`
- Use descriptive filenames

## 📝 Drafts

To keep a post hidden:

```yaml
published: false
```

Draft posts:

- ❌ Won’t appear in blog listings
- ❌ Won’t be accessible via direct URL

## ✅ Publishing Checklist

Before publishing, make sure:

- [ ] Title and date are correct
- [ ] `published: true` is set
- [ ] Cover image exists and loads properly
- [ ] Description is filled in
- [ ] All images use relative paths
- [ ] Content has been proofread
