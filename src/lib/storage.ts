const compressImage = async (file: File, maxWidth = 1200, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Retornar como Base64 (Data URL)
        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
      };
    };
  });
};

export const uploadImage = async (
  file: File, 
  bucket: 'products' | 'logos' | 'banners',
  onProgress?: (percent: number) => void
): Promise<string> => {
  // Agora salvamos diretamente no banco de dados como Base64 para garantir persistência total
  if (onProgress) onProgress(50);
  
  try {
    // Comprimir e converter para Base64
    const base64 = await compressImage(file, bucket === 'logos' ? 400 : 1200, 0.7);
    if (onProgress) onProgress(100);
    return base64;
  } catch (e) {
    console.error('Erro ao processar imagem:', e);
    // Fallback para o leitor simples se falhar a compressão
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  }
};
