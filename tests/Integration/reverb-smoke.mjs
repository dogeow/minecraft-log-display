// Local protocol integration only: disposable process, fixed test-only credentials, no DB writes.
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import net from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import WebSocket from "ws";

const php = process.env.PHP_BINARY || "php";
const temporaryDirectory = mkdtempSync(
    join(tmpdir(), "minecraft-reverb-smoke-"),
);
const port = Number(process.env.REVERB_TEST_PORT || 18787);
const env = {
    ...process.env,
    // Never load a production configuration cache, even when this checkout has one.
    APP_CONFIG_CACHE: join(temporaryDirectory, "config.php"),
    APP_ENV: "testing",
    APP_DEBUG: "false",
    APP_URL: "http://reverb.test",
    APP_KEY: "base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    DB_CONNECTION: "sqlite",
    DB_DATABASE: ":memory:",
    CACHE_STORE: "array",
    SESSION_DRIVER: "array",
    QUEUE_CONNECTION: "sync",
    BROADCAST_CONNECTION: "reverb",
    MINECRAFT_REALTIME_ENABLED: "true",
    REVERB_APP_ID: "protocol-test",
    REVERB_APP_KEY: "protocol-test-public",
    REVERB_APP_SECRET: "protocol-test-secret",
    REVERB_HOST: "127.0.0.1",
    REVERB_PORT: String(port),
    REVERB_SCHEME: "http",
    REVERB_SERVER_HOST: "127.0.0.1",
    REVERB_SERVER_PORT: String(port),
    REVERB_ALLOWED_ORIGINS: "reverb.test",
    REVERB_SCALING_ENABLED: "false",
    LOG_CHANNEL: "stderr",
};
const server = spawn(
    php,
    ["artisan", "reverb:start", "--host=127.0.0.1", `--port=${port}`],
    { env, stdio: ["ignore", "pipe", "pipe"] },
);
let serverOutput = "";
server.stdout.on("data", (data) => {
    serverOutput += data;
});
server.stderr.on("data", (data) => {
    serverOutput += data;
});
const clients = [];
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function nextEvent(ws, predicate) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            cleanup();
            reject(new Error("WebSocket event timeout"));
        }, 5000);
        const handler = (raw) => {
            const event = JSON.parse(raw.toString());
            if (typeof event.data === "string")
                event.data = JSON.parse(event.data);
            if (predicate(event)) {
                cleanup();
                resolve(event);
            }
        };
        const error = (exception) => {
            cleanup();
            reject(exception);
        };
        function cleanup() {
            clearTimeout(timer);
            ws.off("message", handler);
            ws.off("error", error);
        }
        ws.on("message", handler);
        ws.on("error", error);
    });
}
function connect(origin = "http://reverb.test") {
    const ws = new WebSocket(
        `ws://127.0.0.1:${port}/app/protocol-test-public?protocol=7&client=js&version=8.4.0&flash=false`,
        { origin },
    );
    clients.push(ws);
    return ws;
}
try {
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt++) {
        if (server.exitCode !== null)
            throw new Error(`Reverb exited: ${serverOutput}`);
        ready = await new Promise((resolve) => {
            const probe = net.connect(port, "127.0.0.1");
            probe.once("connect", () => {
                probe.destroy();
                resolve(true);
            });
            probe.once("error", () => {
                probe.destroy();
                resolve(false);
            });
        });
        if (ready) break;
        await delay(100);
    }
    assert(ready, "Local Reverb process did not start");
    const ws = connect();
    await nextEvent(
        ws,
        (event) => event.event === "pusher:connection_established",
    );
    const subscribed = nextEvent(
        ws,
        (event) => event.event === "pusher_internal:subscription_succeeded",
    );
    ws.send(
        JSON.stringify({
            event: "pusher:subscribe",
            data: { channel: "minecraft.status" },
        }),
    );
    await subscribed;
    const notification = nextEvent(
        ws,
        (event) => event.event === "status.changed",
    );
    execFileSync(
        php,
        [
            "-r",
            "require 'vendor/autoload.php'; $app = require 'bootstrap/app.php'; $app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap(); event(new App\\Events\\ServerStatusChanged('smoke-revision'));",
        ],
        { env, stdio: "pipe" },
    );
    const received = await notification;
    assert.equal(received.channel, "minecraft.status");
    assert.deepEqual(received.data, { revision: "smoke-revision" });
    const rejected = nextEvent(ws, (event) => event.event === "pusher:error");
    ws.send(
        JSON.stringify({
            event: "client-status.changed",
            channel: "minecraft.status",
            data: { revision: "forged" },
        }),
    );
    assert.equal((await rejected).data.code, 4301);
    const wrongOrigin = connect("https://unapproved.example");
    const refused = await nextEvent(
        wrongOrigin,
        (event) => event.event === "pusher:error",
    );
    assert.equal(refused.data.code, 4009);
    console.log(
        "PASS: Reverb handshake, public subscription, server notification, minimal payload, client-event rejection, origin restriction",
    );
} finally {
    for (const ws of clients) ws.terminate();
    server.kill("SIGTERM");
    await Promise.race([
        new Promise((resolve) => server.once("exit", resolve)),
        delay(1500),
    ]);
    if (server.exitCode === null && server.signalCode === null)
        server.kill("SIGKILL");
    rmSync(temporaryDirectory, { recursive: true, force: true });
}
