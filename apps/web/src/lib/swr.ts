export const jsonFetcher = (...args: Parameters<typeof fetch>) =>
  fetch(...args).then((res) => res.json());
