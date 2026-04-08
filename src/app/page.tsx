import React from 'react';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>سجل الحلقات | المنصة الأولى</title>
        <meta name="description" content="المنصة الأولى لإدارة ومتابعة الحلقات القرآنية" />
      </Head>

      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      
      <main className="welcome-container">
        <h1 className="title">سجل الحلقات</h1>
        <p className="subtitle">
          المنصة الأولى لإدارة ومتابعة الحلقات القرآنية بأسلوب عصري ومبتكر
        </p>
        
        <a href="https://github.com/OmarHizabrr/follow_up_log_wep" target="_blank" rel="noopener noreferrer" className="btn-primary">
          <svg className="icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
          </svg>
          الدخول للمنصة
        </a>
      </main>
    </>
  );
}
