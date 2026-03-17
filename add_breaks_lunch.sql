-- Add Break and Lunch schedules for CS 2028
INSERT INTO public.schedules (program_id, day_of_week, start_time, end_time, module_name, venue)
SELECT 
    'a673dab5-294b-42bd-b07c-b468cffa8563'::uuid, 
    d, 
    '10:00:00'::time, 
    '10:15:00'::time, 
    'Break', 
    'Campus'
FROM generate_series(1, 5) AS d
UNION ALL
SELECT 
    'a673dab5-294b-42bd-b07c-b468cffa8563'::uuid, 
    d, 
    '13:15:00'::time, 
    '14:00:00'::time, 
    'Lunch', 
    'Cafeteria'
FROM generate_series(1, 5) AS d;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
