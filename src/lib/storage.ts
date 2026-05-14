const compressImage = async (file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> => {
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

        canvas.toBlob((blob) => {
          resolve(blob || file);
        }, 'image/jpeg', quality);
      };
    };
  });
};

export const uploadImage = async (
  file: File, 
  bucket: 'products' | 'logos' | 'banners',
  onProgress?: (percent: number) => void
): Promise<string> => {
  // Comprimir imagem antes de enviar se for maior que 200KB
  let fileToUpload: File | Blob = file;
  if (file.type.startsWith('image/') && file.size > 200 * 1024) {
    try {
      fileToUpload = await compressImage(file);
    } catch (e) {
      console.warn('Falha na compressão, enviando original', e);
    }
  }

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', fileToUpload, file.name);
    formData.append('bucket', bucket);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.url);
        } catch (e) {
          reject(new Error('Falha ao processar resposta do servidor'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || 'Upload failed'));
        } catch (e) {
          reject(new Error('Erro no servidor durante o upload'));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Erro de conexão ao enviar imagem'));
    xhr.send(formData);
  });
};
