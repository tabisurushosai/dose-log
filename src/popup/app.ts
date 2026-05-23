import { addDoseRecord, createDoseRecord, getLatestDoseRecord, type DoseRecord } from "../core/doseLog";
import {
  PREMIUM_PRICE_USD,
  STRIPE_PAYMENT_LINK,
  createInitialPremiumState,
  getPremiumAccess,
  type PremiumState
} from "../core/premium";
import type { AppStorage } from "../storage/appStorage";
import type { Translator } from "./i18n";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

interface AppState {
  records: DoseRecord[];
  premiumState: PremiumState;
  statusMessage: string;
  statusTone: "neutral" | "info" | "success" | "error";
  isBusy: boolean;
  hasStorageError: boolean;
}

export interface DoseLogAppDependencies {
  storage: AppStorage;
  t: Translator;
  confirm: (message: string) => boolean;
  root?: HTMLElement | null;
}

export interface DoseLogApp {
  init(): Promise<void>;
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
  textContent?: string
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (textContent !== undefined) {
    element.textContent = textContent;
  }
  return element;
}

async function ensurePremiumState(adapter: AppStorage): Promise<PremiumState> {
  const storedState = await adapter.getPremiumState();
  if (storedState) {
    return storedState;
  }

  const initialState = createInitialPremiumState();
  await adapter.setPremiumState(initialState);
  return initialState;
}

function formatRecordTime(record: DoseRecord): string {
  return dateFormatter.format(new Date(record.takenAtIso));
}

