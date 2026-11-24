'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import en from './locales/en.json';
import zh from './locales/zh.json';

export type Locale = 'en' | 'zh';

type TranslationValue = string | Record<string, unknown>;
type Translations = Record<string, TranslationValue>;

const translations: Record<Locale, Translations> = { en, zh };

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocale] = useState<Locale>('zh');

    const t = useCallback(
        (key: string): string => {
            const keys = key.split('.');
            let value: TranslationValue = translations[locale];

            for (const k of keys) {
                if (typeof value === 'object' && value !== null && k in value) {
                    value = (value as Record<string, TranslationValue>)[k];
                } else {
                    return key; // 找不到则返回 key 本身
                }
            }

            return typeof value === 'string' ? value : key;
        },
        [locale]
    );

    return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}
