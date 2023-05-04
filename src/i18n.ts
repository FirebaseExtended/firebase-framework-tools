import { Request } from "firebase-functions/v2/https";

export function getPreferredLocale(req: Request, locales: string[], defaultLocale: string): string {
  const country = req.headers["x-country-code"] || ""
  const languages = languagesByPreference(req.headers["accept-language"]);
  const localesByHostingOOO: string[] = [];
  if (country) {
    for (const language of languages) {
        localesByHostingOOO.push(`${language}_${country}`);
    }
    localesByHostingOOO.push(`ALL_${country}`);
  }
  for (const language of languages) {
    localesByHostingOOO.push(`${language}_ALL`);
    localesByHostingOOO.push(`${language}`);
  }
  return localesByHostingOOO.find(it => locales.includes(it)) || defaultLocale;
}

function languagesByPreference(acceptLanguage: string|undefined): string[] {
  if (!acceptLanguage) {
    return [];
  }

  const languagesSeen = new Set<string>();
  const languagesOrdered: string[] = [];
  for (const v of acceptLanguage.split(",")) {
    const l = v.split("-")[0];
    if (!l) {
      continue;
    }
    if (!languagesSeen.has(l)) {
      languagesOrdered.push(l);
    }
    languagesSeen.add(l);
  }
  return languagesOrdered;
}
