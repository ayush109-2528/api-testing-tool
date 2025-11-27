export const toolActions = {
  'base64-encode': (input) => btoa(input),
  'base64-decode': (input) => {
    try {
      return atob(input);
    } catch {
      return 'Invalid Base64 input';
    }
  },
  'url-encode': (input) => encodeURIComponent(input),
  'url-decode': (input) => {
    try {
      return decodeURIComponent(input);
    } catch {
      return 'Invalid URL encoding';
    }
  },
  'json-prettify': (input) => {
    try {
      return JSON.stringify(JSON.parse(input), null, 2);
    } catch {
      return 'Invalid JSON';
    }
  },
};
