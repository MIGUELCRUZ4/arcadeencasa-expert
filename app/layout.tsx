import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ArcadeEnCasa Expert',
  description: 'Asistente experto de ArcadeEnCasa.es para hardware, historia, retrogaming y compra inteligente.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
