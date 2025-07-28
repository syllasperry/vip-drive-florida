-- Criar políticas RLS para o bucket avatars
-- Permitir que usuários autenticados façam upload de seus próprios avatares

-- Política para permitir SELECT (visualizar) avatares publicamente
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

-- Política para permitir INSERT (upload) de avatares para usuários autenticados
-- Cada usuário só pode fazer upload para sua própria pasta (usando user_id)
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir UPDATE (atualizar) avatares próprios
CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir DELETE (deletar) avatares próprios
CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);