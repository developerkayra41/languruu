import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { WordRequestDTO } from 'src/words/dto/request/Word.request.dto';
import { WordColumn, WordColumnWithoutPool, WordRow } from 'src/_common/types/words.type';
import { WordRepository } from 'src/words/repository/words.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class WordsService {
  constructor(
    private readonly wordsRepo: WordRepository,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  getWordsById = async (userId: number, wordId: number): Promise<WordColumn> => {
    const word = await this.wordsRepo.getWordsById(userId, wordId);
    if (!word) throw new NotFoundException();
    return word;
  };

  getWordsInfo = async (userId: number) => {

    const words = await this.wordsRepo.getWordsByUserId(userId);
    if (!words) return [];
    return words.words.map(({ wordPool, ...rest }) => ({
        ...rest,
        word_count: wordPool.length,
    }));
};

  getWords = async (): Promise<WordRow[]> => {
    const words = await this.wordsRepo.getWords();
    if (!words) throw new NotFoundException();
    return words;
  };

  upsertWord = async (userId: number, word: WordRequestDTO): Promise<WordColumn> => {
    const updatedWord = await this.wordsRepo.upsertWord(userId, word);
    if (!updatedWord) throw new InternalServerErrorException();

    this.eventEmitter.emit('word-column.upserted', { userId, column: updatedWord });

    return updatedWord;
  };
}
