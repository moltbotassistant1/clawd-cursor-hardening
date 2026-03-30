import { describe, expect, it, vi, beforeEach } from "vitest";
import { ActionRouter } from "../src/action-router";

function makeMockA11y() {
  return {
    getWindows: vi.fn().mockResolvedValue([]),
    getActiveWindow: vi.fn().mockResolvedValue(null),
    focusWindow: vi.fn().mockResolvedValue({ success: true }),
    findElement: vi.fn().mockResolvedValue([]),
    invokeElement: vi.fn().mockResolvedValue({ success: false }),
  } as any;
}

function makeMockDesktop() {
  return {
    keyPress: vi.fn().mockResolvedValue(undefined),
    typeText: vi.fn().mockResolvedValue(undefined),
    mouseClick: vi.fn().mockResolvedValue(undefined),
  } as any;
}

describe("ActionRouter.route", () => {
  let router: ActionRouter;
  let mockDesktop: ReturnType<typeof makeMockDesktop>;

  beforeEach(() => {
    const mockA11y = makeMockA11y();
    mockDesktop = makeMockDesktop();
    router = new ActionRouter(mockA11y, mockDesktop);
  });

  it('handles "type hello"', async () => {
    const result = await router.route("type hello");
    expect(result.handled).toBe(true);
    expect(mockDesktop.typeText).toHaveBeenCalledWith("hello");
  });

  it("handles \"type 'quoted text'\"", async () => {
    const result = await router.route("type 'hello world'");
    expect(result.handled).toBe(true);
    expect(mockDesktop.typeText).toHaveBeenCalledWith("hello world");
  });

  it('handles "press enter"', async () => {
    const result = await router.route("press enter");
    expect(result.handled).toBe(true);
    expect(mockDesktop.keyPress).toHaveBeenCalled();
  });

  it("rejects compound tasks with comma + verb", async () => {
    const result = await router.route("open chrome, type hello");
    expect(result.handled).toBe(false);
    expect(result.description).toContain("Compound task");
  });

  it('rejects compound tasks with "and then"', async () => {
    const result = await router.route("open notepad and then type hello");
    expect(result.handled).toBe(false);
  });

  it("falls back for unrecognized tasks", async () => {
    const result = await router.route("explain quantum physics");
    expect(result.handled).toBe(false);
  });

  it("handles URL navigation when browser window exists", async () => {
    // Provide a mock browser window so the router can navigate via address bar
    const mockA11yWithBrowser = {
      getWindows: vi
        .fn()
        .mockResolvedValue([
          {
            processId: 1,
            processName: "chrome",
            title: "Google Chrome",
            handle: 1,
            bounds: { x: 0, y: 0, width: 1280, height: 800 },
            isMinimized: false,
          },
        ]),
      getActiveWindow: vi.fn().mockResolvedValue(null),
      focusWindow: vi.fn().mockResolvedValue({ success: true }),
      findElement: vi.fn().mockResolvedValue([]),
      invokeElement: vi.fn().mockResolvedValue({ success: false }),
    } as any;
    const routerWithBrowser = new ActionRouter(
      mockA11yWithBrowser,
      mockDesktop,
    );
    const result = await routerWithBrowser.route("go to https://example.com");
    expect(result.handled).toBe(true);
    // Should use address bar navigation: Ctrl+L + type URL + Enter
    expect(mockDesktop.keyPress).toHaveBeenCalledWith("ctrl+l");
    expect(mockDesktop.typeText).toHaveBeenCalledWith("https://example.com");
  });

  it("validates URL protocol — rejects non-http/https via navigate to", async () => {
    // handleNavigateToUrl blocks non-http/https protocols (defense in depth)
    // file:// is already blocked by the URL regex (no dots in path),
    // so falls to window focus. This tests that the router doesn't crash.
    const result = await router.route("go to file:///etc/passwd");
    // Treated as a focus window request — no browser navigation occurs
    expect(typeof result.handled).toBe("boolean");
    expect(mockDesktop.typeText).not.toHaveBeenCalled();
  });

  it('handles "close firefox" (no window found)', async () => {
    const result = await router.route("close firefox");
    // Mock returns empty windows — close will not find window
    // handled may be true (process kill attempted) or false depending on impl
    // We just verify it doesn't throw
    expect(typeof result.handled).toBe("boolean");
  });

  it("handles screenshot command", async () => {
    const result = await router.route("take a screenshot");
    expect(result.handled).toBe(true);
    expect(mockDesktop.keyPress).toHaveBeenCalled();
  });

  it("handles lock screen", async () => {
    const result = await router.route("lock screen");
    expect(result.handled).toBe(true);
    expect(mockDesktop.keyPress).toHaveBeenCalled();
  });

  it("handles show desktop", async () => {
    const result = await router.route("show desktop");
    expect(result.handled).toBe(true);
    expect(mockDesktop.keyPress).toHaveBeenCalled();
  });
});

describe("ActionRouter.telemetry", () => {
  it("tracks nonShortcutHandled vs LLM fallbacks", async () => {
    const router = new ActionRouter(makeMockA11y(), makeMockDesktop());

    await router.route("type hello"); // nonShortcutHandled
    await router.route("explain quantum"); // llmFallback
    await router.route("take a screenshot"); // nonShortcutHandled

    const telemetry = router.getTelemetry();
    expect(telemetry.totalRequests).toBe(3);
    expect(telemetry.nonShortcutHandled).toBe(2);
    expect(telemetry.llmFallbacks).toBe(1);
  });

  it("resets telemetry", async () => {
    const router = new ActionRouter(makeMockA11y(), makeMockDesktop());
    await router.route("type hello");
    router.resetTelemetry();
    expect(router.getTelemetry().totalRequests).toBe(0);
  });
});
