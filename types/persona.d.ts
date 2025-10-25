// Type definitions for Persona KYC SDK
interface PersonaClientOptions {
  templateId: string;
  inquiryId?: string;
  environment?: 'sandbox' | 'production';
  onReady?: () => void;
  onComplete?: (data: { inquiryId: string; status: string }) => void;
  onCancel?: () => void;
  onError?: (error: Error) => void;
}

interface PersonaClient {
  open: () => void;
  close: () => void;
}

interface PersonaStatic {
  Client: new (options: PersonaClientOptions) => PersonaClient;
}

interface Window {
  Persona?: PersonaStatic;
}

