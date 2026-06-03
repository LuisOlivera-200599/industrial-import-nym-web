-- Remove temporary rows created during security smoke testing.

delete from public.contact_leads
where correo like 'security-test-%@example.com'
   or correo like 'security-retest-%@example.com';

delete from auth.users
where email like 'security-test-%@example.com'
   or email like 'security-retest-%@example.com';
