import React from 'react';

const ErrorPage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <h1>应用发生错误</h1>
      <p>抱歉，应用在渲染时发生了未处理的异常。</p>
      <p>请尝试重启应用，或在开发模式下查看控制台以获取更多信息。</p>
    </div>
  );
};

export default ErrorPage;
