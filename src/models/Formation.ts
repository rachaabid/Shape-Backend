import { Schema, model } from 'mongoose';

const LessonSchema = new Schema({
  title: String,
  content: String,          // texte / HTML / markdown
  videoUrl: String,         // vidéo de la leçon
  duration: Number,         // en minutes
  order: Number
});

const QuizSchema = new Schema({
  question: String,
  options: [String],
  correctAnswer: String
});

const TaskSchema = new Schema({
  title: String,
  description: String,
  fileUrl: String,          // upload task file (PDF, zip...)
  dueDate: Date
});

const FormationSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,

    category: String, // Web, AI, Business...
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced']
    },

    keywords: [String], // 🔥 important pour IA matching
    skills: [String],   // skills liés à la formation

    duration: Number, // total hours

    image: String,

    videoUrl: String,  // intro video globale (optionnel)

    documents: [
      {
        name: String,
        url: String      // PDF, slides, docs
      }
    ],

    references: [
      {
        title: String,
        url: String
      }
    ],

    lessons: [LessonSchema], // 📚 structure cours

    quizzes: [QuizSchema],   // 📝 quiz par formation

    tasks: [TaskSchema],     // 📌 projets / exercices

    isPublished: {
      type: Boolean,
      default: true
    },

    provider: String, // formateur / entreprise

    enrolledUsers: [
      { type: Schema.Types.ObjectId, ref: 'User' }
    ],

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },

    deleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default model('Formation', FormationSchema);