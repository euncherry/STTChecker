import { ScrollViewStyleReset } from 'expo-router/html';

// 이 파일은 웹 전용이며 정적 렌더링 중 모든 웹 페이지의 루트 HTML을 구성하는 데 사용됩니다.
// 이 함수의 내용은 Node.js 환경에서만 실행되며 DOM이나 브라우저 API에 접근할 수 없습니다.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/*
          웹에서 body 스크롤을 비활성화합니다. 이렇게 하면 ScrollView 컴포넌트가 네이티브에서 작동하는 방식과 더 유사하게 작동합니다.
          그러나 모바일 웹에서는 body 스크롤이 종종 유용합니다. 활성화하려면 이 줄을 제거하세요.
        */}
        <ScrollViewStyleReset />

        {/* 다크 모드에서 배경색이 깜빡이지 않도록 하기 위해 원시 CSS 스타일을 사용합니다. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* 웹에서 전역적으로 사용할 추가 <head> 요소를 여기에 추가하세요... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;
