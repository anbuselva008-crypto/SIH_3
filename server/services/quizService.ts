import { query, queryOne, execute } from '../database/db.ts';
import { QuizGenerationService } from './quizGenerationService.ts';
import { DocumentService } from './documentService.ts';
import { LearnerService } from './learnerService.ts';
import { RecommendationService } from './recommendationService.ts';
import type { 
  Quiz, 
  QuizQuestion, 
  QuizAttempt, 
  QuizAnswerDetail, 
  LearningMaterial 
} from '../database/models.ts';
import type { ValidatedQuestion } from './quizValidationService.ts';

export interface SubmitQuizAttemptPayload {
  quiz_id: number;
  learner_id: number;
  answers: Record<number, number>; // question_id -> selected_option (0..3)
}

export class QuizService {
  /**
   * Generates and persists a grounded AI quiz from a learning material.
   */
  public static async generateAndSaveQuiz(
    materialId: number,
    options: {
      questionCount?: 5 | 10 | 15;
      learnerId?: number;
    } = {}
  ): Promise<Quiz> {
    const questionCount = options.questionCount || 10;
    const material = await DocumentService.getMaterialById(materialId);
    if (!material) {
      throw new Error(`Learning material #${materialId} not found.`);
    }

    // Retrieve learner profile if provided for profile-aware scenario framing
    let learner = null;
    if (options.learnerId) {
      learner = await LearnerService.getLearnerProfile(options.learnerId);
    }

    // Retrieve linked learning resource metadata if available
    let resourceTitle = material.original_filename.replace(/\.[^/.]+$/, '');
    let resourceCompetency = 'Statistics';

    if (material.learning_resource_id) {
      const resource = await RecommendationService.getLearningResourceById(material.learning_resource_id);
      if (resource) {
        resourceTitle = resource.title;
        resourceCompetency = resource.competency;
      }
    }

    // Retrieve chunks
    const chunks = await DocumentService.getChunksForMaterial(material.id);
    if (!chunks || chunks.length === 0) {
      throw new Error('No readable chunks found in document for quiz generation.');
    }

    // Generate grounded questions (Groq or fallback engine)
    const validatedQuestions: ValidatedQuestion[] = await QuizGenerationService.generateQuizQuestions(
      chunks,
      {
        questionCount,
        learner,
        resourceTitle,
        resourceCompetency,
      }
    );

    if (validatedQuestions.length === 0) {
      throw new Error('Could not generate grounded questions from the uploaded material.');
    }

    // Save quiz in database
    const lId = options.learnerId || material.learner_id || 1;
    const rId = material.learning_resource_id || 'NULL';
    const safeTitle = `Practice Quiz: ${resourceTitle.slice(0, 150)}`.replace(/'/g, "''");
    const safeComp = resourceCompetency.replace(/'/g, "''");

    await execute(`
      INSERT INTO quizzes
      (learning_material_id, learning_resource_id, learner_id, title, competency_name, question_count, generation_status, review_status)
      VALUES
      (${material.id}, ${rId}, ${lId}, '${safeTitle}', '${safeComp}', ${validatedQuestions.length}, 'ready', 'approved');
    `);

    const insertedQuiz = await queryOne<Quiz>(
      `SELECT * FROM quizzes WHERE learning_material_id = ${material.id} ORDER BY id DESC LIMIT 1`
    );

    if (!insertedQuiz) {
      throw new Error('Failed to persist quiz in database.');
    }

    // Insert questions
    for (const q of validatedQuestions) {
      const safePrompt = q.question_text.replace(/'/g, "''");
      const safeA = q.options[0].replace(/'/g, "''");
      const safeB = q.options[1].replace(/'/g, "''");
      const safeC = q.options[2].replace(/'/g, "''");
      const safeD = q.options[3].replace(/'/g, "''");
      const safeExp = q.explanation.replace(/'/g, "''");
      const safeQComp = q.competency.replace(/'/g, "''");
      const safeSourceRef = q.source_reference
        ? `'${JSON.stringify(q.source_reference).replace(/'/g, "''")}'`
        : 'NULL';

      await execute(`
        INSERT INTO quiz_questions
        (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, competency, difficulty, source_reference)
        VALUES
        (${insertedQuiz.id}, '${safePrompt}', '${safeA}', '${safeB}', '${safeC}', '${safeD}', ${q.correct_option}, '${safeExp}', '${safeQComp}', '${q.difficulty}', ${safeSourceRef});
      `);
    }

    return this.getQuizById(insertedQuiz.id);
  }

  /**
   * Retrieves a full quiz with its questions.
   */
  public static async getQuizById(id: number): Promise<Quiz> {
    const quiz = await queryOne<Quiz>(`SELECT * FROM quizzes WHERE id = ${id}`);
    if (!quiz) {
      throw new Error(`Quiz #${id} not found.`);
    }

    const rawQuestions = await query<any>(
      `SELECT * FROM quiz_questions WHERE quiz_id = ${id} ORDER BY id ASC`
    );

    const questions: QuizQuestion[] = rawQuestions.map((q) => {
      let srcRef = null;
      if (q.source_reference) {
        try {
          srcRef = typeof q.source_reference === 'string' ? JSON.parse(q.source_reference) : q.source_reference;
        } catch {
          srcRef = null;
        }
      }
      return {
        id: q.id,
        quiz_id: q.quiz_id,
        question_text: q.question_text,
        options: [q.option_a, q.option_b, q.option_c, q.option_d],
        correct_option: q.correct_option,
        explanation: q.explanation,
        competency: q.competency,
        difficulty: q.difficulty,
        source_reference: srcRef,
        created_at: q.created_at,
      };
    });

    const material = await DocumentService.getMaterialById(quiz.learning_material_id);

    return {
      ...quiz,
      questions,
      material: material || undefined,
    };
  }

  /**
   * Submits learner quiz attempt and records answers and score evidence.
   * NOTE: Does NOT overwrite baseline Stage 2 diagnostic scores.
   */
  public static async submitQuizAttempt(
    payload: SubmitQuizAttemptPayload
  ): Promise<{ attempt: QuizAttempt; answers: QuizAnswerDetail[]; message: string }> {
    const quiz = await this.getQuizById(payload.quiz_id);
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      throw new Error('Quiz has no active questions to evaluate.');
    }

    let correctCount = 0;
    const totalQuestions = quiz.questions.length;
    const answerDetails: QuizAnswerDetail[] = [];

    // Evaluate each question
    for (const q of quiz.questions) {
      const selectedOption = payload.answers[q.id] !== undefined ? payload.answers[q.id] : -1;
      const isCorrect = selectedOption === q.correct_option;
      if (isCorrect) {
        correctCount++;
      }

      answerDetails.push({
        id: 0,
        attempt_id: 0,
        question_id: q.id,
        question_text: q.question_text,
        options: q.options,
        selected_option: selectedOption,
        correct_option: q.correct_option,
        is_correct: isCorrect,
        explanation: q.explanation,
        source_reference: q.source_reference,
      });
    }

    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const feedback =
      scorePercentage >= 80
        ? `Excellent mastery! You demonstrated strong comprehension of ${quiz.competency_name}.`
        : scorePercentage >= 60
        ? `Good progress! Core principles of ${quiz.competency_name} are well grasped.`
        : `Foundational review recommended. Review the grounded explanations below to strengthen your understanding.`;

    const safeFeedback = feedback.replace(/'/g, "''");
    const safeComp = quiz.competency_name.replace(/'/g, "''");

    // Insert into quiz_attempts
    await execute(`
      INSERT INTO quiz_attempts
      (quiz_id, learner_id, total_questions, correct_count, score_percentage, competency, feedback)
      VALUES
      (${quiz.id}, ${payload.learner_id}, ${totalQuestions}, ${correctCount}, ${scorePercentage}, '${safeComp}', '${safeFeedback}');
    `);

    const insertedAttempt = await queryOne<QuizAttempt>(
      `SELECT * FROM quiz_attempts WHERE quiz_id = ${quiz.id} AND learner_id = ${payload.learner_id} ORDER BY id DESC LIMIT 1`
    );

    if (!insertedAttempt) {
      throw new Error('Failed to record quiz attempt.');
    }

    // Insert answers
    for (const ans of answerDetails) {
      await execute(`
        INSERT INTO quiz_answers
        (attempt_id, question_id, selected_option, is_correct)
        VALUES
        (${insertedAttempt.id}, ${ans.question_id}, ${ans.selected_option}, ${ans.is_correct});
      `);
      ans.attempt_id = insertedAttempt.id;
    }

    return {
      attempt: {
        ...insertedAttempt,
        answers: answerDetails,
      },
      answers: answerDetails,
      message: `Practice Quiz evaluated: ${correctCount}/${totalQuestions} (${scorePercentage}%). Learning assessment evidence recorded for ${quiz.competency_name} (Stage 2 diagnostic baseline preserved).`,
    };
  }

  /**
   * Retrieves a specific attempt result.
   */
  public static async getAttemptResult(attemptId: number): Promise<QuizAttempt | null> {
    const attempt = await queryOne<QuizAttempt>(
      `SELECT * FROM quiz_attempts WHERE id = ${attemptId}`
    );
    if (!attempt) return null;

    const rawAnswers = await query<any>(`
      SELECT qa.*, qq.question_text, qq.option_a, qq.option_b, qq.option_c, qq.option_d, 
             qq.correct_option, qq.explanation, qq.source_reference
      FROM quiz_answers qa
      JOIN quiz_questions qq ON qa.question_id = qq.id
      WHERE qa.attempt_id = ${attemptId}
      ORDER BY qa.id ASC
    `);

    const answers: QuizAnswerDetail[] = rawAnswers.map((a) => {
      let srcRef = null;
      if (a.source_reference) {
        try {
          srcRef = typeof a.source_reference === 'string' ? JSON.parse(a.source_reference) : a.source_reference;
        } catch {
          srcRef = null;
        }
      }
      return {
        id: a.id,
        attempt_id: a.attempt_id,
        question_id: a.question_id,
        question_text: a.question_text,
        options: [a.option_a, a.option_b, a.option_c, a.option_d],
        selected_option: a.selected_option,
        correct_option: a.correct_option,
        is_correct: a.is_correct,
        explanation: a.explanation,
        source_reference: srcRef,
      };
    });

    return {
      ...attempt,
      answers,
    };
  }

  /**
   * Retrieves all quizzes taken or generated for a learner.
   */
  public static async getLearnerQuizzes(learnerId: number): Promise<Quiz[]> {
    const quizzes = await query<Quiz>(
      `SELECT * FROM quizzes WHERE learner_id = ${learnerId} ORDER BY id DESC`
    );
    return quizzes;
  }

  /**
   * Admin audit: updates quiz review status ('approved' | 'needs_review' | 'rejected').
   */
  public static async updateReviewStatus(
    quizId: number,
    status: 'approved' | 'needs_review' | 'rejected'
  ): Promise<Quiz> {
    await execute(
      `UPDATE quizzes SET review_status = '${status}' WHERE id = ${quizId}`
    );
    return this.getQuizById(quizId);
  }
}
