import React from 'react';
import { renderToString } from 'react-dom/server';
import { useChat } from '@ai-sdk/react';

function Test() {
  const result = useChat();
  console.log("USE_CHAT_KEYS:", Object.keys(result));
  return <div>Test</div>;
}

renderToString(React.createElement(Test));
