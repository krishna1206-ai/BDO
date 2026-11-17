-- Removes ALL sample data created by seed.sql.
-- Deleting the @example.com sample users also deletes their profiles, enquiries, event sign-ups,
-- job applications, Cyber Risk Check results and saved articles (every table uses ON DELETE CASCADE).
-- Real users and their data are not touched.
delete from auth.users where email like '%@example.com';
