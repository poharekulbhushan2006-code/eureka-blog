async function verifyRome() {
  const base = 'http://localhost:3000';
  const urls = [
    { url: '/post/rome-wasnt-built-in-a-day-and-it-didnt-fall-in-one-either', expectText: 'Rome Wasn’t Built in a Day' },
    { url: '/category/History%20&%20Civilization', expectText: 'History & Civilization' },
    { url: '/images/rome-hero-empire.jpg' },
    { url: '/images/roman-roads-infrastructure.jpg' },
    { url: '/images/fall-of-rome-legacy.jpg' }
  ];

  console.log('=== VERIFYING ROME ESSAY & BACKGROUND ASSETS ===');
  for (const item of urls) {
    const res = await fetch(base + item.url);
    const text = item.expectText ? await res.text() : '';
    const ok = res.status === 200 && (!item.expectText || text.includes(item.expectText));
    console.log(ok ? 'PASS:' : 'FAIL:', item.url, 'Status:', res.status);
    if (item.url.includes('/post/')) {
      const match = text.match(/data-topic="([^"]+)"/);
      console.log('  Detected Topic Attribute on Body:', match ? match[1] : 'none');
    }
  }
}
verifyRome();
