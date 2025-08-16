CREATE UNIQUE INDEX IF NOT EXISTS unique_active_round ON buzzer_rounds ((active)) WHERE active;
