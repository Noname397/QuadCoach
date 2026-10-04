import { afterEach, describe, expect, it, vi } from "vitest";
import { parseResume, request } from "./authApi";

function response({ ok, status, contentType, data }) {
  return {
    ok,
    status,
    headers: new Headers({ "content-type": contentType }),
    json: vi.fn().mockResolvedValue(data),
  };
}

describe("request", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns JSON for successful responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          ok: true,
          status: 200,
          contentType: "application/json",
          data: { user: { id: "user-1" } },
        }),
      ),
    );

    await expect(request("/api/me")).resolves.toEqual({
      user: { id: "user-1" },
    });
  });

  it("uses the server error for JSON error responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          ok: false,
          status: 401,
          contentType: "application/json",
          data: { error: "Invalid session." },
        }),
      ),
    );

    await expect(request("/api/me")).rejects.toThrow("Invalid session.");
  });

  it("handles non-JSON server errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          ok: false,
          status: 502,
          contentType: "text/html",
          data: "Bad gateway",
        }),
      ),
    );

    await expect(request("/api/me")).rejects.toThrow("Request failed (502)");
  });

  it("handles network failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(request("/api/me")).rejects.toThrow(
      "Unable to connect to the server.",
    );
  });
});

describe("parseResume", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts the selected file with bearer auth as multipart form data", async () => {
    const resume = new File(["resume text"], "resume.pdf", {
      type: "application/pdf",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          ok: true,
          status: 200,
          contentType: "application/json",
          data: { filename: "resume.pdf", text: "Resume text" },
        }),
      ),
    );

    await expect(parseResume("test-token", resume)).resolves.toEqual({
      filename: "resume.pdf",
      text: "Resume text",
    });

    const [url, options] = fetch.mock.calls[0];
    expect(url).toContain("/api/resume/parse");
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ Authorization: "Bearer test-token" });
    expect(options.body.get("resume")).toBe(resume);
  });
});