import { useEffect, useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import Button from "./ui/Button";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import { NAV_LINKS } from "../lib/content";

interface NavbarProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function Navbar({ theme, onToggleTheme }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-[1000]">
      {/* Resizable navbar (21st.dev pattern): full-width & transparent at the
          top, contracts into a centered, blurred, rounded pill once scrolled. */}
      <div
        className={`transition-all duration-300 ease-brand ${
          scrolled
            ? "mx-3 mt-2.5 h-14 max-w-4xl rounded-full border border-slate-200/70 bg-white/80 px-5 shadow-lg shadow-ink/5 backdrop-blur-md dark:border-white/10 dark:bg-[#0B1020]/80 sm:mx-auto lg:h-[60px]"
            : "mx-auto mt-0 h-[60px] max-w-[1200px] border border-transparent px-6 sm:px-8 lg:h-[72px]"
        }`}
      >
        <nav
          aria-label="Primary"
          className="flex h-full w-full items-center justify-between"
        >
        <a href="#top" className="flex items-center gap-2.5" aria-label="Trine home">
          <Logo className="h-8 w-8" />
          <span className="font-display text-2xl tracking-tight text-ink dark:text-white">
            Trine
          </span>
        </a>

        {/* Desktop links */}
        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-muted transition hover:text-ink dark:text-slate-300 dark:hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <Button href="/app" variant="ghost" size="md">
            Open app
          </Button>
          <Button href="#start" size="md">
            Start free
          </Button>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="grid h-11 w-11 place-items-center rounded-lg text-ink dark:text-white"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
        </nav>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[1100] bg-ink/40 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed right-0 top-0 z-[1200] flex h-full w-[80%] max-w-sm flex-col bg-white p-6 shadow-2xl dark:bg-[#0B1020] lg:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Logo className="h-7 w-7" />
                  <span className="font-display text-xl text-ink dark:text-white">
                    Trine
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="grid h-11 w-11 place-items-center rounded-lg text-ink dark:text-white"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <ul className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-3 text-base font-medium text-ink transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
              <Button
                href="/app"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="mt-6 w-full"
              >
                Open app
              </Button>
              <Button
                href="#start"
                onClick={() => setOpen(false)}
                className="mt-3 w-full"
              >
                Start free
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
