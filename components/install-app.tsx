"use client";

import { useEffect, useState } from "react";

type InstallChoice = "accepted" | "dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: InstallChoice }>;
};

type Phone = "iphone" | "android" | "other";

function phoneKind(): Phone {
  const agent = window.navigator.userAgent;
  const iPad = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if (/iPad|iPhone|iPod/.test(agent) || iPad) return "iphone";
  if (/Android/i.test(agent)) return "android";
  return "other";
}

function alreadyInstalled(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

const iphoneSteps = [
  "Open this page in Safari.",
  "Tap the Share button.",
  "Tap Add to Home Screen.",
  "Tap Add. The icon then opens the programme.",
];

const androidSteps = [
  "Open this page in Chrome.",
  "Tap Install, or open the Chrome menu and choose Install app.",
  "Confirm. The icon then opens the programme.",
];

export function InstallApp() {
  const [phone, setPhone] = useState<Phone>("other");
  const [installed, setInstalled] = useState(false);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setPhone(phoneKind());
    setInstalled(alreadyInstalled());

    function onPrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      setInstalled(true);
      setPromptEvent(null);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPromptEvent(null);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <article className="card p-6">
        <h2 className="font-display text-2xl sm:text-3xl text-navy">iPhone</h2>
        <ol className="mt-4 grid list-decimal gap-2 pl-5 leading-7">
          {iphoneSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {phone === "iphone" && installed ? <p className="mt-4 text-sm font-semibold text-green">Already on this iPhone.</p> : null}
      </article>
      <article className="card p-6">
        <h2 className="font-display text-2xl sm:text-3xl text-navy">Android</h2>
        {promptEvent ? (
          <button
            type="button"
            className="pill pill-solid mt-4"
            onClick={install}
          >
            Install on this phone
          </button>
        ) : null}
        <ol className="mt-4 grid list-decimal gap-2 pl-5 leading-7">
          {androidSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {phone === "android" && installed ? <p className="mt-4 text-sm font-semibold text-green">Already on this Android phone.</p> : null}
      </article>
    </div>
  );
}
