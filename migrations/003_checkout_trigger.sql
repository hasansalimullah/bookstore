-- Allow a "checkout" trigger in the check history (live re-check right before a customer pays).
ALTER TABLE check_logs DROP CONSTRAINT IF EXISTS check_logs_trigger_check;
ALTER TABLE check_logs ADD CONSTRAINT check_logs_trigger_check CHECK (trigger IN ('scheduled','manual','test','checkout'));
