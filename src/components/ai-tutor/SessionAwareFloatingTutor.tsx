"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { FloatingTutor } from "@/components/ai-tutor/FloatingTutor";
import { readTutorSessionId } from "@/lib/tutor-session";

/**
 * Session-bound, cross-tab-safe lifecycle for the existing floating tutor.
 * On focus, visibility restoration and periodic revalidation, the server's
 * authenticated user id is authoritative. A changed id remounts the tutor,
 * wiping all prior in-memory messages, drafts, quotas, and in-flight UI state.
 */
export function SessionAwareFloatingTutor() {
  const pathname = usePathname();
  const [identity, setIdentity] = useState<string | null | undefined>(undefined);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState(false);
  const generation = useRef(0);
  const mounted = useRef(true);

  // AGF_V273_PRESERVE_FIRST_OPEN
  // Save a launch intent until the auth request has finished and the
  // account-bound FloatingTutor has been re-mounted with a clean state.
  const [pendingLaunch, setPendingLaunch] = useState(false);
  const replayingLaunch = useRef(false);

  const check = useCallback(async (blockUi: boolean) => {
    const request = ++generation.current;
    if (blockUi) setVerifying(true);
    try {
      const current = await readTutorSessionId();
      if (!mounted.current || request !== generation.current) return;
      setIdentity(current);
      setError(false);
    } catch {
      if (!mounted.current || request !== generation.current) return;
      // Fail closed: do not expose a possibly stale transcript while auth is unknown.
      setError(true);
    } finally {
      if (mounted.current && request === generation.current) setVerifying(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const onFocus = () => { void check(true); };
    const onVisible = () => { if (document.visibilityState === "visible") void check(true); };
    const onStorage = () => { void check(true); };
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    // AGF_V272_ACTIVE_SESSION_SYNC
    // Browsers and headless automation do not always dispatch focus/visibility
    // events when another tab changes the shared auth cookie. Revalidate
    // visible pages, plus hidden tabs that still have an open chat panel.
    // Hidden pages with a closed panel skip polling; opening triggers a check.
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible" || document.querySelector(".agf-panel")) {
        void check(false);
      }
    }, 2000);
    // AGF_V272_LINT_CLEANUP: capture the stable ref object in the effect scope.
    const cleanupGeneration = generation;
    return () => {
      mounted.current = false;
      ++cleanupGeneration.current;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [check]);



  // Next.js client-side login/logout navigation may not fire window.focus.
  // Revalidate on every route transition as well as on focus/visibility.
  useEffect(() => {
    const task = window.setTimeout(() => { void check(true); }, 0);
    return () => window.clearTimeout(task);
  }, [pathname, check]);

  // When the workshop's verdict or detailed results occupy the viewport,
  // hide the mobile FAB rather than obscure the verdict and primary action.
  useEffect(() => {
    if (pathname !== "/workshop" || typeof IntersectionObserver === "undefined") return;
    const seen = new Map<Element, boolean>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) seen.set(entry.target, entry.isIntersecting);
      document.documentElement.classList.toggle("agf-results-visible", [...seen.values()].some(Boolean));
    }, { rootMargin: "0px", threshold: 0 });
    const scan = () => {
      for (const element of [...seen.keys()]) {
        if (document.body.contains(element)) continue;
        observer.unobserve(element);
        seen.delete(element);
      }
      document.documentElement.classList.toggle("agf-results-visible", [...seen.values()].some(Boolean));
      for (const element of document.querySelectorAll("#agw-result-summary, #agw-detailed-results")) {
        if (seen.has(element)) continue;
        seen.set(element, false);
        observer.observe(element);
      }
    };
    const mutations = new MutationObserver(scan);
    mutations.observe(document.body, { childList: true, subtree: true });
    scan();
    return () => {
      observer.disconnect();
      mutations.disconnect();
      document.documentElement.classList.remove("agf-results-visible");
    };
  }, [pathname]);

  // After verification, replay precisely the launch action the user made.
  // requestAnimationFrame allows React to commit the new account-bound child;
  // the bypass ref prevents the synthetic click from triggering another check.
  useEffect(() => {
    if (!pendingLaunch || verifying || error || identity === undefined) return;
    const frame = window.requestAnimationFrame(() => {
      const launcher = document.querySelector<HTMLButtonElement>(".agf-session-host .agf-launcher");
      setPendingLaunch(false);
      if (!launcher) return;
      replayingLaunch.current = true;
      try {
        launcher.click();
      } finally {
        replayingLaunch.current = false;
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pendingLaunch, verifying, error, identity]);

  if (identity === undefined || error) {
    return <button type="button" className="agf-session-retry" onClick={() => void check(true)}
      aria-label="重新检测 AI 助手登录状态">{error ? "AI 登录状态待确认 · 点击重试" : "AI 助手加载中…"}</button>;
  }

  return <div
    className="agf-session-host"
    // Re-validate BEFORE an old in-memory chat can be reopened. This is a
    // second trigger in case a background tab's timers have been throttled.
    // React batches the event's state updates; verifying masks old content
    // until /api/auth/me confirms the current identity.
    onClickCapture={event => {
      if (!(event.target instanceof Element) || !event.target.closest(".agf-launcher")) return;
      // Programmatic replay is already backed by a completed auth check.
      if (replayingLaunch.current) return;
      // Do not let the original button open A's in-memory chat BEFORE
      // /api/auth/me confirms B. Save the first click instead of discarding it.
      event.preventDefault();
      event.stopPropagation();
      setPendingLaunch(true);
      void check(true);
    }}
    style={verifying ? { visibility: "hidden", pointerEvents: "none" } : undefined}
  >
    <FloatingTutor key={identity ?? "guest"} sessionUserId={identity} />
  </div>;
}
