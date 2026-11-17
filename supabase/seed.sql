-- Random SAMPLE data for testing the admin panel.
-- Run AFTER schema.sql: Supabase dashboard > SQL Editor > New query > paste > Run.
-- Running it again adds more random enquiries, applications, etc. for the same sample users.
--
-- * Creates 12 sample users with @example.com emails and NO password (nobody can log in as them).
-- * Gives them random enquiries, event sign-ups, job applications, Cyber Risk Check results
--   and saved articles, spread over the last 30 days.
-- * To remove everything this script added, run supabase/seed-cleanup.sql.

do $$
declare
  first_names text[] := array['Aarav','Diya','Rohan','Priya','Kabir','Ananya','Vikram','Neha','Arjun','Isha','Rahul','Meera'];
  last_names  text[] := array['Shah','Patel','Mehta','Iyer','Kapoor','Rao','Desai','Nair','Joshi','Gupta','Verma','Reddy'];
  companies   text[] := array['Acme Textiles','Blue River Foods','Nova Fintech','Sunrise Logistics','Greenleaf Pharma',
                              'Orbit Software','Kite Retail','Summit Infra','Lotus Hospitality',null];
  phones      text[] := array['+91 98200 11223','+91 99870 44556','+91 90040 77889','+91 98330 22114',null];

  topics      text[] := array['Tax','Audit','GST','Transfer pricing','Selling my business','Payroll outsourcing',
                              'Cyber security','ESG reporting','Due diligence','Company set-up in India'];
  messages    text[] := array[
    'We are planning to expand next year and would like advice on the tax implications.',
    'Can someone call me about our year-end audit timeline? We are a mid-sized manufacturer.',
    'We need help reconciling our GST returns for the last two quarters.',
    'Looking for support with transfer pricing documentation for our group companies.',
    'I am considering selling my business in the next 2-3 years. What should I prepare?',
    'Interested in outsourcing payroll for around 150 employees. Please share a proposal.',
    'We had a phishing incident last month and want a cyber security review.',
    'Our investors are asking for an ESG report. Where do we start?',
    'We are acquiring a smaller competitor and need financial due diligence.',
    'We are a UK company looking to set up a subsidiary in India. Please advise.'];
  enquiry_status text[] := array['new','new','new','in_progress','replied','closed'];

  event_ids    text[] := array['e1','e2','e3','e4','e5','e6'];
  event_titles text[] := array['Autumn Budget briefing','Selling your business: getting deal-ready','Cyber risk for boards',
                               'Year-end reporting update','Net zero for mid-sized businesses','Scaling AI in your finance team'];

  job_ids    text[] := array['j1','j2','j3','j4','j5','j6','j7','j8'];
  job_titles text[] := array['Graduate Auditor','Tax Trainee','Summer Intern, Advisory','Transaction Services Manager',
                             'Payroll Specialist','Cyber Security Consultant','Graduate, Sustainability & ESG','Spring Insight Intern'];
  app_status text[] := array['received','received','reviewing','interview','rejected','hired'];
  app_notes  text[] := array['I have 3 years of experience in statutory audits and recently cleared my CA final.',
                             'Passionate about tax and keen to learn from a growing team.',
                             'Currently working in a Big Four firm and looking for a mid-market role.',
                             null];

  insight_ids text[] := array['autumn-budget-2026','mid-market-growth','risk-landscape-2026','deal-outlook','audit-reform',
                              'sustainability-survey-2026','digital-edge-4','telecoms-risk-2026','ifrs-2027'];

  q_ids text[] := array['mfa','backup','patch','training','plan','payments'];
  q_weights int[] := array[3,3,2,2,2,3];

  i int; j int; k int; n int;
  uid uuid; em text; fname text; lname text; created timestamptz; at timestamptz;
  answers jsonb; total int; pct int; band text;
  r record;
