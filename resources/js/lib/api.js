export async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  if (!response.ok) {
    const error = new Error(
      response.status === 429
        ? "请求过于频繁，请稍后重试"
        : response.status === 422
          ? "筛选条件无效，请检查日期范围和页码"
          : response.status === 401 || response.status === 403
            ? "登录已失效或无权访问，请重新登录"
            : "暂时无法加载数据，请稍后重试",
    );
    error.status = response.status;
    throw error;
  }
  try {
    const data = await response.json();
    return url === "/api/server-status"
      ? { ...data, receivedAt: Date.now() }
      : data;
  } catch {
    throw new Error("服务器返回了无效数据，请刷新页面后重试");
  }
}
