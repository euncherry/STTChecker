// 참고: 기본 React Native 스타일링은 서버 렌더링을 지원하지 않습니다.
// 서버 렌더링된 스타일은 HTML의 첫 렌더링과 클라이언트의 첫 렌더링 사이에 변경되어서는 안 됩니다.
// 일반적으로 웹 개발자는 CSS 미디어 쿼리를 사용하여 클라이언트와 서버에서 다른 스타일을 렌더링합니다.
// 이는 React Native에서 직접 지원되지 않지만 Nativewind와 같은 스타일링 라이브러리를 사용하여 구현할 수 있습니다.
export function useColorScheme() {
  return 'light';
}
