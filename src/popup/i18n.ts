const fallbackMessages = {
  appTitle: "のんだ記録",
  purposeText: "ボタンを1回押した時刻だけを、この端末の Chrome ストレージに保存します。名前・量・効果は扱いません。",
  tapButton: "のんだ",
  tapButtonDescription: "現在の時刻を1件の記録として保存します。",
  onboardingGuideTitle: "はじめて使うときのガイド",
  onboardingGuideCopy: "のんだ直後に「$1」を1回押してください。保存されるのは時刻だけです。",
  onboardingGuideAction: "次にやること：大きな「$1」ボタンを押します。",
  lastRecordTitle: "直近の記録",
  emptyLatestRecord: "ここには最後に保存した時刻が表示されます。まずは大きな「$1」ボタンを1回押してください。",
  historyTitle: "最近の記録",
  emptyHistoryRecords: "履歴はまだありません。最初の記録を保存すると、最大$1件までここに並びます。",
  clearButton: "すべての記録を削除",
  clearButtonDescription: "この端末に保存した記録をすべて削除します。",
  confirmClear: "この端末に保存した記録をすべて削除します。この操作は元に戻せません。よろしいですか。",
  loadingStatus: "保存済みの記録を読み込んでいます。",
  readyStatus: "記録できます。",
  firstRunGuide: "初回は大きな「$1」ボタンから記録を始めます。",
  savingStatus: "保存中です。",
  clearingStatus: "削除中です。",
  savedToast: "記録しました。",
  clearedToast: "記録をすべて削除しました。",
  privacyNote: "外部には送信しません。記録はこの端末の Chrome ストレージにのみ保存されます。",
  premiumTitle: "プレミアム",
  premiumCopy: "プレミアムは買い切り（$1）です。$2のトライアルがあり、無効な場合でも記録機能は使えます。",
  premiumTrialActive: "トライアル中（残り$1）",
  premiumTrialEnded: "トライアルは終了しました。",
  premiumPurchased: "プレミアムは有効です。",
  premiumLinkLabel: "購入リンク（オーナー設定待ち）",
  storageError: "保存データの読み書きに失敗しました。"
} as const satisfies Record<string, string>;

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

    return applyFallbackSubstitutions(fallbackMessages[key], substitutions);
  };
}
