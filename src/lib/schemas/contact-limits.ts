// Limites do formulário de contato: compartilhados entre o schema do servidor e os atributos maxLength do cliente.
export const CONTACT_LIMITS = { name: 100, email: 255, message: 1000 } as const;
