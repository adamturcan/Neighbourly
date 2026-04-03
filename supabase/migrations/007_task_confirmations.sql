-- Track mutual confirmations for starting and completing tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS creator_started boolean DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS helper_started boolean DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS creator_completed boolean DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS helper_completed boolean DEFAULT false;

-- Auto-transition: when both confirm start → status becomes in_progress
CREATE OR REPLACE FUNCTION auto_start_task()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.creator_started = true AND NEW.helper_started = true AND NEW.status = 'matched' THEN
    NEW.status := 'in_progress';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_start_task
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION auto_start_task();

-- Auto-transition: when both confirm complete → status becomes completed
CREATE OR REPLACE FUNCTION auto_complete_task()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.creator_completed = true AND NEW.helper_completed = true AND NEW.status = 'in_progress' THEN
    NEW.status := 'completed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_complete_task
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION auto_complete_task();
