import "server-only";

const LOCAL_SITE_URL = "http://localhost:3000";

function normalizeUrl(value: string) {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/$/, "");
}

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredUrl) return normalizeUrl(configuredUrl);

  const vercelDeploymentUrl = process.env.VERCEL_URL?.trim();
  if (vercelDeploymentUrl) return normalizeUrl(vercelDeploymentUrl);

  return LOCAL_SITE_URL;
}
