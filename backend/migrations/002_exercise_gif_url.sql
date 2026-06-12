-- Migration 002 : ajout du champ gif_url sur la table Exercise
-- Les URLs pointent vers le CDN ExerciseDB (exercices animés en GIF)
-- Si un GIF ne charge pas, mettre l'URL à jour via phpMyAdmin (localhost:8081)

-- IF NOT EXISTS : la migration peut être rejouée sans erreur si la colonne existe déjà
ALTER TABLE Exercise ADD COLUMN IF NOT EXISTS gif_url VARCHAR(500) DEFAULT NULL;

-- ============================================================
-- Musculation
-- ============================================================
UPDATE Exercise SET gif_url = 'https://v2.exercisedb.io/image/0023'
  WHERE name = 'Développé couché';

UPDATE Exercise SET gif_url = 'https://v2.exercisedb.io/image/0026'
  WHERE name = 'Squat';

UPDATE Exercise SET gif_url = 'https://v2.exercisedb.io/image/0292'
  WHERE name = 'Soulevé de terre';

UPDATE Exercise SET gif_url = 'https://v2.exercisedb.io/image/0652'
  WHERE name = 'Tractions';

UPDATE Exercise SET gif_url = 'https://v2.exercisedb.io/image/0526'
  WHERE name = 'Développé militaire';

UPDATE Exercise SET gif_url = 'https://v2.exercisedb.io/image/0030'
  WHERE name = 'Curl biceps';

UPDATE Exercise SET gif_url = 'https://v2.exercisedb.io/image/0748'
  WHERE name = 'Extension triceps';

UPDATE Exercise SET gif_url = 'https://v2.exercisedb.io/image/0057'
  WHERE name = 'Rowing barre';

UPDATE Exercise SET gif_url = 'https://v2.exercisedb.io/image/0432'
  WHERE name = 'Fentes';

UPDATE Exercise SET gif_url = 'https://v2.exercisedb.io/image/0667'
  WHERE name = 'Pompes';

-- ============================================================
-- Cardio
-- ============================================================
UPDATE Exercise SET gif_url = 'https://v2.exercisedb.io/image/2368'
  WHERE name = 'Course à pied';

UPDATE Exercise SET gif_url = 'https://v2.exercisedb.io/image/1320'
  WHERE name = 'Vélo stationnaire';

UPDATE Exercise SET gif_url = 'https://v2.exercisedb.io/image/1064'
  WHERE name = 'Corde à sauter';

UPDATE Exercise SET gif_url = 'https://v2.exercisedb.io/image/2317'
  WHERE name = 'Rameur';

UPDATE Exercise SET gif_url = 'https://v2.exercisedb.io/image/3945'
  WHERE name = 'HIIT';

-- ============================================================
-- Flexibilité
-- ============================================================
UPDATE Exercise SET gif_url = 'https://v2.exercisedb.io/image/0847'
  WHERE name = 'Étirement ischio-jambiers';

UPDATE Exercise SET gif_url = 'https://v2.exercisedb.io/image/1461'
  WHERE name = 'Yoga - Chien tête en bas';

UPDATE Exercise SET gif_url = 'https://v2.exercisedb.io/image/0860'
  WHERE name = 'Étirement des épaules';

UPDATE Exercise SET gif_url = 'https://v2.exercisedb.io/image/0876'
  WHERE name = 'Rotation du tronc';

UPDATE Exercise SET gif_url = 'https://v2.exercisedb.io/image/1294'
  WHERE name = 'Foam roller dos';
