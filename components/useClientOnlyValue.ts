// 네이티브는 현재 서버(또는 빌드 타임) 렌더링을 지원하지 않으므로 이 함수는 웹 전용입니다.
export function useClientOnlyValue<S, C>(server: S, client: C): S | C {
  return client;
}
