async function testEndpoints() {
  const base = 'http://localhost:3000';
  const urls = [
    { url: '/robots.txt', expectStatus: 200, expectText: 'Disallow: /editor' },
    { url: '/sitemap.xml', expectStatus: 200, expectText: '<urlset' },
    { url: '/privacy', expectStatus: 200, expectText: 'Privacy Policy' },
    { url: '/terms', expectStatus: 200, expectText: 'Terms of Service' },
    { url: '/contact', expectStatus: 200, expectText: 'Nagpur' },
    { url: '/thank-you', expectStatus: 200, expectText: 'reached the editorial desk' },
    { url: '/non-existent-page-test-404', expectStatus: 404, expectText: '404' },
    { url: '/favicon.svg', expectStatus: 200 },
    { url: '/images/og-eureka-cover.jpg', expectStatus: 200 },
    { url: '/post/attachment-is-not-proof-someone-is-good-for-you', expectStatus: 200, expectText: 'Attachment Is Not Proof' }
  ];

  console.log('=== RUNNING PRODUCTION VERIFICATION SUITE ===');
  let passed = 0;

  for (const item of urls) {
    try {
      const res = await fetch(base + item.url);
      const text = await res.text();
      const statusOk = res.status === item.expectStatus;
      const textOk = !item.expectText || text.includes(item.expectText);

      if (statusOk && textOk) {
        console.log('PASS:', item.url, 'Status:', res.status);
        passed++;
      } else {
        console.error('FAIL:', item.url, 'Expected:', item.expectStatus, 'Got:', res.status, 'Text match:', textOk);
      }

      if (item.url === '/privacy') {
        console.log('--- Security Headers on /privacy ---');
        console.log('  X-Frame-Options:', res.headers.get('x-frame-options'));
        console.log('  X-Content-Type-Options:', res.headers.get('x-content-type-options'));
        console.log('  Referrer-Policy:', res.headers.get('referrer-policy'));
        console.log('  Content-Security-Policy:', res.headers.get('content-security-policy') ? 'Present' : 'Missing');
        console.log('  RateLimit Remaining:', res.headers.get('x-ratelimit-remaining'));
      }
    } catch (err) {
      console.error('ERROR requesting', item.url, err.message);
    }
  }

  // Test POST /contact
  try {
    const postRes = await fetch(base + '/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'name=Tester&email=test@example.com&message=Hello%20Eureka%20team!',
      redirect: 'manual'
    });
    console.log('POST /contact status:', postRes.status, 'Location:', postRes.headers.get('location'));
    if (postRes.status === 302 && postRes.headers.get('location') === '/thank-you') {
      console.log('PASS: POST /contact redirected to /thank-you');
      passed++;
    } else {
      console.error('FAIL: POST /contact did not redirect properly');
    }
  } catch (err) {
    console.error('ERROR POST /contact:', err.message);
  }

  console.log('=== RESULT:', passed, '/', urls.length + 1, 'PASSED ===');
}

testEndpoints();
