import "./globals.css";


export const metadata = {
  title: "Retrace — Defend your code",
  description: "AI-powered technical interview simulator based on your own codebase",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-black text-white">
        {children}
        
      </body>
    </html>
  );
}