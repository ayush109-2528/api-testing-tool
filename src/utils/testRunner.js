export function runTests(response, script) {
  const results = [];
  const assert = (condition, message) => {
    if (condition) results.push({ pass: true, message });
    else results.push({ pass: false, message });
  };

  try {
    // eslint-disable-next-line no-new-func
    const func = new Function('response', 'assert', script);
    func(response, assert);
  } catch (e) {
    results.push({ pass: false, message: 'Test script error: ' + e.message });
  }

  return results;
}
