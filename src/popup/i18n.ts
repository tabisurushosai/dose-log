const fallbackMessages = {
  appTitle: "のんだ記録",
  purposeText: "1回押した時刻だけを、この端末の Chrome storage に保存します。名前・量・効果は扱いません。",
  tapButton: "のんだ",
  tapButtonDescription: "現在の時刻を1件の記録として保存します。",
  onboardingGuideTitle: "はじめ方",
  onboardingGuideCopy: "のんだ直後に上のボタンを1回押すだけで、直近の時刻と最近の記録に残ります。",
  lastRecordTitle: "直近の記録",
  emptyLatestRecord: "最初の記録をすると、直近の時刻がここに表示されます。",
  historyTitle: "最近の記録",
  emptyHistoryRecords: "記録後、最近の$1件がここに並びます。",
  clearButton: "記録をすべて消す",
  clearButtonDescription: "この端末に保存した記録をすべて削除します。",
  confirmClear: "この端末に保存した記録をすべて消します。よろしいですか。",
  loadingStatus: "保存済みの記録を読み込んでいます。",
  readyStatus: "記録できます。",
  firstRunGuide: "まずは、のんだ直後に大きなボタンを1回押してください。",
  savingStatus: "保存しています。",
  clearingStatus: "削除しています。",
  savedToast: "記録しました。",
  clearedToast: "記録を消しました。",
  privacyNote: "外部送信はありません。保存先は Chrome storage のみです。",
  premiumTitle: "Premium",
  premiumCopy: "Premium は $1 の買い切りで、$2日間のトライアルがあります。Premium が無効でも記録機能は使えます。",
  premiumTrialActive: "トライアル中（残り$1日）",
  premiumTrialEnded: "トライアルは終了しました。",
  premiumPurchased: "Premium は有効です。",
  premiumLinkLabel: "購入リンク（オーナー設定待ち）",
  storageError: "保存の読み書きに失敗しました。"
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
