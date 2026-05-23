const fallbackMessages: Record<string, string> = {
  appTitle: "のんだ記録",
  purposeText: "1回押した時刻だけを、この端末の Chrome storage に保存します。名前・量・効果は扱いません。",
  tapButton: "のんだ",
  lastRecordTitle: "直近の記録",
  noRecords: "まだ記録はありません。",
  historyTitle: "最近の記録",
  clearButton: "記録をすべて消す",
  confirmClear: "この端末に保存した記録をすべて消します。よろしいですか。",
  loadingStatus: "保存済みの記録を読み込んでいます。",
  readyStatus: "記録できます。",
  savingStatus: "保存しています。",
  clearingStatus: "削除しています。",
  savedToast: "記録しました。",
  clearedToast: "記録を消しました。",
  privacyNote: "外部送信はありません。保存先は Chrome storage のみです。",
  premiumTitle: "Premium",
  premiumCopy: "$3 買い切り・7日トライアルの枠組みです。Premium が無効でも記録機能は使えます。",
  premiumTrialEnded: "トライアルは終了しています。",
  premiumPurchased: "Premium は有効です。",
  premiumLinkLabel: "購入リンク（オーナー設定待ち）",
  storageError: "保存の読み書きに失敗しました。"
};

export type TranslationSubstitutions = string | string[];
export type Translator = (key: string, substitutions?: TranslationSubstitutions) => string;
export type MessageResolver = (key: string, substitutions?: TranslationSubstitutions) => string;

export function createTranslator(resolveMessage?: MessageResolver): Translator {
  return (key: string, substitutions?: TranslationSubstitutions): string => {
    const localized = resolveMessage?.(key, substitutions);
    if (localized) {
      return localized;
    }

    if (key === "premiumTrialActive") {
      const days = Array.isArray(substitutions) ? substitutions[0] : substitutions;
      return `トライアル中（残り ${days ?? "0"} 日）`;
    }

    return fallbackMessages[key] ?? key;
  };
}

export const fallbackTranslator = createTranslator();
