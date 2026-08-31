import serverApp from '../dist/server.cjs';

const app = (serverApp as any).default || (serverApp as any).app || serverApp;

export default function handler(req: any, res: any) {
  return app(req, res);
}
