import "./globals.css";


export const metadata = {
  title: "Retrace",
  description: "AI-powered technical interview simulator based on your own codebase",
  icons:{
    icon:'/favicon.svg',
  },
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