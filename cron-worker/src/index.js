export default {
  async scheduled(_event, env, ctx) {
    const req = new Request("https://bookstore.internal/api/cron/check", {
      headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
    });
    ctx.waitUntil(
      env.SHOP.fetch(req).then(async (res) => console.log("cron check:", res.status, await res.text())),
    );
  },
  // Visiting this Worker in a browser does nothing useful.
  async fetch() {
    return new Response("ok");
  },
};
