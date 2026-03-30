-- ═══════════════════════════════════════════════════════════════
-- SkillSwap Seed Data — 10 test users with full profiles,
-- skills, courses, sessions, ratings, study groups
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Step 1: Create auth users (password: Test1234! for all)
-- Using Supabase's auth.users table directly

INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at, confirmation_token)
VALUES
  ('a1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'kwame.asante@st.knust.edu.gh', crypt('Test1234!', gen_salt('bf')), now(), '{"name":"Kwame Asante","faculty":"College of Engineering"}', 'authenticated', 'authenticated', now() - interval '60 days', now(), ''),
  ('a2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'ama.mensah@st.knust.edu.gh', crypt('Test1234!', gen_salt('bf')), now(), '{"name":"Ama Mensah","faculty":"College of Science"}', 'authenticated', 'authenticated', now() - interval '55 days', now(), ''),
  ('a3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'yaw.boateng@st.knust.edu.gh', crypt('Test1234!', gen_salt('bf')), now(), '{"name":"Yaw Boateng","faculty":"College of Engineering"}', 'authenticated', 'authenticated', now() - interval '50 days', now(), ''),
  ('a4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'efua.nyarko@st.knust.edu.gh', crypt('Test1234!', gen_salt('bf')), now(), '{"name":"Efua Nyarko","faculty":"College of Art & Built Environment"}', 'authenticated', 'authenticated', now() - interval '45 days', now(), ''),
  ('a5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'kofi.owusu@st.knust.edu.gh', crypt('Test1234!', gen_salt('bf')), now(), '{"name":"Kofi Owusu","faculty":"College of Science"}', 'authenticated', 'authenticated', now() - interval '40 days', now(), ''),
  ('a6666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'abena.darko@st.knust.edu.gh', crypt('Test1234!', gen_salt('bf')), now(), '{"name":"Abena Darko","faculty":"College of Humanities & Social Sciences"}', 'authenticated', 'authenticated', now() - interval '35 days', now(), ''),
  ('a7777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000000', 'nana.appiah@st.knust.edu.gh', crypt('Test1234!', gen_salt('bf')), now(), '{"name":"Nana Appiah","faculty":"College of Engineering"}', 'authenticated', 'authenticated', now() - interval '30 days', now(), ''),
  ('a8888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000000', 'adjoa.poku@st.knust.edu.gh', crypt('Test1234!', gen_salt('bf')), now(), '{"name":"Adjoa Poku","faculty":"College of Health Sciences"}', 'authenticated', 'authenticated', now() - interval '25 days', now(), ''),
  ('a9999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000000', 'prince.tetteh@st.knust.edu.gh', crypt('Test1234!', gen_salt('bf')), now(), '{"name":"Prince Tetteh","faculty":"College of Agriculture & Natural Resources"}', 'authenticated', 'authenticated', now() - interval '20 days', now(), ''),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000', 'felicia.agyei@st.knust.edu.gh', crypt('Test1234!', gen_salt('bf')), now(), '{"name":"Felicia Agyei","faculty":"College of Science"}', 'authenticated', 'authenticated', now() - interval '15 days', now(), '')
ON CONFLICT (id) DO NOTHING;

-- Create identities for each user
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '{"sub":"a1111111-1111-1111-1111-111111111111","email":"kwame.asante@st.knust.edu.gh"}', 'email', 'a1111111-1111-1111-1111-111111111111', now(), now(), now()),
  ('a2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', '{"sub":"a2222222-2222-2222-2222-222222222222","email":"ama.mensah@st.knust.edu.gh"}', 'email', 'a2222222-2222-2222-2222-222222222222', now(), now(), now()),
  ('a3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', '{"sub":"a3333333-3333-3333-3333-333333333333","email":"yaw.boateng@st.knust.edu.gh"}', 'email', 'a3333333-3333-3333-3333-333333333333', now(), now(), now()),
  ('a4444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', '{"sub":"a4444444-4444-4444-4444-444444444444","email":"efua.nyarko@st.knust.edu.gh"}', 'email', 'a4444444-4444-4444-4444-444444444444', now(), now(), now()),
  ('a5555555-5555-5555-5555-555555555555', 'a5555555-5555-5555-5555-555555555555', '{"sub":"a5555555-5555-5555-5555-555555555555","email":"kofi.owusu@st.knust.edu.gh"}', 'email', 'a5555555-5555-5555-5555-555555555555', now(), now(), now()),
  ('a6666666-6666-6666-6666-666666666666', 'a6666666-6666-6666-6666-666666666666', '{"sub":"a6666666-6666-6666-6666-666666666666","email":"abena.darko@st.knust.edu.gh"}', 'email', 'a6666666-6666-6666-6666-666666666666', now(), now(), now()),
  ('a7777777-7777-7777-7777-777777777777', 'a7777777-7777-7777-7777-777777777777', '{"sub":"a7777777-7777-7777-7777-777777777777","email":"nana.appiah@st.knust.edu.gh"}', 'email', 'a7777777-7777-7777-7777-777777777777', now(), now(), now()),
  ('a8888888-8888-8888-8888-888888888888', 'a8888888-8888-8888-8888-888888888888', '{"sub":"a8888888-8888-8888-8888-888888888888","email":"adjoa.poku@st.knust.edu.gh"}', 'email', 'a8888888-8888-8888-8888-888888888888', now(), now(), now()),
  ('a9999999-9999-9999-9999-999999999999', 'a9999999-9999-9999-9999-999999999999', '{"sub":"a9999999-9999-9999-9999-999999999999","email":"prince.tetteh@st.knust.edu.gh"}', 'email', 'a9999999-9999-9999-9999-999999999999', now(), now(), now()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","email":"felicia.agyei@st.knust.edu.gh"}', 'email', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now(), now(), now())
ON CONFLICT DO NOTHING;

-- Step 2: Create profiles with full data
INSERT INTO profiles (id, name, email, faculty, student_level, bio, avatar_url, skills_to_teach, skills_to_learn, courses_to_teach, courses_to_learn, availability, preferred_mode, contact, whatsapp, session_duration_pref, learning_goals, profile_visibility, response_rate, rating, total_ratings, xp, last_seen, created_at)
VALUES
(
  'a1111111-1111-1111-1111-111111111111',
  'Kwame Asante', 'kwame.asante@st.knust.edu.gh', 'College of Engineering', 300,
  'Computer Engineering student passionate about Python, machine learning, and web development. Happy to teach programming fundamentals!',
  '', '[{"name":"Python","level":"advanced","category":"Programming"},{"name":"Machine Learning","level":"intermediate","category":"Programming"},{"name":"Web Development","level":"advanced","category":"Programming"}]',
  '[{"name":"UI/UX Design","level":"beginner","category":"Design"},{"name":"Guitar","level":"beginner","category":"Music & Arts"}]',
  '[{"code":"COE 361","name":"Computer Networks","level":"advanced"},{"code":"COE 355","name":"Software Engineering","level":"intermediate"}]',
  '[{"code":"MATH 351","name":"Numerical Methods","level":"intermediate"}]',
  ARRAY['Monday','Wednesday','Friday','Saturday'], 'both', '+233201234567', '+233201234567', 60,
  '{"UI/UX Design":"Want to design better interfaces for my projects","Guitar":"Always wanted to play acoustic guitar"}',
  'public', 92, 4.8, 12, 850, now() - interval '2 minutes', now() - interval '60 days'
),
(
  'a2222222-2222-2222-2222-222222222222',
  'Ama Mensah', 'ama.mensah@st.knust.edu.gh', 'College of Science', 200,
  'Biochemistry student who loves design and photography. Self-taught in Figma and Adobe XD. Let me help you create beautiful designs!',
  '', '[{"name":"UI/UX Design","level":"advanced","category":"Design"},{"name":"Figma","level":"advanced","category":"Design"},{"name":"Photography","level":"intermediate","category":"Music & Arts"}]',
  '[{"name":"Python","level":"beginner","category":"Programming"},{"name":"Data Analysis","level":"beginner","category":"Programming"}]',
  '[{"code":"BCH 251","name":"General Biochemistry","level":"intermediate"}]',
  '[{"code":"CSM 181","name":"Intro to Computing","level":"beginner"}]',
  ARRAY['Tuesday','Thursday','Saturday'], 'online', '+233209876543', '+233209876543', 60,
  '{"Python":"Need it for bioinformatics research","Data Analysis":"Want to analyze lab results"}',
  'public', 88, 4.9, 8, 620, now() - interval '10 minutes', now() - interval '55 days'
),
(
  'a3333333-3333-3333-3333-333333333333',
  'Yaw Boateng', 'yaw.boateng@st.knust.edu.gh', 'College of Engineering', 400,
  'Final year Electrical Engineering student. Strong in mathematics, circuit analysis and MATLAB. Looking to learn mobile app dev.',
  '', '[{"name":"Mathematics","level":"advanced","category":"Mathematics"},{"name":"MATLAB","level":"advanced","category":"Programming"},{"name":"Circuit Analysis","level":"advanced","category":"Engineering"}]',
  '[{"name":"React Native","level":"beginner","category":"Programming"},{"name":"Web Development","level":"intermediate","category":"Programming"}]',
  '[{"code":"EE 461","name":"Power Systems","level":"advanced"},{"code":"MATH 351","name":"Numerical Methods","level":"advanced"}]',
  '[{"code":"COE 355","name":"Software Engineering","level":"beginner"}]',
  ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday'], 'offline', '+233205551234', '+233205551234', 120,
  '{"React Native":"Want to build a campus app","Web Development":"Need it for my final year project"}',
  'public', 95, 4.7, 15, 1100, now() - interval '30 minutes', now() - interval '50 days'
),
(
  'a4444444-4444-4444-4444-444444444444',
  'Efua Nyarko', 'efua.nyarko@st.knust.edu.gh', 'College of Art & Built Environment', 200,
  'Architecture student with a love for graphic design and 3D modeling. Also teaching myself French!',
  '', '[{"name":"Graphic Design","level":"advanced","category":"Design"},{"name":"3D Modeling","level":"intermediate","category":"Design"},{"name":"AutoCAD","level":"advanced","category":"Engineering"}]',
  '[{"name":"French","level":"intermediate","category":"Languages"},{"name":"Photography","level":"beginner","category":"Music & Arts"},{"name":"Python","level":"beginner","category":"Programming"}]',
  '[{"code":"ARCH 271","name":"Design Studio","level":"intermediate"}]',
  '[{"code":"FREN 181","name":"French I","level":"beginner"}]',
  ARRAY['Wednesday','Thursday','Saturday','Sunday'], 'both', '+233207778899', '+233207778899', 60,
  '{"French":"Planning to study abroad in France","Photography":"Want to document my architecture projects","Python":"Parametric design automation"}',
  'public', 78, 4.6, 6, 420, now() - interval '1 hour', now() - interval '45 days'
),
(
  'a5555555-5555-5555-5555-555555555555',
  'Kofi Owusu', 'kofi.owusu@st.knust.edu.gh', 'College of Science', 300,
  'Mathematics and Statistics major. Tutoring calculus and stats for 2 years. Also a self-taught guitarist!',
  '', '[{"name":"Mathematics","level":"advanced","category":"Mathematics"},{"name":"Statistics","level":"advanced","category":"Mathematics"},{"name":"Guitar","level":"intermediate","category":"Music & Arts"},{"name":"R Programming","level":"intermediate","category":"Programming"}]',
  '[{"name":"Machine Learning","level":"beginner","category":"Programming"},{"name":"Web Development","level":"beginner","category":"Programming"}]',
  '[{"code":"MATH 351","name":"Numerical Methods","level":"advanced"},{"code":"MATH 355","name":"Statistics II","level":"advanced"}]',
  '[{"code":"COE 361","name":"Computer Networks","level":"beginner"}]',
  ARRAY['Monday','Wednesday','Friday'], 'offline', '+233203334455', '+233203334455', 60,
  '{"Machine Learning":"Fascinated by AI and want to apply it to statistics","Web Development":"Want to build a math tutoring platform"}',
  'public', 90, 4.8, 20, 1500, now() - interval '5 minutes', now() - interval '40 days'
),
(
  'a6666666-6666-6666-6666-666666666666',
  'Abena Darko', 'abena.darko@st.knust.edu.gh', 'College of Humanities & Social Sciences', 200,
  'Communication Studies student with excellent writing and public speaking skills. Fluent in French and learning Mandarin.',
  '', '[{"name":"Public Speaking","level":"advanced","category":"Communication"},{"name":"French","level":"advanced","category":"Languages"},{"name":"Academic Writing","level":"advanced","category":"Communication"},{"name":"Digital Marketing","level":"intermediate","category":"Business"}]',
  '[{"name":"Graphic Design","level":"beginner","category":"Design"},{"name":"Video Editing","level":"beginner","category":"Design"}]',
  '[{"code":"FREN 181","name":"French I","level":"advanced"},{"code":"COM 251","name":"Media Studies","level":"intermediate"}]',
  '[]',
  ARRAY['Tuesday','Thursday','Saturday','Sunday'], 'online', '+233206667788', '+233206667788', 30,
  '{"Graphic Design":"Want to create content for social media","Video Editing":"For my YouTube channel"}',
  'public', 85, 4.5, 10, 700, now() - interval '3 hours', now() - interval '35 days'
),
(
  'a7777777-7777-7777-7777-777777777777',
  'Nana Appiah', 'nana.appiah@st.knust.edu.gh', 'College of Engineering', 300,
  'Mechanical Engineering student. Expert in SolidWorks and thermodynamics. Also run a small business and can teach entrepreneurship basics.',
  '', '[{"name":"SolidWorks","level":"advanced","category":"Engineering"},{"name":"Thermodynamics","level":"advanced","category":"Engineering"},{"name":"Entrepreneurship","level":"intermediate","category":"Business"}]',
  '[{"name":"Python","level":"intermediate","category":"Programming"},{"name":"Data Analysis","level":"beginner","category":"Programming"},{"name":"Digital Marketing","level":"beginner","category":"Business"}]',
  '[{"code":"ME 361","name":"Thermodynamics II","level":"advanced"},{"code":"ME 355","name":"Machine Design","level":"intermediate"}]',
  '[{"code":"CSM 181","name":"Intro to Computing","level":"intermediate"}]',
  ARRAY['Monday','Wednesday','Saturday'], 'both', '+233208889900', '+233208889900', 60,
  '{"Python":"Need it for engineering simulations","Data Analysis":"For research data processing","Digital Marketing":"To grow my business online"}',
  'public', 80, 4.4, 5, 350, now() - interval '45 minutes', now() - interval '30 days'
),
(
  'a8888888-8888-8888-8888-888888888888',
  'Adjoa Poku', 'adjoa.poku@st.knust.edu.gh', 'College of Health Sciences', 400,
  'Medical student passionate about health education and biology tutoring. Also a hobby photographer and love teaching anatomy!',
  '', '[{"name":"Biology","level":"advanced","category":"Science"},{"name":"Anatomy","level":"advanced","category":"Science"},{"name":"Photography","level":"advanced","category":"Music & Arts"},{"name":"First Aid","level":"advanced","category":"Science"}]',
  '[{"name":"French","level":"beginner","category":"Languages"},{"name":"Graphic Design","level":"beginner","category":"Design"}]',
  '[{"code":"MED 451","name":"Clinical Medicine","level":"advanced"},{"code":"ANA 351","name":"Human Anatomy","level":"advanced"}]',
  '[{"code":"FREN 181","name":"French I","level":"beginner"}]',
  ARRAY['Tuesday','Friday','Sunday'], 'online', '+233201112233', '+233201112233', 60,
  '{"French":"Want to read French medical journals","Graphic Design":"To create health infographics"}',
  'public', 75, 4.9, 18, 1300, now() - interval '15 minutes', now() - interval '25 days'
),
(
  'a9999999-9999-9999-9999-999999999999',
  'Prince Tetteh', 'prince.tetteh@st.knust.edu.gh', 'College of Agriculture & Natural Resources', 200,
  'Agricultural Engineering student. Teaching soil science and agri-tech. Music lover — I play piano and guitar!',
  '', '[{"name":"Soil Science","level":"intermediate","category":"Science"},{"name":"Piano","level":"advanced","category":"Music & Arts"},{"name":"Guitar","level":"advanced","category":"Music & Arts"}]',
  '[{"name":"Python","level":"beginner","category":"Programming"},{"name":"Statistics","level":"beginner","category":"Mathematics"},{"name":"AutoCAD","level":"beginner","category":"Engineering"}]',
  '[{"code":"AGE 251","name":"Soil Mechanics","level":"intermediate"}]',
  '[{"code":"MATH 355","name":"Statistics II","level":"beginner"},{"code":"CSM 181","name":"Intro to Computing","level":"beginner"}]',
  ARRAY['Monday','Thursday','Saturday','Sunday'], 'offline', '+233204445566', '+233204445566', 120,
  '{"Python":"For precision agriculture applications","Statistics":"Need it for soil analysis research","AutoCAD":"For farm layout designs"}',
  'public', 70, 4.3, 4, 280, now() - interval '2 hours', now() - interval '20 days'
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Felicia Agyei', 'felicia.agyei@st.knust.edu.gh', 'College of Science', 300,
  'Computer Science student specializing in web and mobile development. React, Next.js and Flutter enthusiast. Happy to help with CS courses!',
  '', '[{"name":"React","level":"advanced","category":"Programming"},{"name":"React Native","level":"advanced","category":"Programming"},{"name":"Web Development","level":"advanced","category":"Programming"},{"name":"Flutter","level":"intermediate","category":"Programming"}]',
  '[{"name":"Machine Learning","level":"intermediate","category":"Programming"},{"name":"SolidWorks","level":"beginner","category":"Engineering"},{"name":"Public Speaking","level":"beginner","category":"Communication"}]',
  '[{"code":"CSM 399","name":"Software Project","level":"advanced"},{"code":"CSM 355","name":"Database Systems","level":"advanced"},{"code":"COE 361","name":"Computer Networks","level":"intermediate"}]',
  '[{"code":"MATH 351","name":"Numerical Methods","level":"intermediate"}]',
  ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], 'both', '+233207778800', '+233207778800', 60,
  '{"Machine Learning":"Want to add AI features to my apps","SolidWorks":"Curious about hardware design","Public Speaking":"Want to present at tech conferences"}',
  'public', 96, 4.7, 14, 1050, now() - interval '1 minute', now() - interval '15 days'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, faculty = EXCLUDED.faculty, student_level = EXCLUDED.student_level,
  bio = EXCLUDED.bio, skills_to_teach = EXCLUDED.skills_to_teach, skills_to_learn = EXCLUDED.skills_to_learn,
  courses_to_teach = EXCLUDED.courses_to_teach, courses_to_learn = EXCLUDED.courses_to_learn,
  availability = EXCLUDED.availability, preferred_mode = EXCLUDED.preferred_mode,
  contact = EXCLUDED.contact, whatsapp = EXCLUDED.whatsapp, session_duration_pref = EXCLUDED.session_duration_pref,
  learning_goals = EXCLUDED.learning_goals, profile_visibility = EXCLUDED.profile_visibility,
  response_rate = EXCLUDED.response_rate, rating = EXCLUDED.rating, total_ratings = EXCLUDED.total_ratings,
  xp = EXCLUDED.xp, last_seen = EXCLUDED.last_seen;

-- Step 3: Create completed sessions with ratings (cross-matching skills)
INSERT INTO sessions (id, teacher_id, learner_id, skill, date, time, duration, mode, location, status, teacher_rating, learner_rating, teacher_feedback, learner_feedback, learner_sub_ratings, teacher_sub_ratings, notes, created_at)
VALUES
  -- Kwame teaches Python to Ama
  (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'Python', (now() - interval '30 days')::date, '14:00', 60, 'online', '', 'completed', 5, 5, 'Great student, very attentive!', 'Kwame explains complex concepts so clearly. Best tutor!', '{"teaching_clarity":5,"patience":5,"punctuality":5}', '{"engagement":5,"preparation":5,"punctuality":5}', '', now() - interval '30 days'),
  -- Ama teaches UI/UX to Kwame
  (gen_random_uuid(), 'a2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'UI/UX Design', (now() - interval '28 days')::date, '10:00', 60, 'online', '', 'completed', 5, 5, 'Kwame picks up design principles fast', 'Ama is an amazing teacher, very patient with beginners', '{"teaching_clarity":5,"patience":5,"punctuality":4}', '{"engagement":5,"preparation":4,"punctuality":5}', '', now() - interval '28 days'),
  -- Yaw teaches Math to Kofi (mutual — Kofi also teaches Math but Yaw teaches MATLAB)
  (gen_random_uuid(), 'a3333333-3333-3333-3333-333333333333', 'a5555555-5555-5555-5555-555555555555', 'MATLAB', (now() - interval '25 days')::date, '09:00', 120, 'offline', 'Engineering Block Lab 3', 'completed', 4, 5, 'Kofi already knew some basics', 'Yaw made MATLAB feel intuitive. Highly recommend!', '{"teaching_clarity":5,"patience":4,"punctuality":5}', '{"engagement":5,"preparation":4,"punctuality":4}', '', now() - interval '25 days'),
  -- Kofi teaches Guitar to Kwame
  (gen_random_uuid(), 'a5555555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111111', 'Guitar', (now() - interval '22 days')::date, '16:00', 60, 'offline', 'Unity Hall Common Room', 'completed', 5, 4, 'Kwame is enthusiastic but needs practice', 'Kofi is a patient guitar teacher, made it fun', '{"teaching_clarity":4,"patience":5,"punctuality":4}', '{"engagement":5,"preparation":4,"punctuality":5}', '', now() - interval '22 days'),
  -- Felicia teaches React Native to Yaw
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a3333333-3333-3333-3333-333333333333', 'React Native', (now() - interval '20 days')::date, '11:00', 60, 'online', '', 'completed', 5, 5, 'Yaw learns incredibly fast for his first framework', 'Felicia is a rockstar developer and teacher', '{"teaching_clarity":5,"patience":5,"punctuality":5}', '{"engagement":5,"preparation":5,"punctuality":5}', '', now() - interval '20 days'),
  -- Abena teaches French to Efua
  (gen_random_uuid(), 'a6666666-6666-6666-6666-666666666666', 'a4444444-4444-4444-4444-444444444444', 'French', (now() - interval '18 days')::date, '15:00', 30, 'online', '', 'completed', 4, 5, 'Efua is dedicated and practices between sessions', 'Abena makes French fun with real conversation practice', '{"teaching_clarity":5,"patience":5,"punctuality":4}', '{"engagement":5,"preparation":5,"punctuality":4}', '', now() - interval '18 days'),
  -- Adjoa teaches Photography to Ama
  (gen_random_uuid(), 'a8888888-8888-8888-8888-888888888888', 'a2222222-2222-2222-2222-222222222222', 'Photography', (now() - interval '15 days')::date, '13:00', 60, 'offline', 'Botanical Gardens', 'completed', 5, 5, 'Ama has a natural eye for composition', 'Adjoa taught me how to use manual mode properly. Life changing!', '{"teaching_clarity":5,"patience":5,"punctuality":5}', '{"engagement":5,"preparation":5,"punctuality":5}', '', now() - interval '15 days'),
  -- Prince teaches Piano to Abena
  (gen_random_uuid(), 'a9999999-9999-9999-9999-999999999999', 'a6666666-6666-6666-6666-666666666666', 'Piano', (now() - interval '12 days')::date, '17:00', 120, 'offline', 'Great Hall Annex', 'completed', 4, 4, 'Abena is a quick learner with natural rhythm', 'Prince is so talented and patient with beginners', '{"teaching_clarity":4,"patience":5,"punctuality":4}', '{"engagement":5,"preparation":4,"punctuality":4}', '', now() - interval '12 days'),
  -- Nana teaches Entrepreneurship to Felicia
  (gen_random_uuid(), 'a7777777-7777-7777-7777-777777777777', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Entrepreneurship', (now() - interval '10 days')::date, '14:00', 60, 'offline', 'Engineering Block Cafe', 'completed', 5, 4, 'Felicia already has great product ideas', 'Nana gave practical business advice, not just theory', '{"teaching_clarity":4,"patience":4,"punctuality":5}', '{"engagement":5,"preparation":5,"punctuality":5}', '', now() - interval '10 days'),
  -- Kwame teaches Web Dev to Yaw
  (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'Web Development', (now() - interval '8 days')::date, '10:00', 60, 'online', '', 'completed', 4, 5, 'Yaw already understands logic, just needed the syntax', 'Kwame helped me build my first Next.js app in one session!', '{"teaching_clarity":5,"patience":4,"punctuality":5}', '{"engagement":5,"preparation":5,"punctuality":4}', '', now() - interval '8 days')
ON CONFLICT DO NOTHING;

-- Step 4: Create some pending/upcoming sessions
INSERT INTO sessions (id, teacher_id, learner_id, skill, date, time, duration, mode, location, status, notes, created_at)
VALUES
  (gen_random_uuid(), 'a5555555-5555-5555-5555-555555555555', 'a2222222-2222-2222-2222-222222222222', 'Mathematics', (now() + interval '3 days')::date, '14:00', 60, 'offline', 'Science Block Tutorial Room', 'accepted', '', now() - interval '2 days'),
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a7777777-7777-7777-7777-777777777777', 'React', (now() + interval '5 days')::date, '11:00', 60, 'online', '', 'pending', '', now() - interval '1 day'),
  (gen_random_uuid(), 'a8888888-8888-8888-8888-888888888888', 'a4444444-4444-4444-4444-444444444444', 'Photography', (now() + interval '7 days')::date, '09:00', 60, 'offline', 'Campus Gardens', 'pending', '', now() - interval '12 hours'),
  (gen_random_uuid(), 'a6666666-6666-6666-6666-666666666666', 'a8888888-8888-8888-8888-888888888888', 'French', (now() + interval '4 days')::date, '16:00', 30, 'online', '', 'accepted', '', now() - interval '3 days')
ON CONFLICT DO NOTHING;

-- Step 5: Create study groups
INSERT INTO study_groups (id, name, course_code, department, creator_id, description, max_members, schedule_days, schedule_time, location, created_at)
VALUES
  ('b1111111-1111-1111-1111-111111111111', 'COE 361 Study Circle', 'COE 361', 'College of Engineering', 'a1111111-1111-1111-1111-111111111111', 'Weekly study group for Computer Networks. We review lecture notes, solve past questions, and help each other with assignments.', 10, '{"Monday","Wednesday"}', '18:00', 'Engineering Block Room 205', now() - interval '20 days'),
  ('b2222222-2222-2222-2222-222222222222', 'MATH 351 Problem Solving', 'MATH 351', 'College of Science', 'a5555555-5555-5555-5555-555555555555', 'Collaborative problem-solving sessions for Numerical Methods. Bring your textbooks and calculators!', 8, '{"Tuesday","Thursday"}', '17:00', 'Science Block Tutorial Room 3', now() - interval '15 days'),
  ('b3333333-3333-3333-3333-333333333333', 'French Practice Club', 'FREN 181', 'College of Humanities & Social Sciences', 'a6666666-6666-6666-6666-666666666666', 'Casual French conversation practice. All levels welcome! We speak only French during sessions.', 12, '{"Saturday"}', '10:00', 'Online (Google Meet)', now() - interval '10 days'),
  ('b4444444-4444-4444-4444-444444444444', 'Design & Creativity Hub', '', 'College of Art & Built Environment', 'a4444444-4444-4444-4444-444444444444', 'Share design work, give feedback, and learn new tools together. Open to all creative disciplines.', 15, '{"Friday"}', '14:00', 'Architecture Studio B', now() - interval '8 days')
ON CONFLICT (id) DO NOTHING;

-- Add members to study groups
INSERT INTO group_members (group_id, user_id, role, status, joined_at)
VALUES
  -- COE 361 group
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'coordinator', 'approved', now() - interval '20 days'),
  ('b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'member', 'approved', now() - interval '18 days'),
  ('b1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'member', 'approved', now() - interval '17 days'),
  ('b1111111-1111-1111-1111-111111111111', 'a7777777-7777-7777-7777-777777777777', 'member', 'approved', now() - interval '15 days'),
  -- MATH 351 group
  ('b2222222-2222-2222-2222-222222222222', 'a5555555-5555-5555-5555-555555555555', 'coordinator', 'approved', now() - interval '15 days'),
  ('b2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333', 'member', 'approved', now() - interval '13 days'),
  ('b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'member', 'approved', now() - interval '12 days'),
  -- French group
  ('b3333333-3333-3333-3333-333333333333', 'a6666666-6666-6666-6666-666666666666', 'coordinator', 'approved', now() - interval '10 days'),
  ('b3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444', 'member', 'approved', now() - interval '9 days'),
  ('b3333333-3333-3333-3333-333333333333', 'a8888888-8888-8888-8888-888888888888', 'member', 'approved', now() - interval '8 days'),
  -- Design Hub
  ('b4444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 'coordinator', 'approved', now() - interval '8 days'),
  ('b4444444-4444-4444-4444-444444444444', 'a2222222-2222-2222-2222-222222222222', 'member', 'approved', now() - interval '7 days'),
  ('b4444444-4444-4444-4444-444444444444', 'a6666666-6666-6666-6666-666666666666', 'member', 'approved', now() - interval '6 days')
ON CONFLICT DO NOTHING;

-- Step 6: Add some group messages
INSERT INTO group_messages (group_id, sender_id, content, created_at)
VALUES
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Welcome everyone to the COE 361 study group! Let us start with Chapter 5 on Monday.', now() - interval '19 days'),
  ('b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'Sounds good! I will bring my notes from the last lecture.', now() - interval '19 days' + interval '30 minutes'),
  ('b1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Can we also go over the subnet masking exercises?', now() - interval '18 days'),
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Yes definitely! I will prepare some practice problems.', now() - interval '18 days' + interval '15 minutes'),
  ('b2222222-2222-2222-2222-222222222222', 'a5555555-5555-5555-5555-555555555555', 'Hey team! First session this Thursday. We will tackle interpolation methods.', now() - interval '14 days'),
  ('b2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333', 'Perfect, that is exactly where I am struggling.', now() - interval '14 days' + interval '1 hour'),
  ('b3333333-3333-3333-3333-333333333333', 'a6666666-6666-6666-6666-666666666666', 'Bonjour tout le monde! On Saturday we will practice ordering food in French.', now() - interval '9 days'),
  ('b3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444', 'Genial! Je suis excitee pour cette session.', now() - interval '9 days' + interval '2 hours'),
  ('b4444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 'Welcome to the Design Hub! Share your latest work and let us give each other feedback.', now() - interval '7 days'),
  ('b4444444-4444-4444-4444-444444444444', 'a2222222-2222-2222-2222-222222222222', 'Excited to be here! I have some UI mockups I would love feedback on.', now() - interval '6 days')
ON CONFLICT DO NOTHING;
