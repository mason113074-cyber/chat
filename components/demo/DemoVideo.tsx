'use client';

import { useTranslations } from 'next-intl';

export function DemoVideo() {
  const t = useTranslations('demo');

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        {t('video.title')}
      </h2>
      <div className="aspect-video w-full max-w-3xl mx-auto rounded-xl overflow-hidden bg-gray-900 shadow-lg">
        {/* Placeholder for video embed: replace src with your YouTube/Vimeo embed URL or use an iframe */}
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <div className="text-center p-8">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">{t('video.caption')}</p>
            <p className="text-xs mt-2 text-gray-500">Add your demo video URL in components/demo/DemoVideo.tsx</p>
          </div>
        </div>
      </div>
    </div>
  );
}
