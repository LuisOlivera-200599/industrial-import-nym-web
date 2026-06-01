-- Update public company name.

update public.company_settings
set company_name = 'INDUSTRIAL IMPORT COMPANY S.R.L.',
    updated_at = now()
where company_name = 'Industrial Import NYM';
