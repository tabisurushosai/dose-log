const fallbackMessages = {
  appTitle: "のんだ記録",
  purposeText: "ボタンを1回押した時刻だけを、この端末の Chrome のストレージに保存します。名前・量・効果は扱いません。",
  tapButton: "のんだ",
  tapButtonDescription: "現在の時刻を1件の記録として保存します。",
  onboardingGuideTitle: "初回ガイド",
  onboardingGuideCopy: "のんだ直後に「$1」を1回押すだけで、その時刻を残せます。",
  lastRecordTitle: "直近の記録",
  emptyLatestRecord: "まだ記録はありません。上の「$1」を押すと、直近の時刻がここに表示されます。",
  historyTitle: "最近の記録",
  emptyHistoryRecords: "まだ履歴はありません。上の「$2」で最初に記録すると、最新$1件がここに表示されます。",
  clearButton: "すべての記録を削除",
  clearButtonDescription: "この端末に保存した記録をすべて削除します。",
  confirmClear: "この端末に保存した記録をすべて削除します。よろしいですか。",
  loadingStatus: "保存済みの記録を読み込んでいます。",
  readyStatus: "記録できます。",
  firstRunGuide: "初回は、のんだ直後に「$1」を押してください。",
  savingStatus: "保存しています。",
  clearingStatus: "削除しています。",
  savedToast: "記録しました。",
  clearedToast: "記録をすべて削除しました。",
  privacyNote: "外部には送信しません。記録はこの端末の Chrome のストレージにのみ保存されます。",
  premiumTitle: "Premium",
  premiumCopy: "Premium は買い切り（$1）です。$2のトライアルがあり、Premium が無効な場合でも記録機能は使えます。",
  premiumTrialActive: "トライアル中（残り$1）",
  premiumTrialEnded: "トライアルは終了しました。",
  premiumPurchased: "Premium は有効です。",
  premiumLinkLabel: "購入リンク（オーナー設定待ち）",
  storageError: "保存データの読み書きに失敗しました。"
} as const;

export type TranslationSubstitutions = string | string[];
export type MessageKey = keyof typeof fallbackMessages;
export type Translator = (key: MessageKey, substitutions?: TranslationSubstitutions) => string;

function applyFallbackSubstitutions(message: string, substitutions?: TranslationSubstitutions): string {
  if (substitutions === undefined) {
    return message;
  }

  const values = Array.isArray(substitutions) ? substitutions : [substitutions];
  return values.reduce((result, value, index) => result.split(`$${index + 1}`).join(value), message);
}

export function createTranslator(resolveMessage?: Translator): Translator {
  return (key: MessageKey, substitutions?: TranslationSubstitutions): string => {
    const localized = resolveMessage?.(key, substitutions);
    if (localized) {
      return localized;
    }

    return applyFallbackSubstitutions(fallbackMessages[key] ?? key, substitutions);
  };
}
