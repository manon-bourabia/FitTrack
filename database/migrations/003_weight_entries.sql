-- Migration 003 : Ajout du suivi du poids
-- Chaque entrée représente une pesée manuelle de l'utilisateur à une date donnée.
-- On conserve aussi weight dans User pour le "poids actuel" affiché rapidement.

USE fittrack;

CREATE TABLE IF NOT EXISTS WeightEntry (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT            NOT NULL,
    weight     DECIMAL(5,2)   NOT NULL COMMENT 'Poids en kg',
    date       DATE           NOT NULL,
    note       VARCHAR(255)   DEFAULT NULL,
    created_at TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
);

-- Index pour accélérer la récupération de l'historique par utilisateur
CREATE INDEX idx_weight_entry_user_date ON WeightEntry(user_id, date DESC);
