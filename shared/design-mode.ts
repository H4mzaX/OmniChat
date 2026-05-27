export interface GetStyleInfo {
  (resolved: { element: Element }): {
    className: string;
    styles: Record<string, string> | null;
  };
}

export function initDesignMode(getStyleInfo: GetStyleInfo): () => void {
  return () => {};
}
