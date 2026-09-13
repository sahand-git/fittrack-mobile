import { useEffect } from 'react';

/** Adds consistent keyboard behavior to the existing modal overlays. */
export function DialogAccessibility() {
  useEffect(() => {
    const focusable = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')).filter(el => el.getClientRects().length > 0 && el.getAttribute('aria-hidden') !== 'true');
    let active: HTMLElement | null = null;
    const previous = new Map<HTMLElement, HTMLElement | null>();
    const originalOverflow = document.body.style.overflow;
    function update() {
      const overlays = Array.from(document.querySelectorAll<HTMLElement>('.fixed.inset-0')).filter(el => el.getClientRects().length > 0 && el.querySelector('h2,h3,[role="dialog"]'));
      const overlay = overlays.at(-1);
      const panel = overlay?.querySelector<HTMLElement>('[role="dialog"]') || overlay || null;
      if (panel === active) return;
      const closed = active;
      active = panel;
      if (panel) {
        if (!previous.has(panel)) previous.set(panel, document.activeElement as HTMLElement | null);
        panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
        if (!panel.hasAttribute('aria-label') && !panel.hasAttribute('aria-labelledby')) {
          const title = panel.querySelector('h2,h3');
          if (title) panel.setAttribute('aria-label', title.textContent || '');
        }
        panel.tabIndex = -1;
        if (!panel.contains(document.activeElement)) (focusable(panel)[0] || panel).focus();
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = originalOverflow;
        const restore = closed && previous.get(closed);
        if (restore?.isConnected) restore.focus();
      }
    }
    function keydown(event: KeyboardEvent) {
      if (!active) return;
      if (event.key === 'Escape') {
        const close = Array.from(active.querySelectorAll<HTMLButtonElement>('button[aria-label]')).find(button => button.querySelector('.lucide-x'));
        if (close && !close.disabled) { event.preventDefault(); event.stopPropagation(); close.click(); }
      }
      if (event.key === 'Tab') {
        const items = focusable(active), first = items[0], last = items.at(-1);
        if (!first) { event.preventDefault(); active.focus(); return; }
        if (event.shiftKey && (document.activeElement === first || !active.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !active.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      }
    }
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('keydown', keydown, true); update();
    return () => { observer.disconnect(); document.removeEventListener('keydown', keydown, true); document.body.style.overflow = originalOverflow; };
  }, []);
  return null;
}
