export const TERMS_VERSION = '1.0';

export const TERMS_SECTIONS = [
  {
    title: '1. Masharti ya Huduma ya 40Labs',
    body: 'Kwa kutumia mfumo huu wa 40Labs, unakubali masharti yote ya huduma, sera ya faragha, na sheria za usalama wa data za Jamhuri ya Muungano wa Tanzania.',
  },
  {
    title: '2. Faragha na Usalama wa Data',
    body: 'Data zote za wagonjwa, hesabu, na biashara zinalindwa kwa viwango vya juu vya usalama wa ndani (offline-first).',
  },
  {
    title: '3. Wajibu wa Mtumiaji',
    body: 'Kila mtumiaji ana wajibu wa kulinda nenosiri na namba yake ya siri (PIN). Vitendo vyote vilivyofanywa chini ya kikao chako ni jukumu lako.',
  },
] as const;

export async function getTermsTextSha256(): Promise<string> {
  const canonicalText = TERMS_SECTIONS
    .map(({ title, body }) => `${title}\n${body}`)
    .join('\n\n');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalText));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
