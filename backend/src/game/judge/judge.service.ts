import { Injectable } from '@nestjs/common';
import { GameQuestion, Verdict } from '../game.types';
import {
    SENTENCE_CLOSE_F1,
    SENTENCE_CORRECT_F1,
    TYPO_LOOSE_MIN_LENGTH,
    TYPO_STRICT_MIN_LENGTH,
} from '../game.constants';
import { foldDiacritics, normalizeAnswer } from './normalize';
import { damerauLevenshtein, fuzzyTokenF1 } from './similarity';

@Injectable()
export class JudgeService {
    evaluate(question: GameQuestion, rawAnswer: string): Verdict {
        const lang = question.answerLang;
        const candidate = normalizeAnswer(rawAnswer, lang);
        if (!candidate) return 0;

        const accepted = question.accepted
            .map((value) => normalizeAnswer(value, lang))
            .filter((value) => value.length > 0);
        if (accepted.length === 0) return 0;

        if (accepted.includes(candidate)) return 2;

        const foldedCandidate = foldDiacritics(candidate);
        const foldedAccepted = accepted.map(foldDiacritics);
        if (foldedAccepted.includes(foldedCandidate)) return 2;

        return question.isSentence
            ? this.judgeSentence(foldedAccepted, foldedCandidate)
            : this.judgeWord(foldedAccepted, foldedCandidate);
    }

    private judgeWord(accepted: string[], candidate: string): Verdict {
        let best: Verdict = 0;

        for (const target of accepted) {
            const distance = damerauLevenshtein(candidate, target, 2);
            if (distance < 0) continue;
            if (target.length >= TYPO_STRICT_MIN_LENGTH && distance <= 1) return 2;
            if (target.length >= TYPO_LOOSE_MIN_LENGTH && distance <= 2) best = 1;
        }

        return best;
    }

    private judgeSentence(accepted: string[], candidate: string): Verdict {
        let bestScore = 0;
        for (const target of accepted) {
            const score = fuzzyTokenF1(target, candidate);
            if (score > bestScore) bestScore = score;
        }

        if (bestScore >= SENTENCE_CORRECT_F1) return 2;
        if (bestScore >= SENTENCE_CLOSE_F1) return 1;
        return 0;
    }
}
