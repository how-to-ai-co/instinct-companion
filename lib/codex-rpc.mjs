import { EventEmitter } from "node:events";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

// One persistent stdio connection, owned by the supervised bridge service.
export class CodexRPC extends EventEmitter {
  constructor(binary, options = {}) {
    super();
    this.sequence = 0;
    this.pending = new Map();
    this.child = spawn(
      binary,
      [
        "app-server",
        "--disable",
        "shell_tool",
        "--disable",
        "shell_snapshot",
        "-c",
        'web_search="disabled"',
        "-c",
        'cli_auth_credentials_store="file"',
      ],
      {
        cwd: options.cwd,
        env: options.env || process.env,
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    this.child.stderr.on("data", () => {}); // Never log provider tokens or raw traces.
    createInterface({ input: this.child.stdout }).on("line", (line) => {
      let packet;
      try {
        packet = JSON.parse(line);
      } catch {
        return;
      }
      if ("id" in packet && !packet.method) {
        const entry = this.pending.get(packet.id);
        if (!entry) return;
        clearTimeout(entry.timer);
        this.pending.delete(packet.id);
        if (packet.error)
          entry.reject(
            new Error(packet.error.message || "Codex request failed"),
          );
        else entry.resolve(packet.result);
      } else if ("id" in packet) this.emit("request", packet);
      else this.emit("notification", packet);
    });
    const stopped = () => {
      for (const entry of this.pending.values()) {
        clearTimeout(entry.timer);
        entry.reject(new Error("Agent runtime stopped"));
      }
      this.pending.clear();
      this.emit("stopped");
    };
    this.child.on("error", stopped);
    this.child.on("exit", stopped);
  }
  send(packet) {
    if (!this.child.stdin.writable)
      throw new Error("Agent runtime unavailable");
    this.child.stdin.write(JSON.stringify(packet) + "\n");
  }
  call(method, params = {}, timeout = 25000) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("Agent runtime request timed out"));
      }, timeout);
      this.pending.set(id, { resolve, reject, timer });
      try {
        this.send({ id, method, params });
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(error);
      }
    });
  }
  async initialize() {
    await this.call("initialize", {
      clientInfo: {
        name: "instinct_companion",
        title: "Instinct Companion",
        version: "0.2.0",
      },
      capabilities: { experimentalApi: true },
    });
    this.send({ method: "initialized", params: {} });
  }
  close() {
    this.child.kill("SIGTERM");
  }
}
