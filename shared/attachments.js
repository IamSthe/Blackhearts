export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_CATEGORY_BYTES = 6 * 1024 * 1024;
export const ATTACHMENT_TYPES = ['image/png','image/jpeg','image/webp','application/pdf','text/plain'];
export function validateAttachments(files = []) {
  if (!Array.isArray(files) || files.length > 5) throw new Error('Use até 5 anexos por categoria.');
  let total = 0;
  return files.map(file => {
    if (!file || typeof file.name !== 'string' || !file.name.trim() || file.name.length > 180 || !ATTACHMENT_TYPES.includes(file.type)) throw new Error('Anexo inválido. Use PNG, JPG, WebP, PDF ou TXT.');
    const prefix = `data:${file.type};base64,`;
    if (typeof file.data !== 'string' || !file.data.startsWith(prefix)) throw new Error('Conteúdo de anexo inválido.');
    const base64 = file.data.slice(prefix.length);
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)) throw new Error('Arquivo corrompido.');
    const size = base64.length * 3 / 4 - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
    if (!size || size > MAX_FILE_BYTES || size !== file.size) throw new Error('Cada arquivo deve ter no máximo 2 MB.');
    total += size;
    if (total > MAX_CATEGORY_BYTES) throw new Error('O total de anexos da categoria deve ter no máximo 6 MB.');
    const head = atob(base64.slice(0,32));
    if ((file.type === 'image/png' && !head.startsWith('\x89PNG\r\n\x1a\n')) || (file.type === 'image/jpeg' && !head.startsWith('\xff\xd8\xff')) || (file.type === 'image/webp' && !(head.startsWith('RIFF') && head.slice(8,12)==='WEBP')) || (file.type === 'application/pdf' && !head.startsWith('%PDF-'))) throw new Error('O conteúdo do arquivo não corresponde ao tipo informado.');
    return { id: typeof file.id === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(file.id) ? file.id : crypto.randomUUID(), name: file.name.trim(), type: file.type, size, data: file.data };
  });
}
