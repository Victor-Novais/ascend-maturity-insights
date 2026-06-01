/**
 * Função para baixar arquivo da API
 * @param url - URL completa do endpoint
 * @param filename - Nome do arquivo para download
 * @param token - Token de autenticação Bearer
 */
export async function downloadFileFromApi(
  url: string,
  filename: string,
  token: string
): Promise<void> {
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Falha ao gerar arquivo: ${response.statusText}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Erro ao baixar arquivo: ${error.message}`
        : "Erro desconhecido ao baixar arquivo"
    );
  }
}
