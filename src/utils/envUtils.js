export function replaceEnvVars(str = '', envVars = []) {
  return str.replace(/{{(.*?)}}/g, (_, v) => {
    const key = v.trim();
    const found = envVars.find(({ key: k }) => k === key);
    return found ? found.value : '';
  });
}
