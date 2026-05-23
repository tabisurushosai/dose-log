/// <reference types="chrome" />

import { createChromeStorageAdapter } from "../storage/chromeStorageAdapter";
import { createAppStorage } from "../storage/appStorage";
import { createDoseLogApp } from "./app";
import { createTranslator } from "./i18n";
import "./styles.css";

function getSupportedLocale(uiLanguage: string): "ja" | "en" {
  return uiLanguage.toLowerCase().startsWith("en") ? "en" : "ja";
}

const app = createDoseLogApp({
  storage: createAppStorage(createChromeStorageAdapter()),
  t: createTranslator((key, substitutions) => chrome.i18n.getMessage(key, substitutions)),
  confirm: (message) => window.confirm(message),
  locale: getSupportedLocale(chrome.i18n.getUILanguage())
});

void app.init();
