import { Router, Request, Response, NextFunction } from 'express';
import { generateVocabularyQuiz } from '../gemini.js';
import { config } from '../config.js';
import {
  DifficultyLevel,
  getWordById,
  getWordByName,
  getRandomWordForLevel,
  VocabularyWord
} from '../data/vocabulary.js';

const router = Router();

router.post('/quiz', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      wordId,
      wordName,
      level = 'Intermediate',
      type = 'multiple-choice',
    } = req.body;

    const typedLevel = (['Beginner', 'Intermediate', 'Advanced'].includes(level)
      ? level
      : 'Intermediate') as DifficultyLevel;

    let targetWord: VocabularyWord | undefined;
    if (wordId) {
      targetWord = getWordById(wordId);
    } else if (wordName) {
      targetWord = getWordByName(wordName);
    }

    if (!targetWord) {
      targetWord = getRandomWordForLevel(typedLevel);
    }

    const quizType = ['multiple-choice', 'fill-in-the-blank', 'synonym-match'].includes(type)
      ? type
      : 'multiple-choice';

    // If Gemini is configured, try dynamic generation
    if (config.isGeminiConfigured) {
      try {
        const quiz = await generateVocabularyQuiz(targetWord, quizType);
        res.json({
          success: true,
          quiz,
        });
        return;
      } catch (geminiErr) {
        console.warn('Dynamic quiz generation fallback:', geminiErr);
      }
    }

    // Curated high quality fallback quiz
    let question = `What does "${targetWord.word}" mean?`;
    let options: string[] = [];
    let correctAnswer = targetWord.definition;

    if (quizType === 'fill-in-the-blank') {
      const sentenceWithBlank = targetWord.exampleSentence.replace(
        new RegExp(`\\b${targetWord.word}\\b`, 'i'),
        '_______'
      );
      question = `Fill in the blank: "${sentenceWithBlank}"`;
      correctAnswer = targetWord.word;
      
      const otherWords = getRandomWordForLevel(typedLevel, [targetWord.id]);
      options = [
        targetWord.word,
        otherWords.word,
        'hesitant',
        'reluctant'
      ].sort(() => Math.random() - 0.5);
    } else if (quizType === 'synonym-match') {
      question = `Which word is a synonym for "${targetWord.word}"?`;
      correctAnswer = targetWord.synonyms[0] || 'receptive';
      options = [
        correctAnswer,
        targetWord.antonyms[0] || 'distant',
        'superficial',
        'reckless'
      ].sort(() => Math.random() - 0.5);
    } else {
      // Multiple-choice definition
      const altWord1 = getRandomWordForLevel(typedLevel, [targetWord.id]);
      const altWord2 = getRandomWordForLevel(typedLevel, [targetWord.id, altWord1.id]);
      
      options = [
        targetWord.definition,
        altWord1.definition,
        altWord2.definition,
        'Having or showing a stubborn desire to resist authority',
      ].sort(() => Math.random() - 0.5);
    }

    res.json({
      success: true,
      quiz: {
        question,
        type: quizType,
        options,
        correctAnswer,
        explanation: `"${targetWord.word}" means ${targetWord.definition}. Example: "${targetWord.exampleSentence}"`,
        targetWord: targetWord.word,
      },
    });
  } catch (err: any) {
    next(err);
  }
});

export default router;
