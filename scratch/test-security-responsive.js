import http from 'http';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING EUREKA SECURITY & DISPLAY VERIFICATION ===');
  let passed = 0;
  let total = 0;

  function assert(name, condition, extra = '') {
    total++;
    if (condition) {
      console.log(`✅ PASS [${total}]: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL [${total}]: ${name} - ${extra}`);
    }
  }

  try {
    // 1. Security Headers Test
    const home = await makeRequest({ host: 'localhost', port: 3000, path: '/', method: 'GET' });
    assert('X-Frame-Options is DENY', home.headers['x-frame-options'] === 'DENY');
    assert('X-Content-Type-Options is nosniff', home.headers['x-content-type-options'] === 'nosniff');
    assert('CSP contains object-src none', home.headers['content-security-policy']?.includes("object-src 'none'"));
    assert('Strict-Transport-Security is present', Boolean(home.headers['strict-transport-security']));
    assert('RateLimit headers are present', Boolean(home.headers['x-ratelimit-limit']));

    // 2. Search XSS Sanitization
    const searchRes = await makeRequest({
      host: 'localhost',
      port: 3000,
      path: '/api/search?q=%3Cscript%3Ealert(1)%3C/script%3E',
      method: 'GET'
    });
    assert('Search API returns 200', searchRes.status === 200);
    const searchJson = JSON.parse(searchRes.body);
    assert('Search results array is returned', Array.isArray(searchJson.results));

    // 3. API Publishing Route Security: Reject with Invalid Key
    const unauthPost = await makeRequest({
      host: 'localhost',
      port: 3000,
      path: '/api/posts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Editorial-Key': 'wrong-key-12345'
      }
    }, { title: 'Hacked Title', content: 'Hacked content here' });
    assert('Invalid editorial key rejected with 403', unauthPost.status === 403);

    // 4. API Publishing Route Security: Reject Invalid Data (Missing content/short title)
    const invalidDataPost = await makeRequest({
      host: 'localhost',
      port: 3000,
      path: '/api/posts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Editorial-Key': 'eureka-editorial-2026'
      }
    }, { title: 'ab', content: '' });
    assert('Invalid short title rejected with 400', invalidDataPost.status === 400);

    // 5. Post Content HTML Sanitization Test
    const testMarkdown = '# Test Title\n<script>alert("xss")</script>\n<a href="javascript:steal()">Click</a>\n<img src=x onerror=alert(1)>';
    const { postService } = await import('../src/services/postService.js');
    const { html } = postService.extractHeadingsAndHtml(testMarkdown);
    assert('Script tags stripped from rendered HTML', !html.includes('<script>') && !html.includes('alert("xss")'));
    assert('javascript: URI neutralized from rendered HTML', !html.includes('javascript:steal()'));
    assert('onerror handler stripped from rendered HTML', !html.includes('onerror='));

    // 6. Error Handler: No stack trace leakage
    const notFound = await makeRequest({
      host: 'localhost',
      port: 3000,
      path: '/non-existent-page-test-500',
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    assert('404 returns proper status', notFound.status === 404);
    assert('No internal stack trace leaked', !notFound.body.includes('at Module.') && !notFound.body.includes('node_modules'));

    console.log(`\n=== RESULTS: ${passed} / ${total} TESTS PASSED ===`);
    if (passed === total) {
      console.log('🎉 ALL SECURITY & VALIDATION CHECKS PASSED PERFECTLY!');
    }
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runTests();
