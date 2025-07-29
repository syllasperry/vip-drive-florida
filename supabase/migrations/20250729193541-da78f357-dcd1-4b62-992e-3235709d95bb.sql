-- Primeiro, vamos deletar o registro antigo que tem o email duplicado
DELETE FROM passengers 
WHERE id = '9152de1c-3a24-4476-8836-e66ea86e79c9' AND email = 'silasjunior.usa@gmail.com';

-- Agora criar o perfil correto com o ID do usuário autenticado
INSERT INTO passengers (
  id, 
  full_name, 
  email, 
  phone, 
  profile_photo_url, 
  created_at
) VALUES (
  '3dfd510c-0c2c-40c0-a2e8-04c95b1cdd99',
  'Samantha Batista',
  'silasjunior.usa@gmail.com',
  '5613502301',
  'https://extdyjkfgftbokabiamc.supabase.co/storage/v1/object/public/avatars/9152de1c-3a24-4476-8836-e66ea86e79c9/9152de1c-3a24-4476-8836-e66ea86e79c9.jpeg',
  now()
);