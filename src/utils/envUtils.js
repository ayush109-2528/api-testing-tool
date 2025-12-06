export function replaceEnvVars(str = '', envVars = []) {
  return str.replace(/{{(.*?)}}/g, (_, v) => {
    const key = v.trim();
    const found = envVars.find((item) => item.key === key);
    return found ? found.value : '';
  });
}
