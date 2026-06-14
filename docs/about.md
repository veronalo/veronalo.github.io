# About

<style>
  .about-profile {
    display: grid;
    grid-template-columns: minmax(150px, 220px) minmax(0, 1fr);
    gap: clamp(1.8rem, 5vw, 4rem);
    align-items: center;
    max-width: 920px;
    margin: clamp(2rem, 8vh, 5rem) auto 3rem;
  }

  .about-avatar-wrap {
    justify-self: center;
  }

  .about-avatar {
    width: clamp(142px, 18vw, 210px);
    aspect-ratio: 1;
    border-radius: 50%;
    object-fit: cover;
    box-shadow:
      0 20px 50px rgba(0, 0, 0, 0.18),
      0 0 0 1px rgba(255, 255, 255, 0.36),
      0 0 0 10px rgba(104, 138, 167, 0.08);
  }

  .about-kicker {
    margin: 0 0 0.45rem;
    color: var(--md-primary-fg-color);
    font-family: "Harlow Solid Italic", "French Script MT", "Gabriola", "Palatino Linotype", serif;
    font-size: 1.55rem;
    font-style: italic;
    font-weight: 400;
    letter-spacing: 0.03em;
    text-shadow: 0 1px 12px rgba(104, 138, 167, 0.22);
    text-shadow: 0 1px 12px color-mix(in srgb, var(--md-primary-fg-color) 22%, transparent);
  }

  .about-name {
    margin: 0;
    font-size: clamp(2rem, 5vw, 3.2rem);
    line-height: 1.08;
  }

  .about-line {
    margin: 0.9rem 0 0;
    color: var(--md-default-fg-color--light);
    font-size: 1.05rem;
  }

  .about-bio {
    margin: 1.5rem 0 0;
    max-width: 34rem;
    font-size: 1rem;
    line-height: 1.9;
  }

  .about-tags {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(8.5rem, max-content));
    gap: 0.55rem 0.8rem;
    margin: 1.5rem 0 0;
    padding: 0;
    list-style: none;
  }

  .about-tags li {
    margin: 0;
  }

  .about-tags a {
    display: inline-flex;
    align-items: center;
    gap: 0.46rem;
    min-height: 2.05rem;
    padding: 0.2rem 0.24rem 0.28rem 0;
    border-bottom: 1px solid rgba(104, 138, 167, 0.32);
    color: var(--md-default-fg-color);
    font-size: 0.88rem;
    text-decoration: none;
    transition: color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
  }

  .about-tags a:hover {
    border-color: var(--md-accent-fg-color);
    color: var(--md-accent-fg-color);
    transform: translateY(-1px);
  }

  .about-tag-icon {
    display: inline-flex;
    width: 1.18em;
    height: 1.18em;
    color: currentColor;
  }

  .about-tag-icon svg {
    width: 100%;
    height: 100%;
    fill: currentColor;
  }

  .about-tag-icon img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .about-note {
    max-width: 760px;
    margin: 2rem auto 0;
    color: var(--md-default-fg-color--light);
    line-height: 1.9;
  }

  .about-kicker,
  .about-name,
  .about-line,
  .about-bio,
  .about-tags,
  .about-note {
    opacity: 0;
    transform: translateY(12px);
    animation: about-rise 0.76s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  .about-kicker {
    animation-delay: 0.12s;
  }

  .about-name {
    animation-delay: 0.72s;
  }

  .about-line,
  .about-bio,
  .about-tags,
  .about-note {
    animation-delay: 1.24s;
  }

  @keyframes about-rise {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 700px) {
    .about-profile {
      grid-template-columns: 1fr;
      text-align: center;
    }

    .about-bio,
    .about-note {
      margin-left: auto;
      margin-right: auto;
    }

    .about-tags {
      justify-content: center;
      grid-template-columns: repeat(2, max-content);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .about-kicker,
    .about-name,
    .about-line,
    .about-bio,
    .about-tags,
    .about-note {
      opacity: 1;
      transform: none;
      animation: none;
    }
  }
</style>

<section class="about-profile">
  <div class="about-avatar-wrap">
    <img class="about-avatar" src="../images/avatar.jpg" alt="vero 的头像">
  </div>

  <div>
    <p class="about-kicker">Hello, this is</p>
    <h1 class="about-name">vero</h1>
    <p class="about-line">2024 级 ZJU ISEEer / Shannoner</p>

    <p class="about-bio">
      一个正在努力把学习、生活和一些细碎感受整理清楚的普通人。
      这里会放课程笔记、项目记录、偶尔的生活瞬间，也会留下一点关于喜欢与成长的自言自语。
    </p>

    <ul class="about-tags">
      <li>
        <a href="https://github.com/veronalo">
          <span class="about-tag-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 .5A11.5 11.5 0 0 0 8.36 22.9c.58.1.79-.25.79-.56v-2.1c-3.22.7-3.9-1.38-3.9-1.38-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.75.4-1.27.74-1.56-2.57-.29-5.27-1.28-5.27-5.72 0-1.26.45-2.3 1.2-3.1-.12-.3-.52-1.48.11-3.07 0 0 .98-.31 3.18 1.19A11.1 11.1 0 0 1 12 5.98c.98 0 1.96.13 2.88.39 2.2-1.5 3.17-1.19 3.17-1.19.64 1.59.24 2.77.12 3.07.75.8 1.2 1.84 1.2 3.1 0 4.45-2.71 5.43-5.29 5.72.42.36.79 1.07.79 2.16v3.11c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"/></svg>
          </span>
          GitHub
        </a>
      </li>
      <li>
        <a href="https://www.cc98.org/usercenter">
          <span class="about-tag-icon" aria-hidden="true">
            <img src="../assets/cc98-icon.svg" alt="">
          </span>
          CC98
        </a>
      </li>
      <!-- <li>
        <a href="../notes/notes/">
          <span class="about-tag-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="m12 3 10 5.4-10 5.4L2 8.4 12 3Zm-6 8.4 6 3.2 6-3.2V16c0 1.9-2.7 3.5-6 3.5S6 17.9 6 16v-4.6Z"/></svg>
          </span>
          ZJU ISEE
        </a>
      </li>
      <li>
        <a href="../notes/notes/">
          <span class="about-tag-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M5 3.5h11a3 3 0 0 1 3 3v14H7a3 3 0 0 1-3-3v-13a1 1 0 0 1 1-1Zm2 13a1 1 0 0 0 0 2h10v-2H7Zm0-11v9.1c.32-.07.65-.1 1-.1h9v-8a1 1 0 0 0-1-1H7Z"/></svg>
          </span>
          Notes
        </a>
      </li> -->
    </ul>
  </div>
</section>

<p class="about-note">
  希望这个站点能像一个安静的小房间：有资料，有碎片，有正在变得清楚的想法，也有一点点不那么正式的生活气息。
</p>
