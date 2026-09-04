const APOSTROPHES = /[‘’ʼʹ′`´']/g;

const ENGLISH_CONTRACTIONS: Record<string, string> = {
  "i'm": "i am",
  "i'am": "i am",
  im: "i am",
  "i've": "i have",
  ive: "i have",
  "i'll": "i will",
  "i'd": "i would",
  "you're": "you are",
  youre: "you are",
  "you've": "you have",
  youve: "you have",
  "you'll": "you will",
  youll: "you will",
  "you'd": "you would",
  youd: "you would",
  "he's": "he is",
  hes: "he is",
  "he'll": "he will",
  "he'd": "he would",
  "she's": "she is",
  shes: "she is",
  "she'll": "she will",
  "she'd": "she would",
  "it's": "it is",
  "it'll": "it will",
  "it'd": "it would",
  "we're": "we are",
  "we've": "we have",
  weve: "we have",
  "we'll": "we will",
  "we'd": "we would",
  "they're": "they are",
  theyre: "they are",
  "they've": "they have",
  theyve: "they have",
  "they'll": "they will",
  theyll: "they will",
  "they'd": "they would",
  theyd: "they would",
  "that's": "that is",
  thats: "that is",
  "there's": "there is",
  theres: "there is",
  "here's": "here is",
  heres: "here is",
  "what's": "what is",
  whats: "what is",
  "who's": "who is",
  whos: "who is",
  "where's": "where is",
  wheres: "where is",
  "how's": "how is",
  hows: "how is",
  "let's": "let us",
  "isn't": "is not",
  isnt: "is not",
  "aren't": "are not",
  arent: "are not",
  "wasn't": "was not",
  wasnt: "was not",
  "weren't": "were not",
  werent: "were not",
  "don't": "do not",
  dont: "do not",
  "doesn't": "does not",
  doesnt: "does not",
  "didn't": "did not",
  didnt: "did not",
  "haven't": "have not",
  havent: "have not",
  "hasn't": "has not",
  hasnt: "has not",
  "hadn't": "had not",
  hadnt: "had not",
  "can't": "can not",
  cant: "can not",
  cannot: "can not",
  "couldn't": "could not",
  couldnt: "could not",
  "won't": "will not",
  wont: "will not",
  "wouldn't": "would not",
  wouldnt: "would not",
  "shouldn't": "should not",
  shouldnt: "should not",
  "mustn't": "must not",
  mustnt: "must not",
  "needn't": "need not",
  "shan't": "shall not",
  "would've": "would have",
  wouldve: "would have",
  "could've": "could have",
  couldve: "could have",
  "should've": "should have",
  shouldve: "should have",
  "must've": "must have",
  mustve: "must have",
  "might've": "might have",
  mightve: "might have",
};

function lowerCase(text: string, lang?: string | null): string {
  try {
    return text.toLocaleLowerCase(lang || "en");
  } catch {
    return text.toLocaleLowerCase("en");
  }
}

function usesEnglishContractions(lang?: string | null): boolean {
  return !lang || lowerCase(lang, "en").startsWith("en");
}

export function normalizeAnswer(
  text: string | null | undefined,
  lang?: string | null,
): string {
  if (typeof text !== "string") return "";

  const collapsed = lowerCase(text, lang)
    .replace(APOSTROPHES, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (!collapsed || !usesEnglishContractions(lang)) return collapsed;

  return collapsed
    .split(" ")
    .map((token) => ENGLISH_CONTRACTIONS[token] ?? token)
    .join(" ");
}

export function buildAcceptableAnswers(
  source: string[],
  lang?: string | null,
): string[] {
  return source.map((value) => normalizeAnswer(value, lang)).filter(Boolean);
}

export function isAnswerCorrect(
  userAnswer: string,
  acceptableAnswers: string[],
  lang?: string | null,
): boolean {
  const candidate = normalizeAnswer(userAnswer, lang);
  if (!candidate) return false;
  return acceptableAnswers.includes(candidate);
}
