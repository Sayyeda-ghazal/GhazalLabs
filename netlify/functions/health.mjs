export default async () => Response.json({ status: "ok", time: new Date().toISOString() });

export const config = { path: "/api/health" };
