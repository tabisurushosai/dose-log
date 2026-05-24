const fallbackMessages = {
  appTitle: "のんだ記録",
  purposeText: "ボタンを1回押した時刻だけを、この端末の Chrome storage に保存します。名前・量・効果は扱いません。",
  tapButton: "のんだ",
  tapButtonDescription: "今の時刻を1件の記録として保存します。",
  onboardingGuideTitle: "初回ガイド",
  onboardingGuideCopy: "のんだ直後に「$1」を1回押すだけで、時刻を残せます。",
  lastRecordTitle: "直近の記録",
  emptyLatestRecord: "まだ記録はありません。上の「$1」ボタンを押すと、直近の時刻がここに表示されます。",
  historyTitle: "最近の記録",
  emptyHistoryRecords: "まだ履歴はありません。上の「$2」ボタンで最初に記録すると、最新の$1件がここに表示されます。",
  clearButton: "記録をすべて消す",
  clearButtonDescription: "この端末に保存した記録をすべて削除します。",
  confirmClear: "この端末に保存した記録をすべて削除します。よろしいですか。",
  loadingStatus: "保存済みの記録を読み込んでいます。",
  readyStatus: "記録できます。",
  firstRunGuide: "初回は、のんだ直後に「$1」を押してください。",
  savingStatus: "保存しています。",
  clearingStatus: "削除しています。",
  savedToast: "記録しました。",
  clearedToast: "記録をすべて削除しました。",
  privacyNote: "外部送信はありません。保存先はこの端末の Chrome storage のみです。",
  premiumTitle: "Premium",
  premiumCopy: "Premium は $1 の買い切りで、$2日間のトライアルがあります。Premium が無効でも記録機能は使えます。",
  premiumTrialActive: "トライアル中（残り$1日）",
  premiumTrialEnded: "トライアルは終了しました。",
  premiumPurchased: "Premium は有効です。",
  premiumLinkLabel: "購入リンク（オーナーによる設定待ち）",
  storageError: "保存データの読み書きに失敗しました。"
} as const;

export type TranslationSubstitutions = string | string[];
export type MessageKey = keyof typeof fallbackMessages;
export type Translator = (key: MessageKey, substitutions?: TranslationSubstitutions) => string;
export type MessageResolver = (key: MessageKey, substitutions?: TranslationSubstitutions) => string;

function applyFallbackSubstitutions(message: string, substitutions?: TranslationSubstitutions): string {
  if (substitutions === undefined) {
    return message;
  }

  const values = Array.isArray(substitutions) ? substitutions : [substitutions];
  return values.reduce((result, value, index) => result.split(`$${index + 1}`).join(value), message);
}

export function createTranslator(resolveMessage?: MessageResolver): Translator {
  return (key: MessageKey, substitutions?: TranslationSubstitutions): string => {
    const localized = resolveMessage?.(key, substitutions);
    if (localized) {
      return localized;
    }

    return applyFallbackSubstitutions(fallbackMessages[key] ?? key, substitutions);
  };
}
