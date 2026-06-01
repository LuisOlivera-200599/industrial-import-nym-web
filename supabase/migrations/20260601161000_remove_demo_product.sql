-- Remove inactive demo product from the catalog.

delete from public.products
where id = 'b4278032-0c82-4a25-b132-2c646dcdfadf'
  and name = 'Controlador industrial demo';
