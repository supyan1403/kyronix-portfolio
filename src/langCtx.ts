import { createContext, useContext } from "react";
export type Lang = "id" | "en";
export const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "id", setLang: () => {} });
export const useLang = () => useContext(LangCtx);