export function createDoseLogApp(dependencies: DoseLogAppDependencies): DoseLogApp {
  const { storage, t, confirm } = dependencies;
  const root = dependencies.root ?? document.querySelector<HTMLElement>("#app");
  let appState: AppState | null = null;
  let pendingFocusKey: string | null = null;

  function rememberFocusedAction(): void {
    if (!root) {
      return;
    }

    const activeElement = document.activeElement;
    if (!(activeElement instanceof HTMLElement) || !root.contains(activeElement)) {
      return;
    }

    const focusKey = activeElement.dataset.focusKey;
    if (focusKey) {
      pendingFocusKey = focusKey;
    }
  }

  function restoreFocusedAction(): void {
    if (!root || !pendingFocusKey) {
      return;
    }

    const target = root.querySelector<HTMLElement>(`[data-focus-key="${pendingFocusKey}"]`);
    if (!target) {
      pendingFocusKey = null;
      return;
    }

    if (target.matches(":disabled")) {
      if (!appState?.isBusy) {
        pendingFocusKey = null;
      }
      return;
    }

    target.focus();
    pendingFocusKey = null;
  }

  function renderStatus(container: HTMLElement, state: AppState): void {
    const statusTone = state.hasStorageError ? "error" : state.statusTone;
    const status = createElement("p", `status status-${statusTone}`, state.statusMessage);
    status.id = "status-message";
    status.setAttribute("role", state.hasStorageError ? "alert" : "status");
    status.setAttribute("aria-live", state.hasStorageError ? "assertive" : "polite");
    status.setAttribute("aria-atomic", "true");
    container.append(status);
  }

  function renderLoading(container: HTMLElement): void {
    container.setAttribute("aria-busy", "true");
    container.replaceChildren();

    const header = createElement("header", "app-header");
    header.append(createElement("h1", undefined, t("appTitle")));
    header.append(createElement("p", "purpose", t("purposeText")));

    const loadingCard = createElement("section", "card state-card");
    const loadingStatus = createElement("p", "status status-info", t("loadingStatus"));
    loadingStatus.setAttribute("role", "status");
    loadingStatus.setAttribute("aria-live", "polite");
    loadingStatus.setAttribute("aria-atomic", "true");
    loadingCard.append(loadingStatus);

    container.append(header, loadingCard);
  }

  function renderLatestRecord(container: HTMLElement, records: readonly DoseRecord[]): void {
    const section = createElement("section", "card");
    section.setAttribute("aria-labelledby", "latest-record-title");

    const title = createElement("h2", undefined, t("lastRecordTitle"));
    title.id = "latest-record-title";
    section.append(title);

    const latestRecord = getLatestDoseRecord(records);
    section.append(
      createElement(
        "p",
        latestRecord ? "latest-time" : "empty-state",
        latestRecord ? formatRecordTime(latestRecord) : t("noRecords")
      )
    );

    container.append(section);
  }

  function renderHistory(container: HTMLElement, records: readonly DoseRecord[]): void {
    const section = createElement("section", "card");
    section.setAttribute("aria-labelledby", "history-title");

    const title = createElement("h2", undefined, t("historyTitle"));
    title.id = "history-title";
    section.append(title);

    if (records.length === 0) {
      section.append(createElement("p", "empty-state", t("noRecords")));
    } else {
      const list = createElement("ol", "history-list");
      records.slice(0, 10).forEach((record) => {
        const item = createElement("li", undefined, formatRecordTime(record));
        list.append(item);
      });
      section.append(list);
    }

    const clearButton = createElement("button", "secondary-button", t("clearButton"));
    clearButton.type = "button";
    clearButton.disabled = records.length === 0;
    clearButton.dataset.focusKey = "clear-records";
    clearButton.setAttribute("aria-describedby", "clear-button-description status-message");
    clearButton.addEventListener("click", handleClearRecords);

    const clearButtonDescription = createElement("p", "sr-only", t("clearButtonDescription"));
    clearButtonDescription.id = "clear-button-description";
    section.append(clearButtonDescription, clearButton);

    container.append(section);
  }

  function renderPremium(container: HTMLElement, state: PremiumState): void {
    const section = createElement("section", "card premium-card");
    section.setAttribute("aria-labelledby", "premium-title");

    const title = createElement("h2", undefined, t("premiumTitle"));
    title.id = "premium-title";
    section.append(title);

    section.append(createElement("p", "premium-copy", t("premiumCopy")));

    const access = getPremiumAccess(state);
    let accessText = t("premiumTrialEnded");
    if (state.purchasedAtIso) {
      accessText = t("premiumPurchased");
    } else if (access.isTrialActive) {
      accessText = t("premiumTrialActive", String(access.trialDaysRemaining));
    }

    section.append(createElement("p", "premium-status", accessText));
    section.append(createElement("p", "premium-price", `$${PREMIUM_PRICE_USD}`));

    const linkLabel = createElement("p", "premium-link-label", t("premiumLinkLabel"));
    const linkValue = createElement("code", "premium-link", STRIPE_PAYMENT_LINK);
    section.append(linkLabel, linkValue);

    container.append(section);
  }

  function renderApp(state: AppState): void {
    if (!root) {
      return;
    }

    rememberFocusedAction();
    root.setAttribute("aria-busy", String(state.isBusy));
    root.replaceChildren();

    const header = createElement("header", "app-header");
    header.append(createElement("h1", undefined, t("appTitle")));
    header.append(createElement("p", "purpose", t("purposeText")));
    root.append(header);

    const tapButton = createElement("button", "tap-button", t("tapButton"));
    tapButton.type = "button";
    tapButton.disabled = state.isBusy;
    tapButton.dataset.focusKey = "tap-record";
    tapButton.setAttribute("aria-busy", String(state.isBusy));
    tapButton.setAttribute("aria-describedby", "tap-button-description status-message");
    tapButton.addEventListener("click", handleTapRecord);
    const tapButtonDescription = createElement("p", "sr-only", t("tapButtonDescription"));
    tapButtonDescription.id = "tap-button-description";
    root.append(tapButton, tapButtonDescription);

    renderStatus(root, state);
    renderLatestRecord(root, state.records);
    renderHistory(root, state.records);
    renderPremium(root, state.premiumState);
    root.append(createElement("p", "privacy-note", t("privacyNote")));
    restoreFocusedAction();
  }

  async function setState(nextState: AppState): Promise<void> {
    appState = nextState;
    renderApp(nextState);
  }

  async function handleTapRecord(): Promise<void> {
    if (!appState || appState.isBusy) {
      return;
    }

    const nextRecord = createDoseRecord();
    const nextRecords = addDoseRecord(appState.records, nextRecord);
    await setState({
      ...appState,
      statusMessage: t("savingStatus"),
      statusTone: "info",
      isBusy: true,
      hasStorageError: false
    });

    try {
      await storage.setDoseRecords(nextRecords);
      await setState({
        ...appState,
        records: nextRecords,
        statusMessage: t("savedToast"),
        statusTone: "success",
        isBusy: false,
        hasStorageError: false
      });
    } catch {
      await setState({
        ...appState,
        statusMessage: t("storageError"),
        statusTone: "error",
        isBusy: false,
        hasStorageError: true
      });
    }
  }

  async function handleClearRecords(): Promise<void> {
    if (!appState || appState.records.length === 0 || appState.isBusy) {
      return;
    }

    if (!confirm(t("confirmClear"))) {
      return;
    }

    await setState({
      ...appState,
      statusMessage: t("clearingStatus"),
      statusTone: "info",
      isBusy: true,
      hasStorageError: false
    });

    try {
      await storage.setDoseRecords([]);
      await setState({
        ...appState,
        records: [],
        statusMessage: t("clearedToast"),
        statusTone: "success",
        isBusy: false,
        hasStorageError: false
      });
    } catch {
      await setState({
        ...appState,
        statusMessage: t("storageError"),
        statusTone: "error",
        isBusy: false,
        hasStorageError: true
      });
    }
  }

  async function init(): Promise<void> {
    if (root) {
      renderLoading(root);
    }

    try {
      const [records, premiumState] = await Promise.all([storage.getDoseRecords(), ensurePremiumState(storage)]);
      await setState({
        records,
        premiumState,
        statusMessage: t("readyStatus"),
        statusTone: "neutral",
        isBusy: false,
        hasStorageError: false
      });
    } catch {
      const fallbackState = createInitialPremiumState();
      await setState({
        records: [],
        premiumState: fallbackState,
        statusMessage: t("storageError"),
        statusTone: "error",
        isBusy: false,
        hasStorageError: true
      });
    }
  }

  return { init };
}
