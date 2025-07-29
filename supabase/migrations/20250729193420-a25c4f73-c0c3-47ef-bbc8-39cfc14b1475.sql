-- Corrigir o ID do perfil de passageiro para corresponder ao usuário autenticado
UPDATE passengers 
SET id = '3dfd510c-0c2c-40c0-a2e8-04c95b1cdd99'
WHERE email = 'silasjunior.usa@gmail.com' AND id = '9152de1c-3a24-4476-8836-e66ea86e79c9';

-- Atualizar quaisquer bookings que possam estar ligados ao ID antigo
UPDATE bookings 
SET passenger_id = '3dfd510c-0c2c-40c0-a2e8-04c95b1cdd99'
WHERE passenger_id = '9152de1c-3a24-4476-8836-e66ea86e79c9';