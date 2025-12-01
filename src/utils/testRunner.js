
export function runTests(response, script) {
  const results = [];
  const assert = (condition, message) => {
    results.push({ pass: !!condition, message });
  };

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('response', 'assert', script);
    fn(response, assert);
  } catch (e) {
    results.push({ pass: false, message: 'Test script error: ' + e.message });
  }

  return results;
}
