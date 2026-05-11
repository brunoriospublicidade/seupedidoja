export const uploadImage = async (
  file: File, 
  bucket: 'products' | 'logos' | 'banners',
  onProgress?: (percent: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
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
