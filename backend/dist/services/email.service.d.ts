export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
declare class EmailService {
    private transporter;
    constructor();
    sendEmail(options: EmailOptions): Promise<void>;
    sendVerificationEmail(email: string, token: string, firstName: string): Promise<void>;
    sendPasswordResetEmail(email: string, token: string, firstName: string): Promise<void>;
    sendWelcomeEmail(email: string, firstName: string): Promise<void>;
}
export declare const emailService: EmailService;
export {};
//# sourceMappingURL=email.service.d.ts.map