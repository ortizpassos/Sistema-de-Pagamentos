import express from 'express';
declare class App {
    app: express.Application;
    private port;
    constructor();
    private validateEnvironment;
    private initializeMiddlewares;
    private initializeRoutes;
    private initializeErrorHandling;
    private connectToDatabase;
    listen(): void;
}
declare const app: App;
export default app;
//# sourceMappingURL=app.d.ts.map