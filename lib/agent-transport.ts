import { request } from "node:http";
export function agentRequest(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<any> {
  const socketPath = process.env.COMPANION_AGENT_SOCKET;
  if (!socketPath) return Promise.reject(new Error("AGENT_UNAVAILABLE"));
  return new Promise((resolve, reject) => {
    const req = request(
      {
        socketPath,
        path,
        method,
        headers: { "Content-Type": "application/json" },
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          data += chunk;
          if (data.length > 4_000_000)
            req.destroy(new Error("Response too large"));
        });
        res.on("end", () => {
          try {
            const result = JSON.parse(data);
            if ((res.statusCode || 500) >= 400)
              reject(new Error(result.error || "AGENT_UNAVAILABLE"));
            else resolve(result);
          } catch {
            reject(new Error("AGENT_UNAVAILABLE"));
          }
        });
        res.on("error", () => reject(new Error("AGENT_UNAVAILABLE")));
      },
    );
    req.setTimeout(30000, () => req.destroy(new Error("AGENT_UNAVAILABLE")));
    req.on("error", () => reject(new Error("AGENT_UNAVAILABLE")));
    req.end(body === undefined ? undefined : JSON.stringify(body));
  });
}
