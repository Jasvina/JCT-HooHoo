const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.14,
  }
);

document.querySelectorAll('.reveal').forEach((element) => {
  observer.observe(element);
});

const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');

if (header && navToggle) {
  navToggle.addEventListener('click', () => {
    const isOpen = header.classList.toggle('nav-open');
    document.body.classList.toggle('nav-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.querySelectorAll('.site-nav a').forEach((link) => {
    link.addEventListener('click', () => {
      header.classList.remove('nav-open');
      document.body.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const tiltCards = document.querySelectorAll('.tilt-card');
const supportsHover = window.matchMedia('(hover: hover)').matches;

if (supportsHover) {
  tiltCards.forEach((card) => {
    card.addEventListener('mousemove', (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rx = (0.5 - py) * 5;
      const ry = (px - 0.5) * 7;
      card.style.setProperty('--rx', `${rx}deg`);
      card.style.setProperty('--ry', `${ry}deg`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}

if (document.body.dataset.page === 'club') {
  const topics = ['照片图册', '作品档案', '舞台高光页', '留言互动区'];
  const wishStorageKey = 'jct-hoohoo-wishes';
  const voteStorageKey = 'jct-hoohoo-votes';
  const seedWishes = [
    {
      id: 1,
      nickname: '追光炭火',
      topic: '舞台高光页',
      mood: '想补舞台名场面',
      message: '想要一整页按场次收名场面截图，翻起来像舞台回放手账。',
      createdAt: Date.now() - 1000 * 60 * 60 * 18,
      pinned: true,
    },
    {
      id: 2,
      nickname: '黄海收集员',
      topic: '照片图册',
      mood: '想看更多照片',
      message: '希望首页和作品页都能加一层长图册布局，截图转发会更方便。',
      createdAt: Date.now() - 1000 * 60 * 60 * 12,
    },
    {
      id: 3,
      nickname: '角色卡党',
      topic: '作品档案',
      mood: '想做角色专题',
      message: '作品页可以继续拆出角色卡册入口，这样每个角色都会更有收藏感。',
      createdAt: Date.now() - 1000 * 60 * 60 * 6,
    },
  ];

  const form = document.querySelector('[data-club-form]');
  const feedback = document.querySelector('[data-form-feedback]');
  const wishGrid = document.querySelector('[data-wish-grid]');
  const wishCount = document.querySelector('[data-wish-count]');
  const leadingTopic = document.querySelector('[data-leading-topic]');
  const latestFan = document.querySelector('[data-latest-fan]');
  const voteCountNodes = document.querySelectorAll('[data-vote-count]');
  const filterButtons = document.querySelectorAll('[data-filter]');
  const voteButtons = document.querySelectorAll('[data-vote]');

  let activeFilter = 'all';
  let wishes = loadWishes();
  let votes = loadVotes();

  function readStorage(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      return;
    }
  }

  function loadWishes() {
    const stored = readStorage(wishStorageKey, []);
    if (Array.isArray(stored) && stored.length > 0) {
      return stored;
    }

    writeStorage(wishStorageKey, seedWishes);
    return [...seedWishes];
  }

  function loadVotes() {
    const fallback = Object.fromEntries(topics.map((topic) => [topic, 0]));
    const stored = readStorage(voteStorageKey, fallback);
    return {
      ...fallback,
      ...stored,
    };
  }

  function formatTime(timestamp) {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  }

  function topicScores() {
    const scores = Object.fromEntries(topics.map((topic) => [topic, votes[topic] || 0]));
    wishes.forEach((wish) => {
      scores[wish.topic] = (scores[wish.topic] || 0) + 1;
    });
    return scores;
  }

  function currentLeader() {
    return Object.entries(topicScores()).sort((left, right) => right[1] - left[1])[0]?.[0] || topics[0];
  }

  function renderStats() {
    if (wishCount) {
      wishCount.textContent = String(wishes.length);
    }

    if (leadingTopic) {
      leadingTopic.textContent = currentLeader();
    }

    if (latestFan) {
      latestFan.textContent = wishes[0]?.nickname || '等你来写第一条';
    }

    voteCountNodes.forEach((node) => {
      const topic = node.getAttribute('data-vote-count');
      node.textContent = `${votes[topic] || 0} 票`;
    });
  }

  function buildWishCard(wish) {
    const article = document.createElement('article');
    article.className = `wish-card card-soft${wish.pinned ? ' wish-pinned' : ''}`;

    const headerRow = document.createElement('div');
    headerRow.className = 'wish-card-header';

    const identity = document.createElement('div');
    identity.className = 'wish-identity';

    const name = document.createElement('strong');
    name.textContent = wish.nickname;

    const stamp = document.createElement('span');
    stamp.textContent = formatTime(wish.createdAt);

    identity.append(name, stamp);

    const topic = document.createElement('span');
    topic.className = 'wish-topic';
    topic.textContent = wish.topic;

    headerRow.append(identity, topic);

    const message = document.createElement('p');
    message.className = 'wish-message';
    message.textContent = wish.message;

    const mood = document.createElement('p');
    mood.className = 'wish-mood';
    mood.textContent = `# ${wish.mood}`;

    article.append(headerRow, message, mood);
    return article;
  }

  function renderWishes() {
    if (!wishGrid) {
      return;
    }

    wishGrid.innerHTML = '';
    const filtered = wishes.filter((wish) => activeFilter === 'all' || wish.topic === activeFilter);

    if (filtered.length === 0) {
      const emptyState = document.createElement('article');
      emptyState.className = 'wish-card card-soft wish-empty';
      emptyState.innerHTML = `
        <span class="mini-label">还没有这一类愿望</span>
        <h3>先写下第一条吧。</h3>
        <p>你提交之后，这里会马上亮起来。</p>
      `;
      wishGrid.append(emptyState);
      return;
    }

    filtered.forEach((wish) => {
      wishGrid.append(buildWishCard(wish));
    });
  }

  function setFeedback(message) {
    if (feedback) {
      feedback.textContent = message;
    }
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeFilter = button.getAttribute('data-filter') || 'all';
      filterButtons.forEach((item) => item.classList.toggle('is-active', item === button));
      renderWishes();
    });
  });

  voteButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const topic = button.getAttribute('data-vote');
      votes[topic] = (votes[topic] || 0) + 1;
      writeStorage(voteStorageKey, votes);
      renderStats();
      setFeedback(`已帮你把一票投给「${topic}」。`);
      button.classList.add('is-bumped');
      window.setTimeout(() => {
        button.classList.remove('is-bumped');
      }, 240);
    });
  });

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const nickname = String(formData.get('nickname') || '').trim();
      const topic = String(formData.get('topic') || topics[0]).trim();
      const message = String(formData.get('message') || '').trim();
      const mood = String(formData.get('mood') || '想看更多照片').trim();

      if (!nickname || !message) {
        setFeedback('先把昵称和愿望写完整，再点亮留言墙。');
        return;
      }

      const wish = {
        id: Date.now(),
        nickname,
        topic,
        mood,
        message,
        createdAt: Date.now(),
      };

      wishes = [wish, ...wishes].slice(0, 18);
      writeStorage(wishStorageKey, wishes);
      renderStats();
      renderWishes();
      setFeedback(`收到 ${nickname} 的愿望啦，已经替你贴进留言墙。`);
      form.reset();
    });
  }

  renderStats();
  renderWishes();
}