begin
  -- 1. Sample users (the sign-up trigger creates their profiles automatically).
  for i in 1..12 loop
    fname := first_names[i];
    lname := last_names[i];
    em := lower(fname || '.' || lname || '@example.com');
    continue when exists (select 1 from auth.users where email = em);

    uid := gen_random_uuid();
    created := now() - (random() * 30) * interval '1 day';
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em, '', created,
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('name', fname || ' ' || lname,
                         'company', companies[1 + floor(random() * array_length(companies, 1))::int]),
      created, created, '', '', '', ''
    );
    update public.profiles set created_at = created where id = uid;
  end loop;

  -- 2. Random activity for every sample user.
  for r in
    select u.id, u.email, coalesce(p.full_name, u.email) as full_name, p.company, u.created_at
    from auth.users u
    left join public.profiles p on p.id = u.id
    where u.email like '%@example.com'
  loop
    -- Enquiries: 0-3 each
    n := floor(random() * 4)::int;
    for j in 1..n loop
      k := 1 + floor(random() * array_length(topics, 1))::int;
      at := r.created_at + random() * (now() - r.created_at);
      insert into public.enquiries (user_id, full_name, email, company, topic, message, status, created_at)
      values (r.id, r.full_name, r.email, r.company, topics[k], messages[k],
              enquiry_status[1 + floor(random() * array_length(enquiry_status, 1))::int], at);
    end loop;

    -- Event sign-ups: 0-3 each (one per event)
    n := floor(random() * 4)::int;
    for j in 1..n loop
      k := 1 + floor(random() * array_length(event_ids, 1))::int;
      at := r.created_at + random() * (now() - r.created_at);
      insert into public.event_registrations (user_id, event_id, event_title, full_name, email, created_at)
      values (r.id, event_ids[k], event_titles[k], r.full_name, r.email, at)
      on conflict (user_id, event_id) do nothing;
    end loop;

    -- Job applications: about half the users apply once
    if random() < 0.5 then
      k := 1 + floor(random() * array_length(job_ids, 1))::int;
      at := r.created_at + random() * (now() - r.created_at);
      insert into public.job_applications (user_id, job_id, job_title, full_name, email, phone, cv_url, message, status, created_at)
      values (r.id, job_ids[k], job_titles[k], r.full_name, r.email,
              phones[1 + floor(random() * array_length(phones, 1))::int],
              case when random() < 0.6 then 'https://example.com/cv/' || split_part(r.email, '@', 1) || '.pdf' end,
              app_notes[1 + floor(random() * array_length(app_notes, 1))::int],
              app_status[1 + floor(random() * array_length(app_status, 1))::int], at);
    end if;

    -- Cyber Risk Check: about 60% of users take it once
    if random() < 0.6 then
      answers := '{}'::jsonb;
      total := 0;
      for j in 1..array_length(q_ids, 1) loop
        k := floor(random() * 3)::int; -- 0 = No, 1 = Partly, 2 = Yes
        answers := answers || jsonb_build_object(q_ids[j], k);
        total := total + q_weights[j] * k;
      end loop;
      pct := round(total * 100.0 / 30);
      band := case when pct >= 80 then 'Strong' when pct >= 50 then 'Developing' else 'At risk' end;
      insert into public.cyber_check_results (user_id, answers, score, result, created_at)
      values (r.id, answers, pct, band, r.created_at + random() * (now() - r.created_at));
    end if;

    -- Saved articles: 0-4 each
    n := floor(random() * 5)::int;
    for j in 1..n loop
      insert into public.saved_insights (user_id, insight_id, created_at)
      values (r.id, insight_ids[1 + floor(random() * array_length(insight_ids, 1))::int],
              r.created_at + random() * (now() - r.created_at))
      on conflict (user_id, insight_id) do nothing;
    end loop;
  end loop;
end $$;

-- Quick summary of what is now in each table.
select 'profiles' as table_name, count(*) from public.profiles
union all select 'enquiries', count(*) from public.enquiries
union all select 'event_registrations', count(*) from public.event_registrations
union all select 'job_applications', count(*) from public.job_applications
union all select 'cyber_check_results', count(*) from public.cyber_check_results
union all select 'saved_insights', count(*) from public.saved_insights;
