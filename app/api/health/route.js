// Liveness endpoint for the container healthcheck. Deliberately touches nothing
// (no DB, no auth) so it answers 200 as soon as the server is up.
export const dynamic = 'force-dynamic';

export const GET = async () => Response.json({ status: 'ok' });
