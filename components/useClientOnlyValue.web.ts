import React from 'react';

// `useEffect`는 서버 렌더링 중에는 호출되지 않으므로
// 이를 사용하여 서버에 있는지 여부를 판단할 수 있습니다.
export function useClientOnlyValue<S, C>(server: S, client: C): S | C {
  const [value, setValue] = React.useState<S | C>(server);
  React.useEffect(() => {
    setValue(client);
  }, [client]);

  return value;
}
