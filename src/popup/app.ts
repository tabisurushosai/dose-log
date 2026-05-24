import { addDoseRecord, createDoseRecord, getLatestDoseRecord, type DoseRecord } from "../core/doseLog";
import {
  PREMIUM_PRICE_USD,
  STRIPE_PAYMENT_LINK,
  TRIAL_DAYS,
  createInitialPremiumState,
  getPremiumAccess,
  type PremiumState
} from "../core/premium";
import type { AppStorage } from "../storage/appStorage";
import type { Translator } from "./i18n";

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
  locale?: string;
  root?: HTMLElement | null;
}

export interface DoseLogApp {
  init(): Promise<void>;
}

const HISTORY_DISPLAY_LIMIT = 10;
const APP_TITLE_ID = "app-title";
const STATUS_MESSAGE_ID = "status-message";

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

export function createDoseLogApp(dependencies: DoseLogAppDependencies): DoseLogApp {
  const { storage, t, confirm } = dependencies;
  const root = dependencies.root ?? document.querySelector<HTMLElement>("#app");
  const locale = dependencies.locale || navigator.language || undefined;
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short"
  });
  const numberFormatter = new Intl.NumberFormat(locale);
  const usdFormatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
  let appState: AppState | null = null;
  let pendingFocusKey: string | null = null;

  function syncDocumentLocale(): void {
    if (locale) {
      document.documentElement.lang = locale;
    }
    document.title = t("appTitle");
  }

  function formatRecordTime(record: DoseRecord): string {
    return dateFormatter.format(new Date(record.takenAtIso));
  }

  function formatNumber(value: number): string {
    return numberFormatter.format(value);
  }

  function formatUsd(value: number): string {
    return usdFormatter.format(value);
  }

  function rememberFocusedAction(): void {
    if (!root) {
      return;
    }

    const activeElement = document.activeElement;
    if (!(activeElement instanceof HTMLElement) || !root.contains(activeElement)) {
      return;
    }

    const focusKey = activeElement.dataset["focusKey"];
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
    status.id = STATUS_MESSAGE_ID;
    status.setAttribute("role", state.hasStorageError ? "alert" : "status");
    status.setAttribute("aria-live", state.hasStorageError ? "assertive" : "polite");
    status.setAttribute("aria-atomic", "true");
    container.append(status);
  }

  function renderHeader(): HTMLElement {
    const header = createElement("header", "app-header");
    const title = createElement("h1", undefined, t("appTitle"));
    title.id = APP_TITLE_ID;
    header.append(title);
    header.append(createElement("p", "purpose", t("purposeText")));
    return header;
  }

  function renderLoading(container: HTMLElement): void {
    syncDocumentLocale();
    container.setAttribute("aria-busy", "true");
    container.setAttribute("aria-labelledby", APP_TITLE_ID);
    container.replaceChildren();

    const loadingCard = createElement("section", "card state-card");
    const loadingStatus = createElement("p", "status status-info", t("loadingStatus"));
    loadingStatus.setAttribute("role", "status");
    loadingStatus.setAttribute("aria-live", "polite");
    loadingStatus.setAttribute("aria-atomic", "true");
    loadingCard.append(loadingStatus);

    container.append(renderHeader(), loadingCard);
  }

  function renderLatestRecord(container: HTMLElement, records: readonly DoseRecord[]): void {
    const section = createElement("section", "card");
    section.setAttribute("aria-labelledby", "latest-record-title");

    const title = createElement("h2", undefined, t("lastRecordTitle"));
    title.id = "latest-record-title";
    section.append(title);

    const latestRecord = getLatestDoseRecord(records);
    const latestRecordText = createElement(
      "p",
      latestRecord ? "latest-time" : "empty-state",
      latestRecord ? formatRecordTime(latestRecord) : t("emptyLatestRecord")
    );
    latestRecordText.setAttribute("aria-live", "polite");
    latestRecordText.setAttribute("aria-atomic", "true");
    section.append(latestRecordText);

    container.append(section);
  }

  function renderOnboardingGuide(container: HTMLElement, state: AppState): void {
    if (state.records.length > 0 || state.hasStorageError) {
      return;
    }

    const section = createElement("section", "onboarding-guide");
    section.setAttribute("aria-labelledby", "onboarding-guide-title");

    const title = createElement("h2", undefined, t("onboardingGuideTitle"));
    title.id = "onboarding-guide-title";
    section.append(title);
    section.append(createElement("p", "onboarding-copy", t("onboardingGuideCopy")));

    container.append(section);
  }

  function renderHistory(container: HTMLElement, records: readonly DoseRecord[]): void {
    const section = createElement("section", "card");
    section.setAttribute("aria-labelledby", "history-title");

    const title = createElement("h2", undefined, t("historyTitle"));
    title.id = "history-title";
    section.append(title);

    if (records.length === 0) {
      section.append(
        createElement("p", "empty-state", t("emptyHistoryRecords", formatNumber(HISTORY_DISPLAY_LIMIT)))
      );
    } else {
      const list = createElement("ol", "history-list");
      records.slice(0, HISTORY_DISPLAY_LIMIT).forEach((record) => {
        const item = createElement("li", undefined, formatRecordTime(record));
        list.append(item);
      });
      section.append(list);
    }

    const clearButton = createElement("button", "secondary-button", t("clearButton"));
    clearButton.type = "button";
    clearButton.disabled = records.length === 0;
    clearButton.dataset["focusKey"] = "clear-records";
    clearButton.setAttribute("aria-describedby", `clear-button-description ${STATUS_MESSAGE_ID}`);
    clearButton.addEventListener("click", () => {
      void handleClearRecords();
    });

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

    const formattedPrice = formatUsd(PREMIUM_PRICE_USD);
    section.append(
      createElement("p", "premium-copy", t("premiumCopy", [formattedPrice, formatNumber(TRIAL_DAYS)]))
    );

    const access = getPremiumAccess(state);
    let accessText = t("premiumTrialEnded");
    if (state.purchasedAtIso) {
      accessText = t("premiumPurchased");
    } else if (access.isTrialActive) {
      accessText = t("premiumTrialActive", formatNumber(access.trialDaysRemaining));
    }

    section.append(createElement("p", "premium-status", accessText));
    section.append(createElement("p", "premium-price", formattedPrice));

    const linkLabel = createElement("p", "premium-link-label", t("premiumLinkLabel"));
    const linkValue = createElement("code", "premium-link", STRIPE_PAYMENT_LINK);
    section.append(linkLabel, linkValue);

    container.append(section);
  }

  function renderApp(state: AppState): void {
    syncDocumentLocale();
    if (!root) {
      return;
    }

    rememberFocusedAction();
    root.setAttribute("aria-busy", String(state.isBusy));
    root.setAttribute("aria-labelledby", APP_TITLE_ID);
    root.replaceChildren();

    root.append(renderHeader());

    const tapButton = createElement("button", "tap-button", t("tapButton"));
    tapButton.type = "button";
    tapButton.disabled = state.isBusy;
    tapButton.dataset["focusKey"] = "tap-record";
    tapButton.setAttribute("aria-busy", String(state.isBusy));
    tapButton.setAttribute("aria-describedby", `tap-button-description ${STATUS_MESSAGE_ID}`);
    tapButton.addEventListener("click", () => {
      void handleTapRecord();
    });
    const tapButtonDescription = createElement("p", "sr-only", t("tapButtonDescription"));
    tapButtonDescription.id = "tap-button-description";
    root.append(tapButton, tapButtonDescription);

    renderOnboardingGuide(root, state);
    renderStatus(root, state);
    renderLatestRecord(root, state.records);
    renderHistory(root, state.records);
    renderPremium(root, state.premiumState);
    root.append(createElement("p", "privacy-note", t("privacyNote")));
    restoreFocusedAction();
  }

  function setState(nextState: AppState): void {
    appState = nextState;
    renderApp(nextState);
  }

  async function handleTapRecord(): Promise<void> {
    if (!appState || appState.isBusy) {
      return;
    }

    const nextRecord = createDoseRecord();
    const nextRecords = addDoseRecord(appState.records, nextRecord);
    setState({
      ...appState,
      statusMessage: t("savingStatus"),
      statusTone: "info",
      isBusy: true,
      hasStorageError: false
    });

    try {
      await storage.setDoseRecords(nextRecords);
      setState({
        ...appState,
        records: nextRecords,
        statusMessage: t("savedToast"),
        statusTone: "success",
        isBusy: false,
        hasStorageError: false
      });
    } catch {
      setState({
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

    setState({
      ...appState,
      statusMessage: t("clearingStatus"),
      statusTone: "info",
      isBusy: true,
      hasStorageError: false
    });

    try {
      await storage.setDoseRecords([]);
      setState({
        ...appState,
        records: [],
        statusMessage: t("clearedToast"),
        statusTone: "success",
        isBusy: false,
        hasStorageError: false
      });
    } catch {
      setState({
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
      setState({
        records,
        premiumState,
        statusMessage: records.length === 0 ? t("firstRunGuide") : t("readyStatus"),
        statusTone: "neutral",
        isBusy: false,
        hasStorageError: false
      });
    } catch {
      const fallbackState = createInitialPremiumState();
      setState({
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
