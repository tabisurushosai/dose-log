/// <reference types="chrome" />

import { createChromeStorageAdapter } from "../storage/chromeStorageAdapter";
import { createAppStorage } from "../storage/appStorage";
import { createDoseLogApp } from "./app";
import { createTranslator } from "./i18n";
import "./styles.css";

const app = createDoseLogApp({
  storage: createAppStorage(createChromeStorageAdapter()),
  t: createTranslator((key, substitutions) => chrome.i18n.getMessage(key, substitutions)),
  confirm: (message) => window.confirm(message)
});

void app.init();
